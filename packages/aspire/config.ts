/**
 * @module
 *
 * Zod schemas and parser for Aspire `appsettings.json` configuration.
 *
 * All schemas use PascalCase keys to match ASP.NET Core's `IConfiguration`
 * binding convention. The parser reads a JSON file, validates it against the
 * schema, resolves defaults, and validates cross-references.
 *
 * @example
 * ```ts
 * import { parseAppSettings } from '@netscript/aspire/config';
 *
 * const { config, warnings } = await parseAppSettings('dotnet/AppHost/appsettings.json');
 * console.log(config.Name); // "test-app"
 * ```
 */

import { z } from 'zod';

type DatabaseEngine = 'Postgres' | 'Mssql' | 'Mysql' | 'Sqlite';
type CacheEngine = 'Redis' | 'Garnet';
type ResourceMode = 'Container' | 'External';
type AppType = 'app' | 'tauri' | 'task';

interface OtelConfig {
  HttpEndpoint: string;
  Protocol: string;
}

interface DenoDefaults {
  Permissions: string[];
  WatchMode: boolean;
}

interface DefaultsConfig {
  Deno: DenoDefaults;
}

interface BaseEntry {
  Enabled: boolean;
  Description?: string;
  Permissions?: string[];
}

interface ReferenceEntry {
  ServiceReferences?: string[];
  PluginReferences?: string[];
}

interface ServiceEntry extends BaseEntry, ReferenceEntry {
  Runtime: string;
  Port: number;
  Entrypoint: string;
  Workdir?: string;
  DependsOn?: string[];
}

interface AppEntry extends BaseEntry, ReferenceEntry {
  Runtime: string;
  Type: AppType;
  WatchMode: boolean;
  Prebuild?: string;
  Workdir?: string;
  Remote?: string;
  Port?: number;
  TaskName?: string;
  RequiresKv: boolean;
}

interface PluginEntry extends BaseEntry, ReferenceEntry {
  Runtime: string;
  Port: number;
  Entrypoint: string;
  Workdir?: string;
  RequiresKv: boolean;
  RequiresDb: boolean;
}

interface BackgroundProcessorEntry extends BaseEntry, ReferenceEntry {
  Runtime: string;
  Workdir?: string;
  Entrypoint: string;
  Concurrency?: number;
  ConcurrencyEnvVar?: string;
  Telemetry: boolean;
  WatchMode: boolean;
  WatchDirs?: string[];
  RequiresDb: boolean;
  RequiresKv: boolean;
}

interface DatabaseEntry extends BaseEntry {
  Engine: DatabaseEngine;
  Mode: ResourceMode;
  ImageTag?: string;
  DatabaseName?: string;
  DataPath?: string;
  Port?: number;
  Persistent: boolean;
}

interface CacheEntry extends BaseEntry {
  Engine: CacheEngine;
  Mode: ResourceMode;
  ImageTag?: string;
  Port?: number;
  DataPath?: string;
}

interface ToolEntry extends BaseEntry {
  TaskName?: string;
  Database?: string;
}

interface NetScriptConfig {
  Name: string;
  Version: string;
  AspireProject?: string;
  PrimaryDatabase?: string;
  PrimaryCache?: string;
  Otel: OtelConfig;
  Defaults: DefaultsConfig;
  Services: Record<string, ServiceEntry>;
  Apps: Record<string, AppEntry>;
  Plugins: Record<string, PluginEntry>;
  BackgroundProcessors: Record<string, BackgroundProcessorEntry>;
  Databases: Record<string, DatabaseEntry>;
  Cache: Record<string, CacheEntry>;
  Tools: Record<string, ToolEntry>;
}

interface LoggingConfig {
  LogLevel?: Record<string, string>;
}

interface AppSettings {
  $schema?: string;
  Logging?: LoggingConfig;
  NetScript: NetScriptConfig;
}

// --- Enum Schemas ---

/** Database engine variants supported by Aspire hosting integrations. */
export const DatabaseEngineSchema: z.ZodType<DatabaseEngine> = z
  .enum(['Postgres', 'Mssql', 'Mysql', 'Sqlite'])
  .meta({ title: 'DatabaseEngine', description: 'Supported database engine types' });

/** Cache engine variants supported by Aspire hosting integrations. */
export const CacheEngineSchema: z.ZodType<CacheEngine> = z
  .enum(['Redis', 'Garnet'])
  .meta({ title: 'CacheEngine', description: 'Supported cache engine types' });

/** Resource provisioning mode. */
export const ResourceModeSchema: z.ZodType<ResourceMode> = z
  .enum(['Container', 'External'])
  .meta({
    title: 'ResourceMode',
    description: 'Resource provisioning mode: Container (managed) or External (pre-existing)',
  });

/** Application type variants for the Apps section. */
export const AppTypeSchema: z.ZodType<AppType> = z
  .enum(['app', 'tauri', 'task'])
  .meta({
    title: 'AppType',
    description: 'Application type: app (web), tauri (desktop), or task (deno task)',
  });

// --- Component Schemas ---

/** OpenTelemetry endpoint configuration. */
export const OtelConfigSchema: z.ZodType<OtelConfig> = z.object({
  HttpEndpoint: z.string().default('http://localhost:4318'),
  Protocol: z.string().default('http/protobuf'),
}).meta({ title: 'OtelConfig', description: 'OpenTelemetry exporter configuration' });

/** Global Deno runtime defaults. */
export const DenoDefaultsSchema: z.ZodType<DenoDefaults> = z.object({
  Permissions: z.array(z.string()).default([
    '--allow-net',
    '--allow-env',
    '--allow-read',
    '--allow-sys',
  ]),
  WatchMode: z.boolean().default(false),
}).meta({
  title: 'DenoDefaults',
  description: 'Default Deno runtime configuration applied to all resources',
});

/** Defaults section wrapper. */
export const DefaultsSchema: z.ZodType<DefaultsConfig> = z.object({
  Deno: DenoDefaultsSchema.default(() => ({
    Permissions: ['--allow-net', '--allow-env', '--allow-read', '--allow-sys'],
    WatchMode: false,
  })),
}).meta({ title: 'Defaults', description: 'Global default configuration' });

// --- Entry Schemas ---

/** Common fields shared by all resource entries. */
const BaseEntryFields = {
  Enabled: z.boolean().default(true),
  Description: z.string().optional(),
  Permissions: z.array(z.string()).optional(),
} as const satisfies z.ZodRawShape;

/** Common reference fields for entries that can reference services and plugins. */
const ReferenceFields = {
  ServiceReferences: z.array(z.string()).optional(),
  PluginReferences: z.array(z.string()).optional(),
} as const satisfies z.ZodRawShape;

/** Service entry configuration. */
export const ServiceEntrySchema: z.ZodType<ServiceEntry> = z.object({
  ...BaseEntryFields,
  ...ReferenceFields,
  Runtime: z.string().default('deno'),
  Port: z.number().int().positive(),
  Entrypoint: z.string().default('src/main.ts'),
  Workdir: z.string().optional(),
  DependsOn: z.array(z.string()).optional(),
}).meta({ title: 'ServiceEntry', description: 'Configuration for a backend service resource' });

/** Application entry configuration. */
export const AppEntrySchema: z.ZodType<AppEntry> = z.object({
  ...BaseEntryFields,
  ...ReferenceFields,
  Runtime: z.string().default('deno'),
  Type: AppTypeSchema.default('app'),
  WatchMode: z.boolean().default(false),
  Prebuild: z.string().optional(),
  Workdir: z.string().optional(),
  Remote: z.string().optional(),
  Port: z.number().int().positive().optional(),
  TaskName: z.string().optional(),
  RequiresKv: z.boolean().default(false),
}).meta({
  title: 'AppEntry',
  description: 'Configuration for a frontend or desktop application resource',
});

/** Plugin entry configuration. */
export const PluginEntrySchema: z.ZodType<PluginEntry> = z.object({
  ...BaseEntryFields,
  ...ReferenceFields,
  Runtime: z.string().default('deno'),
  Port: z.number().int().positive(),
  Entrypoint: z.string().default('src/main.ts'),
  Workdir: z.string().optional(),
  RequiresKv: z.boolean().default(false),
  RequiresDb: z.boolean().default(false),
}).meta({ title: 'PluginEntry', description: 'Configuration for a plugin service resource' });

/** Background processor entry configuration. */
export const BackgroundProcessorEntrySchema: z.ZodType<BackgroundProcessorEntry> = z.object({
  ...BaseEntryFields,
  ...ReferenceFields,
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
}).meta({
  title: 'BackgroundProcessorEntry',
  description: 'Configuration for a background processor (worker, saga, trigger)',
});

/** Database entry configuration. */
export const DatabaseEntrySchema: z.ZodType<DatabaseEntry> = z.object({
  ...BaseEntryFields,
  Engine: DatabaseEngineSchema,
  Mode: ResourceModeSchema.default('Container'),
  ImageTag: z.string().optional(),
  DatabaseName: z.string().optional(),
  DataPath: z.string().optional(),
  Port: z.number().int().positive().optional(),
  Persistent: z.boolean().default(false),
}).meta({ title: 'DatabaseEntry', description: 'Configuration for a database resource' });

/** Cache entry configuration. */
export const CacheEntrySchema: z.ZodType<CacheEntry> = z.object({
  ...BaseEntryFields,
  Engine: CacheEngineSchema.default('Garnet'),
  Mode: ResourceModeSchema.default('Container'),
  ImageTag: z.string().optional(),
  Port: z.number().int().positive().optional(),
  DataPath: z.string().optional(),
}).meta({ title: 'CacheEntry', description: 'Configuration for a cache resource' });

/** Prisma Studio tool configuration. */
export const ToolEntrySchema: z.ZodType<ToolEntry> = z.object({
  ...BaseEntryFields,
  TaskName: z.string().optional(),
  Database: z.string().optional(),
}).meta({ title: 'ToolEntry', description: 'Configuration for a development tool' });

// --- Root Configuration Schemas ---

/** Root NetScript configuration section from `appsettings.json`. */
export const NetScriptConfigSchema: z.ZodType<NetScriptConfig> = z.object({
  Name: z.string(),
  Version: z.string().default('1.0.0'),
  AspireProject: z.string().optional(),
  PrimaryDatabase: z.string().optional(),
  PrimaryCache: z.string().optional(),
  Otel: OtelConfigSchema.default(() => ({
    HttpEndpoint: 'http://localhost:4318',
    Protocol: 'http/protobuf',
  })),
  Defaults: DefaultsSchema.default(() => ({
    Deno: {
      Permissions: ['--allow-net', '--allow-env', '--allow-read', '--allow-sys'],
      WatchMode: false,
    },
  })),
  Services: z.record(z.string(), ServiceEntrySchema).default({}),
  Apps: z.record(z.string(), AppEntrySchema).default({}),
  Plugins: z.record(z.string(), PluginEntrySchema).default({}),
  BackgroundProcessors: z.record(z.string(), BackgroundProcessorEntrySchema).default({}),
  Databases: z.record(z.string(), DatabaseEntrySchema).default({}),
  Cache: z.record(z.string(), CacheEntrySchema).default({}),
  Tools: z.record(z.string(), ToolEntrySchema).default({}),
}).meta({ title: 'NetScriptConfig', description: 'Root NetScript application configuration' });

/** ASP.NET Core log level configuration. */
const LogLevelSchema: z.ZodType<Record<string, string> | undefined> = z.record(
  z.string(),
  z.string(),
).optional();

/** ASP.NET Core logging configuration. */
const LoggingSchema: z.ZodType<LoggingConfig | undefined> = z.object({
  LogLevel: LogLevelSchema,
}).optional();

/** Top-level `appsettings.json` structure. */
export const AppSettingsSchema: z.ZodType<AppSettings> = z.object({
  $schema: z.string().optional(),
  Logging: LoggingSchema,
  NetScript: NetScriptConfigSchema,
}).meta({
  title: 'AppSettings',
  description:
    'Full appsettings.json structure including ASP.NET Core logging and NetScript configuration',
});

// --- Parser ---

/**
 * Resolves default values that depend on the record key (resource name).
 *
 * - Resolves `Workdir` defaults based on section convention
 * - Merges legacy `DependsOn` into `ServiceReferences`
 * - Generates `ConcurrencyEnvVar` default from key name
 *
 * @param config - The parsed NetScript configuration
 * @returns The configuration with defaults resolved
 */
function resolveDefaults<T extends NetScriptConfig>(config: T): T {
  const result = structuredClone(config);

  // Resolve service workdirs
  for (const [key, entry] of Object.entries(result.Services)) {
    if (!entry.Workdir) {
      entry.Workdir = `services/${key}`;
    }
    // Merge legacy DependsOn → ServiceReferences
    if (entry.DependsOn?.length) {
      const existing = new Set(entry.ServiceReferences ?? []);
      for (const dep of entry.DependsOn) {
        existing.add(dep);
      }
      entry.ServiceReferences = [...existing];
    }
  }

  // Resolve app workdirs
  for (const [key, entry] of Object.entries(result.Apps)) {
    if (!entry.Workdir) {
      entry.Workdir = `apps/${key}`;
    }
  }

  // Resolve plugin workdirs
  for (const [key, entry] of Object.entries(result.Plugins)) {
    if (!entry.Workdir) {
      entry.Workdir = `plugins/${key}`;
    }
  }

  // Resolve background processor workdirs + concurrency env var
  for (const [key, entry] of Object.entries(result.BackgroundProcessors)) {
    if (!entry.Workdir) {
      entry.Workdir = key;
    }
    if (!entry.ConcurrencyEnvVar && entry.Concurrency) {
      entry.ConcurrencyEnvVar = `${key.toUpperCase().replace(/-/g, '_')}_CONCURRENCY`;
    }
  }

  return result;
}

/**
 * Validates cross-references within the configuration.
 *
 * Checks that `PrimaryDatabase`, `PrimaryCache`, `ServiceReferences`, and
 * `PluginReferences` all point to entries that actually exist in the config.
 *
 * @param config - The parsed and defaults-resolved configuration
 * @returns Array of validation issues (empty if valid)
 */
function validateCrossReferences(config: NetScriptConfig): string[] {
  const issues: string[] = [];
  const serviceNames = new Set(Object.keys(config.Services));
  const pluginNames = new Set(Object.keys(config.Plugins));
  const dbNames = new Set(Object.keys(config.Databases));
  const cacheNames = new Set(Object.keys(config.Cache));

  // Primary references
  if (config.PrimaryDatabase && !dbNames.has(config.PrimaryDatabase)) {
    issues.push(
      `PrimaryDatabase "${config.PrimaryDatabase}" is not a key in Databases (available: ${
        [...dbNames].join(', ')
      })`,
    );
  }
  if (config.PrimaryCache && !cacheNames.has(config.PrimaryCache)) {
    issues.push(
      `PrimaryCache "${config.PrimaryCache}" is not a key in Cache (available: ${
        [...cacheNames].join(', ')
      })`,
    );
  }

  // Service/plugin references across all sections
  const sections = [
    { name: 'Services', entries: config.Services },
    { name: 'Apps', entries: config.Apps },
    { name: 'Plugins', entries: config.Plugins },
    { name: 'BackgroundProcessors', entries: config.BackgroundProcessors },
  ] as const;

  for (const section of sections) {
    for (const [key, entry] of Object.entries(section.entries)) {
      const refs = entry as Record<string, unknown>;
      const svcRefs = refs.ServiceReferences as string[] | undefined;
      const plgRefs = refs.PluginReferences as string[] | undefined;

      if (svcRefs) {
        for (const ref of svcRefs) {
          if (!serviceNames.has(ref)) {
            issues.push(
              `${section.name}.${key}.ServiceReferences: "${ref}" is not a key in Services`,
            );
          }
        }
      }
      if (plgRefs) {
        for (const ref of plgRefs) {
          if (!pluginNames.has(ref)) {
            issues.push(
              `${section.name}.${key}.PluginReferences: "${ref}" is not a key in Plugins`,
            );
          }
        }
      }
    }
  }

  return issues;
}

/** Options for controlling parser behavior. */
export interface ParseOptions {
  /** When `true`, cross-reference issues throw instead of being returned as warnings. */
  readonly strict?: boolean;
}

/** Result of parsing `appsettings.json`. */
export interface ParseResult<T extends NetScriptConfig> {
  /** The validated and defaults-resolved configuration. */
  readonly config: T;
  /** Cross-reference validation warnings (empty if all references are valid). */
  readonly warnings: readonly string[];
}

/**
 * Parses an `appsettings.json` file, validates it against the Zod schema,
 * resolves key-dependent defaults, and checks cross-references.
 *
 * @param filePath - Path to the `appsettings.json` file
 * @param options - Optional parse behavior options
 * @returns Parsed configuration with cross-reference warnings
 *
 * @example
 * ```ts
 * const { config, warnings } = await parseAppSettings('dotnet/AppHost/appsettings.json');
 * console.log(config.Name);     // "test-app"
 * console.log(config.Services); // { users: {...}, products: {...}, orders: {...} }
 * ```
 */
export async function parseAppSettings(
  filePath: string,
  options?: ParseOptions,
): Promise<ParseResult<NetScriptConfig>> {
  const text = await Deno.readTextFile(filePath);
  const json = JSON.parse(text);
  const parsed = AppSettingsSchema.parse(json);
  const config = resolveDefaults(parsed.NetScript);
  const warnings = validateCrossReferences(config);

  if (options?.strict && warnings.length > 0) {
    throw new Error(
      `Cross-reference validation failed:\n${warnings.map((w) => `  - ${w}`).join('\n')}`,
    );
  }

  return { config, warnings };
}
