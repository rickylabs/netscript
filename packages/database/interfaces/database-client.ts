/**
 * Database Client Interface
 *
 * Defines the contract for database adapters, providing a unified interface
 * for different database backends (PostgreSQL, MSSQL, etc.).
 *
 * @module
 */

/**
 * Database provider types
 */
export type DatabaseProvider = 'postgres' | 'mssql' | 'mysql' | 'sqlite';

/**
 * Database connection status
 */
export interface DatabaseConnectionStatus {
  /** Whether the connection is active */
  connected: boolean;
  /** Provider type */
  provider: DatabaseProvider;
  /** Database name */
  database?: string;
  /** Host/server name */
  host?: string;
  /** Last successful connection timestamp */
  lastConnected?: Date;
  /** Error if connection failed */
  error?: string;
}

/**
 * Database connection options
 */
export interface DatabaseConnectionOptions {
  /** Connection string or URI */
  connectionString?: string;
  /** Database host */
  host?: string;
  /** Database port */
  port?: number;
  /** Database name */
  database?: string;
  /** Username */
  username?: string;
  /** Password */
  password?: string;
  /** SSL mode */
  ssl?: boolean | 'require' | 'prefer' | 'disable';
  /** Connection pool size */
  poolSize?: number;
  /** Connection timeout in milliseconds */
  timeout?: number;
}

/**
 * Transaction isolation levels
 */
export type IsolationLevel =
  | 'ReadUncommitted'
  | 'ReadCommitted'
  | 'RepeatableRead'
  | 'Serializable'
  | 'Snapshot'; // MSSQL-specific

/**
 * Transaction options
 */
export interface TransactionOptions {
  /** Maximum time to wait for transaction to start */
  maxWait?: number;
  /** Transaction timeout */
  timeout?: number;
  /** Isolation level */
  isolationLevel?: IsolationLevel;
}

/**
 * Generic database adapter interface
 *
 * All database adapters must implement this interface to ensure
 * consistent behavior across different backends.
 */
export interface DatabaseAdapter<TClient = unknown> {
  /** Provider type */
  readonly provider: DatabaseProvider;

  /** Get the underlying Prisma client */
  getClient(): TClient;

  /**
   * Connect to the database
   * Note: Prisma clients auto-connect on first query, but this can be used
   * for explicit connection handling.
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the database
   */
  disconnect(): Promise<void>;

  /**
   * Check if the database is healthy
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get connection status
   */
  getStatus(): Promise<DatabaseConnectionStatus>;

  /**
   * Execute a raw SQL query
   * @param query - SQL query with optional parameters
   * @param params - Query parameters
   */
  executeRaw<T = unknown>(query: string, ...params: unknown[]): Promise<T>;

  /**
   * Execute a raw SQL query and return affected rows count
   * @param query - SQL query with optional parameters
   * @param params - Query parameters
   */
  executeRawUnsafe<T = unknown>(query: string, ...params: unknown[]): Promise<T>;
}

/**
 * Factory for creating database adapters
 */
export interface DatabaseAdapterFactory {
  /**
   * Create a database adapter for the given provider
   * @param provider - Database provider type
   * @param options - Connection options
   */
  create<TClient = unknown>(
    provider: DatabaseProvider,
    options: DatabaseConnectionOptions,
  ): DatabaseAdapter<TClient>;
}

/**
 * Configuration for the shared database instance
 */
export interface SharedDatabaseConfig {
  /**
   * Force a specific provider. Default: 'auto'
   * - 'auto': Auto-detect from environment (Aspire discovery)
   * - 'postgres': Force PostgreSQL
   * - 'mssql': Force SQL Server
   */
  provider?: DatabaseProvider | 'auto';

  /**
   * Connection string (if not using auto-discovery)
   */
  connectionString?: string;

  /**
   * Database name for Aspire discovery
   * @default 'postgresdb' for postgres, 'mssqldb' for mssql
   */
  databaseName?: string;

  /**
   * Skip Aspire service discovery
   * @default false
   */
  skipServiceDiscovery?: boolean;

  /**
   * Enable OpenTelemetry instrumentation
   * @default true (when OTEL_DENO=true)
   */
  enableInstrumentation?: boolean;
}
