import { join } from '@std/path';
import { discoverWorkspace } from '@netscript/config';
import type { DeployConfig, PathsConfig } from '@netscript/config';
import {
  DEFAULT_BUNDLE_EXTERNAL,
  DEFAULT_BUNDLE_EXTERNAL_IMPORTS,
  DEFAULT_BUNDLE_TIMEOUT_MS,
  DEFAULT_COMPILE_TARGET,
  DEFAULT_COMPILE_TIMEOUT_MS,
  DEFAULT_HEALTH_MONITORING,
  DEFAULT_LOG_ROTATION,
  DEFAULT_SERVICE_PREFIX,
  DEFAULT_SERVY_CLI_PATH,
  DEFAULT_V8_HEAP_MB,
} from '../../constants/windows.ts';
import type {
  RegisteredPluginConfig,
  ResolvedAppConfig,
  ResolvedDefaultsConfig,
  ResolvedPluginConfig,
  ResolvedServiceConfig,
  ResolvedWindowsDeployConfig,
} from '../../domain/resolved-config.ts';
import { getPluginServiceLookupName } from './plugin-registry.ts';
import type {
  NetScriptAppConfig,
  NetScriptSection,
  RawAppConfig,
  RawPluginConfig,
} from './deploy-config-types.ts';

const DEFAULT_DENO_PERMISSIONS = [
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-sys',
];

export function resolveDefaults(ns: NetScriptSection): ResolvedDefaultsConfig {
  return {
    permissions: ns.Defaults?.Deno?.Permissions ?? DEFAULT_DENO_PERMISSIONS,
    watchMode: ns.Defaults?.Deno?.WatchMode ?? false,
  };
}

export function mergeEnvironment(
  ...sources: Array<Record<string, string> | undefined>
): Record<string, string> | undefined {
  const merged = Object.assign({}, ...sources.filter(Boolean));
  return Object.keys(merged).length > 0 ? merged : undefined;
}

export type WorkspaceMap = Awaited<ReturnType<typeof discoverWorkspace>>;

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function getMemberLeaf(path: string): string {
  return normalizePath(path).split('/').at(-1) ?? path;
}

export function findWorkspaceMemberPath(
  workspace: WorkspaceMap | undefined,
  type: 'service' | 'plugin' | 'background' | 'app',
  name: string,
): string | undefined {
  const collection = type === 'service'
    ? workspace?.services
    : type === 'plugin'
    ? workspace?.plugins
    : type === 'background'
    ? workspace?.backgroundProcessors
    : workspace?.apps;

  return collection?.find((member) => {
    const memberLeaf = getMemberLeaf(member.path);
    const memberName = member.name.split('/').at(-1) ?? member.name;
    return memberLeaf === name || memberName === name;
  })?.path;
}

export function resolveWorkdir(
  explicit: string | undefined,
  workspacePath: string | undefined,
  fallback: string,
): string {
  return normalizePath(explicit ?? workspacePath ?? fallback);
}

/**
 * Merge services from netscript.config.ts + appsettings.json.
 * appsettings.json values take precedence for runtime-specific fields (Port, Workdir, etc.)
 */
export function resolveServices(
  ns: NetScriptSection,
  netscriptServices:
    | Record<
      string,
      {
        port?: number;
        entrypoint?: string;
        workdir?: string;
        dependsOn?: string[];
        runtime?: string;
      }
    >
    | undefined,
  defaultPermissions: string[],
  paths: PathsConfig,
  workspace?: WorkspaceMap,
): Record<string, ResolvedServiceConfig> {
  const services: Record<string, ResolvedServiceConfig> = {};
  const appServices = ns.Services ?? {};

  // Start from netscript.config.ts service list
  for (const [name, nsSvc] of Object.entries(netscriptServices ?? {})) {
    const appSvc = appServices[name];
    const workspaceWorkdir = findWorkspaceMemberPath(workspace, 'service', name);
    services[name] = {
      name,
      runtime:
        ((appSvc?.Runtime ?? nsSvc.runtime ?? 'deno').toLowerCase()) as ResolvedServiceConfig[
          'runtime'
        ],
      port: appSvc?.Port ?? nsSvc.port ?? 3000,
      entrypoint: appSvc?.Entrypoint ?? nsSvc.entrypoint ?? 'src/main.ts',
      workdir: resolveWorkdir(
        appSvc?.Workdir ?? nsSvc.workdir,
        workspaceWorkdir,
        join(paths.services, name),
      ),
      dependsOn: appSvc?.DependsOn ?? nsSvc.dependsOn,
      permissions: appSvc?.Permissions ?? defaultPermissions,
      description: appSvc?.Description,
    };
  }

  // Add any services only in appsettings.json (not in netscript.config.ts)
  for (const [name, appSvc] of Object.entries(appServices)) {
    if (name in services) continue;
    const workspaceWorkdir = findWorkspaceMemberPath(workspace, 'service', name);
    services[name] = {
      name,
      runtime: ((appSvc.Runtime ?? 'deno').toLowerCase()) as ResolvedServiceConfig['runtime'],
      port: appSvc.Port ?? 3000,
      entrypoint: appSvc.Entrypoint ?? 'src/main.ts',
      workdir: resolveWorkdir(appSvc.Workdir, workspaceWorkdir, join(paths.services, name)),
      dependsOn: appSvc.DependsOn,
      permissions: appSvc.Permissions ?? defaultPermissions,
      description: appSvc.Description,
    };
  }

  return services;
}

export function resolvePlugins(
  raw: Record<string, RawPluginConfig>,
  defaultPermissions: string[],
  paths: PathsConfig,
  registeredPlugins: Record<string, RegisteredPluginConfig>,
  workspace?: WorkspaceMap,
): Record<string, ResolvedPluginConfig> {
  const plugins: Record<string, ResolvedPluginConfig> = {};
  for (const [name, cfg] of Object.entries(raw)) {
    // Skip disabled plugins that have no port (they're placeholder entries)
    if (cfg.Enabled === false && !cfg.Port) continue;

    const pluginName = getPluginServiceLookupName(name);
    const plugin = registeredPlugins[pluginName];
    const pluginService = plugin?.service;
    const workspaceWorkdir = findWorkspaceMemberPath(workspace, 'plugin', pluginName);

    plugins[name] = {
      name,
      enabled: cfg.Enabled ?? false,
      port: cfg.Port ?? pluginService?.port ?? plugin?.infrastructure?.port ?? 8090,
      entrypoint: cfg.Entrypoint ?? pluginService?.entrypoint ?? 'services/src/main.ts',
      workdir: resolveWorkdir(
        cfg.Workdir,
        plugin?.workdir ?? workspaceWorkdir,
        join(paths.plugins, pluginName),
      ),
      requiresKv: cfg.RequiresKv ?? pluginService?.requiresKv ??
        plugin?.infrastructure?.requires.includes('kv') ?? false,
      requiresDb: cfg.RequiresDb ?? pluginService?.requiresDatabase ??
        plugin?.infrastructure?.requires.includes('db') ?? false,
      permissions: cfg.Permissions ?? pluginService?.permissions ??
        [...defaultPermissions, '--allow-write'],
      description: cfg.Description ?? pluginService?.description,
    };
  }
  return plugins;
}

export function resolveApps(
  raw: Record<string, RawAppConfig>,
  netscriptApps: Record<string, NetScriptAppConfig> | undefined,
  defaultPermissions: string[],
  paths: PathsConfig,
  workspace?: WorkspaceMap,
): Record<string, ResolvedAppConfig> {
  const apps: Record<string, ResolvedAppConfig> = {};

  for (const [name, nsApp] of Object.entries(netscriptApps ?? {})) {
    const rawApp = raw[name];
    // Skip explicitly disabled apps (appsettings.json Enabled: false)
    if (rawApp?.Enabled === false) continue;
    const runtime = (rawApp?.Runtime ?? rawApp?.Type ?? nsApp.runtime ?? 'deno').toLowerCase();

    // Only Deno-runtime apps are compiled and managed as Windows Services
    if (runtime !== 'deno') continue;

    const workspaceWorkdir = findWorkspaceMemberPath(workspace, 'app', name);
    apps[name] = {
      name,
      enabled: true,
      runtime: 'deno',
      port: rawApp?.Port ?? nsApp.port ?? 8000,
      entrypoint: rawApp?.Entrypoint ?? nsApp.entrypoint ?? 'main.ts',
      workdir: resolveWorkdir(
        rawApp?.Workdir ?? nsApp.workdir,
        workspaceWorkdir,
        join(paths.apps, name),
      ),
      permissions: rawApp?.Permissions ?? nsApp.permissions ??
        [...defaultPermissions, '--allow-write'],
      description: rawApp?.Description ?? nsApp.description,
      prebuild: rawApp?.Prebuild ?? nsApp.prebuild,
    };
  }

  for (const [name, rawApp] of Object.entries(raw)) {
    if (name in apps) continue;
    if (rawApp.Enabled === false) continue;

    const runtime = (rawApp.Runtime ?? rawApp.Type ?? 'deno').toLowerCase();
    if (runtime !== 'deno') continue;

    const workspaceWorkdir = findWorkspaceMemberPath(workspace, 'app', name);
    apps[name] = {
      name,
      enabled: true,
      runtime: 'deno',
      port: rawApp.Port ?? 8000,
      entrypoint: rawApp.Entrypoint ?? 'main.ts',
      workdir: resolveWorkdir(rawApp.Workdir, workspaceWorkdir, join(paths.apps, name)),
      permissions: rawApp.Permissions ?? [...defaultPermissions, '--allow-write'],
      description: rawApp.Description,
      prebuild: rawApp.Prebuild,
    };
  }

  return apps;
}

export function resolveWindowsDeploy(userDeploy?: DeployConfig): ResolvedWindowsDeployConfig {
  const win = userDeploy?.windows;
  return {
    servyCliPath: win?.servyCliPath ?? DEFAULT_SERVY_CLI_PATH,
    servicePrefix: win?.servicePrefix ?? DEFAULT_SERVICE_PREFIX,
    installBase: win?.installBase ?? 'C:\\NetScript',
    mode: win?.mode ?? 'compile',
    denoPath: win?.denoPath ?? 'deno',
    compileTarget: win?.compileTarget ?? DEFAULT_COMPILE_TARGET,
    concurrency: win?.concurrency ?? 4,
    compileTimeoutMs: win?.compileTimeoutMs ?? DEFAULT_COMPILE_TIMEOUT_MS,
    bundleTimeoutMs: win?.bundleTimeoutMs ?? DEFAULT_BUNDLE_TIMEOUT_MS,
    bundleExternal: win?.bundleExternal
      ? (win.bundleExternal as readonly string[])
      : DEFAULT_BUNDLE_EXTERNAL,
    bundleExternalImports: win?.bundleExternalImports ?? DEFAULT_BUNDLE_EXTERNAL_IMPORTS,
    workspace: win?.workspace,
    v8HeapMb: {
      service: win?.v8HeapMb?.service ?? DEFAULT_V8_HEAP_MB.service,
      plugin: win?.v8HeapMb?.plugin ?? DEFAULT_V8_HEAP_MB.plugin,
      worker: win?.v8HeapMb?.worker ?? DEFAULT_V8_HEAP_MB.worker,
      app: win?.v8HeapMb?.app ?? DEFAULT_V8_HEAP_MB.app,
    },
    generateEnvFile: win?.generateEnvFile ?? true,
    logging: {
      rotationSizeMb: win?.logging?.rotationSizeMb ?? DEFAULT_LOG_ROTATION.rotationSizeMB,
      maxRotations: win?.logging?.maxRotations ?? DEFAULT_LOG_ROTATION.maxRotations,
      dateRotation: win?.logging?.dateRotation ?? DEFAULT_LOG_ROTATION.dateRotationType,
    },
    health: {
      intervalSeconds: win?.health?.intervalSeconds ??
        DEFAULT_HEALTH_MONITORING.heartbeatIntervalSeconds,
      maxFailedChecks: win?.health?.maxFailedChecks ?? DEFAULT_HEALTH_MONITORING.maxFailedChecks,
      maxRestartAttempts: win?.health?.maxRestartAttempts ??
        DEFAULT_HEALTH_MONITORING.maxRestartAttempts,
    },
    docker: {
      denoBaseImage: win?.docker?.denoBaseImage ?? 'denoland/deno:2.5',
      dotnetBaseImage: win?.docker?.dotnetBaseImage ?? 'mcr.microsoft.com/dotnet/aspnet:9.0',
    },
  };
}

// ============================================================================
// PROJECT ROOT FINDER
// ============================================================================

/**
 * Walk up from startDir looking for a NetScript project root.
 * A root is identified by the presence of:
 * - netscript.config.ts, OR
 * - dotnet/AppHost/appsettings.json, OR
 * - deno.json with a `workspace` array
 */
