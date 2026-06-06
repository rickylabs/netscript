/**
 * Plugin appsettings schemas used by generated NetScript hosts.
 *
 * @module
 */

import { z } from 'zod';

const baseEntryFields = {
  Enabled: z.boolean().default(true),
  Description: z.string().optional(),
  Permissions: z.array(z.string()).optional(),
} as const;

const referenceFields = {
  ServiceReferences: z.array(z.string()).optional(),
  PluginReferences: z.array(z.string()).optional(),
} as const;

const installedVersionFields = {
  InstalledVersion: z.string().min(1),
  InstalledFrom: z.string().min(1),
} as const;

const pluginEntryFields = {
  ...baseEntryFields,
  ...referenceFields,
  ...installedVersionFields,
  Runtime: z.string().default('deno'),
  Port: z.number().int().positive(),
  Entrypoint: z.string().default('src/main.ts'),
  Workdir: z.string().optional(),
  RequiresKv: z.boolean().default(false),
  RequiresDb: z.boolean().default(false),
} as const;

const backgroundProcessorEntryFields = {
  ...baseEntryFields,
  ...referenceFields,
  ...installedVersionFields,
  Runtime: z.string().default('deno'),
  Workdir: z.string().optional(),
  Entrypoint: z.string().default('bin/combined.ts'),
  Concurrency: z.number().int().positive().optional(),
  ConcurrencyEnvVar: z.string().optional(),
  Telemetry: z.boolean().default(true),
  WatchMode: z.boolean().default(false),
  WatchDirs: z.array(z.string()).optional(),
  RequiresDb: z.boolean().default(false),
  RequiresKv: z.boolean().default(false),
} as const;

/** Minimal public validation contract for plugin appsettings schemas. */
export interface PluginSettingsSchema<T> {
  /** Parse and validate an unknown appsettings value. */
  parse(input: unknown): T;
  /** Parse an unknown appsettings value and return a success/failure result. */
  safeParse(input: unknown):
    | { success: true; data: T }
    | { success: false; error: unknown };
}

/**
 * Installed plugin version fields stored in `appsettings.json`.
 *
 * @example
 * ```ts
 * import { installedVersionSchema } from "@netscript/config/schema/plugins";
 *
 * const version = installedVersionSchema.parse({
 *   InstalledVersion: "0.0.1-alpha.0",
 *   InstalledFrom: "jsr:@netscript/plugin-workers@^0.0.1-alpha.0",
 * });
 * ```
 */
export interface InstalledVersionFields {
  /** Installed plugin version string. */
  readonly InstalledVersion: string;
  /** Source specifier or workspace path used to install the plugin. */
  readonly InstalledFrom: string;
}

/**
 * Configuration for a plugin-backed HTTP service in `appsettings.json`.
 *
 * @example
 * ```ts
 * import { pluginEntrySchema } from "@netscript/config/schema/plugins";
 *
 * const entry = pluginEntrySchema.parse({
 *   Port: 8091,
 *   InstalledVersion: "0.0.1-alpha.0",
 *   InstalledFrom: "jsr:@netscript/plugin-workers@^0.0.1-alpha.0",
 * });
 * ```
 */
export interface PluginEntry extends InstalledVersionFields {
  /** Whether the plugin service is enabled. */
  readonly Enabled: boolean;
  /** Optional human-readable plugin description. */
  readonly Description?: string;
  /** Optional Deno permission names required by the plugin. */
  readonly Permissions?: readonly string[];
  /** Service names referenced by the plugin. */
  readonly ServiceReferences?: readonly string[];
  /** Plugin names referenced by the plugin. */
  readonly PluginReferences?: readonly string[];
  /** Runtime used to execute the plugin service. */
  readonly Runtime: string;
  /** HTTP port assigned to the plugin service. */
  readonly Port: number;
  /** Entrypoint file for the plugin service. */
  readonly Entrypoint: string;
  /** Working directory for the plugin service. */
  readonly Workdir?: string;
  /** Whether the plugin service requires Deno KV. */
  readonly RequiresKv: boolean;
  /** Whether the plugin service requires a database. */
  readonly RequiresDb: boolean;
}

/**
 * Configuration for a plugin-backed background processor in `appsettings.json`.
 *
 * @example
 * ```ts
 * import { backgroundProcessorEntrySchema } from "@netscript/config/schema/plugins";
 *
 * const processor = backgroundProcessorEntrySchema.parse({
 *   InstalledVersion: "0.0.1-alpha.0",
 *   InstalledFrom: "workspace:plugins/workers",
 * });
 * ```
 */
export interface BackgroundProcessorEntry extends InstalledVersionFields {
  /** Whether the background processor is enabled. */
  readonly Enabled: boolean;
  /** Optional human-readable processor description. */
  readonly Description?: string;
  /** Optional Deno permission names required by the processor. */
  readonly Permissions?: readonly string[];
  /** Service names referenced by the processor. */
  readonly ServiceReferences?: readonly string[];
  /** Plugin names referenced by the processor. */
  readonly PluginReferences?: readonly string[];
  /** Runtime used to execute the processor. */
  readonly Runtime: string;
  /** Working directory for the processor. */
  readonly Workdir?: string;
  /** Entrypoint file for the processor. */
  readonly Entrypoint: string;
  /** Optional processor concurrency limit. */
  readonly Concurrency?: number;
  /** Environment variable name used to resolve concurrency. */
  readonly ConcurrencyEnvVar?: string;
  /** Whether telemetry is enabled for the processor. */
  readonly Telemetry: boolean;
  /** Whether file-watch mode is enabled for the processor. */
  readonly WatchMode: boolean;
  /** Directories watched when watch mode is enabled. */
  readonly WatchDirs?: readonly string[];
  /** Whether the processor requires a database. */
  readonly RequiresDb: boolean;
  /** Whether the processor requires Deno KV. */
  readonly RequiresKv: boolean;
}

/**
 * Validates installed plugin version metadata stored on appsettings entries.
 *
 * @example
 * ```ts
 * const fields = installedVersionSchema.parse({
 *   InstalledVersion: "0.0.1-alpha.0",
 *   InstalledFrom: "local:../plugins/example",
 * });
 * ```
 */
export const installedVersionSchema: PluginSettingsSchema<InstalledVersionFields> = z.object(
  installedVersionFields,
);

/**
 * Validates a `NetScript.Plugins.<key>` appsettings entry.
 *
 * @example
 * ```ts
 * const entry = pluginEntrySchema.parse({
 *   Port: 8091,
 *   InstalledVersion: "0.0.1-alpha.0",
 *   InstalledFrom: "jsr:@netscript/plugin-workers",
 * });
 * ```
 */
export const pluginEntrySchema: PluginSettingsSchema<PluginEntry> = z.object(pluginEntryFields);

/**
 * Validates a `NetScript.BackgroundProcessors.<key>` appsettings entry.
 *
 * @example
 * ```ts
 * const processor = backgroundProcessorEntrySchema.parse({
 *   InstalledVersion: "0.0.1-alpha.0",
 *   InstalledFrom: "jsr:@netscript/plugin-workers",
 * });
 * ```
 */
export const backgroundProcessorEntrySchema: PluginSettingsSchema<BackgroundProcessorEntry> = z
  .object(backgroundProcessorEntryFields);
