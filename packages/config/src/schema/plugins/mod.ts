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
  readonly InstalledVersion: string;
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
  readonly Enabled: boolean;
  readonly Description?: string;
  readonly Permissions?: readonly string[];
  readonly ServiceReferences?: readonly string[];
  readonly PluginReferences?: readonly string[];
  readonly Runtime: string;
  readonly Port: number;
  readonly Entrypoint: string;
  readonly Workdir?: string;
  readonly RequiresKv: boolean;
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
  readonly Enabled: boolean;
  readonly Description?: string;
  readonly Permissions?: readonly string[];
  readonly ServiceReferences?: readonly string[];
  readonly PluginReferences?: readonly string[];
  readonly Runtime: string;
  readonly Workdir?: string;
  readonly Entrypoint: string;
  readonly Concurrency?: number;
  readonly ConcurrencyEnvVar?: string;
  readonly Telemetry: boolean;
  readonly WatchMode: boolean;
  readonly WatchDirs?: readonly string[];
  readonly RequiresDb: boolean;
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
export const installedVersionSchema: z.ZodType<InstalledVersionFields> = z.object(
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
export const pluginEntrySchema: z.ZodType<PluginEntry> = z.object({
  ...baseEntryFields,
  ...referenceFields,
  ...installedVersionFields,
  Runtime: z.string().default('deno'),
  Port: z.number().int().positive(),
  Entrypoint: z.string().default('src/main.ts'),
  Workdir: z.string().optional(),
  RequiresKv: z.boolean().default(false),
  RequiresDb: z.boolean().default(false),
});

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
export const backgroundProcessorEntrySchema: z.ZodType<BackgroundProcessorEntry> = z.object({
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
});
