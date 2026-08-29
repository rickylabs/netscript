/**
 * Prisma MySQL Driver Adapter for Deno
 *
 * This adapter allows Prisma to use the dynamically imported npm
 * `mysql2/promise` driver instead of the npm `mariadb` package.
 *
 * It runs on Deno deployments that provide npm resolution and Node-compatible socket APIs.
 *
 * @module
 */

import type {
  ConnectionInfo,
  IsolationLevel,
  SqlDriverAdapter,
  SqlQuery,
  SqlQueryable,
  SqlResultSet,
  Transaction,
  TransactionOptions,
} from '@prisma/driver-adapter-utils';
import { Debug, DriverAdapterError } from '@prisma/driver-adapter-utils';
import type { Pool, PoolConnection, PoolOptions } from 'mysql2/promise';

import { mapArg, mapColumnType, mapRow, type MySqlFieldInfo } from './conversion.ts';
import { convertDriverError, isConnectionError } from './errors.ts';
import type { MySqlCapabilities, MySqlConnectionConfig, PrismaMySqlOptions } from './types.ts';

const PACKAGE_NAME = '@netscript/prisma-adapter-mysql';
const debug = Debug('prisma:driver-adapter:deno-mysql');

type ConnectionErrorNotifier = (error: unknown) => void;

function notifyConnectionError(
  options: PrismaMySqlOptions | undefined,
  error: unknown,
): void {
  if (!options?.onConnectionError || !isConnectionError(error)) {
    return;
  }

  try {
    options.onConnectionError(error as Error);
  } catch (callbackError) {
    debug('onConnectionError callback failed: %O', callbackError);
  }
}

function createConnectionErrorNotifier(
  options: PrismaMySqlOptions | undefined,
): ConnectionErrorNotifier {
  return (error: unknown): void => notifyConnectionError(options, error);
}

interface MysqlQueryableClient {
  query(sql: string, values?: readonly unknown[]): Promise<Record<string, unknown>[]>;
  execute(
    sql: string,
    values?: readonly unknown[],
  ): Promise<Mysql2ExecuteResult & { rows?: unknown[] }>;
}

interface MysqlPoolClient extends MysqlQueryableClient {
  connect(): Promise<MysqlPoolClient>;
  useConnection<T>(fn: (connection: MysqlQueryableClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

interface Mysql2ExecuteResult {
  affectedRows?: number;
  insertId?: number | bigint;
  lastInsertId?: number | bigint;
}

interface Mysql2Queryable {
  query(
    sql: string,
    values?: readonly unknown[],
  ): Promise<readonly [unknown, readonly unknown[]]>;
  execute(
    sql: string,
    values?: readonly unknown[],
  ): Promise<readonly [unknown, readonly unknown[]]>;
}

type TypedMysql2Pool = Pool & Mysql2Queryable;
type TypedMysql2PoolConnection = PoolConnection & Mysql2Queryable;

/**
 * Simple deferred promise for synchronization
 */
class Deferred<T> {
  promise: Promise<T>;
  resolve!: (value: T) => void;
  reject!: (reason?: unknown) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

/**
 * Internal interface for query results with metadata
 */
interface QueryResultWithMeta {
  rows: Record<string, unknown>[];
  fields?: MySqlFieldInfo[];
  affectedRows?: number;
  lastInsertId?: number | bigint;
}

/**
 * Base queryable class implementing common query logic.
 */
class MySqlQueryable<TClient extends MysqlQueryableClient> implements SqlQueryable {
  readonly provider: 'mysql' = 'mysql';
  readonly adapterName: string = PACKAGE_NAME;

  constructor(
    protected client: TClient,
    protected getFields?: () => MySqlFieldInfo[] | undefined,
    protected readonly notifyConnectionError: ConnectionErrorNotifier = () => {},
  ) {}

  /**
   * Execute a raw SQL query and return results.
   */
  async queryRaw(query: SqlQuery): Promise<SqlResultSet> {
    const tag = '[js::query_raw]';
    debug(`${tag} %O`, query);

    const result = await this.performIO(query);

    const fields = result.fields ?? [];
    const columnNames = fields.map((f) => f.name);
    const columnTypes = fields.map(mapColumnType);

    // Map rows from objects to arrays in column order
    const rows = (result.rows ?? []).map((row) => mapRow(row, fields));

    return {
      columnNames,
      columnTypes,
      rows,
      lastInsertId: result.lastInsertId?.toString(),
    };
  }

  /**
   * Execute a raw SQL statement and return affected row count.
   */
  async executeRaw(query: SqlQuery): Promise<number> {
    const tag = '[js::execute_raw]';
    debug(`${tag} %O`, query);

    const result = await this.performIO(query);
    return result.affectedRows ?? 0;
  }

  /**
   * Perform the actual database I/O.
   */
  protected async performIO(query: SqlQuery): Promise<QueryResultWithMeta> {
    const { sql, args, argTypes } = query;

    try {
      // Map arguments to appropriate MySQL format
      const values = args.map((arg: unknown, i: number) => mapArg(arg, argTypes[i]));

      // The normalized client uses query() for result-returning statements and
      // execute() for statements that report affected rows.

      const sqlUpper = sql.trim().toUpperCase();
      const isSelect = sqlUpper.startsWith('SELECT') ||
        sqlUpper.startsWith('SHOW') ||
        sqlUpper.startsWith('DESCRIBE') ||
        sqlUpper.startsWith('EXPLAIN');

      if (isSelect) {
        // query() returns an array of row objects
        const rows = await this.client.query(sql, values) as Record<string, unknown>[];

        // Infer field metadata from row data
        const fields = this.inferFieldsFromRows(rows);

        return {
          rows,
          fields,
          affectedRows: 0,
        };
      } else {
        // execute() returns { affectedRows, lastInsertId }
        const result = await this.client.execute(sql, values) as {
          affectedRows?: number;
          lastInsertId?: number | bigint;
        };

        return {
          rows: [],
          fields: [],
          affectedRows: result.affectedRows ?? 0,
          lastInsertId: result.lastInsertId,
        };
      }
    } catch (e) {
      this.onError(e);
    }
  }

  /**
   * Infer field information from row data.
   * This fallback is used when the normalized mysql2 wrapper has only row data
   * and no field metadata.
   */
  protected inferFieldsFromRows(
    rows: Record<string, unknown>[],
  ): MySqlFieldInfo[] {
    if (rows.length === 0) {
      return [];
    }

    const firstRow = rows[0];
    return Object.keys(firstRow).map((name) => ({
      catalog: '',
      schema: '',
      table: '',
      originTable: '',
      name,
      originName: name,
      encoding: 0,
      fieldLen: 0,
      fieldType: this.inferFieldType(firstRow[name]),
      fieldFlag: 0,
      decimals: 0,
      defaultVal: '',
    }));
  }

  /**
   * Infer MySQL field type from JavaScript value.
   */
  protected inferFieldType(value: unknown): number {
    if (value === null) return 0x06; // NULL
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 0x03 : 0x05; // LONG or DOUBLE
    }
    if (typeof value === 'bigint') return 0x08; // LONGLONG
    if (typeof value === 'boolean') return 0x01; // TINY
    if (typeof value === 'string') return 0xfd; // VAR_STRING
    if (value instanceof Date) return 0x0c; // DATETIME
    if (value instanceof Uint8Array) return 0xfc; // BLOB
    return 0xfd; // Default to VAR_STRING
  }

  /**
   * Handle errors from the database driver.
   */
  protected onError(error: unknown): never {
    debug('Error in performIO: %O', error);
    this.notifyConnectionError(error);
    throw new DriverAdapterError(convertDriverError(error));
  }
}

/**
 * Transaction implementation for MySQL.
 */
class MySqlTransaction extends MySqlQueryable<MysqlQueryableClient> implements Transaction {
  readonly options: TransactionOptions;
  private committed = false;
  private rolledBack = false;

  constructor(
    private conn: MysqlQueryableClient,
    options: TransactionOptions,
    private cleanup?: () => void,
    notifyConnectionError: ConnectionErrorNotifier = () => {},
  ) {
    super(conn, undefined, notifyConnectionError);
    this.options = options;
  }

  /**
   * Commit the transaction.
   */
  async commit(): Promise<void> {
    debug('[js::commit]');

    if (this.committed || this.rolledBack) {
      return;
    }

    try {
      await this.conn.execute('COMMIT');
      this.committed = true;
    } catch (error) {
      this.notifyConnectionError(error);
      throw error;
    } finally {
      this.cleanup?.();
    }
  }

  /**
   * Rollback the transaction.
   */
  async rollback(): Promise<void> {
    debug('[js::rollback]');

    if (this.committed || this.rolledBack) {
      return;
    }

    try {
      await this.conn.execute('ROLLBACK');
      this.rolledBack = true;
    } catch (error) {
      this.notifyConnectionError(error);
      throw error;
    } finally {
      this.cleanup?.();
    }
  }
}

/**
 * Main MySQL driver adapter for Prisma.
 *
 * This adapter wraps the normalized mysql2 pool client and implements Prisma's
 * `SqlDriverAdapter` interface. Applications receive it through
 * {@linkcode PrismaMySqlAdapterFactory.connect} rather than constructing it directly.
 */
export class PrismaMySqlAdapter extends MySqlQueryable<MysqlPoolClient>
  implements SqlDriverAdapter {
  constructor(
    client: MysqlPoolClient,
    private readonly capabilities: MySqlCapabilities,
    private readonly options: PrismaMySqlOptions | undefined = undefined,
  ) {
    super(client, undefined, createConnectionErrorNotifier(options));
  }

  /**
   * Execute a trusted SQL script.
   */
  async executeScript(script: string): Promise<void> {
    try {
      await this.client.query(script);
    } catch (error) {
      this.notifyConnectionError(error);
      throw error;
    }
  }

  /**
   * Get connection information.
   */
  getConnectionInfo(): ConnectionInfo {
    return {
      schemaName: this.options?.database,
      supportsRelationJoins: this.capabilities.supportsRelationJoins,
    };
  }

  /**
   * Start a new transaction.
   *
   * This implementation uses a deferred pattern to hold the connection
   * from the pool until the transaction is committed or rolled back.
   */
  async startTransaction(isolationLevel?: IsolationLevel): Promise<MySqlTransaction> {
    const options: TransactionOptions = {
      usePhantomQuery: false,
    };

    const tag = '[js::startTransaction]';
    debug('%s options: %O', tag, options);

    const client = this.client;

    // Deferred to signal when we have the connection ready
    const connectionReady = new Deferred<MysqlQueryableClient>();
    // Deferred to signal when the transaction should end (release connection)
    const transactionEnd = new Deferred<void>();

    // Start the connection lifecycle in the background
    const connectionLifecycle = client.useConnection(async (conn: MysqlQueryableClient) => {
      try {
        // Set isolation level if specified
        if (isolationLevel) {
          await conn.execute(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
        }

        // Begin transaction
        await conn.execute('BEGIN');
        debug('%s BEGIN executed, connection ready', tag);

        // Signal that connection is ready
        connectionReady.resolve(conn);

        // Wait until the transaction ends (commit or rollback called)
        await transactionEnd.promise;
        debug('%s Transaction ended, releasing connection', tag);
      } catch (error) {
        connectionReady.reject(error);
        throw error;
      }
    });

    // Handle errors from the connection lifecycle
    connectionLifecycle.catch((error: unknown) => {
      debug('%s Connection lifecycle error: %O', tag, error);
      this.notifyConnectionError(error);
      // If connection wasn't ready yet, reject it
      connectionReady.reject(error);
    });

    // Wait for the connection to be ready
    const conn = await connectionReady.promise;

    // Create cleanup function that ends the transaction lifecycle
    const cleanup = () => {
      transactionEnd.resolve();
    };

    // Create and return the transaction object
    return new MySqlTransaction(conn, options, cleanup, this.notifyConnectionError);
  }

  /**
   * Dispose of the adapter and close connections.
   */
  async dispose(): Promise<void> {
    try {
      await this.client.close();
    } catch (error) {
      this.notifyConnectionError(error);
      throw error;
    }
  }

  /**
   * Get the underlying driver client.
   */
  underlyingDriver(): MysqlPoolClient {
    return this.client;
  }
}

/**
 * Query shape accepted by the Prisma MySQL adapter.
 */
export interface PrismaMySqlQuery {
  /** SQL statement to execute. */
  sql: string;
  /** Positional query arguments. */
  args: unknown[];
  /** Prisma argument metadata for each argument. */
  argTypes: Array<{
    /** Prisma scalar type name. */
    scalarType:
      | 'string'
      | 'int'
      | 'bigint'
      | 'float'
      | 'decimal'
      | 'boolean'
      | 'enum'
      | 'uuid'
      | 'json'
      | 'datetime'
      | 'bytes'
      | 'unknown';
    /** Database-specific type name. */
    dbType?: string;
    /** Whether the argument is a scalar or list. */
    arity: 'scalar' | 'list';
  }>;
}

/**
 * Result set returned by Prisma MySQL raw queries.
 */
export interface PrismaMySqlResultSet {
  /** Column names in result order. */
  columnNames: string[];
  /** Prisma column types in result order. */
  columnTypes: SqlResultSet['columnTypes'];
  /** Result rows in column order. */
  rows: unknown[][];
  /** Last inserted ID when reported by MySQL. */
  lastInsertId?: string;
}

/**
 * Transaction isolation levels accepted by the MySQL adapter.
 */
export type PrismaMySqlIsolationLevel =
  | 'READ UNCOMMITTED'
  | 'READ COMMITTED'
  | 'REPEATABLE READ'
  | 'SNAPSHOT'
  | 'SERIALIZABLE';

/**
 * Connection details reported to Prisma.
 */
export interface PrismaMySqlConnectionInfo {
  /** Database schema name. */
  schemaName?: string;
  /** Whether the server supports relation joins. */
  supportsRelationJoins: boolean;
}

/**
 * Options associated with a connected MySQL transaction.
 */
export interface PrismaMySqlTransactionOptions {
  /** Whether Prisma should issue a phantom query for transaction coordination. */
  usePhantomQuery: boolean;
}

/**
 * Connected transaction adapter returned by `startTransaction`.
 */
export interface PrismaMySqlTransactionAdapter {
  /** Database provider identity. */
  readonly provider: 'mysql';
  /** Adapter package name. */
  readonly adapterName: string;
  /** Prisma transaction options associated with this transaction. */
  readonly options: PrismaMySqlTransactionOptions;
  /** Execute a raw SQL query. */
  queryRaw(query: PrismaMySqlQuery): Promise<PrismaMySqlResultSet>;
  /** Execute a raw SQL statement and return affected rows. */
  executeRaw(query: PrismaMySqlQuery): Promise<number>;
  /** Commit the transaction. */
  commit(): Promise<void>;
  /** Roll back the transaction. */
  rollback(): Promise<void>;
}

/**
 * Connected MySQL adapter returned by {@linkcode PrismaMySqlAdapterFactory.connect}.
 */
export interface PrismaMySqlConnectedAdapter {
  /** Database provider identity. */
  readonly provider: 'mysql';
  /** Adapter package name. */
  readonly adapterName: string;
  /** Execute a raw SQL query. */
  queryRaw(query: PrismaMySqlQuery): Promise<PrismaMySqlResultSet>;
  /** Execute a raw SQL statement and return affected rows. */
  executeRaw(query: PrismaMySqlQuery): Promise<number>;
  /** Execute a trusted SQL script. */
  executeScript(script: string): Promise<void>;
  /** Return connection details used by Prisma. */
  getConnectionInfo(): PrismaMySqlConnectionInfo;
  /** Start a transaction. */
  startTransaction(
    isolationLevel?: PrismaMySqlIsolationLevel,
  ): Promise<PrismaMySqlTransactionAdapter>;
  /** Close the underlying driver resources. */
  dispose(): Promise<void>;
  /** Return the underlying driver object. */
  underlyingDriver(): unknown;
}

/**
 * Factory for creating Prisma MySQL adapter instances.
 */
export class PrismaMySqlAdapterFactory {
  /** Database provider identity. */
  readonly provider: 'mysql' = 'mysql';
  /** Adapter package name. */
  readonly adapterName: string = PACKAGE_NAME;

  #capabilities?: MySqlCapabilities;
  #config: MySqlConnectionConfig;
  #options?: PrismaMySqlOptions;

  /**
   * Create a MySQL adapter factory.
   *
   * @param config - MySQL connection configuration.
   * @param options - Adapter options passed to Prisma.
   */
  constructor(config: MySqlConnectionConfig, options?: PrismaMySqlOptions) {
    this.#config = config;
    this.#options = {
      ...options,
      database: options?.database ?? config.db,
    };
  }

  /**
   * Connect to the database and create an adapter instance.
   */
  async connect(): Promise<PrismaMySqlConnectedAdapter> {
    const { createPool } = await import('mysql2/promise');

    let client: MysqlPoolClient;
    try {
      const pool = createPool(toMysql2PoolOptions(this.#config));
      if (!isMysql2Queryable(pool)) {
        throw new TypeError('mysql2 promise pool does not expose query and execute methods');
      }
      client = createMysql2Client(pool);
    } catch (error) {
      // Add context to pool construction and connection configuration errors.
      if (error instanceof Error && error.message.includes('connect')) {
        throw new Error(
          `Failed to connect to MySQL database: ${error.message}`,
        );
      }
      throw error;
    }

    // Detect server capabilities
    if (this.#capabilities === undefined) {
      this.#capabilities = await getCapabilities(client, this.#options);
    }

    return new PrismaMySqlAdapter(
      client,
      this.#capabilities,
      this.#options,
    );
  }
}

function createMysql2Client(pool: TypedMysql2Pool): MysqlPoolClient {
  return {
    connect(): Promise<MysqlPoolClient> {
      return Promise.resolve(this);
    },
    async query(sql: string, values?: readonly unknown[]): Promise<Record<string, unknown>[]> {
      const [rows] = await pool.query(sql, [...(values ?? [])]);
      return Array.isArray(rows) ? rows.filter(isRecord) : [];
    },
    async execute(
      sql: string,
      values?: readonly unknown[],
    ): Promise<Mysql2ExecuteResult & { rows?: unknown[] }> {
      const [result] = await pool.execute(sql, [...(values ?? [])]);
      return {
        affectedRows: hasExecutionMetadata(result) ? result.affectedRows : undefined,
        lastInsertId: hasExecutionMetadata(result) ? result.insertId : undefined,
      };
    },
    async useConnection<T>(
      fn: (conn: MysqlQueryableClient) => Promise<T>,
    ): Promise<T> {
      const connection = await pool.getConnection();
      try {
        if (!isMysql2Queryable(connection)) {
          throw new TypeError(
            'mysql2 promise pool connection does not expose query and execute methods',
          );
        }
        return await fn(createMysql2Connection(connection));
      } finally {
        connection.release();
      }
    },
    async close(): Promise<void> {
      await pool.end();
    },
  };
}

function createMysql2Connection(connection: TypedMysql2PoolConnection): MysqlQueryableClient {
  return {
    async query(sql: string, values?: readonly unknown[]): Promise<Record<string, unknown>[]> {
      const [rows] = await connection.query(sql, [...(values ?? [])]);
      return Array.isArray(rows) ? rows.filter(isRecord) : [];
    },
    async execute(
      sql: string,
      values?: readonly unknown[],
    ): Promise<Mysql2ExecuteResult & { rows?: unknown[] }> {
      const [result] = await connection.execute(sql, [...(values ?? [])]);
      return {
        affectedRows: hasExecutionMetadata(result) ? result.affectedRows : undefined,
        lastInsertId: hasExecutionMetadata(result) ? result.insertId : undefined,
      };
    },
  };
}

/**
 * Translate the public structured connection config to mysql2 pool options.
 *
 * This export is an internal source-level test seam and is not re-exported from the package root.
 */
export function toMysql2PoolOptions(config: MySqlConnectionConfig): PoolOptions {
  const options: PoolOptions = {
    host: config.hostname,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.db,
    waitForConnections: true,
    connectionLimit: config.poolSize ?? 1,
    multipleStatements: true,
    connectTimeout: config.timeout,
  };

  if (config.tls?.mode === 'verify_identity' && config.tls.caCerts?.length) {
    options.ssl = { ca: config.tls.caCerts.join('\n') };
  }

  return options;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMysql2Queryable(value: unknown): value is Mysql2Queryable {
  return isRecord(value) && typeof value.query === 'function' &&
    typeof value.execute === 'function';
}

function hasExecutionMetadata(
  value: unknown,
): value is { affectedRows: number; insertId: number | bigint } {
  return isRecord(value) && typeof value.affectedRows === 'number' &&
    (typeof value.insertId === 'number' || typeof value.insertId === 'bigint');
}

/**
 * Detect MySQL server capabilities.
 */
export async function getCapabilities(
  client: MysqlQueryableClient,
  options: PrismaMySqlOptions | undefined = undefined,
): Promise<MySqlCapabilities> {
  const tag = '[js::getCapabilities]';

  try {
    const rows = await client.query('SELECT VERSION() as version');
    const version = (rows[0] as { version: string })?.version;

    debug(`${tag} MySQL version: %s`, version);

    const capabilities = inferCapabilities(version);
    debug(`${tag} Inferred capabilities: %O`, capabilities);

    return capabilities;
  } catch (e) {
    debug(`${tag} Error while checking capabilities: %O`, e);
    notifyConnectionError(options, e);
    return { supportsRelationJoins: false };
  }
}

/**
 * Infer server capabilities from version string.
 */
export function inferCapabilities(version: unknown): MySqlCapabilities {
  if (typeof version !== 'string') {
    return { supportsRelationJoins: false };
  }

  const [versionStr, suffix] = version.split('-');
  const [major, minor, patch] = versionStr.split('.').map((n) => parseInt(n, 10));

  // No relation-joins support for mysql < 8.0.13 or mariadb
  const isMariaDB = suffix?.toLowerCase()?.includes('mariadb') ?? false;
  const supportsRelationJoins = !isMariaDB &&
    (major > 8 ||
      (major === 8 && (minor > 0 || (minor === 0 && patch >= 13))));

  return { supportsRelationJoins };
}

// Export the factory as the main export name
export { PrismaMySqlAdapterFactory as PrismaMySql };
