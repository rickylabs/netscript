import type { PathsConfig } from '@netscript/config';
import type {
  RegisteredPluginConfig,
  ResolvedBackgroundProcessorConfig,
  ResolvedBackgroundProcessorEntrypointConfig,
} from '../../domain/resolved-config.ts';
import type { RawBackgroundProcessorConfig } from './deploy-config-types.ts';
import { resolvePluginEnvironmentVariables } from './plugin-registry.ts';
import {
  findWorkspaceMemberPath,
  mergeEnvironment,
  resolveWorkdir,
  type WorkspaceMap,
} from './deploy-config-resolvers.ts';

function getBackgroundProcessorPath(paths: PathsConfig, name: string): string {
  if (Object.hasOwn(paths, name)) {
    return paths[name as keyof PathsConfig];
  }
  return name;
}

function getBackgroundProcessorPlugins(
  registeredPlugins: Record<string, RegisteredPluginConfig>,
): Record<string, RegisteredPluginConfig> {
  return Object.fromEntries(
    Object.entries(registeredPlugins).filter(([, plugin]) =>
      plugin.type === 'background-processor'
    ),
  );
}

function getDefaultBackgroundEntrypointName(plugin?: RegisteredPluginConfig): string {
  if (plugin?.entrypoints?.combined) {
    return 'combined';
  }

  return Object.keys(plugin?.entrypoints ?? {})[0] ?? 'combined';
}

function resolveBackgroundProcessorEntrypoints(
  name: string,
  raw: RawBackgroundProcessorConfig | undefined,
  plugin: RegisteredPluginConfig | undefined,
): Record<string, ResolvedBackgroundProcessorEntrypointConfig> {
  const resolved: Record<string, ResolvedBackgroundProcessorEntrypointConfig> = {};
  const defaultEntrypointName = getDefaultBackgroundEntrypointName(plugin);
  const rawEntrypointNames = Object.keys(raw?.Entrypoints ?? {});
  const pluginEntrypointNames = Object.keys(plugin?.entrypoints ?? {});
  const entrypointNames = rawEntrypointNames.length > 0
    ? rawEntrypointNames
    : raw?.Entrypoint
    ? [defaultEntrypointName]
    : pluginEntrypointNames.length > 0
    ? pluginEntrypointNames
    : [];

  for (const entrypointName of entrypointNames) {
    const rawEntrypoint = raw?.Entrypoints?.[entrypointName];
    const pluginEntrypoint = plugin?.entrypoints?.[entrypointName];
    const isDefaultEntrypoint = entrypointName === defaultEntrypointName;

    resolved[entrypointName] = {
      name: entrypointName,
      entrypoint: rawEntrypoint?.Entrypoint ??
        (isDefaultEntrypoint ? raw?.Entrypoint : undefined) ??
        pluginEntrypoint?.path ??
        `bin/${entrypointName}.ts`,
      description: rawEntrypoint?.Description ??
        (isDefaultEntrypoint ? raw?.Description : undefined) ??
        pluginEntrypoint?.description ??
        `${name} ${entrypointName} runtime`,
      permissions: rawEntrypoint?.Permissions ?? raw?.Permissions ??
        pluginEntrypoint?.permissions ??
        plugin?.permissions ?? ['--allow-all', '--unstable-kv'],
      include: rawEntrypoint?.Include ?? pluginEntrypoint?.include,
      manifestResourceName: rawEntrypoint?.ManifestResourceName ??
        pluginEntrypoint?.manifestResourceName ??
        plugin?.infrastructure?.manifestResourceName,
      environment: mergeEnvironment(
        resolvePluginEnvironmentVariables(plugin?.infrastructure?.envVars),
        resolvePluginEnvironmentVariables(pluginEntrypoint?.envVars),
      ),
      assignWorkerId: rawEntrypoint?.AssignWorkerId ?? pluginEntrypoint?.assignWorkerId,
    };
  }

  return resolved;
}

function resolveBackgroundProcessor(
  name: string,
  raw: RawBackgroundProcessorConfig | undefined,
  paths: PathsConfig,
  plugin: RegisteredPluginConfig | undefined,
  workspace?: WorkspaceMap,
): ResolvedBackgroundProcessorConfig {
  const workspaceWorkdir = findWorkspaceMemberPath(workspace, 'background', name);
  const workdir = resolveWorkdir(
    raw?.Workdir,
    workspaceWorkdir ?? plugin?.workdir,
    getBackgroundProcessorPath(paths, name),
  );

  return {
    name,
    enabled: raw?.Enabled ?? false,
    workdir,
    concurrency: raw?.Concurrency ?? plugin?.infrastructure?.defaultConcurrency ?? 2,
    concurrencyEnvVar: raw?.ConcurrencyEnvVar ?? plugin?.infrastructure?.concurrencyEnvVar,
    permissions: raw?.Permissions ?? plugin?.permissions ?? ['--allow-all', '--unstable-kv'],
    description: raw?.Description,
    watchDirs: raw?.WatchDirs,
    runtimeTopics: plugin?.infrastructure?.runtimeTopics,
    requiresKv: raw?.RequiresKv ?? plugin?.infrastructure?.requires.includes('kv') ?? false,
    requiresDb: raw?.RequiresDb ?? plugin?.infrastructure?.requires.includes('db') ?? false,
    serviceReferences: raw?.ServiceReferences ?? [],
    pluginReferences: raw?.PluginReferences ?? [],
    entrypoints: raw?.Enabled ? resolveBackgroundProcessorEntrypoints(name, raw, plugin) : {},
  };
}

export function resolveBackgroundProcessors(
  raw: Record<string, RawBackgroundProcessorConfig> | undefined,
  paths: PathsConfig,
  registeredPlugins: Record<string, RegisteredPluginConfig>,
  workspace?: WorkspaceMap,
): Record<string, ResolvedBackgroundProcessorConfig> {
  const backgroundProcessorPlugins = getBackgroundProcessorPlugins(registeredPlugins);
  const processorNames = new Set([
    ...Object.keys(backgroundProcessorPlugins),
    ...Object.keys(raw ?? {}),
  ]);

  return Object.fromEntries(
    [...processorNames]
      .sort((left, right) => left.localeCompare(right))
      .map((name) => [
        name,
        resolveBackgroundProcessor(
          name,
          raw?.[name],
          paths,
          backgroundProcessorPlugins[name],
          workspace,
        ),
      ]),
  );
}

// ============================================================================
// DEPLOY CONFIG RESOLVER
// ============================================================================

/**
 * Merge user deploy.windows overrides with compiled-in defaults.
 * All fields are required on the returned object — callers never deal with optionals.
 */
