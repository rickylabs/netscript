/**
 * @module providers
 * Database and cache provider constants for infrastructure detection.
 */

/**
 * Supported database providers.
 */
export const DB_PROVIDERS = {
  POSTGRES: 'postgres',
  POSTGRESQL: 'postgresql',
  MYSQL: 'mysql',
  MSSQL: 'mssql',
  SQLSERVER: 'sqlserver',
} as const;

export type DbProvider = (typeof DB_PROVIDERS)[keyof typeof DB_PROVIDERS];

/**
 * Supported cache providers.
 */
export const CACHE_PROVIDERS = {
  GARNET: 'garnet',
  REDIS: 'redis',
  DENOKV: 'denokv',
} as const;

export type CacheProvider = (typeof CACHE_PROVIDERS)[keyof typeof CACHE_PROVIDERS];

/**
 * Default database users per provider.
 */
export const DB_DEFAULT_USERS: Record<string, string> = {
  [DB_PROVIDERS.POSTGRES]: 'postgres',
  [DB_PROVIDERS.POSTGRESQL]: 'postgres',
  [DB_PROVIDERS.MYSQL]: 'root',
  [DB_PROVIDERS.MSSQL]: 'sa',
  [DB_PROVIDERS.SQLSERVER]: 'sa',
};

/**
 * JDBC URI scheme prefixes per database provider.
 */
export const JDBC_PROTOCOLS: Record<string, string> = {
  [DB_PROVIDERS.POSTGRES]: 'jdbc:postgresql',
  [DB_PROVIDERS.POSTGRESQL]: 'jdbc:postgresql',
  [DB_PROVIDERS.MYSQL]: 'jdbc:mysql',
  [DB_PROVIDERS.MSSQL]: 'jdbc:sqlserver',
  [DB_PROVIDERS.SQLSERVER]: 'jdbc:sqlserver',
};

/**
 * Environment variable names used to inject database passwords
 * from Aspire-managed Docker containers.
 */
export const DB_PASSWORD_ENV_VARS: Record<string, string> = {
  [DB_PROVIDERS.POSTGRES]: 'POSTGRES_PASSWORD',
  [DB_PROVIDERS.POSTGRESQL]: 'POSTGRES_PASSWORD',
  [DB_PROVIDERS.MYSQL]: 'MYSQL_ROOT_PASSWORD',
  [DB_PROVIDERS.MSSQL]: 'MSSQL_SA_PASSWORD',
  [DB_PROVIDERS.SQLSERVER]: 'MSSQL_SA_PASSWORD',
};

/**
 * Default ports for each database provider.
 */
export const DB_DEFAULT_PORTS: Record<string, number> = {
  [DB_PROVIDERS.POSTGRES]: 5432,
  [DB_PROVIDERS.POSTGRESQL]: 5432,
  [DB_PROVIDERS.MYSQL]: 3306,
  [DB_PROVIDERS.MSSQL]: 1433,
  [DB_PROVIDERS.SQLSERVER]: 1433,
};

/**
 * Default port for cache providers.
 */
export const CACHE_DEFAULT_PORT = 6379;

/**
 * Connection string URI scheme prefixes used for engine inference.
 */
export const DB_URI_PREFIXES: Record<string, string[]> = {
  [DB_PROVIDERS.POSTGRES]: ['postgres://', 'postgresql://'],
  [DB_PROVIDERS.MYSQL]: ['mysql://'],
  [DB_PROVIDERS.MSSQL]: ['mssql://', 'sqlserver://'],
};

/**
 * Cache URI scheme prefixes used for engine inference.
 */
export const CACHE_URI_PREFIXES: Record<string, string[]> = {
  [CACHE_PROVIDERS.GARNET]: ['garnet://'],
  [CACHE_PROVIDERS.REDIS]: ['redis://'],
};

/**
 * Environment variable names that contain resource mode indicators
 * (used to detect container vs external resource mode in Aspire).
 */
export const RESOURCE_MODE_ENV_VAR = 'NETSCRIPT_RESOURCE_MODE';
