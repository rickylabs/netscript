/**
 * Aspire-managed data connection discovery.
 *
 * @module
 */

import { getServiceUrl } from './service-url.ts';

/**
 * PostgreSQL connection details discovered from Aspire-managed environment variables.
 */
export interface PostgresConnectionInfo {
  /** Database name. */
  database?: string;
  /** Hostname or IP address. */
  host?: string;
  /** Port number. */
  port?: number;
  /** Username for authentication. */
  username?: string;
  /** Password for authentication. */
  password?: string;
  /** Full connection URI. */
  uri?: string;
  /** JDBC connection string. */
  jdbcConnectionString?: string;
}

/**
 * SQL Server connection details discovered from Aspire-managed environment variables.
 */
export interface MssqlConnectionInfo {
  /** Database name. */
  database?: string;
  /** Hostname or IP address. */
  host?: string;
  /** Port number. */
  port?: number;
  /** Instance name for named instances. */
  instanceName?: string;
  /** Username for authentication. */
  username?: string;
  /** Password for authentication. */
  password?: string;
  /** Full connection URI. */
  uri?: string;
  /** Whether local development should trust the server certificate. */
  trustServerCertificate?: boolean;
  /** Whether the connection should be encrypted. */
  encrypt?: boolean;
}

/**
 * MySQL connection details discovered from Aspire-managed environment variables.
 */
export interface MysqlConnectionInfo {
  /** Database name. */
  database?: string;
  /** Hostname or IP address. */
  host?: string;
  /** Port number. */
  port?: number;
  /** Username for authentication. */
  username?: string;
  /** Password for authentication. */
  password?: string;
  /** Full connection URI. */
  uri?: string;
  /** Whether SSL/TLS is enabled. */
  ssl?: boolean;
}

/**
 * Get KV connection from SQLite or remote Deno KV environment variables.
 */
export function getKvConnection(kvName = 'kv'): string | undefined {
  const sqlitePath = getSqliteCacheConnection(kvName);
  if (sqlitePath) {
    return sqlitePath;
  }

  try {
    return getServiceUrl(kvName, 'http');
  } catch {
    return undefined;
  }
}

/**
 * Get PostgreSQL connection settings from environment variables.
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

  if (!database && !host && !uri) {
    return undefined;
  }

  return {
    database,
    host,
    port: portStr ? parseInt(portStr, 10) : undefined,
    username,
    password,
    uri,
    jdbcConnectionString,
  };
}

/**
 * Get PostgreSQL connection URI.
 */
export function getPostgresUri(dbName = 'postgresdb'): string | undefined {
  const info = getPostgresConnection(dbName);

  if (!info) {
    return undefined;
  }

  if (info.uri) {
    return info.uri;
  }

  if (info.host && info.port && info.username && info.password && info.database) {
    return `postgresql://${info.username}:${info.password}@${info.host}:${info.port}/${info.database}`;
  }

  throw new Error(
    `PostgreSQL database "${dbName}" is configured but connection URI cannot be determined. ` +
      `Missing required properties (host, port, username, password, or database).`,
  );
}

/**
 * Get SQL Server connection settings from environment variables.
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

  if (!database && !host && !uri) {
    return undefined;
  }

  return {
    database,
    host,
    port: portStr ? parseInt(portStr, 10) : 1433,
    instanceName,
    username,
    password,
    uri,
    trustServerCertificate: trustCertStr?.toLowerCase() === 'true',
    encrypt: encryptStr?.toLowerCase() !== 'false',
  };
}

/**
 * Get SQL Server connection URI.
 */
export function getMssqlUri(dbName = 'mssqldb'): string | undefined {
  const info = getMssqlConnection(dbName);

  if (!info) {
    return undefined;
  }

  if (info.uri) {
    return info.uri;
  }

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
 * Get MySQL connection settings from environment variables.
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

  if (!database && !host && !uri) {
    return undefined;
  }

  return {
    database,
    host,
    port: portStr ? parseInt(portStr, 10) : 3306,
    username,
    password,
    uri,
    ssl: sslStr?.toLowerCase() === 'true',
  };
}

/**
 * Get MySQL connection URI.
 */
export function getMysqlUri(dbName = 'mysqldb'): string | undefined {
  const info = getMysqlConnection(dbName);

  if (!info) {
    return undefined;
  }

  if (info.uri) {
    return info.uri;
  }

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

function getSqliteCacheConnection(kvName = 'kv'): string | undefined {
  const envKey = `ConnectionStrings__${kvName}`;
  const connectionString = Deno.env.get(envKey);

  if (!connectionString) {
    return undefined;
  }

  const match = connectionString.match(/Data Source=([^;]+)/i);
  return match?.[1];
}
