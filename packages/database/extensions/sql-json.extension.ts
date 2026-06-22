/**
 * SQL JSON Field Extension for Prisma
 *
 * Some SQL databases (MSSQL, MySQL in some configs) store JSON as text strings
 * rather than native JSON types. This extension automatically handles
 * serialization/deserialization of JSON fields, making the API transparent -
 * you pass objects, get objects back.
 *
 * Supported databases:
 * - SQL Server (MSSQL): Stores JSON as NVARCHAR(MAX)
 * - MySQL: When using TEXT/VARCHAR instead of native JSON type
 * - Any SQL database that stores JSON as string
 *
 * The extension intercepts all CRUD operations and:
 * 1. Serializes object values to JSON strings before writing to database
 * 2. Deserializes JSON strings back to objects after reading from database
 *
 * @module
 */

// ============================================================================
// TYPES AND CONFIGURATION
// ============================================================================

/**
 * Supported database types for JSON handling.
 * This is informational - the serialization logic is the same,
 * but allows for future database-specific optimizations.
 */
export type SqlDatabaseType = 'mssql' | 'mysql' | 'generic';

/**
 * Configuration for JSON fields per model.
 * Maps model names to their JSON field names.
 */
export type JsonFieldConfig = Record<string, readonly string[]>;

const debugLogEncoder = new TextEncoder();

function formatDebugLogValue(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function writeDebugLog(name: string, message: string, ...args: unknown[]): void {
  const suffix = args.length > 0 ? ` ${args.map(formatDebugLogValue).join(' ')}` : '';
  Deno.stderr.writeSync(debugLogEncoder.encode(`[${name}] ${message}${suffix}\n`));
}

/**
 * Options for creating the SQL JSON extension.
 */
export interface SqlJsonExtensionOptions {
  /**
   * The database type. Used for logging and potential future optimizations.
   * @default 'generic'
   */
  databaseType?: SqlDatabaseType;

  /**
   * JSON fields configuration per model.
   * Maps model names to arrays of field names that contain JSON.
   *
   * @example
   * ```typescript
   * {
   *   SagaInstance: ['state'],
   *   JobDefinition: ['config', 'metadata'],
   * }
   * ```
   */
  jsonFields?: JsonFieldConfig;

  /**
   * Extension name for debugging.
   * @default 'sql-json-extension'
   */
  name?: string;

  /**
   * Enable debug logging.
   * @default false
   */
  debug?: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Empty default JSON fields configuration.
 * Consumers should provide their own configuration via options.
 *
 * @example
 * ```typescript
 * // Define your project's JSON fields
 * const JSON_FIELDS: JsonFieldConfig = {
 *   SagaInstance: ['state'],
 *   JobDefinition: ['config', 'metadata'],
 * };
 *
 * // Pass to the extension
 * const extension = sqlJsonExtension(Prisma, { jsonFields: JSON_FIELDS });
 * ```
 */
export const DEFAULT_JSON_FIELDS: JsonFieldConfig = {} as const;

// ============================================================================
// JSON FIELD REGISTRY (RUNTIME MUTABLE)
// ============================================================================

/**
 * Internal mutable registry for JSON fields.
 * Empty by default - consumers must provide configuration.
 */
let jsonFieldRegistry: JsonFieldConfig = {};

/**
 * Check if a model has JSON fields configured.
 */
function hasJsonFields(model: string): boolean {
  return model in jsonFieldRegistry;
}

/**
 * Get the list of JSON fields for a model (empty array if not configured).
 */
function getJsonFields(model: string): readonly string[] {
  return jsonFieldRegistry[model] ?? [];
}

/**
 * Initialize the JSON field registry with custom configuration.
 * Replaces existing configuration.
 */
function initializeRegistry(config: JsonFieldConfig): void {
  jsonFieldRegistry = { ...config };
}

/**
 * Reset the registry to empty configuration.
 */
function resetRegistry(): void {
  jsonFieldRegistry = {};
}

// ============================================================================
// SERIALIZATION HELPERS
// ============================================================================

/**
 * Safely serialize a value to JSON string.
 * - null/undefined -> null
 * - Already a valid JSON string -> returns as-is
 * - Object/Array -> JSON.stringify
 * - Other primitives -> JSON.stringify
 */
function toJsonString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    // Check if it's already valid JSON
    try {
      JSON.parse(value);
      return value; // Already a JSON string, pass through
    } catch {
      // Not valid JSON, wrap the string as JSON
      return JSON.stringify(value);
    }
  }

  return JSON.stringify(value);
}

/**
 * Safely parse a JSON string to object.
 * - null/undefined -> null
 * - Already an object -> returns as-is
 * - Valid JSON string -> parsed object
 * - Invalid JSON string -> returns as-is (might be plain string value)
 */
function fromJsonString<T = unknown>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Already an object (shouldn't happen from DB, but handle gracefully)
  if (typeof value === 'object') {
    return value as T;
  }

  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      // Not valid JSON, return as-is
      return value as T;
    }
  }

  return value as T;
}

/**
 * Serialize JSON fields in a data object before database write.
 * Creates a shallow copy with JSON fields serialized.
 */
function serializeData(
  model: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const fields = getJsonFields(model);
  if (fields.length === 0) return data;

  const result = { ...data };
  for (const field of fields) {
    if (field in result && result[field] !== undefined) {
      result[field] = toJsonString(result[field]);
    }
  }
  return result;
}

/**
 * Deserialize JSON fields in a result object after database read.
 * Creates a shallow copy with JSON fields deserialized.
 */
function deserializeData(
  model: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const fields = getJsonFields(model);
  if (fields.length === 0) return data;

  const result = { ...data };
  for (const field of fields) {
    if (field in result) {
      result[field] = fromJsonString(result[field]);
    }
  }
  return result;
}

/**
 * Process nested data structures (handles nested creates/updates).
 */
function serializeNestedData(
  model: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const result = serializeData(model, data);

  // Handle common nested operations
  for (const [key, value] of Object.entries(result)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;

      // Handle nested create
      if ('create' in nested && nested.create && typeof nested.create === 'object') {
        nested.create = serializeData(key, nested.create as Record<string, unknown>);
      }

      // Handle nested createMany
      if ('createMany' in nested && nested.createMany && typeof nested.createMany === 'object') {
        const createMany = nested.createMany as { data?: unknown[] };
        if (Array.isArray(createMany.data)) {
          createMany.data = createMany.data.map((item) =>
            serializeData(key, item as Record<string, unknown>)
          );
        }
      }
    }
  }

  return result;
}

// ============================================================================
// PRISMA EXTENSION FACTORY
// ============================================================================

/**
 * Query context passed by Prisma to extension handlers.
 */
export interface PrismaQueryContext {
  /** Model name for the intercepted Prisma operation. */
  model?: string;
  /** Operation arguments passed to Prisma. */
  args: Record<string, unknown>;
  /** Continue the intercepted Prisma operation. */
  query: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Query handler used by Prisma extension configuration.
 */
export type PrismaQueryHandler = (context: PrismaQueryContext) => Promise<unknown>;

/**
 * Prisma extension configuration generated by SQL JSON helpers.
 */
export interface PrismaExtensionConfig {
  /** Extension name shown in Prisma diagnostics. */
  readonly name: string;
  /** Query interception handlers keyed by Prisma model operation. */
  readonly query: {
    /** Operation handlers applied to all Prisma models. */
    readonly $allModels: Record<string, PrismaQueryHandler>;
  };
}

/**
 * Creates the extension configuration object.
 * This function is called with options to create a customized config.
 */
function createExtensionConfig(options: SqlJsonExtensionOptions): PrismaExtensionConfig {
  const { name = 'sql-json-extension', debug = false } = options;

  const log = debug
    ? (message: string, ...args: unknown[]) => writeDebugLog(name, message, ...args)
    : () => {};

  return {
    name,

    query: {
      $allModels: {
        // Write operations - serialize before, deserialize after
        async create({ model, args, query }: PrismaQueryContext) {
          if (model && args.data && !Array.isArray(args.data)) {
            log('create', model, 'serializing data');
            args.data = serializeNestedData(model, args.data as Record<string, unknown>);
          }
          const result = await query(args);
          return model && result
            ? deserializeData(model, result as Record<string, unknown>)
            : result;
        },

        async createMany({ model, args, query }: PrismaQueryContext) {
          if (model && args.data) {
            log('createMany', model, 'serializing data');
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item) =>
                serializeData(model, item as Record<string, unknown>)
              );
            } else {
              args.data = serializeData(model, args.data as Record<string, unknown>);
            }
          }
          const result = await query(args);
          return result;
        },

        async createManyAndReturn({ model, args, query }: PrismaQueryContext) {
          if (model && args.data) {
            log('createManyAndReturn', model, 'serializing data');
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item) =>
                serializeData(model, item as Record<string, unknown>)
              );
            } else {
              args.data = serializeData(model, args.data as Record<string, unknown>);
            }
          }
          const results = await query(args);
          if (model && Array.isArray(results)) {
            return results.map((r) => deserializeData(model, r as Record<string, unknown>));
          }
          return results;
        },

        async update({ model, args, query }: PrismaQueryContext) {
          if (model && args.data && !Array.isArray(args.data)) {
            log('update', model, 'serializing data');
            args.data = serializeNestedData(model, args.data as Record<string, unknown>);
          }
          const result = await query(args);
          return model && result
            ? deserializeData(model, result as Record<string, unknown>)
            : result;
        },

        async updateMany({ model, args, query }: PrismaQueryContext) {
          if (model && args.data && !Array.isArray(args.data)) {
            log('updateMany', model, 'serializing data');
            args.data = serializeData(model, args.data as Record<string, unknown>);
          }
          const result = await query(args);
          return result;
        },

        async updateManyAndReturn({ model, args, query }: PrismaQueryContext) {
          if (model && args.data && !Array.isArray(args.data)) {
            log('updateManyAndReturn', model, 'serializing data');
            args.data = serializeData(model, args.data as Record<string, unknown>);
          }
          const results = await query(args);
          if (model && Array.isArray(results)) {
            return results.map((r) => deserializeData(model, r as Record<string, unknown>));
          }
          return results;
        },

        async upsert({ model, args, query }: PrismaQueryContext) {
          if (model) {
            log('upsert', model, 'serializing data');
            if (args.create) {
              args.create = serializeNestedData(model, args.create as Record<string, unknown>);
            }
            if (args.update) {
              args.update = serializeNestedData(model, args.update as Record<string, unknown>);
            }
          }
          const result = await query(args);
          return model && result
            ? deserializeData(model, result as Record<string, unknown>)
            : result;
        },

        // Read operations - deserialize results
        async findUnique({ model, args, query }: PrismaQueryContext) {
          const result = await query(args);
          return model && result
            ? deserializeData(model, result as Record<string, unknown>)
            : result;
        },

        async findUniqueOrThrow({ model, args, query }: PrismaQueryContext) {
          const result = await query(args);
          return model ? deserializeData(model, result as Record<string, unknown>) : result;
        },

        async findFirst({ model, args, query }: PrismaQueryContext) {
          const result = await query(args);
          return model && result
            ? deserializeData(model, result as Record<string, unknown>)
            : result;
        },

        async findFirstOrThrow({ model, args, query }: PrismaQueryContext) {
          const result = await query(args);
          return model ? deserializeData(model, result as Record<string, unknown>) : result;
        },

        async findMany({ model, args, query }: PrismaQueryContext) {
          const results = await query(args);
          if (model && Array.isArray(results)) {
            return results.map((r) => deserializeData(model, r as Record<string, unknown>));
          }
          return results;
        },

        // Delete operations - deserialize returned record
        async delete({ model, args, query }: PrismaQueryContext) {
          const result = await query(args);
          return model && result
            ? deserializeData(model, result as Record<string, unknown>)
            : result;
        },

        // Pass through - no transformation needed
        async deleteMany({ args, query }: PrismaQueryContext) {
          const result = await query(args);
          return result;
        },

        async deleteManyAndReturn({ model, args, query }: PrismaQueryContext) {
          const results = await query(args);
          if (model && Array.isArray(results)) {
            return results.map((r) => deserializeData(model, r as Record<string, unknown>));
          }
          return results;
        },
      },
    },
  } as const;
}

/**
 * Creates a Prisma extension that automatically handles JSON serialization
 * for SQL databases that store JSON as text strings.
 *
 * The extension must be applied using the Prisma namespace from your
 * generated client, which provides the proper type context.
 *
 * @param Prisma - The Prisma namespace from the generated client
 * @param options - Configuration options for the extension (jsonFields is required)
 * @returns Prisma extension configuration for $extends()
 *
 * @example
 * ```typescript
 * import { PrismaClient, Prisma } from './schema/.generated/client.server.ts';
 * import { sqlJsonExtension, type JsonFieldConfig } from '@netscript/database/extensions';
 *
 * // Define your project's JSON fields configuration
 * const JSON_FIELDS: JsonFieldConfig = {
 *   SagaInstance: ['state'],
 *   SagaDefinition: ['handledTypes', 'initialState', 'metadata'],
 *   JobDefinition: ['config', 'permissions', 'metadata'],
 * };
 *
 * const adapter = new PrismaMssql(config);
 * const baseClient = new PrismaClient({ adapter });
 *
 * // Apply extension with your JSON fields configuration
 * const prisma = baseClient.$extends(sqlJsonExtension(Prisma, {
 *   databaseType: 'mssql',
 *   jsonFields: JSON_FIELDS,
 * }));
 *
 * // Now you can use JSON fields naturally:
 * await prisma.sagaInstance.create({
 *   data: {
 *     id: 'saga-1',
 *     sagaName: 'OrderSaga',
 *     state: { orderId: '123', status: 'pending' }, // Object, not string!
 *   }
 * });
 *
 * const saga = await prisma.sagaInstance.findFirst();
 * saga.state.orderId; // Automatically parsed back to object
 * ```
 */
export function sqlJsonExtension<
  P extends {
    defineExtension: (config: PrismaExtensionConfig) => ReturnType<P['defineExtension']>;
  },
>(Prisma: P, options: SqlJsonExtensionOptions = {}): ReturnType<P['defineExtension']> {
  // Initialize the registry with provided JSON fields
  if (options.jsonFields) {
    initializeRegistry(options.jsonFields);
  }

  const config = createExtensionConfig(options);
  return Prisma.defineExtension(config);
}

/**
 * Creates a Prisma extension for MySQL JSON serialization.
 * This is an alias for `sqlJsonExtension` with `databaseType: 'mysql'`.
 */
export function mysqlJsonExtension<
  P extends {
    defineExtension: (config: PrismaExtensionConfig) => ReturnType<P['defineExtension']>;
  },
>(
  Prisma: P,
  options: Omit<SqlJsonExtensionOptions, 'databaseType'> = {},
): ReturnType<P['defineExtension']> {
  return sqlJsonExtension(Prisma, { ...options, databaseType: 'mysql' });
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Export serialization utilities for manual use if needed.
 * These are useful when working with raw queries or custom operations.
 */
export const jsonUtils: {
  readonly toJsonString: (value: unknown) => string | null;
  readonly fromJsonString: <T = unknown>(value: unknown) => T | null;
  readonly serializeData: (
    model: string,
    data: Record<string, unknown>,
  ) => Record<string, unknown>;
  readonly deserializeData: (
    model: string,
    data: Record<string, unknown>,
  ) => Record<string, unknown>;
  readonly getJsonFields: (model: string) => readonly string[];
  readonly hasJsonFields: (model: string) => boolean;
  readonly resetRegistry: () => void;
} = {
  /** Convert value to JSON string for database storage */
  toJsonString: toJsonString,
  /** Parse JSON string from database to object */
  fromJsonString: fromJsonString,
  /** Serialize JSON fields in a data object */
  serializeData: serializeData,
  /** Deserialize JSON fields in a result object */
  deserializeData: deserializeData,
  /** Get configured JSON fields for a model */
  getJsonFields: getJsonFields,
  /** Check if a model has JSON fields configured */
  hasJsonFields: hasJsonFields,
  /** Reset registry to defaults */
  resetRegistry: resetRegistry,
} as const;

/**
 * Register additional JSON fields for a model at runtime.
 * Useful for plugin models that aren't known at compile time.
 *
 * Note: This modifies the global configuration.
 *
 * @param model - The model name (e.g., 'CustomModel')
 * @param fields - Array of field names that contain JSON
 *
 * @example
 * ```typescript
 * // Before creating the extension
 * registerJsonFields('CustomModel', ['config', 'metadata']);
 * ```
 */
export function registerJsonFields(model: string, fields: readonly string[]): void {
  const existing = jsonFieldRegistry[model] ?? [];
  jsonFieldRegistry[model] = [...new Set([...existing, ...fields])];
}

/**
 * Type alias for JSON field values.
 * Use this in your type definitions to document that a field
 * will be auto-serialized/deserialized.
 *
 * @example
 * ```typescript
 * interface SagaState {
 *   orderId: string;
 *   status: 'pending' | 'confirmed';
 * }
 *
 * // In your code
 * const state: JsonField<SagaState> = { orderId: '123', status: 'pending' };
 * ```
 */
export type JsonField<T> = T;

// Default export for convenience
export default sqlJsonExtension;
