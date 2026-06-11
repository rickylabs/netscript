/**
 * Service Discovery
 *
 * Aspire service discovery via environment variables.
 * Pattern: services__{serviceName}__{protocol}__{index}
 *
 * @example
 * ```ts
 * const usersApiUrl = getServiceUrl('users-api', 'http');
 * console.log(usersApiUrl); // http://localhost:3000
 *
 * const kvUrl = getDenoKvConnection('kv');
 * const kv = await Deno.openKv(kvUrl);
 * ```
 */

/**
 * Supported protocols for Aspire service discovery endpoints.
 */
export type ServiceProtocol = 'http' | 'https';

// ---------------------------------------------------------------------------
// Browser service URL lookup
// ---------------------------------------------------------------------------
//
// Aspire's `WithConfiguredViteHttpReferences` injects two env vars per
// service reference into the process:
//
//   1. `VITE_services__{name}__http__0` — isomorphic full format, mirrors
//      the server-side `services__{name}__http__0` exactly (no uppercasing).
//   2. `VITE_{NORMALISED}_URL`          — convenient shorthand.
//
// Vite natively exposes every `VITE_`-prefixed process env var as
// `import.meta.env.VITE_*` — no custom plugin logic required.

/**
 * Read a service URL from the browser environment.
 *
 * Checks the isomorphic full format first (`VITE_services__{name}__http__0`),
 * then falls back to the shorthand (`VITE_{NORMALISED}_URL`).
 */
function getBrowserServiceUrl(
  serviceName: string,
  protocol: string = 'http',
  index: number = 0,
): string | undefined {
  try {
    // deno-lint-ignore no-explicit-any
    const env = (import.meta as any).env;
    if (!env) return undefined;

    // 1. Isomorphic full format (exact same key pattern as server, prefixed)
    const fullKey = `VITE_services__${serviceName}__${protocol}__${index}`;
    const fullUrl = env[fullKey] as string | undefined;
    if (fullUrl) return fullUrl;

    // 2. Shorthand: VITE_{NORMALISED}_URL
    const shortKey = `VITE_${serviceName.toUpperCase().replace(/-/g, '_')}_URL`;
    return env[shortKey] as string | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolved service endpoint metadata discovered from Aspire environment
 * variables.
 */
export interface ServiceInfo {
  /** Service name */
  name: string;
  /** HTTP endpoint URL (if configured) */
  http?: string;
  /** HTTPS endpoint URL (if configured) */
  https?: string;
}

/**
 * PostgreSQL connection details discovered from Aspire-managed environment
 * variables.
 */
export interface PostgresConnectionInfo {
  /** Database name */
  database?: string;
  /** Hostname or IP address */
  host?: string;
  /** Port number */
  port?: number;
  /** Username for authentication */
  username?: string;
  /** Password for authentication */
  password?: string;
  /** Full connection URI (postgresql://) */
  uri?: string;
  /** JDBC connection string */
  jdbcConnectionString?: string;
}

/**
 * SQL Server connection details discovered from Aspire-managed environment
 * variables.
 */
export interface MssqlConnectionInfo {
  /** Database name */
  database?: string;
  /** Hostname or IP address */
  host?: string;
  /** Port number */
  port?: number;
  /** Instance name (for named instances) */
  instanceName?: string;
  /** Username for authentication */
  username?: string;
  /** Password for authentication */
  password?: string;
  /** Full connection URI (sqlserver://) */
  uri?: string;
  /** Trust server certificate (for local development) */
  trustServerCertificate?: boolean;
  /** Encrypt connection */
  encrypt?: boolean;
}

/**
 * MySQL connection details discovered from Aspire-managed environment
 * variables.
 */
export interface MysqlConnectionInfo {
  /** Database name */
  database?: string;
  /** Hostname or IP address */
  host?: string;
  /** Port number */
  port?: number;
  /** Username for authentication */
  username?: string;
  /** Password for authentication */
  password?: string;
  /** Full connection URI (mysql://) */
  uri?: string;
  /** Enable SSL/TLS connection */
  ssl?: boolean;
}

/**
 * Get KV connection (SQLite file path or remote Deno KV URL) from environment variables.
 *
 * Automatically detects and returns the correct connection type:
 * - SQLite: Returns file path from `ConnectionStrings__{kvName}`
 * - Remote Deno KV: Returns URL from `services__{kvName}__http__0`
 *
 * Deno's `openKv()` works with both file paths and remote URLs.
 * For remote KV, it automatically uses `DENO_KV_ACCESS_TOKEN` env var.
 *
 * @param kvName - KV resource name (default: 'kv')
 * @returns KV connection (file path or URL) or undefined
 *
 * @example
 * ```ts
 * // Works with both SQLite and remote Deno KV
 * const kv = await Deno.openKv(getKvConnection('kv'));
 * ```
 */
export function getKvConnection(kvName = 'kv'): string | undefined {
  // Try SQLite connection string first (dev mode)
  const sqlitePath = getSqliteCacheConnection(kvName);
  if (sqlitePath) {
    return sqlitePath;
  }

  // Try remote Deno KV URL (prod mode)
  try {
    return getServiceUrl(kvName, 'http');
  } catch {
    return undefined;
  }
}

/**
 * Get PostgreSQL connection settings from environment variables
 *
 * Aspire sets PostgreSQL connection properties in format:
 * `{DBNAME}_DATABASE`, `{DBNAME}_HOST`, `{DBNAME}_PORT`, etc.
 *
 * @param dbName - Database resource name (default: 'postgresdb')
 * @returns PostgreSQL connection info or undefined if not configured
 *
 * @example
 * ```ts
 * const pgConfig = getPostgresConnection('postgresdb');
 * console.log(pgConfig?.uri); // postgresql://user:pass@localhost:5432/mydb
 * console.log(pgConfig?.host); // localhost
 * console.log(pgConfig?.port); // 5432
 * ```
 */
export function getPostgresConnection(dbName = 'postgresdb'): PostgresConnectionInfo | undefined {
  const prefix = dbName.toUpperCase();

  const database = Deno.env.get(`${prefix}_DATABASE`);
  const host = Deno.env.get(`${prefix}_HOST`);
  const portStr = Deno.env.get(`${prefix}_PORT`);
  const username = Deno.env.get(`${prefix}_USERNAME`);
  const password = Deno.env.get(`${prefix}_PASSWORD`);
  const uri = Deno.env.get(`${prefix}_URI`);
  const jdbcConnectionString = Deno.env.get(`${prefix}_JDBCCONNECTIONSTRING`);

  // If no properties are set, database is not configured
  if (!database && !host && !uri) {
    return undefined;
  }

  const info: PostgresConnectionInfo = {
    database,
    host,
    port: portStr ? parseInt(portStr, 10) : undefined,
    username,
    password,
    uri,
    jdbcConnectionString,
  };

  return info;
}

/**
 * Get PostgreSQL connection URI
 *
 * Returns the full connection URI for connecting to PostgreSQL.
 * Falls back to constructing URI from individual properties if not provided.
 *
 * @param dbName - Database resource name (default: 'postgresdb')
 * @returns Connection URI or undefined if not configured
 * @throws {Error} If database is configured but URI cannot be determined
 *
 * @example
 * ```ts
 * const uri = getPostgresUri('postgresdb');
 * console.log(uri); // postgresql://user:pass@localhost:5432/mydb
 * ```
 */
export function getPostgresUri(dbName = 'postgresdb'): string | undefined {
  const info = getPostgresConnection(dbName);

  if (!info) {
    return undefined;
  }

  // Use provided URI if available
  if (info.uri) {
    return info.uri;
  }

  // Construct URI from individual properties
  if (info.host && info.port && info.username && info.password && info.database) {
    return `postgresql://${info.username}:${info.password}@${info.host}:${info.port}/${info.database}`;
  }

  throw new Error(
    `PostgreSQL database "${dbName}" is configured but connection URI cannot be determined. ` +
      `Missing required properties (host, port, username, password, or database).`,
  );
}

/**
 * Get SQL Server (MSSQL) connection settings from environment variables
 *
 * Aspire sets SQL Server connection properties in format:
 * `{DBNAME}_DATABASE`, `{DBNAME}_HOST`, `{DBNAME}_PORT`, etc.
 *
 * @param dbName - Database resource name (default: 'mssqldb')
 * @returns MSSQL connection info or undefined if not configured
 *
 * @example
 * ```ts
 * const mssqlConfig = getMssqlConnection('mssqldb');
 * console.log(mssqlConfig?.uri); // sqlserver://localhost:1433;Database=mydb;...
 * console.log(mssqlConfig?.host); // localhost
 * console.log(mssqlConfig?.port); // 1433
 * ```
 */
export function getMssqlConnection(dbName = 'mssqldb'): MssqlConnectionInfo | undefined {
  const prefix = dbName.toUpperCase();

  const database = Deno.env.get(`${prefix}_DATABASE`);
  const host = Deno.env.get(`${prefix}_HOST`);
  const portStr = Deno.env.get(`${prefix}_PORT`);
  const instanceName = Deno.env.get(`${prefix}_INSTANCENAME`);
  const username = Deno.env.get(`${prefix}_USERNAME`);
  const password = Deno.env.get(`${prefix}_PASSWORD`);
  const uri = Deno.env.get(`${prefix}_URI`);
  const trustCertStr = Deno.env.get(`${prefix}_TRUSTSERVERCERTIFICATE`);
  const encryptStr = Deno.env.get(`${prefix}_ENCRYPT`);

  // If no properties are set, database is not configured
  if (!database && !host && !uri) {
    return undefined;
  }

  const info: MssqlConnectionInfo = {
    database,
    host,
    port: portStr ? parseInt(portStr, 10) : 1433,
    instanceName,
    username,
    password,
    uri,
    trustServerCertificate: trustCertStr?.toLowerCase() === 'true',
    encrypt: encryptStr?.toLowerCase() !== 'false', // Default to true
  };

  return info;
}

/**
 * Get SQL Server (MSSQL) connection URI
 *
 * Returns the full connection URI for connecting to SQL Server.
 * Falls back to constructing URI from individual properties if not provided.
 *
 * @param dbName - Database resource name (default: 'mssqldb')
 * @returns Connection URI or undefined if not configured
 * @throws {Error} If database is configured but URI cannot be determined
 *
 * @example
 * ```ts
 * const uri = getMssqlUri('mssqldb');
 * console.log(uri); // sqlserver://localhost:1433;Database=mydb;User Id=sa;...
 * ```
 */
export function getMssqlUri(dbName = 'mssqldb'): string | undefined {
  const info = getMssqlConnection(dbName);

  if (!info) {
    return undefined;
  }

  // Use provided URI if available
  if (info.uri) {
    return info.uri;
  }

  // Construct URI from individual properties
  if (info.host && info.database) {
    const port = info.port || 1433;
    const server = info.instanceName
      ? `${info.host}\\${info.instanceName}`
      : `${info.host}:${port}`;
    const params: string[] = [`Database=${info.database}`];

    if (info.username) {
      params.push(`User Id=${info.username}`);
      if (info.password) {
        params.push(`Password=${info.password}`);
      }
    }

    // Security settings (default for local dev)
    if (info.trustServerCertificate !== false) {
      params.push('TrustServerCertificate=true');
    }
    if (info.encrypt === false) {
      params.push('Encrypt=false');
    }

    return `sqlserver://${server};${params.join(';')}`;
  }

  throw new Error(
    `SQL Server database "${dbName}" is configured but connection URI cannot be determined. ` +
      `Missing required properties (host or database).`,
  );
}

/**
 * Get MySQL connection settings from environment variables
 *
 * Aspire sets MySQL connection properties in format:
 * `{DBNAME}_DATABASE`, `{DBNAME}_HOST`, `{DBNAME}_PORT`, etc.
 *
 * @param dbName - Database resource name (default: 'mysqldb')
 * @returns MySQL connection info or undefined if not configured
 *
 * @example
 * ```ts
 * const mysqlConfig = getMysqlConnection('mysqldb');
 * console.log(mysqlConfig?.uri); // mysql://user:pass@localhost:3306/mydb
 * console.log(mysqlConfig?.host); // localhost
 * console.log(mysqlConfig?.port); // 3306
 * ```
 */
export function getMysqlConnection(dbName = 'mysqldb'): MysqlConnectionInfo | undefined {
  const prefix = dbName.toUpperCase();

  const database = Deno.env.get(`${prefix}_DATABASE`);
  const host = Deno.env.get(`${prefix}_HOST`);
  const portStr = Deno.env.get(`${prefix}_PORT`);
  const username = Deno.env.get(`${prefix}_USERNAME`);
  const password = Deno.env.get(`${prefix}_PASSWORD`);
  const uri = Deno.env.get(`${prefix}_URI`);
  const sslStr = Deno.env.get(`${prefix}_SSL`);

  // If no properties are set, database is not configured
  if (!database && !host && !uri) {
    return undefined;
  }

  const info: MysqlConnectionInfo = {
    database,
    host,
    port: portStr ? parseInt(portStr, 10) : 3306,
    username,
    password,
    uri,
    ssl: sslStr?.toLowerCase() === 'true',
  };

  return info;
}

/**
 * Get MySQL connection URI
 *
 * Returns the full connection URI for connecting to MySQL.
 * Falls back to constructing URI from individual properties if not provided.
 *
 * @param dbName - Database resource name (default: 'mysqldb')
 * @returns Connection URI or undefined if not configured
 * @throws {Error} If database is configured but URI cannot be determined
 *
 * @example
 * ```ts
 * const uri = getMysqlUri('mysqldb');
 * console.log(uri); // mysql://user:pass@localhost:3306/mydb
 * ```
 */
export function getMysqlUri(dbName = 'mysqldb'): string | undefined {
  const info = getMysqlConnection(dbName);

  if (!info) {
    return undefined;
  }

  // Use provided URI if available
  if (info.uri) {
    return info.uri;
  }

  // Construct URI from individual properties
  if (info.host && info.database) {
    const port = info.port || 3306;
    const userInfo = info.username
      ? (info.password ? `${info.username}:${info.password}@` : `${info.username}@`)
      : '';
    const sslParam = info.ssl ? '?ssl=true' : '';

    return `mysql://${userInfo}${info.host}:${port}/${info.database}${sslParam}`;
  }

  throw new Error(
    `MySQL database "${dbName}" is configured but connection URI cannot be determined. ` +
      `Missing required properties (host or database).`,
  );
}

/**
 * Get SQLite connection file path from environment variables.
 *
 * @param kvName - KV resource name (default: 'kv')
 * @returns SQLite file path or undefined
 */
function getSqliteCacheConnection(kvName = 'kv'): string | undefined {
  const envKey = `ConnectionStrings__${kvName}`;
  const connectionString = Deno.env.get(envKey);

  if (!connectionString) {
    return undefined;
  }

  // Parse "Data Source=C:\path\to\cache.db;Cache=Shared;..."
  const match = connectionString.match(/Data Source=([^;]+)/i);
  if (!match) {
    return undefined;
  }

  return match[1];
}

/**
 * Get service URL from Aspire environment variables
 *
 * Aspire sets environment variables in format:
 * `services__{serviceName}__{protocol}__{index}`
 *
 * @param serviceName - Service name (from netscript.config.ts)
 * @param protocol - Protocol (http or https)
 * @param index - Endpoint index (default: 0)
 * @returns Service URL
 * @throws {Error} If service URL not found
 *
 * @example
 * ```ts
 * const url = getServiceUrl('users-api', 'http');
 * console.log(url); // http://localhost:3000
 * ```
 */
export function getServiceUrl(
  serviceName: string,
  protocol: ServiceProtocol = 'http',
  index = 0,
): string {
  // Server path — read Aspire's native `services__*` env vars.
  if (typeof Deno !== 'undefined') {
    const envKey = `services__${serviceName}__${protocol}__${index}`;
    const url = Deno.env.get(envKey);

    if (!url) {
      throw new Error(
        `Service URL not found for "${serviceName}" (${protocol}). ` +
          `Expected environment variable: ${envKey}`,
      );
    }

    return url;
  }

  // Browser path — read Vite-exposed service URL.
  const url = getBrowserServiceUrl(serviceName, protocol, index);

  if (!url) {
    const fullKey = `VITE_services__${serviceName}__${protocol}__${index}`;
    const shortKey = `VITE_${serviceName.toUpperCase().replace(/-/g, '_')}_URL`;
    throw new Error(
      `Service URL not found for "${serviceName}" in the browser. ` +
        `Expected import.meta.env.${fullKey} or import.meta.env.${shortKey} ` +
        `(injected by Aspire via WithConfiguredViteHttpReferences).`,
    );
  }

  return url;
}

/**
 * Get all endpoints for a service
 *
 * Returns both HTTP and HTTPS endpoints if configured.
 *
 * @param serviceName - Service name
 * @returns Service info with all endpoints
 * @throws {Error} If no endpoints found for service
 *
 * @example
 * ```ts
 * const info = getServiceInfo('users-api');
 * console.log(info.http);  // http://localhost:3000
 * console.log(info.https); // https://localhost:3443
 * ```
 */
export function getServiceInfo(serviceName: string): ServiceInfo {
  const info: ServiceInfo = { name: serviceName };

  try {
    info.http = getServiceUrl(serviceName, 'http');
  } catch {
    // HTTP endpoint not configured
  }

  try {
    info.https = getServiceUrl(serviceName, 'https');
  } catch {
    // HTTPS endpoint not configured
  }

  if (!info.http && !info.https) {
    throw new Error(
      `No endpoints found for service "${serviceName}". ` +
        `Check Aspire configuration in dotnet/AppHost/Program.cs`,
    );
  }

  return info;
}

/**
 * Get all available services from environment
 *
 * Scans all environment variables and extracts service names.
 *
 * @returns Array of service names
 *
 * @example
 * ```ts
 * const services = getAllServices();
 * console.log(services); // ['users-api', 'orders-api', 'frontend']
 * ```
 */
export function getAllServices(): string[] {
  const services = new Set<string>();

  const entries = typeof Deno !== 'undefined' ? Deno.env.toObject() : {};

  for (const [key] of Object.entries(entries)) {
    if (key.startsWith('services__')) {
      const parts = key.split('__');
      if (parts.length >= 2) {
        services.add(parts[1]); // Service name is second segment
      }
    }
  }

  return Array.from(services).sort();
}

/**
 * Check if a service is available
 *
 * @param serviceName - Service name
 * @param protocol - Protocol to check (optional, checks both if not specified)
 * @returns True if service is available
 *
 * @example
 * ```ts
 * if (isServiceAvailable('users-api')) {
 *   const client = createNetScriptClient({ ... });
 * }
 * ```
 */
export function isServiceAvailable(
  serviceName: string,
  protocol?: ServiceProtocol,
): boolean {
  try {
    if (protocol) {
      getServiceUrl(serviceName, protocol);
      return true;
    } else {
      getServiceInfo(serviceName);
      return true;
    }
  } catch {
    return false;
  }
}
