/**
 * Plugin kind vocabulary shared by CLI command modes.
 */

import type { BackgroundProcessorEntry, PluginEntry } from '@netscript/aspire/types';
import type { PluginManifest, PluginType } from '@netscript/plugin';
import type { ScaffoldResult } from './core-types.ts';
import type { DbEngine } from './db-engine.ts';
import type { PackageSourceMode } from './scaffold/scaffold-options.ts';

export type { ScaffoldResult } from './core-types.ts';
export type { PackageSourceMode } from './scaffold/scaffold-options.ts';

/** Plugin kind identifier registered by a generic CLI provider or plugin-owned manifest. */
export type PluginKind = string;

/** Aspire registration category for a plugin kind. */
export type PluginCategory = 'plugin' | 'background-processor';

/** Root `appsettings.json` section targeted by a plugin kind. */
export type PluginConfigSection = 'Plugins' | 'BackgroundProcessors';

/** Port ranges available to plugin scaffolders. */
export type PluginPortRangeKey = 'PLUGIN_API' | 'INFRA_PLUGIN';

/** Appsettings entry generated for a scaffolded plugin. */
export type PluginConfigEntry = PluginEntry | BackgroundProcessorEntry;

/** `definePlugin().type` values currently emitted by the CLI. */
export type ScaffoldedPluginType = Extract<
  PluginType,
  'background-processor' | 'utility'
>;

/** One infrastructure requirement item emitted by CLI plugin scaffolding. */
export type PluginInfrastructureDependency = 'kv' | 'db' | 'cache';

/** Durable saga state backend emitted for saga plugin appsettings. */
export type SagaStoreBackend = 'kv' | 'prisma';

/** Maps Aspire registration categories to appsettings config sections. */
export const PLUGIN_CONFIG_SECTION_MAP: Record<PluginCategory, PluginConfigSection> = {
  plugin: 'Plugins',
  'background-processor': 'BackgroundProcessors',
} as const;

/**
 * Immutable per-kind scaffolding knowledge.
 *
 * This is a CLI-only concern. It centralizes day-1 archetype defaults while
 * still producing output that conforms to `PluginManifest`.
 */
export interface PluginKindProvider {
  /** CLI kind identifier. */
  readonly kind: PluginKind;

  /** Human-readable label for logging and command output. */
  readonly displayName: string;

  /** Aspire registration category. */
  readonly category: PluginCategory;

  /** Port range key used for automatic allocation. */
  readonly portRangeKey: PluginPortRangeKey;

  /** Default Deno permission flags for the plugin. */
  readonly defaultPermissions: readonly string[];

  /** Watch flag used by Aspire registration helpers. */
  readonly watchFlag: '--watch' | '--watch-hmr';

  /** Default executable entrypoint relative to plugin root. */
  readonly defaultEntrypoint: string;

  /** Default service entrypoint relative to plugin root, if any. */
  readonly defaultServiceEntrypoint: string | null;

  /** Whether generated service/worker code should assume DB access. */
  readonly defaultRequiresDb: boolean;

  /** Whether generated service/worker code should assume KV access. */
  readonly defaultRequiresKv: boolean;

  /** `definePlugin().type` emitted for this archetype. */
  readonly pluginType: ScaffoldedPluginType;

  /** Whether the archetype supports concurrency configuration. */
  readonly supportsConcurrency: boolean;

  /** Default concurrency environment variable name, if supported. */
  readonly concurrencyEnvVar: string | null;

  /** Default concurrency value, if supported. */
  readonly defaultConcurrency: number | null;

  /** Whether generated runtime config enables telemetry by default. */
  readonly defaultTelemetry: boolean;

  /** Infrastructure requirements emitted into `definePlugin().infrastructure`. */
  readonly infrastructureRequires: readonly PluginInfrastructureDependency[];

  /** Optional infrastructure dependencies emitted into the manifest. */
  readonly infrastructureOptionalDeps: readonly PluginInfrastructureDependency[];
}

/** Options for creating a plugin workspace under `plugins/<name>/`. */
export interface PluginScaffoldOptions {
  /** Project name used for scoped package metadata. */
  readonly projectName: string;

  /** Absolute project root path. */
  readonly targetPath: string;

  /** Selected plugin kind. */
  readonly kind: PluginKind;

  /** Plugin name in kebab-case. */
  readonly pluginName: string;

  /** Import mode for NetScript package references. */
  readonly importMode: PackageSourceMode;

  /** Depth-adjusted local base path for local imports. */
  readonly localBase?: string;

  /** Explicit port override. */
  readonly port?: number;

  /** Optional peer service references. */
  readonly serviceReferences?: readonly string[];

  /** Optional peer plugin references. */
  readonly pluginReferences?: readonly string[];

  /** Whether this plugin should emit DB wiring and schema contribution files. */
  readonly requiresDb?: boolean;

  /** Whether to scaffold sample jobs, tasks, and sagas where relevant. */
  readonly includeSamples?: boolean;

  /** Whether existing files should be overwritten. */
  readonly force: boolean;
}

/** Result of creating a plugin workspace. */
export interface PluginScaffoldResult {
  /** Standard scaffold operation summary. */
  readonly scaffoldResult: ScaffoldResult;

  /** Absolute path to the plugin workspace directory. */
  readonly pluginDir: string;

  /** Scaffolded plugin kind. */
  readonly kind: PluginKind;

  /** Allocated or user-provided infrastructure port for this plugin manifest. */
  readonly port: number;

  /** Port used by the generated service entrypoint. */
  readonly servicePort: number;

  /** Root config section targeted by this plugin. */
  readonly configSection: PluginConfigSection;

  /** Appsettings config key for this plugin. */
  readonly configKey: string;

  /** Appsettings config key for the generated service entrypoint. */
  readonly serviceConfigKey: string;

  /** Optional workdir override for the background processor appsettings entry. */
  readonly backgroundWorkdir?: string;

  /** Optional workdir override for the service appsettings entry. */
  readonly serviceWorkdir?: string;
}

/** Options for init-time registry scaffolding. */
export interface PluginRegistryScaffoldOptions {
  /** Project name used for scoped package metadata. */
  readonly projectName: string;

  /** Absolute project root path. */
  readonly targetPath: string;

  /** Import mode for NetScript package references. */
  readonly importMode: PackageSourceMode;

  /** Depth-adjusted local base path for local imports. */
  readonly localBase?: string;

  /** Whether existing files should be overwritten. */
  readonly force: boolean;
}

/** Plugin metadata discovered from workspace configuration. */
export interface DiscoveredPlugin {
  /** Plugin config key. */
  readonly name: string;

  /** CLI kind inferred from workspace config and/or manifest. */
  readonly kind: PluginKind;

  /** Whether the plugin is enabled. */
  readonly enabled: boolean;

  /** Root config section containing the plugin entry. */
  readonly configSection: PluginConfigSection;

  /** Configured workdir relative to project root. */
  readonly workdir: string;

  /** Configured entrypoint relative to workdir. */
  readonly entrypoint: string;

  /** Configured or inferred service port, if any. */
  readonly port?: number;

  /** Declared service references. */
  readonly serviceReferences: readonly string[];

  /** Declared plugin references. */
  readonly pluginReferences: readonly string[];
}

/** Minimal manifest fragment emitted by the scaffolder for `definePlugin()`. */
export interface GeneratedPluginManifest {
  readonly contributions?: PluginManifest['contributions'];
  readonly hooks?: PluginManifest['hooks'];
  readonly permissions?: PluginManifest['permissions'];
  readonly type?: PluginManifest['type'];
}

/** Result of resolving plugin database intent against project state. */
export interface PluginDbDetectionResult {
  /** Whether the plugin should be wired as DB-backed. */
  readonly requiresDb: boolean;
  /** Whether the target database already exists in appsettings. */
  readonly dbExists: boolean;
  /** Target DB config key, either existing or to be provisioned. */
  readonly targetConfigKey: string | null;
  /** Target DB engine, either existing or to be provisioned. */
  readonly targetEngine: DbEngine | null;
  /** Whether plugin add must scaffold and register a DB workspace first. */
  readonly needsProvisioning: boolean;
}

/** Result of copying a plugin schema contribution into the active DB schema tree. */
export interface PluginSchemaCopyResult {
  /** Plugin-local source schema path. */
  readonly sourcePath: string;
  /** Active Prisma schema contribution path in the root DB workspace. */
  readonly targetPath: string;
  /** Whether the target file was written (`false` means it already existed). */
  readonly written: boolean;
}
