// ============================================================================
// APPSETTINGS.JSON TYPES
// Internal types — not exported; callers always work with ResolvedConfig.
// ============================================================================

export interface AppSettingsJson {
  ConnectionStrings?: Record<string, string>;
  Logging?: { LogLevel?: Record<string, string> };
  NetScript?: NetScriptSection;
}

export interface NetScriptSection {
  Name?: string;
  Version?: string;
  Otel?: { HttpEndpoint?: string; Protocol?: string };
  Defaults?: { Deno?: { Permissions?: string[]; WatchMode?: boolean } };
  Services?: Record<string, RawServiceConfig>;
  Plugins?: Record<string, RawPluginConfig>;
  Apps?: Record<string, RawAppConfig>;
  BackgroundProcessors?: Record<string, RawBackgroundProcessorConfig>;
  Databases?: Record<string, RawDatabaseConfig>;
  Cache?: Record<string, RawCacheConfig>;
}

export interface RawServiceConfig {
  Runtime?: string;
  Port?: number;
  Entrypoint?: string;
  Workdir?: string;
  DependsOn?: string[];
  Permissions?: string[];
  Description?: string;
}

export interface RawPluginConfig {
  Enabled?: boolean;
  Port?: number;
  Entrypoint?: string;
  Workdir?: string;
  RequiresKv?: boolean;
  RequiresDb?: boolean;
  Permissions?: string[];
  Description?: string;
}

export interface RawAppConfig {
  Enabled?: boolean;
  Type?: string;
  Runtime?: string;
  Port?: number;
  Entrypoint?: string;
  Workdir?: string;
  Prebuild?: string;
  Permissions?: string[];
  Description?: string;
}

export interface NetScriptAppConfig {
  runtime?: string;
  port?: number;
  entrypoint?: string;
  workdir?: string;
  prebuild?: string;
  permissions?: string[];
  description?: string;
}

export interface RawBackgroundProcessorEntrypointConfig {
  Entrypoint?: string;
  Description?: string;
  Permissions?: string[];
  Include?: string[];
  ManifestResourceName?: string;
  AssignWorkerId?: boolean;
}

export interface RawBackgroundProcessorConfig {
  Enabled?: boolean;
  Workdir?: string;
  Entrypoint?: string;
  Entrypoints?: Record<string, RawBackgroundProcessorEntrypointConfig>;
  Concurrency?: number;
  ConcurrencyEnvVar?: string;
  RequiresDb?: boolean;
  RequiresKv?: boolean;
  ServiceReferences?: string[];
  PluginReferences?: string[];
  Permissions?: string[];
  Description?: string;
  WatchDirs?: string[];
}

export interface RawDatabaseConfig {
  Engine?: string;
  ImageTag?: string;
  DatabaseName?: string;
  DataPath?: string;
  Persistent?: boolean;
}

export interface RawCacheConfig {
  Engine?: string;
  DataPath?: string;
  Description?: string;
}

// ============================================================================
// APPSETTINGS LOADER
// ============================================================================
