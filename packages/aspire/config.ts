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

/** Public parser contract exposed by Aspire schema constants. */
export interface AspireSchema<Output> {
  /** Structural metadata consumed by Zod inference utilities. */
  readonly _zod: {
    /** Schema input type. */
    readonly input: unknown;
    /** Schema output type. */
    readonly output: Output;
  };
  /** Parse and validate unknown input into the schema output type. */
  parse(data: unknown): Output;
  /** Parse unknown input without throwing on validation failure. */
  safeParse(data: unknown): AspireSafeParseResult<Output>;
}

/** Successful result from `AspireSchema.safeParse`. */
export interface AspireSafeParseSuccess<Output> {
  /** Whether parsing succeeded. */
  readonly success: true;
  /** Parsed output value. */
  readonly data: Output;
}

/** Failed result from `AspireSchema.safeParse`. */
export interface AspireSafeParseFailure {
  /** Whether parsing succeeded. */
  readonly success: false;
  /** Validation error object from the underlying schema engine. */
  readonly error: unknown;
}

/** Result from `AspireSchema.safeParse`. */
export type AspireSafeParseResult<Output> =
  | AspireSafeParseSuccess<Output>
  | AspireSafeParseFailure;

/** Database engine variants supported by Aspire hosting integrations. */
export type DatabaseEngine = 'Postgres' | 'Mssql' | 'Mysql' | 'Sqlite';
/** Cache engine variants supported by Aspire hosting integrations. */
export type CacheEngine = 'Redis' | 'Garnet' | 'DenoKv';
/** Resource provisioning mode for managed resources. */
export type ResourceMode = 'Container' | 'External';
/**
 * Cache-specific provisioning mode. Wider than {@link ResourceMode}:
 * - `Local`: no Aspire resource; consumers use in-process `Deno.openKv()` (DenoKv only).
 * - `Container`: managed container resource.
 * - `Executable`: managed dotnet-tool executable (Garnet only, Docker-less bare metal).
 * - `External`: pre-existing resource referenced by connection string.
 * - `Auto`: backend selected at AppHost runtime by Docker availability.
 */
export type CacheMode = 'Local' | 'Container' | 'Executable' | 'External' | 'Auto';
/** Application entry variants supported by the AppHost config. */
export type AppType = 'app' | 'tauri' | 'task';

/** OpenTelemetry endpoint configuration. */
export interface OtelConfig {
  /** OTLP HTTP endpoint URL. */
  HttpEndpoint: string;
  /** OTLP protocol name. */
  Protocol: string;
}

/** Global Deno runtime defaults. */
export interface DenoDefaults {
  /** Default Deno permission flags. */
  Permissions: string[];
  /** Whether Deno watch mode is enabled by default. */
  WatchMode: boolean;
}

/** Defaults section wrapper. */
export interface DefaultsConfig {
  /** Deno runtime defaults. */
  Deno: DenoDefaults;
}

/** Common fields shared by resource entries. */
export interface BaseEntry {
  /** Whether the resource should be included in AppHost composition. */
  Enabled: boolean;
  /** Optional human-readable resource description. */
  Description?: string;
  /** Optional Deno permission flags for the resource. */
  Permissions?: string[];
}

/** Reference fields for resources that can depend on services or plugins. */
export interface ReferenceEntry {
  /** Service resource names referenced by this entry. */
  ServiceReferences?: string[];
  /** Plugin resource names referenced by this entry. */
  PluginReferences?: string[];
}

/** Saga durable store backend variants used by generated saga resources. */
export type SagaStoreBackend = 'kv' | 'prisma';

/** Saga-specific resource metadata preserved for generated executable env. */
export interface SagaResourceConfig {
  /** Saga durable state store configuration. */
  Store?: {
    /** Durable saga state backend. */
    Backend?: SagaStoreBackend;
  };
}

/** Backend service resource entry. */
export interface ServiceEntry extends BaseEntry, ReferenceEntry {
  /** Runtime used to launch the service. */
  Runtime: string;
  /** TCP port exposed by the service. */
  Port: number;
  /** Service entrypoint path. */
  Entrypoint: string;
  /** Service working directory. */
  Workdir?: string;
}

/** Frontend, desktop, or task application entry. */
export interface AppEntry extends BaseEntry, ReferenceEntry {
  /** Runtime used to launch the app. */
  Runtime: string;
  /** App variant. */
  Type: AppType;
  /** Whether Deno watch mode is enabled for the app. */
  WatchMode: boolean;
  /** Optional prebuild command. */
  Prebuild?: string;
  /** App working directory. */
  Workdir?: string;
  /** Optional remote URL for externally hosted apps. */
  Remote?: string;
  /** TCP port exposed by the app. */
  Port?: number;
  /** Deno task name for task apps. */
  TaskName?: string;
  /** Whether the app requires Deno KV access. */
  RequiresKv: boolean;
}

/** Plugin service resource entry. */
export interface PluginEntry extends BaseEntry, ReferenceEntry {
  /** Runtime used to launch the plugin. */
  Runtime: string;
  /** TCP port exposed by the plugin. */
  Port: number;
  /** Plugin entrypoint path. */
  Entrypoint: string;
  /** Plugin working directory. */
  Workdir?: string;
  /** Whether the plugin requires Deno KV access. */
  RequiresKv: boolean;
  /** Whether the plugin requires database access. */
  RequiresDb: boolean;
  /** Environment variables supplied to the plugin service resource. */
  Environment?: Readonly<Record<string, string>>;
  /** Saga-specific metadata for saga plugin resources. */
  Sagas?: SagaResourceConfig;
}

/** Background processor resource entry. */
export interface BackgroundProcessorEntry extends BaseEntry, ReferenceEntry {
  /** Runtime used to launch the processor. */
  Runtime: string;
  /** Processor working directory. */
  Workdir?: string;
  /** Processor entrypoint path. */
  Entrypoint: string;
  /** Optional concurrency value. */
  Concurrency?: number;
  /** Optional environment variable that supplies concurrency. */
  ConcurrencyEnvVar?: string;
  /** Whether telemetry is enabled for the processor. */
  Telemetry: boolean;
  /** Whether Deno watch mode is enabled for the processor. */
  WatchMode: boolean;
  /** Directories watched when watch mode is enabled. */
  WatchDirs?: string[];
  /** Whether the processor requires database access. */
  RequiresDb: boolean;
  /** Whether the processor requires Deno KV access. */
  RequiresKv: boolean;
  /** Saga-specific metadata for saga background processors. */
  Sagas?: SagaResourceConfig;
}

/** Database resource entry. */
export interface DatabaseEntry extends BaseEntry {
  /** Database engine. */
  Engine: DatabaseEngine;
  /** Resource provisioning mode. Defaults to container mode when omitted. */
  Mode?: ResourceMode;
  /** Optional container image tag. */
  ImageTag?: string;
  /** Database name. */
  DatabaseName?: string;
  /** Persistent data path. */
  DataPath?: string;
  /** TCP port exposed by the database. */
  Port?: number;
  /** Whether the database should use persistent storage. */
  Persistent: boolean;
}

/** Cache resource entry. */
export interface CacheEntry extends BaseEntry {
  /** Cache engine. */
  Engine: CacheEngine;
  /** Cache provisioning mode (wider than database {@link ResourceMode}). */
  Mode: CacheMode;
  /** Optional container image tag. */
  ImageTag?: string;
  /** TCP port exposed by the cache. */
  Port?: number;
  /** Persistent data path. */
  DataPath?: string;
  /** dotnet-tool version pin for `Executable` mode (e.g. `garnet-server`). */
  ToolVersion?: string;
}

/** Development tool entry. */
export interface ToolEntry extends BaseEntry {
  /** Deno task name for the tool. */
  TaskName?: string;
  /** Database resource used by the tool. */
  Database?: string;
}

/** Root NetScript configuration section. */
export interface NetScriptConfig {
  /** Application name. */
  Name: string;
  /** Application version. */
  Version: string;
  /** Optional Aspire project path. */
  AspireProject?: string;
  /** Primary database resource name. */
  PrimaryDatabase?: string;
  /** Primary cache resource name. */
  PrimaryCache?: string;
  /** OpenTelemetry configuration. */
  Otel: OtelConfig;
  /** Global defaults. */
  Defaults: DefaultsConfig;
  /** Backend service entries keyed by resource name. */
  Services: Record<string, ServiceEntry>;
  /** App entries keyed by resource name. */
  Apps: Record<string, AppEntry>;
  /** Plugin entries keyed by resource name. */
  Plugins: Record<string, PluginEntry>;
  /** Background processor entries keyed by resource name. */
  BackgroundProcessors: Record<string, BackgroundProcessorEntry>;
  /** Database entries keyed by resource name. */
  Databases: Record<string, DatabaseEntry>;
  /** Cache entries keyed by resource name. */
  Cache: Record<string, CacheEntry>;
  /** Tool entries keyed by resource name. */
  Tools: Record<string, ToolEntry>;
}

/** ASP.NET Core logging configuration. */
export interface LoggingConfig {
  /** Log levels keyed by category. */
  LogLevel?: Record<string, string>;
}

/** Top-level appsettings.json structure. */
export interface AppSettings {
  /** Optional JSON schema URL. */
  $schema?: string;
  /** ASP.NET Core logging configuration. */
  Logging?: LoggingConfig;
  /** NetScript AppHost configuration. */
  NetScript: NetScriptConfig;
}

// --- Enum Schemas ---

/** Database engine variants supported by Aspire hosting integrations. */
const DatabaseEngineZod = z.enum(['Postgres', 'Mssql', 'Mysql', 'Sqlite']).meta({
  title: 'DatabaseEngine',
  description: 'Supported database engine types',
});
/** Database engine schema. */
export const DatabaseEngineSchema: AspireSchema<DatabaseEngine> = DatabaseEngineZod;

/** Cache engine variants supported by Aspire hosting integrations. */
const CacheEngineZod = z.enum(['Redis', 'Garnet', 'DenoKv']).meta({
  title: 'CacheEngine',
  description: 'Supported cache engine types',
});
/** Cache engine schema. */
export const CacheEngineSchema: AspireSchema<CacheEngine> = CacheEngineZod;

/** Resource provisioning mode. */
const ResourceModeZod = z.enum(['Container', 'External']).meta({
  title: 'ResourceMode',
  description: 'Resource provisioning mode: Container (managed) or External (pre-existing)',
});
/** Resource provisioning mode schema. */
export const ResourceModeSchema: AspireSchema<ResourceMode> = ResourceModeZod;

/** Cache-specific provisioning mode. */
const CacheModeZod = z.enum(['Local', 'Container', 'Executable', 'External', 'Auto']).meta({
  title: 'CacheMode',
  description:
    'Cache provisioning mode: Local (in-process), Container, Executable (dotnet-tool), External, or Auto (runtime Docker probe)',
});
/** Cache provisioning mode schema. */
export const CacheModeSchema: AspireSchema<CacheMode> = CacheModeZod;

/** Application type variants for the Apps section. */
const AppTypeZod = z.enum(['app', 'tauri', 'task']).meta({
  title: 'AppType',
  description: 'Application type: app (web), tauri (desktop), or task (deno task)',
});
/** Application type schema. */
export const AppTypeSchema: AspireSchema<AppType> = AppTypeZod;

// --- Component Schemas ---

/** OpenTelemetry endpoint configuration. */
const OtelConfigZod = z.object({
  HttpEndpoint: z.string().default('http://localhost:4318'),
  Protocol: z.string().default('http/protobuf'),
}).meta({ title: 'OtelConfig', description: 'OpenTelemetry exporter configuration' });
/** OpenTelemetry endpoint configuration schema. */
export const OtelConfigSchema: AspireSchema<OtelConfig> = OtelConfigZod;

/** Global Deno runtime defaults. */
const DenoDefaultsZod = z.object({
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
/** Global Deno runtime defaults schema. */
export const DenoDefaultsSchema: AspireSchema<DenoDefaults> = DenoDefaultsZod;

/** Defaults section wrapper. */
const DefaultsZod = z.object({
  Deno: DenoDefaultsZod.default(() => ({
    Permissions: ['--allow-net', '--allow-env', '--allow-read', '--allow-sys'],
    WatchMode: false,
  })),
}).meta({ title: 'Defaults', description: 'Global default configuration' });
/** Defaults section schema. */
export const DefaultsSchema: AspireSchema<DefaultsConfig> = DefaultsZod;

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

const SagaResourceConfigZod = z.object({
  Store: z.object({
    Backend: z.enum(['kv', 'prisma']).optional(),
  }).optional(),
}).meta({
  title: 'SagaResourceConfig',
  description: 'Saga-specific resource metadata preserved for generated executable env',
});

/** Service entry configuration. */
const ServiceEntryZod = z.object({
  ...BaseEntryFields,
  ...ReferenceFields,
  Runtime: z.string().default('deno'),
  Port: z.number().int().positive(),
  Entrypoint: z.string().default('src/main.ts'),
  Workdir: z.string().optional(),
}).meta({ title: 'ServiceEntry', description: 'Configuration for a backend service resource' });
/** Service entry schema. */
export const ServiceEntrySchema: AspireSchema<ServiceEntry> = ServiceEntryZod;

/** Application entry configuration. */
const AppEntryZod = z.object({
  ...BaseEntryFields,
  ...ReferenceFields,
  Runtime: z.string().default('deno'),
  Type: AppTypeZod.default('app'),
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
/** Application entry schema. */
export const AppEntrySchema: AspireSchema<AppEntry> = AppEntryZod;

/** Plugin entry configuration. */
const PluginEntryZod = z.object({
  ...BaseEntryFields,
  ...ReferenceFields,
  Runtime: z.string().default('deno'),
  Port: z.number().int().positive(),
  Entrypoint: z.string().default('src/main.ts'),
  Workdir: z.string().optional(),
  RequiresKv: z.boolean().default(false),
  RequiresDb: z.boolean().default(false),
  Environment: z.record(z.string(), z.string()).optional(),
  Sagas: SagaResourceConfigZod.optional(),
}).meta({ title: 'PluginEntry', description: 'Configuration for a plugin service resource' });
/** Plugin entry schema. */
export const PluginEntrySchema: AspireSchema<PluginEntry> = PluginEntryZod;

/** Background processor entry configuration. */
const BackgroundProcessorEntryZod = z.object({
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
  Sagas: SagaResourceConfigZod.optional(),
}).meta({
  title: 'BackgroundProcessorEntry',
  description: 'Configuration for a background processor (worker, saga, trigger)',
});
/** Background processor entry schema. */
export const BackgroundProcessorEntrySchema: AspireSchema<BackgroundProcessorEntry> =
  BackgroundProcessorEntryZod;

/** Database entry configuration. */
const DatabaseEntryZod = z.object({
  ...BaseEntryFields,
  Engine: DatabaseEngineZod,
  Mode: ResourceModeZod.default('Container'),
  ImageTag: z.string().optional(),
  DatabaseName: z.string().optional(),
  DataPath: z.string().optional(),
  Port: z.number().int().positive().optional(),
  Persistent: z.boolean().default(false),
}).meta({ title: 'DatabaseEntry', description: 'Configuration for a database resource' });
/** Database entry schema. */
export const DatabaseEntrySchema: AspireSchema<DatabaseEntry> = DatabaseEntryZod;

/** Cache entry configuration. */
const CacheEntryZod = z.object({
  ...BaseEntryFields,
  Engine: CacheEngineZod.default('Garnet'),
  Mode: CacheModeZod.default('Container'),
  ImageTag: z.string().optional(),
  Port: z.number().int().positive().optional(),
  DataPath: z.string().optional(),
  ToolVersion: z.string().optional(),
}).meta({ title: 'CacheEntry', description: 'Configuration for a cache resource' });
/** Cache entry schema. */
export const CacheEntrySchema: AspireSchema<CacheEntry> = CacheEntryZod;

/** Prisma Studio tool configuration. */
const ToolEntryZod = z.object({
  ...BaseEntryFields,
  TaskName: z.string().optional(),
  Database: z.string().optional(),
}).meta({ title: 'ToolEntry', description: 'Configuration for a development tool' });
/** Development tool entry schema. */
export const ToolEntrySchema: AspireSchema<ToolEntry> = ToolEntryZod;

// --- Root Configuration Schemas ---

/** Root NetScript configuration section from `appsettings.json`. */
const NetScriptConfigZod = z.object({
  Name: z.string(),
  Version: z.string().default('1.0.0'),
  AspireProject: z.string().optional(),
  PrimaryDatabase: z.string().optional(),
  PrimaryCache: z.string().optional(),
  Otel: OtelConfigZod.default(() => ({
    HttpEndpoint: 'http://localhost:4318',
    Protocol: 'http/protobuf',
  })),
  Defaults: DefaultsZod.default(() => ({
    Deno: {
      Permissions: ['--allow-net', '--allow-env', '--allow-read', '--allow-sys'],
      WatchMode: false,
    },
  })),
  Services: z.record(z.string(), ServiceEntryZod).default({}),
  Apps: z.record(z.string(), AppEntryZod).default({}),
  Plugins: z.record(z.string(), PluginEntryZod).default({}),
  BackgroundProcessors: z.record(z.string(), BackgroundProcessorEntryZod).default({}),
  Databases: z.record(z.string(), DatabaseEntryZod).default({}),
  Cache: z.record(z.string(), CacheEntryZod).default({}),
  Tools: z.record(z.string(), ToolEntryZod).default({}),
}).meta({ title: 'NetScriptConfig', description: 'Root NetScript application configuration' });
/** Root NetScript configuration schema. */
export const NetScriptConfigSchema: AspireSchema<NetScriptConfig> = NetScriptConfigZod;

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
const AppSettingsZod = z.object({
  $schema: z.string().optional(),
  Logging: LoggingSchema,
  NetScript: NetScriptConfigZod,
}).meta({
  title: 'AppSettings',
  description:
    'Full appsettings.json structure including ASP.NET Core logging and NetScript configuration',
});
/** Top-level appsettings.json schema. */
export const AppSettingsSchema: AspireSchema<AppSettings> = AppSettingsZod;

// --- Parser ---

/**
 * Resolves default values that depend on the record key (resource name).
 *
 * - Resolves `Workdir` defaults based on section convention
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
/**
 * Valid cache provisioning modes per engine. `Auto` resolves at AppHost runtime
 * (Docker probe): Redis/Garnet → Container else Executable/error; DenoKv →
 * Container else Garnet Executable cross-fallback.
 */
const CACHE_ENGINE_MODE_MATRIX: Record<CacheEngine, readonly CacheMode[]> = {
  Redis: ['Container', 'External', 'Auto'],
  Garnet: ['Container', 'Executable', 'External', 'Auto'],
  DenoKv: ['Local', 'Container', 'Auto'],
};

function validateCrossReferences(config: NetScriptConfig): string[] {
  const issues: string[] = [];
  const serviceNames = new Set(Object.keys(config.Services));
  const pluginNames = new Set(Object.keys(config.Plugins));
  const dbNames = new Set(Object.keys(config.Databases));
  const cacheNames = new Set(Object.keys(config.Cache));

  // Cache engine×mode validity matrix
  for (const [name, entry] of Object.entries(config.Cache)) {
    const validModes = CACHE_ENGINE_MODE_MATRIX[entry.Engine];
    if (validModes && !validModes.includes(entry.Mode)) {
      issues.push(
        `Cache."${name}": Mode "${entry.Mode}" is not valid for Engine "${entry.Engine}" (valid: ${
          validModes.join(', ')
        })`,
      );
    }
  }

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
  const parsed = AppSettingsZod.parse(json);
  const config = resolveDefaults(parsed.NetScript);
  const warnings = validateCrossReferences(config);

  if (options?.strict && warnings.length > 0) {
    throw new Error(
      `Cross-reference validation failed:\n${warnings.map((w) => `  - ${w}`).join('\n')}`,
    );
  }

  return { config, warnings };
}
