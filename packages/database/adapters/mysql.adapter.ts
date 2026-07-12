/**
 * MySQL Database Adapter
 *
 * Adapter implementation for MySQL 8.x using Prisma v7 driver adapters.
 * Uses @netscript/prisma-adapter-mysql - a native Deno adapter that avoids
 * the Symbol(Deno.internal.rid) error from npm mariadb package.
 *
 * Supports:
 * - MySQL 8.4.x (default, recommended)
 * - MySQL 8.0.x
 * - MySQL 5.7.x (limited JSON support)
 * - MariaDB 10.5+
 *
 * @module
 */

import { PrismaMySql } from '@netscript/prisma-adapter-mysql';
import type {
  DatabaseAdapter,
  DatabaseConnectionOptions,
  DatabaseConnectionStatus,
} from '../ports/database-client.ts';

// ============================================================================
// MYSQL ADAPTER CONFIG TYPE
// ============================================================================

/**
 * Configuration object for @netscript/prisma-adapter-mysql.
 * This is what the PrismaMySql adapter expects.
 */
export interface MysqlAdapterConfig {
  /** Database hostname */
  hostname: string;
  /** Database port (default: 3306) */
  port?: number;
  /** Database name */
  db: string;
  /** Username */
  username: string;
  /** Password */
  password?: string;
  /** Connection pool size */
  poolSize?: number;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** TLS configuration */
  tls?: {
    /** TLS verification mode. */
    mode?: 'disabled' | 'verify_identity';
    /** CA certificates used for TLS verification. */
    caCerts?: string[];
  };
}

/**
 * MySQL-specific connection options
 */
export interface MysqlConnectionOptions extends DatabaseConnectionOptions {
  /** Character set (default: utf8mb4) */
  charset?: string;
  /** Timezone for timestamp handling */
  timezone?: string;
  /** Connection pool limit */
  connectionLimit?: number;
  /** Enable multi-statements */
  multipleStatements?: boolean;
}

/**
 * Public structural type returned by MySQL driver adapter factories.
 */
export interface MysqlDriverAdapter {
  /** Database provider identity. */
  readonly provider?: string;
  /** Open a Prisma driver connection. */
  connect(): Promise<unknown>;
}

// ============================================================================
// CONNECTION STRING PARSER
// ============================================================================

/**
 * Parses a MySQL connection URI into adapter config.
 *
 * Supports formats:
 * - mysql://user:password@host:port/database
 * - mysql://user:password@host:port/database?ssl=true
 *
 * @param connectionString - MySQL connection URI
 * @returns MysqlAdapterConfig for PrismaMySql
 *
 * @example
 * ```typescript
 * const config = parseMysqlConnectionString(
 *   'mysql://root:password@localhost:3306/mydb'
 * );
 * // { hostname: 'localhost', port: 3306, db: 'mydb', username: 'root', password: 'password' }
 * ```
 */
export function parseMysqlConnectionString(connectionString: string): MysqlAdapterConfig {
  const url = new URL(connectionString);

  if (url.protocol !== 'mysql:') {
    throw new Error(`Invalid MySQL connection string protocol: ${url.protocol}`);
  }

  const config: MysqlAdapterConfig = {
    hostname: url.hostname || 'localhost',
    port: url.port ? parseInt(url.port, 10) : 3306,
    db: url.pathname.slice(1) || 'mysql',
    username: decodeURIComponent(url.username) || 'root',
    password: url.password ? decodeURIComponent(url.password) : undefined,
  };

  // Parse query parameters
  const params = url.searchParams;

  if (params.has('ssl') && params.get('ssl') === 'true') {
    config.tls = { mode: 'verify_identity' };
  }

  if (params.has('poolSize')) {
    config.poolSize = parseInt(params.get('poolSize')!, 10);
  }

  if (params.has('timeout')) {
    config.timeout = parseInt(params.get('timeout')!, 10);
  }

  return config;
}

// ============================================================================
// ENVIRONMENT CONFIG HELPERS
// ============================================================================

/**
 * Gets MySQL configuration from structured environment variables.
 * These are typically injected by Aspire's WithReference() when referencing
 * a MySQL resource.
 *
 * Checks for env vars in format: {RESOURCENAME}_{PROPERTY}
 * Since resource is typically named "mysql", looks for:
 *   - MYSQL_HOST
 *   - MYSQL_PORT
 *   - MYSQL_DATABASE
 *   - MYSQL_USER
 *   - MYSQL_PASSWORD
 *
 * @param resourceName - The resource name prefix (default: 'MYSQL')
 * @returns MysqlAdapterConfig or null if required vars not set
 */
export function getMysqlConfigFromEnv(resourceName = 'MYSQL'): MysqlAdapterConfig | null {
  const prefix = resourceName.toUpperCase();

  const hostname = Deno.env.get(`${prefix}_HOST`) || Deno.env.get('DATABASE_HOST');
  const db = Deno.env.get(`${prefix}_DATABASE`) || Deno.env.get('DATABASE_NAME');
  const username = Deno.env.get(`${prefix}_USER`) || Deno.env.get('DATABASE_USER');

  if (!hostname || !db || !username) {
    return null;
  }

  const port = Deno.env.get(`${prefix}_PORT`) || Deno.env.get('DATABASE_PORT') || '3306';
  const password = Deno.env.get(`${prefix}_PASSWORD`) || Deno.env.get('DATABASE_PASSWORD');
  const ssl = Deno.env.get(`${prefix}_SSL`)?.toLowerCase() === 'true';

  const config: MysqlAdapterConfig = {
    hostname,
    port: parseInt(port, 10),
    db,
    username,
    password: password || undefined,
  };

  if (ssl) {
    config.tls = { mode: 'verify_identity' };
  }

  return config;
}

/**
 * Gets MySQL adapter configuration from environment.
 * Prefers structured env vars (MYSQL_HOST, etc.) but falls back to
 * parsing connection string from the specified env var.
 *
 * @param connectionStringEnvVar - Name of env var containing connection string (default: 'MYSQLDB_URI')
 * @returns MysqlAdapterConfig
 * @throws Error if no configuration is found
 *
 * @example
 * ```typescript
 * // With structured env vars:
 * // MYSQL_HOST=localhost, MYSQL_PORT=3306, MYSQL_DATABASE=mydb, MYSQL_USER=root
 * const config = getMysqlConfig();
 *
 * // Or with connection string:
 * // MYSQLDB_URI=mysql://root:password@localhost:3306/mydb
 * const config = getMysqlConfig('MYSQLDB_URI');
 * ```
 */
export function getMysqlConfig(connectionStringEnvVar = 'MYSQLDB_URI'): MysqlAdapterConfig {
  // Try structured env vars first
  const structuredConfig = getMysqlConfigFromEnv();
  if (structuredConfig) {
    return structuredConfig;
  }

  // Fall back to parsing connection string
  const connectionString = Deno.env.get(connectionStringEnvVar) || Deno.env.get('DATABASE_URL');
  if (!connectionString) {
    throw new Error(
      'MySQL configuration not found. ' +
        `Ensure either MYSQL_HOST/MYSQL_DATABASE/MYSQL_USER or ${connectionStringEnvVar} environment variables are set.`,
    );
  }

  const parsedConfig = parseMysqlConnectionString(connectionString);
  return parsedConfig;
}

/**
 * Build a MySQL connection string from parts
 *
 * @param parts - Connection parts
 * @returns MySQL connection string
 */
export function buildMysqlConnectionString(parts: {
  hostname: string;
  port?: number;
  db: string;
  username: string;
  password?: string;
  ssl?: boolean;
}): string {
  const { hostname, port = 3306, db, username, password, ssl } = parts;
  const encodedPassword = password ? encodeURIComponent(password) : '';
  const auth = password ? `${username}:${encodedPassword}@` : `${username}@`;

  const params: string[] = [];
  if (ssl) params.push('ssl=true');

  const queryString = params.length > 0 ? `?${params.join('&')}` : '';

  return `mysql://${auth}${hostname}:${port}/${db}${queryString}`;
}

// ============================================================================
// MYSQL ADAPTER CLASS
// ============================================================================

/**
 * MySQL Adapter
 *
 * Creates and manages MySQL connections using Prisma's native Deno MySQL adapter.
 *
 * @example
 * ```typescript
 * import { MysqlAdapter, getMysqlConfig } from '@netscript/database/adapters';
 * import { PrismaClient } from './generated/client';
 *
 * // Using structured options
 * const adapter = new MysqlAdapter({
 *   host: 'localhost',
 *   port: 3306,
 *   database: 'mydb',
 *   username: 'root',
 *   password: 'password',
 * });
 *
 * // Or using environment config
 * const config = getMysqlConfig();
 * const driver = new PrismaMySql(config);
 *
 * const client = new PrismaClient({ adapter: adapter.getDriverAdapter() });
 * ```
 */
export class MysqlAdapter<
  TClient extends {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRaw: unknown;
    $executeRaw: unknown;
    $executeRawUnsafe: unknown;
  },
> implements DatabaseAdapter<TClient> {
  /** Database provider identity for status reporting. */
  readonly provider = 'mysql' as const;

  private client: TClient | null = null;
  private driverAdapter: MysqlDriverAdapter | null = null;
  private readonly options: MysqlConnectionOptions;
  private lastConnected?: Date;

  /**
   * Create a MySQL adapter from connection options.
   *
   * @param options - MySQL connection options.
   */
  constructor(options: MysqlConnectionOptions) {
    this.options = options;
  }

  /**
   * Get the Prisma driver adapter for use in client initialization
   */
  getDriverAdapter(): MysqlDriverAdapter {
    if (!this.driverAdapter) {
      const config = this.buildAdapterConfig();
      this.driverAdapter = new PrismaMySql(config) as MysqlDriverAdapter;
    }
    return this.driverAdapter;
  }

  /**
   * Build config object for @netscript/prisma-adapter-mysql
   */
  private buildAdapterConfig(): MysqlAdapterConfig {
    // If connection string is provided, parse it
    if (this.options.connectionString) {
      return parseMysqlConnectionString(this.options.connectionString);
    }

    const {
      host,
      port,
      database,
      username,
      password,
      ssl,
      poolSize,
    } = this.options;

    if (!host || !database || !username) {
      throw new Error('MySQL connection requires host, database, and username');
    }

    const config: MysqlAdapterConfig = {
      hostname: host,
      db: database,
      username,
      password: password || undefined,
    };

    if (port) {
      config.port = port;
    }

    if (ssl === true || ssl === 'require') {
      config.tls = { mode: 'verify_identity' };
    }

    if (poolSize) {
      config.poolSize = poolSize;
    }

    return config;
  }

  /**
   * Set the Prisma client instance
   * Call this after creating the PrismaClient with the driver adapter
   */
  setClient(client: TClient): void {
    this.client = client;
  }

  /** Return the configured Prisma client instance. */
  getClient(): TClient {
    if (!this.client) {
      throw new Error(
        'MySQL client not initialized. Call setClient() with your PrismaClient instance.',
      );
    }
    return this.client;
  }

  /** Open the configured Prisma client connection. */
  async connect(): Promise<void> {
    if (!this.client) {
      throw new Error('MySQL client not set. Call setClient() first.');
    }
    await this.client.$connect();
    this.lastConnected = new Date();
  }

  /** Close the configured Prisma client connection. */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.$disconnect();
    }
  }

  /** Probe the database connection with a lightweight query. */
  async healthCheck(): Promise<boolean> {
    try {
      const client = this.getClient();
      const $queryRaw = client.$queryRaw as (
        strings: TemplateStringsArray,
        ...values: unknown[]
      ) => Promise<unknown>;
      await $queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /** Return a status snapshot for the current database connection. */
  async getStatus(): Promise<DatabaseConnectionStatus> {
    const healthy = await this.healthCheck();
    return {
      connected: healthy,
      provider: this.provider,
      database: this.options.database,
      host: this.options.host,
      lastConnected: this.lastConnected,
      error: healthy ? undefined : 'Connection failed',
    };
  }

  /** Execute a raw query through the configured Prisma client. */
  executeRaw<T = unknown>(query: string, ...params: unknown[]): Promise<T> {
    const client = this.getClient();
    const $queryRaw = client.$queryRaw as (
      query: TemplateStringsArray | string,
      ...params: unknown[]
    ) => Promise<T>;
    return $queryRaw(query as unknown as TemplateStringsArray, ...params); // quality-allow: Prisma's tagged-template query API is invariant although this compatibility method accepts the legacy string form
  }

  /** Execute an unsafe raw command through the configured Prisma client. */
  executeRawUnsafe<T = unknown>(query: string, ...params: unknown[]): Promise<T> {
    const client = this.getClient();
    const $executeRawUnsafe = client.$executeRawUnsafe as (
      query: string,
      ...params: unknown[]
    ) => Promise<T>;
    return $executeRawUnsafe(query, ...params);
  }

  /**
   * Build connection string from options
   */
  private buildConnectionString(): string {
    if (this.options.connectionString) {
      return this.options.connectionString;
    }

    const {
      host,
      port = 3306,
      database,
      username,
      password,
      ssl,
    } = this.options;

    if (!host || !database || !username) {
      throw new Error('MySQL connection requires host, database, and username');
    }

    return buildMysqlConnectionString({
      hostname: host,
      port,
      db: database,
      username,
      password,
      ssl: ssl === true || ssl === 'require',
    });
  }
}

/**
 * Create a MySQL adapter
 */
export function createMysqlAdapter<
  TClient extends {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRaw: unknown;
    $executeRaw: unknown;
    $executeRawUnsafe: unknown;
  },
>(options: MysqlConnectionOptions): MysqlAdapter<TClient> {
  return new MysqlAdapter<TClient>(options);
}
