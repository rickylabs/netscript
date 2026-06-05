import { join as joinPosix } from '@std/path/posix';
import type { BackgroundProcessorEntry, PluginEntry } from '@netscript/aspire/types';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import type { PluginKindProvider, PluginScaffoldResult } from '../../domain/plugin-kind.ts';

interface PluginWorkspaceMutationOptions {
  readonly enabled?: boolean;
  readonly serviceReferences?: readonly string[];
  readonly pluginReferences?: readonly string[];
  readonly description?: string;
}

/** Build an appsettings plugin resource entry for a scaffolded plugin. */
export function buildPluginEntry(
  scaffoldResult: PluginScaffoldResult,
  provider: PluginKindProvider,
  options: PluginWorkspaceMutationOptions,
): PluginEntry {
  const entry = buildBasePluginEntry(scaffoldResult, provider, options);
  if (options.description) {
    entry.Description = options.description;
  }
  return entry;
}

/** Build an appsettings API service entry for a background plugin. */
export function buildPluginServiceEntry(
  scaffoldResult: PluginScaffoldResult,
  provider: PluginKindProvider,
  options: PluginWorkspaceMutationOptions,
): PluginEntry {
  const entry = buildBasePluginEntry(scaffoldResult, provider, options);
  if (options.description) {
    entry.Description = `${options.description} API`;
  }
  return entry;
}

/** Build an appsettings background processor entry for a scaffolded plugin. */
export function buildBackgroundProcessorEntry(
  scaffoldResult: PluginScaffoldResult,
  provider: PluginKindProvider,
  options: PluginWorkspaceMutationOptions,
): BackgroundProcessorEntry {
  const entry: BackgroundProcessorEntry = {
    Enabled: options.enabled ?? true,
    Runtime: 'deno',
    Entrypoint: provider.defaultEntrypoint,
    Workdir: scaffoldResult.backgroundWorkdir ??
      joinPosix(SCAFFOLD_DIRS.PLUGINS, scaffoldResult.configKey),
    Telemetry: provider.defaultTelemetry,
    WatchMode: true,
    RequiresDb: provider.defaultRequiresDb,
    RequiresKv: provider.defaultRequiresKv,
    Permissions: [...provider.defaultPermissions],
  };

  if (provider.supportsConcurrency && provider.defaultConcurrency !== null) {
    entry.Concurrency = provider.defaultConcurrency;
  }
  if (provider.supportsConcurrency && provider.concurrencyEnvVar) {
    entry.ConcurrencyEnvVar = provider.concurrencyEnvVar;
  }
  if (options.serviceReferences && options.serviceReferences.length > 0) {
    entry.ServiceReferences = [...options.serviceReferences];
  }

  const pluginReferences = new Set(options.pluginReferences);
  if (provider.defaultServiceEntrypoint) {
    pluginReferences.add(scaffoldResult.serviceConfigKey);
  }
  if (pluginReferences.size > 0) {
    entry.PluginReferences = [...pluginReferences];
  }
  if (options.description) {
    entry.Description = options.description;
  }

  return entry;
}

function buildBasePluginEntry(
  scaffoldResult: PluginScaffoldResult,
  provider: PluginKindProvider,
  options: PluginWorkspaceMutationOptions,
): PluginEntry {
  const entry: PluginEntry = {
    Enabled: options.enabled ?? true,
    Runtime: 'deno',
    Port: scaffoldResult.servicePort,
    Entrypoint: provider.defaultServiceEntrypoint ?? provider.defaultEntrypoint,
    Workdir: scaffoldResult.serviceWorkdir ??
      joinPosix(SCAFFOLD_DIRS.PLUGINS, scaffoldResult.configKey),
    RequiresKv: provider.defaultRequiresKv,
    RequiresDb: provider.defaultRequiresDb,
    Permissions: [...provider.defaultPermissions],
  };

  if (options.serviceReferences && options.serviceReferences.length > 0) {
    entry.ServiceReferences = [...options.serviceReferences];
  }
  if (options.pluginReferences && options.pluginReferences.length > 0) {
    entry.PluginReferences = [...options.pluginReferences];
  }

  return entry;
}
