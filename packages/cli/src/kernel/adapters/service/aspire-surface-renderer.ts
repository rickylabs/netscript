import { join } from '@std/path';
import {
  loadProjectConfig,
  loadProjectConfigForInspection,
} from '../config/project-config-loader.ts';
import type { ProcessPort } from '../../ports/process-port.ts';
import { canonicalizeAspireOutputs } from './aspire-surface-inventory.ts';
import { parseAppSettings } from '@netscript/aspire/config';
import { HelpersGeneratorPipeline } from '../../templates/aspire/helpers/helpers-generator-pipeline.ts';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import {
  getPluginServiceLookupName,
  loadRegisteredPluginMetadata,
} from '../config/plugin-registry.ts';
import { DenoProcess } from '../runtime/process/deno-process.ts';
import { resolveEffectivePluginPermissions } from '../config/deploy-config-resolvers.ts';
import type { RegisteredPluginConfig } from '../../domain/resolved-config.ts';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';
import type { TemplatePort } from '../../ports/template-port.ts';
import type { GeneratedFile } from '../../templates/aspire/helpers/types.ts';

/** Process and canonical formatting boundaries shared by the Aspire selectors. */
export interface AspireSurfaceRenderOptions {
  /** Injected canonical generated content formatter. */
  readonly formatter: GeneratedSourceFormatterPort;
  /** Configuration and plugin probe process boundary. */
  readonly process?: ProcessPort;
}

/** Render generation bytes, retaining recoverable plugin probe degradation. */
export function renderAspireSurface(
  projectRoot: string,
  fs: FileSystemPort,
  templateAdapter: TemplatePort,
  options: AspireSurfaceRenderOptions,
): Promise<readonly GeneratedFile[]> {
  return renderWithSelectors(projectRoot, fs, templateAdapter, options, {
    loadConfig: loadProjectConfig,
    loadPlugins: loadRegisteredPluginMetadata,
  });
}

/** Inspect through the same renderer with read-only config and certified plugin metadata. */
export function renderAspireSurfaceForInspection(
  projectRoot: string,
  fs: FileSystemPort,
  templateAdapter: TemplatePort,
  options: AspireSurfaceRenderOptions,
): Promise<readonly GeneratedFile[]> {
  return renderWithSelectors(projectRoot, fs, templateAdapter, options, {
    loadConfig: loadProjectConfigForInspection,
    loadPlugins: async (...args) => {
      const plugins = await loadRegisteredPluginMetadata(...args);
      const failed = Object.values(plugins).find((plugin) => plugin.manifestError);
      if (failed) {
        throw new Error(`Cannot inspect Aspire plugin ${failed.name}: ${failed.manifestError}`);
      }
      return plugins;
    },
  });
}

async function renderWithSelectors(
  projectRoot: string,
  fs: FileSystemPort,
  templateAdapter: TemplatePort,
  options: AspireSurfaceRenderOptions,
  selectors: {
    readonly loadConfig: typeof loadProjectConfig;
    readonly loadPlugins: typeof loadRegisteredPluginMetadata;
  },
): Promise<readonly GeneratedFile[]> {
  const appsettingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (!await fs.exists(appsettingsPath)) {
    throw new ScaffoldValidationError(
      `Cannot regenerate Aspire helpers because ${SCAFFOLD_FILES.APPSETTINGS} was not found.`,
      { projectRoot },
    );
  }

  const aspireDir = join(projectRoot, SCAFFOLD_DIRS.ASPIRE_TS);
  if (!await fs.exists(aspireDir)) {
    throw new ScaffoldValidationError(
      `Cannot regenerate Aspire helpers because ${SCAFFOLD_DIRS.ASPIRE_TS}/ was not found.`,
      { projectRoot, aspireDir },
    );
  }

  const parsed = await parseAppSettings(appsettingsPath);
  const rawAppsettings = JSON.parse(await fs.readFile(appsettingsPath)) as unknown;
  const process = options.process ?? new DenoProcess();
  const projectConfig = await selectors.loadConfig({ cwd: projectRoot }, { process });
  const registeredPlugins = await selectors.loadPlugins(projectRoot, projectConfig, process);
  const config = applyRegisteredPluginPermissions(
    preservePluginEnvironment(parsed.config, rawAppsettings),
    registeredPlugins,
  );
  const pipeline = new HelpersGeneratorPipeline(templateAdapter);
  const files = await pipeline.execute({
    config,
    configPath: `../${SCAFFOLD_FILES.APPSETTINGS}`,
    generateAppHost: true,
  });

  return await canonicalizeAspireOutputs(projectRoot, files, options.formatter);
}

function applyRegisteredPluginPermissions<
  TConfig extends {
    Plugins: Record<string, unknown>;
    BackgroundProcessors: Record<string, unknown>;
    Defaults: unknown;
  },
>(
  config: TConfig,
  registeredPlugins: Readonly<Record<string, RegisteredPluginConfig>>,
): TConfig {
  const defaults = readDefaultPermissions(config.Defaults);
  const plugins = { ...config.Plugins };
  for (const [name, entry] of Object.entries(plugins)) {
    if (!isRecord(entry)) continue;
    const plugin = registeredPlugins[getPluginServiceLookupName(name)];
    if (!plugin) continue;
    plugins[name] = {
      ...entry,
      Permissions: resolveEffectivePluginPermissions(
        stringArray(entry.Permissions),
        plugin.service?.permissions,
        plugin.permissions,
        defaults,
      ),
    };
  }

  const backgroundProcessors = { ...config.BackgroundProcessors };
  for (const [name, entry] of Object.entries(backgroundProcessors)) {
    if (!isRecord(entry)) continue;
    const plugin = registeredPlugins[name];
    if (!plugin) continue;
    backgroundProcessors[name] = {
      ...entry,
      Permissions: resolveEffectivePluginPermissions(
        stringArray(entry.Permissions),
        undefined,
        plugin.permissions,
        defaults,
      ),
    };
  }
  return { ...config, Plugins: plugins, BackgroundProcessors: backgroundProcessors };
}

function readDefaultPermissions(value: unknown): readonly string[] {
  if (!isRecord(value) || !isRecord(value.Deno)) return [];
  return stringArray(value.Deno.Permissions) ?? [];
}

function stringArray(value: unknown): readonly string[] | undefined {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? value
    : undefined;
}

function preservePluginEnvironment<TConfig extends { Plugins: Record<string, unknown> }>(
  config: TConfig,
  rawAppsettings: unknown,
): TConfig {
  if (!isRecord(rawAppsettings) || !isRecord(rawAppsettings.NetScript)) return config;
  const rawPlugins = rawAppsettings.NetScript.Plugins;
  if (!isRecord(rawPlugins)) return config;

  const plugins = { ...config.Plugins };
  for (const [name, rawPlugin] of Object.entries(rawPlugins)) {
    if (!isRecord(rawPlugin) || !isStringRecord(rawPlugin.Environment)) continue;
    const parsedPlugin = plugins[name];
    if (!isRecord(parsedPlugin)) continue;
    plugins[name] = { ...parsedPlugin, Environment: rawPlugin.Environment };
  }
  return { ...config, Plugins: plugins };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'string');
}
