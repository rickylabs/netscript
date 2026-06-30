import { isAbsolute } from '@std/path';
import { join as joinPosix } from '@std/path/posix';
import type { BackgroundProcessorEntry, PluginEntry } from '@netscript/aspire/types';
import type {
  PluginKindProvider,
  PluginScaffoldResult,
  SagaStoreBackend,
} from '../../domain/plugin-kind.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';

const PROJECT_ROOT_WORKDIR = '.';

interface PluginWorkspaceMutationOptions {
  readonly enabled?: boolean;
  readonly serviceReferences?: readonly string[];
  readonly pluginReferences?: readonly string[];
  readonly description?: string;
  readonly sagaStoreBackend?: SagaStoreBackend;
}

/** Build an appsettings plugin resource entry for a scaffolded plugin. */
export function buildPluginEntry(
  scaffoldResult: PluginScaffoldResult,
  provider: PluginKindProvider,
  options: PluginWorkspaceMutationOptions,
): PluginEntry {
  const entry = buildBasePluginEntry(scaffoldResult, provider, options);
  applySagaStoreBackend(entry, provider, options.sagaStoreBackend);
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
  applySagaStoreBackend(entry, provider, options.sagaStoreBackend);
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
    Entrypoint: scaffoldResult.backgroundWorkdir
      ? provider.defaultEntrypoint
      : backgroundRuntimeEntrypoint(scaffoldResult.configKey),
    Workdir: scaffoldResult.backgroundWorkdir ?? PROJECT_ROOT_WORKDIR,
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
  applySagaStoreBackend(entry, provider, options.sagaStoreBackend);

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
    Entrypoint: resolveServiceEntrypoint(scaffoldResult, provider),
    Workdir: scaffoldResult.serviceWorkdir ?? PROJECT_ROOT_WORKDIR,
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

function resolveServiceEntrypoint(
  scaffoldResult: PluginScaffoldResult,
  provider: PluginKindProvider,
): string {
  if (scaffoldResult.serviceWorkdir) {
    return provider.defaultServiceEntrypoint ?? provider.defaultEntrypoint;
  }
  if (
    provider.defaultServiceEntrypoint &&
    isAbsolute(provider.defaultServiceEntrypoint)
  ) {
    return provider.defaultServiceEntrypoint;
  }
  return servicePackageEntrypoint(scaffoldResult.configKey);
}

function servicePackageEntrypoint(configKey: string): string {
  return netscriptJsrSpecifier(`plugin-${configKey}`, '/services');
}

function backgroundRuntimeEntrypoint(configKey: string): string {
  return joinPosix(configKey, 'runtime.ts');
}

function applySagaStoreBackend(
  entry: PluginEntry | BackgroundProcessorEntry,
  provider: PluginKindProvider,
  backend: SagaStoreBackend | undefined,
): void {
  if (provider.kind !== 'saga') {
    return;
  }
  const mutable = entry as (PluginEntry | BackgroundProcessorEntry) & {
    Sagas?: { Store: { Backend: SagaStoreBackend } };
  };
  mutable.Sagas = { Store: { Backend: backend ?? 'kv' } };
}
