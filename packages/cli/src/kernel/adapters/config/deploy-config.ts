import { outputWarning } from '../../presentation/output/default-output.ts';
/**
 * @module infra/config/deploy-config
 *
 * Deployment configuration loader for NetScript CLI.
 *
 * Merges three configuration sources into a single ResolvedConfig:
 * 1. netscript.config.ts — service definitions (Zod-validated via @netscript/config)
 * 2. dotnet/AppHost/appsettings.json — runtime config from Aspire (services, plugins, infra)
 * 3. .deploy/windows/config/runtime/*.json — hot-reload overrides (optional)
 *
 * Environment variables (.env.local / .env) are consumed transparently via
 * `deno run --env-file=.env.local --env-file=.env` at the call site.
 */

import { join, resolve } from '@std/path';
import { discoverWorkspace, type NetScriptConfig } from '@netscript/config';
import { DEFAULT_DEPLOY_OUTPUT_DIR } from '../../constants/runtime.ts';
import { ConfigInvalidError, ConfigNotFoundError } from '../../domain/errors.ts';
import { detectInfrastructure, type RawInfrastructureEntries } from './infrastructure.ts';
import { loadRegisteredPlugins } from './plugin-registry.ts';
import type { ResolvedConfig } from '../../domain/resolved-config.ts';
import { loadProjectConfig } from './project-config-loader.ts';
import { DenoProcess } from '../runtime/process/deno-process.ts';

import type { AppSettingsJson } from './deploy-config-types.ts';
import {
  resolveApps,
  resolveDefaults,
  resolvePlugins,
  resolveServices,
  resolveWindowsDeploy,
} from './deploy-config-resolvers.ts';
import { resolveBackgroundProcessors } from './deploy-config-background.ts';

const DEFAULT_APP_SETTINGS_PATH = join('dotnet', 'AppHost', 'appsettings.json');

async function loadAppSettings(projectRoot: string): Promise<AppSettingsJson> {
  const path = join(projectRoot, DEFAULT_APP_SETTINGS_PATH);
  try {
    const text = await Deno.readTextFile(path);
    return JSON.parse(text) as AppSettingsJson;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      outputWarning(`[cli] Warning: appsettings.json not found at ${path}`);
      return {};
    }
    throw new ConfigInvalidError(
      `Failed to parse appsettings.json: ${(error as Error).message}`,
      path,
    );
  }
}

// ============================================================================
// SECTION RESOLVERS
// ============================================================================

export async function findProjectRoot(startDir?: string): Promise<string | null> {
  let currentDir = resolve(startDir ?? Deno.cwd());
  const fsRoot = currentDir.match(/^[A-Za-z]:\\/)?.[0] ?? '/';

  while (currentDir !== fsRoot && currentDir.length > 3) {
    const candidates = [
      join(currentDir, 'netscript.config.ts'),
      join(currentDir, 'dotnet', 'AppHost', 'appsettings.json'),
    ];

    for (const candidate of candidates) {
      try {
        if ((await Deno.stat(candidate)).isFile) return currentDir;
      } catch { /* not found */ }
    }

    // Check deno.json with workspace
    try {
      const denoJson = JSON.parse(await Deno.readTextFile(join(currentDir, 'deno.json')));
      if (Array.isArray(denoJson.workspace)) return currentDir;
    } catch { /* not found or not valid JSON */ }

    const parent = resolve(currentDir, '..');
    if (parent === currentDir) break;
    currentDir = parent;
  }

  return null;
}

// ============================================================================
// MAIN LOADER
// ============================================================================

/**
 * Options for loading the deployment configuration.
 */
export interface LoadDeployConfigOptions {
  /** Project root directory. Defaults to inferion from CWD. */
  projectRoot?: string;
  /** Deployment output directory. Defaults to ./.deploy/windows */
  deployDir?: string;
  /** Suppress warnings about missing optional files. */
  quiet?: boolean;
  /** Project-rooted config loader override. */
  loadNetScriptConfig?: (options: { cwd: string }) => Promise<NetScriptConfig>;
}

/**
 * Load and merge all configuration sources for Windows deployment.
 *
 * Sources (in merge priority order, highest first):
 * 1. Environment variables (transparently loaded via --env-file flags)
 * 2. appsettings.json NetScript section
 * 3. netscript.config.ts service definitions
 *
 * @throws ConfigNotFoundError — project root cannot be located
 * @throws ConfigInvalidError — netscript.config.ts fails Zod validation
 */
export async function loadDeployConfig(options?: LoadDeployConfigOptions): Promise<ResolvedConfig> {
  // Resolve project root
  const projectRoot = options?.projectRoot ? resolve(options.projectRoot) : await findProjectRoot();

  if (!projectRoot) {
    throw new ConfigNotFoundError([
      join(Deno.cwd(), 'netscript.config.ts'),
      join(Deno.cwd(), 'dotnet', 'AppHost', 'appsettings.json'),
    ]);
  }

  const loadNetScriptConfig = options?.loadNetScriptConfig ??
    ((options) => loadProjectConfig(options, { process: new DenoProcess() }));
  const netscriptConfig = await loadNetScriptConfig({ cwd: projectRoot }).catch((err: unknown) => {
    throw new ConfigInvalidError(
      `netscript.config.ts validation failed: ${(err as Error).message}`,
      join(projectRoot, 'netscript.config.ts'),
    );
  });

  const [appSettings, workspace, registeredPlugins] = await Promise.all([
    loadAppSettings(projectRoot),
    discoverWorkspace(projectRoot).catch(() => undefined),
    loadRegisteredPlugins(projectRoot, netscriptConfig).catch((error: unknown) => {
      if (!options?.quiet) {
        outputWarning(
          `[cli] Warning: failed to load configured plugins: ${(error as Error).message}`,
        );
      }
      return {};
    }),
  ]);

  const deployDir = options?.deployDir
    ? resolve(options.deployDir)
    : resolve(projectRoot, netscriptConfig.paths.deploy ?? DEFAULT_DEPLOY_OUTPUT_DIR);

  const ns = appSettings.NetScript ?? {};
  const connectionStrings = appSettings.ConnectionStrings ?? {};
  const defaults = resolveDefaults(ns);

  // Resolve infrastructure (DB, cache, OTLP) with Docker inferion
  const rawInfra: RawInfrastructureEntries = {
    databases: ns.Databases ?? {},
    cache: ns.Cache ?? {},
    connectionStrings,
    otlpEndpoint: ns.Otel?.HttpEndpoint ?? 'http://localhost:4318',
  };
  const infrastructure = await detectInfrastructure(rawInfra);

  // Extract services from netscript.config.ts (runtime-agnostic fields)
  const netscriptServices = netscriptConfig.services
    ? Object.fromEntries(
      Object.entries(netscriptConfig.services).map(([name, svc]) => [
        name,
        {
          port: (svc as { port?: number }).port,
          entrypoint: (svc as { entrypoint?: string }).entrypoint,
          workdir: (svc as { workdir?: string }).workdir,
          dependsOn: (svc as { dependsOn?: string[] }).dependsOn,
          runtime: (svc as { runtime?: string }).runtime,
        },
      ]),
    )
    : undefined;
  const netscriptApps = netscriptConfig.apps
    ? Object.fromEntries(
      Object.entries(netscriptConfig.apps).map(([name, app]) => [
        name,
        {
          port: (app as { port?: number }).port,
          entrypoint: (app as { entrypoint?: string }).entrypoint,
          workdir: (app as { workdir?: string }).workdir,
          runtime: (app as { runtime?: string }).runtime,
          permissions: (app as { permissions?: string[] }).permissions,
          description: (app as { description?: string }).description,
          prebuild: (app as { prebuild?: string }).prebuild,
        },
      ]),
    )
    : undefined;

  return {
    name: ns.Name ?? netscriptConfig.name ?? 'netscript-app',
    version: ns.Version ?? netscriptConfig.version ?? '1.0.0',
    projectRoot,
    deployDir,

    services: resolveServices(
      ns,
      netscriptServices,
      defaults.permissions,
      netscriptConfig.paths,
      workspace,
    ),
    plugins: resolvePlugins(
      ns.Plugins ?? {},
      defaults.permissions,
      netscriptConfig.paths,
      registeredPlugins,
      workspace,
    ),
    apps: resolveApps(
      ns.Apps ?? {},
      netscriptApps,
      defaults.permissions,
      netscriptConfig.paths,
      workspace,
    ),
    backgroundProcessors: resolveBackgroundProcessors(
      ns.BackgroundProcessors,
      netscriptConfig.paths,
      registeredPlugins,
      workspace,
    ),

    infrastructure,
    defaults,
    connectionStrings,
    netscriptConfig,
    registeredPlugins,
    deploy: resolveWindowsDeploy(netscriptConfig.deploy),
  };
}
