import { join } from '@std/path';
import type { BackgroundProcessorEntry, CacheEntry, PluginEntry } from '@netscript/aspire/types';
import { addWorkspaceMember } from '../scaffold/workspace-writer.ts';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { SCAFFOLD_PACKAGES } from '../../constants/scaffold/scaffold-packages.ts';
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
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE,
    SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE_DOMAIN,
  ],
  stream: [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN],
  trigger: [
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
    SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS,
    SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS_RUNTIME,
    SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS_SCHEMAS,
  ],
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

    const requiredSpecifiers = PLUGIN_KIND_ROOT_IMPORTS[pluginKind] ?? [];
    if (requiredSpecifiers.length === 0) {
      return;
    }

    const raw = JSON.parse(await this.fs.readFile(denoJsonPath)) as WorkspaceDenoConfig;
    raw.imports ??= {};
    const resolvedImports = resolveNetScriptImports('jsr');
    let changed = false;
    for (const specifier of requiredSpecifiers) {
      const target = resolvedImports[specifier];
      if (target === undefined || raw.imports[specifier] === target) {
        continue;
      }
      raw.imports[specifier] = target;
      changed = true;
    }

    if (changed) {
      await this.fs.writeFile(denoJsonPath, JSON.stringify(raw, null, 2) + '\n');
    }
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
  async ensureNetScriptConfigPlugin(projectRoot: string, pluginName: string): Promise<boolean> {
    const configPath = join(projectRoot, 'netscript.config.ts');
    if (!await this.fs.exists(configPath)) {
      return false;
    }

    const specifier = `./${SCAFFOLD_DIRS.PLUGINS}/${pluginName}/mod.ts`;
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
    raw.NetScript.Cache[cacheKey] ??= {
      Enabled: true,
      Engine: 'Garnet',
      Mode: 'Container',
    };

    raw.NetScript.PrimaryCache ??= cacheKey;

    await this.fs.writeFile(configPath, JSON.stringify(raw, null, 2) + '\n');
    return !hadCache;
  }

}
