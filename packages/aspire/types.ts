/**
 * @module
 *
 * Type exports derived from Zod schemas via `z.infer<>` and generic
 * resource name extraction utilities for type-safe config access.
 *
 * All types in this module are derived from the canonical Zod schemas in
 * `config.ts`. Manual interfaces that duplicate schema shapes are prohibited
 * per NetScript standards.
 *
 * @example
 * ```ts
 * import type { NetScriptConfig, KnownServices } from '@netscript/aspire/types';
 *
 * // With a narrowed config type:
 * type MyServices = KnownServices<typeof myConfig>; // "users" | "products" | "orders"
 * ```
 */

import type { z } from 'zod';
import type {
  AppEntrySchema,
  AppSettingsSchema,
  AppTypeSchema,
  BackgroundProcessorEntrySchema,
  CacheEngineSchema,
  CacheEntrySchema,
  DatabaseEngineSchema,
  DatabaseEntrySchema,
  DenoDefaultsSchema,
  NetScriptConfigSchema,
  OtelConfigSchema,
  PluginEntrySchema,
  ResourceModeSchema,
  ServiceEntrySchema,
  ToolEntrySchema,
} from './config.ts';

// --- Base Types (z.infer<> derived) ---

/** Full `appsettings.json` structure. */
export type AppSettings = z.infer<typeof AppSettingsSchema>;

/** Root `NetScript` configuration section. */
export type NetScriptConfig = z.infer<typeof NetScriptConfigSchema>;

/** A service resource entry. */
export type ServiceEntry = z.infer<typeof ServiceEntrySchema>;

/** An application resource entry. */
export type AppEntry = z.infer<typeof AppEntrySchema>;

/** A plugin resource entry. */
export type PluginEntry = z.infer<typeof PluginEntrySchema>;

/** A background processor entry (worker, saga, or trigger). */
export type BackgroundProcessorEntry = z.infer<typeof BackgroundProcessorEntrySchema>;

/** A database resource entry. */
export type DatabaseEntry = z.infer<typeof DatabaseEntrySchema>;

/** A cache resource entry. */
export type CacheEntry = z.infer<typeof CacheEntrySchema>;

/** A development tool entry. */
export type ToolEntry = z.infer<typeof ToolEntrySchema>;

/** OpenTelemetry exporter configuration. */
export type OtelConfig = z.infer<typeof OtelConfigSchema>;

/** Global Deno runtime defaults. */
export type DenoDefaults = z.infer<typeof DenoDefaultsSchema>;

/** Supported database engine types. */
export type DatabaseEngine = z.infer<typeof DatabaseEngineSchema>;

/** Supported cache engine types. */
export type CacheEngine = z.infer<typeof CacheEngineSchema>;

/** Resource provisioning mode. */
export type ResourceMode = z.infer<typeof ResourceModeSchema>;

/** Application type variant. */
export type AppType = z.infer<typeof AppTypeSchema>;

// --- Generic Resource Name Extraction Utilities ---

/**
 * Extracts known service names as a literal union type from a config type.
 *
 * @example
 * ```ts
 * type Services = KnownServices<typeof myConfig>; // "users" | "products" | "orders"
 * ```
 */
export type KnownServices<T extends NetScriptConfig> = keyof T['Services'] & string;

/**
 * Extracts known plugin names as a literal union type from a config type.
 */
export type KnownPlugins<T extends NetScriptConfig> = keyof T['Plugins'] & string;

/**
 * Extracts known database names as a literal union type from a config type.
 */
export type KnownDatabases<T extends NetScriptConfig> = keyof T['Databases'] & string;

/**
 * Extracts known app names as a literal union type from a config type.
 */
export type KnownApps<T extends NetScriptConfig> = keyof T['Apps'] & string;

/**
 * Extracts known background processor names as a literal union type from a config type.
 */
export type KnownBackgroundProcessors<T extends NetScriptConfig> =
  & keyof T['BackgroundProcessors']
  & string;

/**
 * Extracts known cache names as a literal union type from a config type.
 */
export type KnownCaches<T extends NetScriptConfig> = keyof T['Cache'] & string;

// --- Typed Entry Accessors ---

/**
 * Gets the typed service entry for a known service name.
 * Returns the exact entry type when used with a narrowed config.
 */
export type ServiceEntryOf<
  T extends NetScriptConfig,
  K extends KnownServices<T>,
> = T['Services'][K];

/**
 * Gets the typed app entry for a known app name.
 */
export type AppEntryOf<
  T extends NetScriptConfig,
  K extends KnownApps<T>,
> = T['Apps'][K];

/**
 * Gets the typed plugin entry for a known plugin name.
 */
export type PluginEntryOf<
  T extends NetScriptConfig,
  K extends KnownPlugins<T>,
> = T['Plugins'][K];

/**
 * Gets the typed database entry for a known database name.
 */
export type DatabaseEntryOf<
  T extends NetScriptConfig,
  K extends KnownDatabases<T>,
> = T['Databases'][K];

/**
 * Gets the typed background processor entry for a known processor name.
 */
export type BackgroundProcessorEntryOf<
  T extends NetScriptConfig,
  K extends KnownBackgroundProcessors<T>,
> = T['BackgroundProcessors'][K];

/**
 * Gets the typed cache entry for a known cache name.
 */
export type CacheEntryOf<
  T extends NetScriptConfig,
  K extends KnownCaches<T>,
> = T['Cache'][K];

// --- Infrastructure Dependencies ---

/**
 * Extracted dependency requirements from a resource entry.
 */
export interface ResourceDependencies {
  /** Whether the resource requires a database connection. */
  readonly requiresDb: boolean;
  /** Whether the resource requires a Deno KV store connection. */
  readonly requiresKv: boolean;
}
