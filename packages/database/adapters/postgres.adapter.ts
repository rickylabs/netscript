/**
 * PostgreSQL Database Adapter
 *
 * Adapter implementation for PostgreSQL using Prisma v7 driver adapters.
 *
 * @module
 */

import { PrismaPg } from '@prisma/adapter-pg';
import type {
  DatabaseAdapter,
  DatabaseConnectionOptions,
  DatabaseConnectionStatus,
} from '../ports/database-client.ts';

/**
 * PostgreSQL-specific connection options
 */
export interface PostgresConnectionOptions extends DatabaseConnectionOptions {
  /** Schema to use */
  schema?: string;
  /** Application name for connection tracking */
  applicationName?: string;
}

/**
 * Public structural type returned by PostgreSQL driver adapter factories.
 */
export interface PostgresDriverAdapter {
  /** Database provider identity. */
  readonly provider?: string;
  /** Open a Prisma driver connection. */
  connect(): Promise<unknown>;
  /** Open a shadow database connection when supported by the driver. */
  connectToShadowDb?(): Promise<unknown>;
}

/**
 * PostgreSQL Adapter
 *
 * Creates and manages PostgreSQL connections using Prisma's pg driver adapter.
 *
 * @example
 * ```typescript
 * import { PostgresAdapter } from '@netscript/database/adapters';
 * import { PrismaClient } from './generated/client';
 *
 * const adapter = new PostgresAdapter({
 *   connectionString: 'postgresql://user:pass@localhost:5432/mydb',
 * });
 *
 * const client = new PrismaClient({ adapter: adapter.getDriverAdapter() });
 * ```
 */
export class PostgresAdapter<
  TClient extends {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRaw: unknown;
    $queryRawUnsafe: unknown;
    $executeRaw: unknown;
    $executeRawUnsafe: unknown;
  },
> implements DatabaseAdapter<TClient> {
  /** Database provider identity for status reporting. */
  readonly provider = 'postgres' as const;

  private client: TClient | null = null;
  private driverAdapter: PostgresDriverAdapter | null = null;
  private readonly options: PostgresConnectionOptions;
  private lastConnected?: Date;

  /**
   * Create a PostgreSQL adapter from connection options.
   *
   * @param options - PostgreSQL connection options.
   */
  constructor(options: PostgresConnectionOptions) {
    this.options = options;
  }

  /**
   * Get the Prisma driver adapter for use in client initialization
   */
  getDriverAdapter(): PostgresDriverAdapter {
    if (!this.driverAdapter) {
      const connectionString = this.buildConnectionString();
      this.driverAdapter = new PrismaPg({ connectionString }) as PostgresDriverAdapter;
    }
    return this.driverAdapter;
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
        'PostgreSQL client not initialized. Call setClient() with your PrismaClient instance.',
      );
    }
    return this.client;
  }

  /** Open the configured Prisma client connection. */
  async connect(): Promise<void> {
    if (!this.client) {
      throw new Error('PostgreSQL client not set. Call setClient() first.');
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
      // Use type assertion for raw query
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
    const $queryRawUnsafe = client.$queryRawUnsafe as (
      query: string,
      ...params: unknown[]
    ) => Promise<T>;
    return $queryRawUnsafe(query, ...params);
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

    const { host, port = 5432, database, username, password, ssl, schema, applicationName } =
      this.options;

    if (!host || !database) {
      throw new Error('PostgreSQL connection requires host and database');
    }

    const auth = username ? (password ? `${username}:${password}@` : `${username}@`) : '';
    const params = new URLSearchParams();

    if (ssl === true || ssl === 'require') {
      params.set('sslmode', 'require');
    } else if (ssl === 'prefer') {
      params.set('sslmode', 'prefer');
    }

    if (schema) {
      params.set('schema', schema);
    }

    if (applicationName) {
      params.set('application_name', applicationName);
    }

    const queryString = params.toString();
    return `postgresql://${auth}${host}:${port}/${database}${queryString ? '?' + queryString : ''}`;
  }
}

/**
 * Create a PostgreSQL adapter
 */
export function createPostgresAdapter<
  TClient extends {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRaw: unknown;
    $queryRawUnsafe: unknown;
    $executeRaw: unknown;
    $executeRawUnsafe: unknown;
  },
>(options: PostgresConnectionOptions): PostgresAdapter<TClient> {
  return new PostgresAdapter<TClient>(options);
}
