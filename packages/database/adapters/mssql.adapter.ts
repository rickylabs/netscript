/**
 * SQL Server (MSSQL) Database Adapter
 *
 * Adapter implementation for SQL Server 2025 using Prisma v7 driver adapters.
 * Supports both structured config and ADO.NET connection string parsing.
 *
 * @module
 */

import { PrismaMssql } from '@prisma/adapter-mssql';
import type {
  DatabaseAdapter,
  DatabaseConnectionOptions,
  DatabaseConnectionStatus,
  IsolationLevel,
} from '../ports/database-client.ts';

// ============================================================================
// MSSQL ADAPTER CONFIG TYPE
// ============================================================================

/**
 * Configuration object for @prisma/adapter-mssql.
 * This is what the PrismaMssql adapter expects.
 *
 * Note: Windows Authentication requires the `tedious` driver to be configured
 * with NTLM authentication type, which is only supported on Windows.
 * For cross-platform compatibility, use SQL Server authentication (user/password).
 */
export interface MssqlAdapterConfig {
  /** SQL Server host name or address. */
  server: string;
  /** SQL Server port. */
  port?: number;
  /** Database name. */
  database: string;
  /** SQL Server login user. */
  user?: string;
  /** SQL Server login password. */
  password?: string;
  /** Authentication configuration for tedious */
  authentication?: {
    /** Tedious authentication mode. */
    type:
      | 'default'
      | 'ntlm'
      | 'azure-active-directory-password'
      | 'azure-active-directory-access-token';
    /** Authentication credentials for the selected tedious mode. */
    options?: {
      /** Login user name. */
      userName?: string;
      /** Login password. */
      password?: string;
      /** Windows domain for NTLM authentication. */
      domain?: string;
    };
  };
  /** Driver-level TLS and authentication options. */
  options?: {
    /** Whether to encrypt the connection. */
    encrypt?: boolean;
    /** Whether to trust the server certificate. */
    trustServerCertificate?: boolean;
  };
}

/**
 * MSSQL-specific connection options
 */
export interface MssqlConnectionOptions extends DatabaseConnectionOptions {
  /** Instance name (for named instances) */
  instanceName?: string;
  /** Trust server certificate (for local development) */
  trustServerCertificate?: boolean;
  /** Encrypt connection */
  encrypt?: boolean;
  /** Use Windows Authentication (Integrated Security) */
  integratedSecurity?: boolean;
  /** Application name for connection tracking */
  applicationName?: string;
  /** Connection timeout in seconds */
  connectTimeout?: number;
  /** Request timeout in seconds */
  requestTimeout?: number;
}

/**
 * Public structural type returned by SQL Server driver adapter factories.
 */
export interface MssqlDriverAdapter {
  /** Database provider identity. */
  readonly provider?: string;
  /** Open a Prisma driver connection. */
  connect(): Promise<unknown>;
}

// ============================================================================
// ADO.NET CONNECTION STRING PARSER
// ============================================================================

/**
 * Parses an ADO.NET connection string into a config object for @prisma/adapter-mssql.
 *
 * ADO.NET format: Server=host,port;Database=name;Integrated Security=True;TrustServerCertificate=True
 * Config format: { server: 'host', port: 1433, database: 'name', options: { ... } }
 *
 * @param connectionString - ADO.NET format connection string
 * @returns MssqlAdapterConfig object for PrismaMssql
 *
 * @example
 * ```typescript
 * const config = parseAdoNetConnectionString(
 *   'Server=localhost,1433;Database=mydb;User Id=sa;Password=pass123'
 * );
 * // { server: 'localhost', port: 1433, database: 'mydb', user: 'sa', password: 'pass123' }
 * ```
 */
export function parseAdoNetConnectionString(connectionString: string): MssqlAdapterConfig {
  const params: Record<string, string> = {};

  // Parse key=value pairs (semicolon-separated)
  for (const part of connectionString.split(';')) {
    const [key, ...valueParts] = part.split('=');
    if (key && valueParts.length > 0) {
      params[key.trim().toLowerCase()] = valueParts.join('=').trim();
    }
  }

  // Parse server and port (format: "host,port" or "host\instance")
  let server = params['server'] || params['data source'] || 'localhost';
  let port: number | undefined;

  if (server.includes(',')) {
    const [host, portStr] = server.split(',');
    server = host;
    port = parseInt(portStr, 10);
  } else if (server.includes('\\')) {
    // Named instance - strip instance name, use default port
    server = server.split('\\')[0];
  }

  const database = params['database'] || params['initial catalog'] || 'master';
  const integratedSecurity = params['integrated security']?.toLowerCase() === 'true' ||
    params['trusted_connection']?.toLowerCase() === 'true';
  const trustServerCertificate = params['trustservercertificate']?.toLowerCase() === 'true' ||
    params['trust server certificate']?.toLowerCase() === 'true';

  const config: MssqlAdapterConfig = {
    server,
    database,
    options: {
      encrypt: false, // Default off for local dev
      trustServerCertificate,
    },
  };

  if (port) {
    config.port = port;
  }

  if (integratedSecurity) {
    // Windows Authentication using NTLM
    // This requires the tedious driver to use NTLM authentication type
    config.authentication = {
      type: 'ntlm',
      options: {
        userName: params['user id'] || params['uid'] || params['user'] || '',
        password: params['password'] || params['pwd'] || '',
        domain: params['domain'] || '',
      },
    };
  } else {
    // SQL Server Authentication
    config.user = params['user id'] || params['uid'] || params['user'];
    config.password = params['password'] || params['pwd'];
  }

  return config;
}

// ============================================================================
// ENVIRONMENT CONFIG HELPERS
// ============================================================================

/**
 * Gets MSSQL configuration from structured environment variables.
 * These are typically injected by Aspire's WithReference() when referencing
 * an external MSSQL resource.
 *
 * Checks for env vars in format: {RESOURCENAME}_{PROPERTY}
 * Since resource is typically named "mssql", looks for:
 *   - MSSQL_SERVER
 *   - MSSQL_PORT
 *   - MSSQL_DATABASE
 *   - MSSQL_INTEGRATED_SECURITY
 *   - MSSQL_TRUST_SERVER_CERTIFICATE
 *   - MSSQL_USER (optional)
 *   - MSSQL_PASSWORD (optional)
 *
 * @param resourceName - The resource name prefix (default: 'MSSQL')
 * @returns MssqlAdapterConfig or null if required vars not set
 */
export function getMssqlConfigFromEnv(resourceName = 'MSSQL'): MssqlAdapterConfig | null {
  const prefix = resourceName.toUpperCase();
  let server = Deno.env.get(`${prefix}_SERVER`);
  const database = Deno.env.get(`${prefix}_DATABASE`);

  if (!server || !database) {
    return null;
  }

  // Handle server,port format (e.g., "localhost,1433" or "PC0134,63348")
  let port = Deno.env.get(`${prefix}_PORT`);
  if (server.includes(',')) {
    const [serverPart, portPart] = server.split(',');
    server = serverPart;
    if (!port && portPart) {
      port = portPart;
    }
  }

  const integratedSecurity =
    Deno.env.get(`${prefix}_INTEGRATED_SECURITY`)?.toLowerCase() === 'true';
  const trustServerCertificate =
    Deno.env.get(`${prefix}_TRUST_SERVER_CERTIFICATE`)?.toLowerCase() === 'true';
  const user = Deno.env.get(`${prefix}_USER`);
  const password = Deno.env.get(`${prefix}_PASSWORD`);

  const config: MssqlAdapterConfig = {
    server,
    database,
    options: {
      encrypt: false,
      trustServerCertificate,
    },
  };

  if (port) {
    config.port = parseInt(port, 10);
  }

  if (integratedSecurity) {
    // Windows Authentication using NTLM
    // This requires the tedious driver to use NTLM authentication type
    // Note: This only works on Windows
    config.authentication = {
      type: 'ntlm',
      options: {
        // For Windows Auth, we use the current Windows user
        // userName and domain can be omitted to use current logged-in user
        userName: user || '',
        password: password || '',
        domain: Deno.env.get(`${prefix}_DOMAIN`) || '',
      },
    };
  } else if (user) {
    // SQL Server Authentication
    config.user = user;
    config.password = password;
  }

  return config;
}

/**
 * Gets MSSQL adapter configuration from environment.
 * Prefers structured env vars (MSSQL_SERVER, etc.) but falls back to
 * parsing ADO.NET connection string from the specified env var.
 *
 * @param connectionStringEnvVar - Name of env var containing ADO.NET connection string (default: 'MSSQLDB_URI')
 * @returns MssqlAdapterConfig
 * @throws Error if no configuration is found
 *
 * @example
 * ```typescript
 * // With structured env vars:
 * // MSSQL_SERVER=localhost, MSSQL_PORT=1433, MSSQL_DATABASE=mydb
 * const config = getMssqlConfig();
 *
 * // Or with connection string:
 * // MSSQLDB_URI=Server=localhost,1433;Database=mydb;...
 * const config = getMssqlConfig('MSSQLDB_URI');
 * ```
 */
export function getMssqlConfig(connectionStringEnvVar = 'MSSQLDB_URI'): MssqlAdapterConfig {
  // Try structured env vars first
  const structuredConfig = getMssqlConfigFromEnv();
  if (structuredConfig) {
    return structuredConfig;
  }

  // Fall back to parsing ADO.NET connection string
  const connectionString = Deno.env.get(connectionStringEnvVar);
  if (!connectionString) {
    throw new Error(
      'SQL Server configuration not found. ' +
        `Ensure either MSSQL_SERVER/MSSQL_DATABASE or ${connectionStringEnvVar} environment variables are set.`,
    );
  }

  const parsedConfig = parseAdoNetConnectionString(connectionString);
  return parsedConfig;
}

/**
 * SQL Server isolation levels (includes Snapshot)
 */
export type MssqlIsolationLevel = IsolationLevel | 'Snapshot';

/**
 * SQL Server Adapter
 *
 * Creates and manages SQL Server connections using Prisma's MSSQL driver adapter.
 * Uses config object format required by @prisma/adapter-mssql.
 *
 * @example
 * ```typescript
 * import { MssqlAdapter, getMssqlConfig } from '@netscript/database/adapters';
 * import { PrismaClient } from './generated/client';
 *
 * // Using structured options
 * const adapter = new MssqlAdapter({
 *   host: 'localhost',
 *   port: 1433,
 *   database: 'mydb',
 *   username: 'sa',
 *   password: 'MyPass123',
 * });
 *
 * // Or using environment config
 * const config = getMssqlConfig();
 * const adapter = new PrismaMssql(config);
 *
 * const client = new PrismaClient({ adapter: adapter.getDriverAdapter() });
 * ```
 */
export class MssqlAdapter<
  TClient extends {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRaw: unknown;
    $executeRaw: unknown;
    $executeRawUnsafe: unknown;
  },
> implements DatabaseAdapter<TClient> {
  /** Database provider identity for status reporting. */
  readonly provider = 'mssql' as const;

  private client: TClient | null = null;
  private driverAdapter: MssqlDriverAdapter | null = null;
  private readonly options: MssqlConnectionOptions;
  private lastConnected?: Date;

  /**
   * Create a SQL Server adapter from connection options.
   *
   * @param options - SQL Server connection options.
   */
  constructor(options: MssqlConnectionOptions) {
    this.options = options;
  }

  /**
   * Get the Prisma driver adapter for use in client initialization
   * Uses config object format required by @prisma/adapter-mssql
   */
  getDriverAdapter(): MssqlDriverAdapter {
    if (!this.driverAdapter) {
      const config = this.buildAdapterConfig();
      this.driverAdapter = new PrismaMssql(config) as MssqlDriverAdapter;
    }
    return this.driverAdapter;
  }

  /**
   * Build config object for @prisma/adapter-mssql
   */
  private buildAdapterConfig(): MssqlAdapterConfig {
    // If connection string is provided, parse it
    if (this.options.connectionString) {
      return parseAdoNetConnectionString(this.options.connectionString);
    }

    const {
      host,
      port,
      database,
      username,
      password,
      trustServerCertificate,
      encrypt,
      integratedSecurity,
    } = this.options;

    if (!host || !database) {
      throw new Error('SQL Server connection requires host and database');
    }

    const config: MssqlAdapterConfig = {
      server: host,
      database,
      options: {
        encrypt: encrypt ?? false,
        trustServerCertificate: trustServerCertificate ?? false,
      },
    };

    if (port) {
      config.port = port;
    }

    if (integratedSecurity || (!username && !password)) {
      config.authentication = {
        type: 'ntlm',
        options: {
          userName: username,
          password,
        },
      };
    } else {
      config.user = username;
      config.password = password;
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
        'SQL Server client not initialized. Call setClient() with your PrismaClient instance.',
      );
    }
    return this.client;
  }

  /** Open the configured Prisma client connection. */
  async connect(): Promise<void> {
    if (!this.client) {
      throw new Error('SQL Server client not set. Call setClient() first.');
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
}

/**
 * Create a SQL Server adapter
 */
export function createMssqlAdapter<
  TClient extends {
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $queryRaw: unknown;
    $executeRaw: unknown;
    $executeRawUnsafe: unknown;
  },
>(options: MssqlConnectionOptions): MssqlAdapter<TClient> {
  return new MssqlAdapter<TClient>(options);
}
