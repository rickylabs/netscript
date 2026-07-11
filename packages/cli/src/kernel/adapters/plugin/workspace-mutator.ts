import { fromFileUrl, join, relative } from '@std/path';
import type { BackgroundProcessorEntry, CacheEntry, PluginEntry } from '@netscript/aspire/types';
import { addWorkspaceMember } from '../scaffold/workspace-writer.ts';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { SCAFFOLD_PACKAGES } from '../../constants/scaffold/scaffold-packages.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type {
  PluginConfigEntry,
  PluginKindProvider,
  PluginScaffoldResult,
  SagaStoreBackend,
} from '../../domain/plugin-kind.ts';
import {
  buildBackgroundProcessorEntry,
  buildPluginEntry,
  buildPluginServiceEntry,
} from './appsettings-entry-builders.ts';
import { insertPluginSpecifier } from './netscript-config-plugin.ts';
import { resolveNetScriptImports } from '../scaffold/import-resolver.ts';

/** Optional overrides when mutating workspace plugin config. */
export interface PluginWorkspaceMutationOptions {
  /** Whether the new config entry should be enabled. */
  readonly enabled?: boolean;
  /** Optional service references for the generated appsettings entry. */
  readonly serviceReferences?: readonly string[];
  /** Optional plugin references for the generated appsettings entry. */
  readonly pluginReferences?: readonly string[];
  /** Optional description for the generated appsettings entry. */
  readonly description?: string;
  /** Saga durable state backend for saga plugin appsettings. */
  readonly sagaStoreBackend?: SagaStoreBackend;
}

/** Summary of appsettings entries removed for a plugin. */
export interface RemovedPluginAppsettingsEntries {
  /** Removed API/service plugin config keys. */
  readonly plugins: readonly string[];
  /** Removed background processor config keys. */
  readonly backgroundProcessors: readonly string[];
}

interface AppsettingsShape {
  NetScript?: {
    PrimaryCache?: string;
    Cache?: Record<string, CacheEntry>;
    Plugins?: Record<string, PluginEntry>;
    BackgroundProcessors?: Record<string, BackgroundProcessorEntry>;
  };
}

interface WorkspaceDenoConfig {
  workspace?: string[];
  imports?: Record<string, string>;
}

const PLUGIN_KIND_ROOT_IMPORTS: Readonly<Record<string, readonly string[]>> = {
  auth: [
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_CONFIG,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_CONTRACTS_V1,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_DOMAIN,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_PORTS,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_STREAMS,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_TESTING,
  ],
  saga: [
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_RUNTIME,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE_DOMAIN,
  ],
  stream: [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN],
  trigger: [
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_RUNTIME,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_ADAPTERS,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_BUILDERS,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_CONFIG,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_CONTRACTS_V1,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_DOMAIN,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_PORTS,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_RUNTIME,
    SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS,
    SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS_RUNTIME,
  ],
  worker: [
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_WORKERS_RUNTIME,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_WORKERS_HEALTH_CHECK,
    SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS,
    SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS_RUNTIME,
    SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS_SCHEMAS,
  ],
};

const PLUGIN_SERVICE_BOOTSTRAP_IMPORTS: readonly string[] = [
  SCAFFOLD_PACKAGES.NETSCRIPT_CONTRACTS,
  SCAFFOLD_PACKAGES.NETSCRIPT_KV,
  SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN,
];

/**
 * Kind-scoped root import-map entries for plugins whose scaffolded userland glue
 * imports first-party `@netscript/*` packages that are NOT covered by the shared
 * {@link PLUGIN_SERVICE_SOURCE_IMPORTS} superset.
 *
 * These entries are applied ONLY to published/JSR consumer projects (no
 * {@link LOCAL_SOURCE_MARKER}). Local-source scaffolds copy the packages as
 * workspace members (see `SCAFFOLD_WORKSPACE_PACKAGES`), and Deno resolves a
 * member's bare name and export subpaths from any workspace file — writing
 * exact jsr pins into a local-source project would risk shadowing local source
 * with published packages and would wedge release-cut CI on not-yet-published
 * versions.
 *
 * Only bare package aliases are listed: Deno auto-expands export subpaths
 * (`@netscript/ai/agent`, `@netscript/fresh/ai`, ...) through a root
 * `jsr:` package alias, exactly like `deno add` semantics — verified
 * empirically against exact-version pins. Keep this list covering every
 * `@netscript/*` package whose specifiers are emitted by
 * `plugins/ai/src/adapter/resources/**` (guarded by the AI scaffold
 * import-map completeness test).
 */
const PLUGIN_KIND_SOURCE_IMPORTS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  ai: {
    '@netscript/ai': netscriptJsrSpecifier('ai'),
    '@netscript/plugin-ai-core': netscriptJsrSpecifier('plugin-ai-core'),
    '@netscript/fresh': netscriptJsrSpecifier('fresh'),
  },
};

const PLUGIN_SERVICE_SOURCE_IMPORTS: Readonly<Record<string, string>> = {
  '@durable-streams/client': 'npm:@durable-streams/client@^0.2.6',
  '@durable-streams/server': 'npm:@durable-streams/server@^0.3.7',
  '@durable-streams/state': 'npm:@durable-streams/state@^0.3.1',
  '@durable-streams/state/db': 'npm:@durable-streams/state@^0.3.1/db',
  '@netscript/cron': netscriptJsrSpecifier('cron'),
  '@netscript/kv/kvdex': netscriptJsrSpecifier('kv', '/kvdex'),
  '@netscript/plugin/contract-base': netscriptJsrSpecifier('plugin', '/contract-base'),
  '@netscript/plugin/loader': netscriptJsrSpecifier('plugin', '/loader'),
  '@netscript/plugin/sdk': netscriptJsrSpecifier('plugin', '/sdk'),
  '@netscript/plugin/service': netscriptJsrSpecifier('plugin', '/service'),
  '@netscript/plugin-auth-core/config': netscriptJsrSpecifier('plugin-auth-core', '/config'),
  '@netscript/plugin-auth-core/contracts/v1': netscriptJsrSpecifier(
    'plugin-auth-core',
    '/contracts/v1',
  ),
  '@netscript/plugin-auth-core/domain': netscriptJsrSpecifier('plugin-auth-core', '/domain'),
  '@netscript/plugin-auth-core/ports': netscriptJsrSpecifier('plugin-auth-core', '/ports'),
  '@netscript/plugin-auth-core/streams': netscriptJsrSpecifier('plugin-auth-core', '/streams'),
  '@netscript/plugin-auth-core/telemetry': netscriptJsrSpecifier('plugin-auth-core', '/telemetry'),
  '@netscript/plugin-sagas-core/contracts/v1': netscriptJsrSpecifier(
    'plugin-sagas-core',
    '/contracts/v1',
  ),
  '@netscript/plugin-sagas-core/domain': netscriptJsrSpecifier('plugin-sagas-core', '/domain'),
  '@netscript/plugin-sagas-core/integration/publisher': netscriptJsrSpecifier(
    'plugin-sagas-core',
    '/integration/publisher',
  ),
  '@netscript/plugin-sagas-core/runtime': netscriptJsrSpecifier('plugin-sagas-core', '/runtime'),
  '@netscript/plugin-sagas-core/stores': netscriptJsrSpecifier('plugin-sagas-core', '/stores'),
  '@netscript/plugin-sagas-core/streams': netscriptJsrSpecifier('plugin-sagas-core', '/streams'),
  '@netscript/plugin-streams-core': netscriptJsrSpecifier('plugin-streams-core'),
  '@netscript/plugin-triggers-core/adapters': netscriptJsrSpecifier(
    'plugin-triggers-core',
    '/adapters',
  ),
  '@netscript/plugin-triggers-core/builders': netscriptJsrSpecifier(
    'plugin-triggers-core',
    '/builders',
  ),
  '@netscript/plugin-triggers-core/config': netscriptJsrSpecifier(
    'plugin-triggers-core',
    '/config',
  ),
  '@netscript/plugin-triggers-core/contracts/v1': netscriptJsrSpecifier(
    'plugin-triggers-core',
    '/contracts/v1',
  ),
  '@netscript/plugin-triggers-core/domain': netscriptJsrSpecifier(
    'plugin-triggers-core',
    '/domain',
  ),
  '@netscript/plugin-triggers-core/ports': netscriptJsrSpecifier(
    'plugin-triggers-core',
    '/ports',
  ),
  '@netscript/plugin-triggers-core/runtime': netscriptJsrSpecifier(
    'plugin-triggers-core',
    '/runtime',
  ),
  '@netscript/plugin-triggers-core/stores': netscriptJsrSpecifier(
    'plugin-triggers-core',
    '/stores',
  ),
  '@netscript/plugin-triggers-core/telemetry': netscriptJsrSpecifier(
    'plugin-triggers-core',
    '/telemetry',
  ),
  '@netscript/plugin-workers-core/executor': netscriptJsrSpecifier(
    'plugin-workers-core',
    '/executor',
  ),
  '@netscript/plugin-workers-core/registry': netscriptJsrSpecifier(
    'plugin-workers-core',
    '/registry',
  ),
  '@netscript/plugin-workers-core/runtime': netscriptJsrSpecifier(
    'plugin-workers-core',
    '/runtime',
  ),
  '@netscript/plugin-workers-core/schemas': netscriptJsrSpecifier(
    'plugin-workers-core',
    '/schemas',
  ),
  '@netscript/plugin-workers-core/state': netscriptJsrSpecifier('plugin-workers-core', '/state'),
  '@netscript/plugin-workers-core/stores': netscriptJsrSpecifier('plugin-workers-core', '/stores'),
  '@netscript/plugin-workers-core/streams': netscriptJsrSpecifier(
    'plugin-workers-core',
    '/streams',
  ),
  '@netscript/queue': netscriptJsrSpecifier('queue'),
  '@netscript/service': netscriptJsrSpecifier('service'),
  '@netscript/telemetry': netscriptJsrSpecifier('telemetry'),
  '@netscript/telemetry/attributes': netscriptJsrSpecifier('telemetry', '/attributes'),
  '@netscript/telemetry/config': netscriptJsrSpecifier('telemetry', '/config'),
  '@netscript/telemetry/context': netscriptJsrSpecifier('telemetry', '/context'),
  '@netscript/telemetry/instrumentation': netscriptJsrSpecifier(
    'telemetry',
    '/instrumentation',
  ),
  '@netscript/telemetry/hono': netscriptJsrSpecifier('telemetry', '/hono'),
  '@netscript/telemetry/orpc': netscriptJsrSpecifier('telemetry', '/orpc'),
  '@netscript/telemetry/otel': netscriptJsrSpecifier('telemetry', '/otel'),
  '@netscript/telemetry/query': netscriptJsrSpecifier('telemetry', '/query'),
  '@netscript/telemetry/registry': netscriptJsrSpecifier('telemetry', '/registry'),
  '@netscript/telemetry/testing': netscriptJsrSpecifier('telemetry', '/testing'),
  '@netscript/telemetry/tracer': netscriptJsrSpecifier('telemetry', '/tracer'),
  '@orpc/contract': 'npm:@orpc/contract@^1.14.6',
  '@orpc/openapi': 'npm:@orpc/openapi@^1.14.6',
  '@orpc/server': 'npm:@orpc/server@^1.14.6',
  '@orpc/zod': 'npm:@orpc/zod@^1.14.6',
  '@standard-schema/spec': 'jsr:@standard-schema/spec@1.1.0',
  '@std/async': 'jsr:@std/async@^1',
  '@std/net': 'jsr:@std/net@^1',
  '@std/path': 'jsr:@std/path@^1',
  '@workos-inc/node': 'npm:@workos-inc/node@^10.4.0',
  'hono': 'jsr:@hono/hono@4.12.24',
  'hono/cors': 'jsr:@hono/hono@4.12.24/cors',
  'zod': 'jsr:@zod/zod@4.4.3',
};

const LOCAL_SOURCE_MARKER = join(SCAFFOLD_DIRS.PACKAGES, 'cli', SCAFFOLD_FILES.DENO_JSON);

const OFFICIAL_PLUGIN_RUNTIME_LOCAL_PATHS: Readonly<Record<string, string>> = {
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_WORKERS_RUNTIME]: join(
    'plugins',
    'workers',
    'bin',
    'runtime.ts',
  ),
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_WORKERS_HEALTH_CHECK]: join(
    'plugins',
    'workers',
    'jobs',
    'health-check.ts',
  ),
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_RUNTIME]: join(
    'plugins',
    'sagas',
    'src',
    'runtime',
    'mod.ts',
  ),
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_RUNTIME]: join(
    'plugins',
    'triggers',
    'src',
    'runtime',
    'mod.ts',
  ),
};

/** Mutates root config files after scaffolding a plugin workspace. */
export class PluginWorkspaceMutator {
  /** Create a mutator with injected filesystem access. */
  constructor(private readonly fs: FileSystemPort) {}

  /** Add or replace the plugin entry in root `appsettings.json`. */
  async updateAppsettings(
    projectRoot: string,
    scaffoldResult: PluginScaffoldResult,
    provider: PluginKindProvider,
    options: PluginWorkspaceMutationOptions = {},
  ): Promise<PluginConfigEntry> {
    const configPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
    if (!await this.fs.exists(configPath)) {
      throw new ScaffoldValidationError(
        `Cannot add plugin "${scaffoldResult.configKey}" because ${SCAFFOLD_FILES.APPSETTINGS} was not found.`,
        { projectRoot, pluginName: scaffoldResult.configKey },
      );
    }

    const raw = JSON.parse(await this.fs.readFile(configPath)) as AppsettingsShape;
    raw.NetScript ??= {};

    const entry = provider.category === 'plugin'
      ? buildPluginEntry(scaffoldResult, provider, options)
      : buildBackgroundProcessorEntry(scaffoldResult, provider, options);

    if (provider.category === 'plugin') {
      raw.NetScript.Plugins ??= {};
      raw.NetScript.Plugins[scaffoldResult.configKey] = entry as PluginEntry;
    } else {
      raw.NetScript.BackgroundProcessors ??= {};
      raw.NetScript.BackgroundProcessors[scaffoldResult.configKey] =
        entry as BackgroundProcessorEntry;
      if (provider.defaultServiceEntrypoint) {
        raw.NetScript.Plugins ??= {};
        raw.NetScript.Plugins[scaffoldResult.serviceConfigKey] = buildPluginServiceEntry(
          scaffoldResult,
          provider,
          options,
        );
      }
    }

    await this.fs.writeFile(configPath, JSON.stringify(raw, null, 2) + '\n');
    return entry;
  }

  /** Ensure the root `deno.json` workspace includes plugin workspace members. */
  async ensureWorkspaceMember(
    projectRoot: string,
    extraMembers: readonly string[] = [],
  ): Promise<void> {
    const denoJsonPath = join(projectRoot, SCAFFOLD_FILES.DENO_JSON);
    if (!await this.fs.exists(denoJsonPath)) {
      throw new ScaffoldValidationError(
        `Cannot ensure plugin workspace membership because ${SCAFFOLD_FILES.DENO_JSON} was not found.`,
        { projectRoot },
      );
    }

    const raw = JSON.parse(await this.fs.readFile(denoJsonPath)) as WorkspaceDenoConfig;
    const members = new Set(raw.workspace ?? []);

    for (
      const memberPath of [
        SCAFFOLD_DIRS.PLUGINS,
        `${SCAFFOLD_DIRS.PLUGINS}/*`,
        ...extraMembers,
      ]
    ) {
      const normalized = memberPath.startsWith('./') ? memberPath : `./${memberPath}`;
      if (members.has(normalized)) {
        continue;
      }

      await addWorkspaceMember(projectRoot, memberPath, this.fs);
      members.add(normalized);
    }
  }

  /** Ensure root `deno.json` can resolve packages used by an added first-party plugin kind. */
  async ensureRootImportsForPluginKind(projectRoot: string, pluginKind: string): Promise<void> {
    const denoJsonPath = join(projectRoot, SCAFFOLD_FILES.DENO_JSON);
    if (!await this.fs.exists(denoJsonPath)) {
      throw new ScaffoldValidationError(
        `Cannot update plugin import mappings because ${SCAFFOLD_FILES.DENO_JSON} was not found.`,
        { projectRoot, pluginKind },
      );
    }

    // Kind-source jsr pins are prod/JSR-only: local-source projects resolve
    // these packages as copied workspace members (name + export subpaths).
    const isLocalSourceProject = await this.fs.exists(join(projectRoot, LOCAL_SOURCE_MARKER));
    const kindSourceImports = isLocalSourceProject
      ? {}
      : PLUGIN_KIND_SOURCE_IMPORTS[pluginKind] ?? {};
    const requiredSpecifiers = [
      ...PLUGIN_SERVICE_BOOTSTRAP_IMPORTS,
      ...(PLUGIN_KIND_ROOT_IMPORTS[pluginKind] ?? []),
    ];
    if (requiredSpecifiers.length === 0 && Object.keys(kindSourceImports).length === 0) {
      return;
    }

    const raw = JSON.parse(await this.fs.readFile(denoJsonPath)) as WorkspaceDenoConfig;
    raw.imports ??= {};
    const resolvedImports = resolveNetScriptImports('jsr');
    const localRuntimeImports = await this.resolveLocalOfficialRuntimeImports(projectRoot);
    const requiredImports: Record<string, string> = {
      ...PLUGIN_SERVICE_SOURCE_IMPORTS,
      ...kindSourceImports,
    };
    for (const specifier of requiredSpecifiers) {
      const target = localRuntimeImports[specifier] ?? resolvedImports[specifier];
      if (target !== undefined) {
        requiredImports[specifier] = target;
      }
    }

    let changed = false;
    for (const [specifier, target] of Object.entries(requiredImports)) {
      if (raw.imports[specifier] === target) {
        continue;
      }
      raw.imports[specifier] = target;
      changed = true;
    }

    if (changed) {
      await this.fs.writeFile(denoJsonPath, JSON.stringify(raw, null, 2) + '\n');
    }
  }

  private async resolveLocalOfficialRuntimeImports(
    projectRoot: string,
  ): Promise<Readonly<Record<string, string>>> {
    if (!await this.fs.exists(join(projectRoot, LOCAL_SOURCE_MARKER))) {
      return {};
    }

    const repositoryRootUrl = new URL('../../../../../../', import.meta.url);
    if (repositoryRootUrl.protocol !== 'file:') {
      return {};
    }

    const repositoryRoot = fromFileUrl(repositoryRootUrl);
    const imports: Record<string, string> = {};
    for (const [specifier, sourcePath] of Object.entries(OFFICIAL_PLUGIN_RUNTIME_LOCAL_PATHS)) {
      const absoluteSourcePath = join(repositoryRoot, sourcePath);
      if (!await this.fs.exists(absoluteSourcePath)) {
        continue;
      }
      imports[specifier] = normalizeImportPath(relative(projectRoot, absoluteSourcePath));
    }
    return imports;
  }

  /** Add or replace a direct plugin appsettings entry. */
  async upsertPluginAppsettingsEntry(
    projectRoot: string,
    configKey: string,
    entry: PluginEntry,
  ): Promise<void> {
    const configPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
    if (!await this.fs.exists(configPath)) {
      throw new ScaffoldValidationError(
        `Cannot add plugin "${configKey}" because ${SCAFFOLD_FILES.APPSETTINGS} was not found.`,
        { projectRoot, configKey },
      );
    }

    const raw = JSON.parse(await this.fs.readFile(configPath)) as AppsettingsShape;
    raw.NetScript ??= {};
    raw.NetScript.Plugins ??= {};
    raw.NetScript.Plugins[configKey] = entry;

    await this.fs.writeFile(configPath, JSON.stringify(raw, null, 2) + '\n');
  }

  /** Ensure `netscript.config.ts` declares a project-local plugin module. */
  async ensureNetScriptConfigPlugin(
    projectRoot: string,
    pluginName: string,
    pluginDir?: string,
  ): Promise<boolean> {
    const configPath = join(projectRoot, 'netscript.config.ts');
    if (!await this.fs.exists(configPath)) {
      return false;
    }

    const relativePluginDir = pluginDir
      ? normalizeWorkspaceRelativePath(projectRoot, pluginDir)
      : join(SCAFFOLD_DIRS.PLUGINS, pluginName);
    const specifier = `./${normalizePath(join(relativePluginDir, 'mod.ts'))}`;
    const quotedSpecifier = `'${specifier}'`;
    const source = await this.fs.readFile(configPath);
    if (source.includes(quotedSpecifier) || source.includes(`"${specifier}"`)) {
      return false;
    }

    const updated = insertPluginSpecifier(source, quotedSpecifier);
    if (updated === source) {
      return false;
    }

    await this.fs.writeFile(configPath, updated);
    return true;
  }

  /** Remove plugin-related entries from root `appsettings.json`. */
  async removeAppsettingsEntries(
    projectRoot: string,
    pluginName: string,
  ): Promise<RemovedPluginAppsettingsEntries> {
    const configPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
    if (!await this.fs.exists(configPath)) {
      throw new ScaffoldValidationError(
        `Cannot remove plugin "${pluginName}" because ${SCAFFOLD_FILES.APPSETTINGS} was not found.`,
        { projectRoot, pluginName },
      );
    }

    const raw = JSON.parse(await this.fs.readFile(configPath)) as AppsettingsShape;
    raw.NetScript ??= {};

    const pluginKeys = [pluginName, `${pluginName}-api`];
    const removedPlugins: string[] = [];
    for (const key of pluginKeys) {
      if (raw.NetScript.Plugins?.[key] === undefined) continue;
      delete raw.NetScript.Plugins[key];
      removedPlugins.push(key);
    }

    const removedBackgroundProcessors: string[] = [];
    if (raw.NetScript.BackgroundProcessors?.[pluginName] !== undefined) {
      delete raw.NetScript.BackgroundProcessors[pluginName];
      removedBackgroundProcessors.push(pluginName);
    }

    await this.fs.writeFile(configPath, JSON.stringify(raw, null, 2) + '\n');
    return {
      plugins: removedPlugins,
      backgroundProcessors: removedBackgroundProcessors,
    };
  }

  /** Ensure a shared cache resource exists for plugins that use Deno KV-backed queues. */
  async ensureSharedCache(projectRoot: string, cacheKey = 'garnet'): Promise<boolean> {
    const configPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
    if (!await this.fs.exists(configPath)) {
      throw new ScaffoldValidationError(
        `Cannot add cache "${cacheKey}" because ${SCAFFOLD_FILES.APPSETTINGS} was not found.`,
        { projectRoot, cacheKey },
      );
    }

    const raw = JSON.parse(await this.fs.readFile(configPath)) as AppsettingsShape;
    raw.NetScript ??= {};
    raw.NetScript.Cache ??= {};

    const hadCache = raw.NetScript.Cache[cacheKey] !== undefined;
    // Environment-aware default (#372): `Auto` resolves at apphost runtime to a
    // Garnet container when Docker is available, or the Docker-less Garnet
    // dotnet-tool executable otherwise — both Redis-compatible, so KV consumers
    // are unaffected either way. Append-only (`??=`) leaves existing entries.
    raw.NetScript.Cache[cacheKey] ??= {
      Enabled: true,
      Engine: 'Garnet',
      Mode: 'Auto',
    };

    raw.NetScript.PrimaryCache ??= cacheKey;

    await this.fs.writeFile(configPath, JSON.stringify(raw, null, 2) + '\n');
    return !hadCache;
  }
}

function normalizeWorkspaceRelativePath(projectRoot: string, path: string): string {
  const normalizedProjectRoot = normalizePath(projectRoot).replace(/\/+$/, '');
  const normalizedPath = normalizePath(path);
  if (normalizedPath === normalizedProjectRoot) {
    return '.';
  }
  if (normalizedPath.startsWith(`${normalizedProjectRoot}/`)) {
    return normalizedPath.slice(normalizedProjectRoot.length + 1);
  }
  return normalizedPath.replace(/^\.\/+/, '');
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

function normalizeImportPath(path: string): string {
  const normalized = normalizePath(path);
  if (normalized.startsWith('../') || normalized.startsWith('./') || normalized.startsWith('/')) {
    return normalized;
  }
  return `./${normalized}`;
}
