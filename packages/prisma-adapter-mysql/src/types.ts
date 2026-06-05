/**
 * Type definitions for the MySQL adapter.
 */

/**
 * MySQL connection configuration options.
 */
export interface MySqlConnectionConfig {
  /** MySQL server hostname */
  hostname?: string;
  /** MySQL server port (default: 3306) */
  port?: number;
  /** Database username */
  username?: string;
  /** Database password */
  password?: string;
  /** Database name */
  db?: string;
  /** Connection pool size (default: 1) */
  poolSize?: number;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** TLS configuration */
  tls?: {
    mode?: "disabled" | "verify_identity";
    caCerts?: string[];
  };
}

/**
 * Adapter options for PrismaMySql.
 */
export interface PrismaMySqlOptions {
  /** Database schema name */
  database?: string;
  /** Callback when connection errors occur */
  onConnectionError?: (err: Error) => void;
}

/**
 * Capabilities of the connected MySQL server.
 */
export interface MySqlCapabilities {
  /** Whether the server supports relation joins (MySQL 8.0.13+) */
  supportsRelationJoins: boolean;
}

/**
 * Result from execute() call - for INSERT/UPDATE/DELETE
 */
export interface ExecuteResult {
  affectedRows?: number;
  lastInsertId?: number | bigint;
}

/**
 * Result from query() call - for SELECT
 */
export interface QueryResult<T = Record<string, unknown>> {
  rows?: T[];
  fields?: FieldInfo[];
}

/**
 * Field metadata from MySQL
 */
export interface FieldInfo {
  catalog: string;
  schema: string;
  table: string;
  originTable: string;
  name: string;
  originName: string;
  encoding: number;
  fieldLen: number;
  fieldType: number;
  fieldFlag: number;
  decimals: number;
  defaultVal: string;
}

/**
 * deno_mysql Client interface
 */
export interface DenoMySqlClient {
  connect(config: MySqlConnectionConfig): Promise<DenoMySqlClient>;
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]>;
  execute(
    sql: string,
    params?: unknown[],
  ): Promise<ExecuteResult & { rows?: unknown[] }>;
  transaction<T>(
    fn: (conn: DenoMySqlConnection) => Promise<T>,
  ): Promise<T>;
  useConnection<T>(
    fn: (conn: DenoMySqlConnection) => Promise<T>,
  ): Promise<T>;
  close(): Promise<void>;
}

/**
 * Connection interface for transactions
 */
export interface DenoMySqlConnection {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<T[]>;
  execute(
    sql: string,
    params?: unknown[],
    iterator?: boolean,
  ): Promise<ExecuteResult & { rows?: unknown[] }>;
}
