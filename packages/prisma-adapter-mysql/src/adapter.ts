/**
 * Prisma MySQL Driver Adapter for Deno
 *
 * This adapter allows Prisma to use a Deno-compatible MySQL driver
 * instead of the npm mariadb package which has compatibility issues with Deno.
 *
 * Based on @prisma/adapter-mariadb but adapted for Deno-compatible MySQL access.
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

import { mapArg, mapColumnType, mapRow, type MySqlFieldInfo } from './conversion.ts';
import { convertDriverError } from './errors.ts';
import type { MySqlCapabilities, MySqlConnectionConfig, PrismaMySqlOptions } from './types.ts';

const PACKAGE_NAME = '@netscript/prisma-adapter-mysql';
const debug = Debug('prisma:driver-adapter:deno-mysql');

// deno-lint-ignore no-explicit-any
type AnyClient = any;
// deno-lint-ignore no-explicit-any
type AnyConnection = any;

interface Mysql2Module {
  createPool(options: Mysql2PoolOptions): Mysql2Pool;
}

interface Mysql2PoolOptions {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  waitForConnections: boolean;
  connectionLimit: number;
  connectTimeout?: number;
  ssl?: {
    ca?: string;
  };
}

interface Mysql2Pool {
  query(sql: string, values?: readonly unknown[]): Promise<readonly [unknown, readonly unknown[]]>;
  execute(
    sql: string,
    values?: readonly unknown[],
  ): Promise<readonly [Mysql2ExecuteResult, readonly unknown[]]>;
  getConnection(): Promise<Mysql2Connection>;
  end(): Promise<void>;
}

interface Mysql2Connection {
  query(sql: string, values?: readonly unknown[]): Promise<readonly [unknown, readonly unknown[]]>;
  execute(
    sql: string,
    values?: readonly unknown[],
  ): Promise<readonly [Mysql2ExecuteResult, readonly unknown[]]>;
  release(): void;
}

interface Mysql2ExecuteResult {
  affectedRows?: number;
  insertId?: number | bigint;
  lastInsertId?: number | bigint;
}

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
class MySqlQueryable implements SqlQueryable {
  readonly provider = 'mysql' as const;
  readonly adapterName = PACKAGE_NAME;

  constructor(
    protected client: AnyClient | AnyConnection,
    protected getFields?: () => MySqlFieldInfo[] | undefined,
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

      // deno_mysql uses different methods for different query types:
      // - query() for SELECT returns rows
      // - execute() for INSERT/UPDATE/DELETE returns affectedRows

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
   * This is a workaround since deno_mysql doesn't expose full field metadata
   * in the standard query interface.
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
    throw new DriverAdapterError(convertDriverError(error));
  }
}

/**
 * Transaction implementation for MySQL.
 */
class MySqlTransaction extends MySqlQueryable implements Transaction {
  readonly options: TransactionOptions;
  private committed = false;
  private rolledBack = false;

  constructor(
    private conn: AnyConnection,
    options: TransactionOptions,
    private cleanup?: () => void,
  ) {
    super(conn);
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
    } finally {
      this.cleanup?.();
    }
  }
}

/**
 * Main MySQL driver adapter for Prisma.
 *
 * This adapter wraps the deno_mysql client and implements Prisma's
 * SqlDriverAdapter interface.
 *
 * @example
 * ```typescript
 * import { PrismaClient } from "@prisma/client";
 * import { PrismaMySqlAdapterFactory } from "@netscript/prisma-adapter-mysql";
 *
 * const adapter = new PrismaMySqlAdapterFactory({
 *   hostname: "localhost",
 *   username: "root",
 *   password: "password",
 *   db: "mydb",
 * });
 *
 * const prisma = new PrismaClient({ adapter });
 * ```
 */
class PrismaMySqlAdapter extends MySqlQueryable implements SqlDriverAdapter {
  constructor(
    client: AnyClient,
    private readonly capabilities: MySqlCapabilities,
    private readonly options?: PrismaMySqlOptions,
  ) {
    super(client);
  }

  /**
   * Execute a script (not implemented).
   */
  executeScript(_script: string): Promise<void> {
    throw new Error('Not implemented yet');
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
  async startTransaction(isolationLevel?: IsolationLevel): Promise<Transaction> {
    const options: TransactionOptions = {
      usePhantomQuery: false,
    };

    const tag = '[js::startTransaction]';
    debug('%s options: %O', tag, options);

    const client = this.client as AnyClient;

    // Deferred to signal when we have the connection ready
    const connectionReady = new Deferred<AnyConnection>();
    // Deferred to signal when the transaction should end (release connection)
    const transactionEnd = new Deferred<void>();

    // Start the connection lifecycle in the background
    const connectionLifecycle = client.useConnection(async (conn: AnyConnection) => {
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
    return new MySqlTransaction(conn, options, cleanup);
  }

  /**
   * Dispose of the adapter and close connections.
   */
  async dispose(): Promise<void> {
    await (this.client as AnyClient).close();
  }

  /**
   * Get the underlying driver client.
   */
  underlyingDriver(): AnyClient {
    return this.client as AnyClient;
  }
}

/**
 * Factory for creating PrismaMySqlAdapter instances.
 *
 * This implements SqlDriverAdapterFactory and handles connection
 * creation and capability detection.
 *
 * @example
 * ```typescript
 * const adapter = new PrismaMySql({
 *   hostname: "localhost",
 *   username: "root",
 *   password: "password",
 *   db: "mydb",
 *   poolSize: 5,
 * });
 *
 * const prisma = new PrismaClient({ adapter });
 * ```
 */
export interface PrismaMySqlQuery {
  /** SQL statement to execute. */
  sql: string;
  /** Positional query arguments. */
  args: unknown[];
  /** Prisma argument metadata for each argument. */
  argTypes: Array<{
    /** Prisma scalar type name. */
    scalarType: string;
    /** Database-specific type name. */
    dbType: string;
    /** Whether the argument is a scalar or list. */
    arity?: 'scalar' | 'list';
  }>;
}

/**
 * Result set returned by Prisma MySQL raw queries.
 */
export interface PrismaMySqlResultSet {
  /** Column names in result order. */
  columnNames: string[];
  /** Prisma column type numbers in result order. */
  columnTypes: number[];
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
 * Connected transaction adapter returned by `startTransaction`.
 */
export interface PrismaMySqlTransactionAdapter {
  /** Database provider identity. */
  readonly provider: 'mysql';
  /** Adapter package name. */
  readonly adapterName: string;
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
  /** Execute a SQL script. */
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
    const { createPool } = await import('mysql2') as unknown as Mysql2Module;

    let client: AnyClient;
    try {
      client = createMysql2Client(createPool(toMysql2PoolOptions(this.#config)));
    } catch (error) {
      // Check for connection string parsing errors
      if (error instanceof Error && error.message.includes('connect')) {
        throw new Error(
          `Failed to connect to MySQL database: ${error.message}`,
        );
      }
      throw error;
    }

    // Detect server capabilities
    if (this.#capabilities === undefined) {
      this.#capabilities = await getCapabilities(client);
    }

    return new PrismaMySqlAdapter(
      client,
      this.#capabilities,
      this.#options,
    ) as PrismaMySqlConnectedAdapter;
  }
}

function createMysql2Client(pool: Mysql2Pool): AnyClient {
  return {
    connect(): Promise<AnyClient> {
      return Promise.resolve(this);
    },
    async query(sql: string, values?: readonly unknown[]): Promise<Record<string, unknown>[]> {
      const [rows] = await pool.query(sql, values);
      return Array.isArray(rows) ? rows as Record<string, unknown>[] : [];
    },
    async execute(
      sql: string,
      values?: readonly unknown[],
    ): Promise<Mysql2ExecuteResult & { rows?: unknown[] }> {
      const [result] = await pool.execute(sql, values);
      return {
        affectedRows: result.affectedRows,
        lastInsertId: result.lastInsertId ?? result.insertId,
      };
    },
    async useConnection<T>(
      fn: (conn: AnyConnection) => Promise<T>,
    ): Promise<T> {
      const connection = await pool.getConnection();
      try {
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

function createMysql2Connection(connection: Mysql2Connection): AnyConnection {
  return {
    async query(sql: string, values?: readonly unknown[]): Promise<Record<string, unknown>[]> {
      const [rows] = await connection.query(sql, values);
      return Array.isArray(rows) ? rows as Record<string, unknown>[] : [];
    },
    async execute(
      sql: string,
      values?: readonly unknown[],
    ): Promise<Mysql2ExecuteResult & { rows?: unknown[] }> {
      const [result] = await connection.execute(sql, values);
      return {
        affectedRows: result.affectedRows,
        lastInsertId: result.lastInsertId ?? result.insertId,
      };
    },
  };
}

function toMysql2PoolOptions(config: MySqlConnectionConfig): Mysql2PoolOptions {
  const options: Mysql2PoolOptions = {
    host: config.hostname,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.db,
    waitForConnections: true,
    connectionLimit: config.poolSize ?? 1,
    connectTimeout: config.timeout,
  };

  if (config.tls?.mode === 'verify_identity' && config.tls.caCerts?.length) {
    options.ssl = { ca: config.tls.caCerts.join('\n') };
  }

  return options;
}

/**
 * Detect MySQL server capabilities.
 */
async function getCapabilities(
  client: AnyClient,
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
