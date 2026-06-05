/**
 * @module
 *
 * Shared option interfaces and result types for the CLI helpers generator.
 * Each generator function receives a narrow slice of the parsed config
 * via these option types — enabling isolated testing and clear contracts.
 */

import type {
  AppEntry,
  BackgroundProcessorEntry,
  CacheEntry,
  DatabaseEntry,
  DenoDefaults,
  NetScriptConfig,
  PluginEntry,
  ServiceEntry,
  ToolEntry,
} from '@netscript/aspire/types';

/** A generated file with its relative output path and content. */
export interface GeneratedFile {
  /** Relative path from the output root (e.g., ".helpers/index.ts"). */
  readonly path: string;
  /** Full file content as a string. */
  readonly content: string;
}

/** Top-level options for the helpers generator orchestrator. */
export interface HelpersGeneratorOptions {
  /** Parsed NetScript config (from parseAppSettings). */
  readonly config: NetScriptConfig;
  /** Path to appsettings.json relative to workspace root. */
  readonly configPath?: string;
  /** Whether to generate the apphost.ts entry point (default: true). */
  readonly generateAppHost?: boolean;
}

/** Options for config-schema.ts generation. */
export interface ConfigSchemaOptions {
  readonly services: Record<string, ServiceEntry>;
  readonly apps: Record<string, AppEntry>;
  readonly plugins: Record<string, PluginEntry>;
  readonly backgroundProcessors: Record<string, BackgroundProcessorEntry>;
  readonly databases: Record<string, DatabaseEntry>;
  readonly caches: Record<string, CacheEntry>;
  readonly tools: Record<string, ToolEntry>;
}

/** Options for register-infrastructure.ts generation. */
export interface RegisterInfrastructureOptions {
  readonly databases: Record<string, DatabaseEntry>;
  readonly caches: Record<string, CacheEntry>;
  readonly primaryDatabase?: string;
  readonly primaryCache?: string;
}

/** Options for db-cli-mode.ts generation. */
export interface DbCliModeOptions {
  readonly databases: Record<string, DatabaseEntry>;
}

/** Options for register-services.ts generation. */
export interface RegisterServicesOptions {
  readonly services: Record<string, ServiceEntry>;
  readonly version: string;
  readonly denoDefaults: DenoDefaults;
}

/** Options for register-plugins.ts generation. */
export interface RegisterPluginsOptions {
  readonly plugins: Record<string, PluginEntry>;
  readonly version: string;
  readonly denoDefaults: DenoDefaults;
}

/** Options for register-background.ts generation. */
export interface RegisterBackgroundOptions {
  readonly processors: Record<string, BackgroundProcessorEntry>;
  readonly version: string;
  readonly denoDefaults: DenoDefaults;
}

/** Options for register-apps.ts generation. */
export interface RegisterAppsOptions {
  readonly apps: Record<string, AppEntry>;
  readonly version: string;
  readonly denoDefaults: DenoDefaults;
}

/** Options for register-tools.ts generation. */
export interface RegisterToolsOptions {
  readonly tools: Record<string, ToolEntry>;
}
