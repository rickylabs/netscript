/**
 * @module types/infrastructure
 * Database, cache, and infrastructure configuration types for deployment.
 */

import type { CacheProvider, DbProvider } from '../constants/providers.ts';

/**
 * How an infrastructure resource is provided.
 * - container: Aspire-managed Docker container (infered)
 * - external: External/cloud-hosted resource (connection string provided)
 */
export type ResourceMode = 'container' | 'external';

/**
 * Resolved database configuration for a single database.
 */
export interface DatabaseConfig {
  /** Logical name (e.g., "netscript", "mdb") */
  name: string;
  /** Database engine (postgres, mysql, mssql) */
  provider: DbProvider;
  /** How the resource is hosted */
  mode: ResourceMode;
  /** Fully-resolved connection URI */
  connectionString: string;
  /** Optional JDBC-style connection string for Java interop */
  jdbcConnectionString?: string;
  /**
   * Actual database name used as env var prefix by @netscript/sdk.
   * Aspire injects <DATABASENAME>_URI, <DATABASENAME>_HOST, etc.
   * e.g. appsettings DatabaseName "postgresdb" → POSTGRESDB_URI
   */
  databaseName?: string;
}

/**
 * Resolved cache configuration.
 */
export interface CacheConfig {
  /** Logical name (e.g., "garnet", "redis") */
  name: string;
  /** Cache engine */
  provider: CacheProvider;
  /** How the resource is hosted */
  mode: ResourceMode;
  /** Hostname or IP */
  host: string;
  /** Port number */
  port: number;
  /** Optional password */
  password?: string;
  /** Full connection URI */
  connectionString: string;
}

/**
 * Raw Docker container info extracted from `docker inspect`.
 */
export interface DockerContainerInfo {
  /** Mapped host port */
  hostPort: number;
  /** Password extracted from container environment */
  password?: string;
}

/**
 * Aggregated infrastructure configuration for a deployment.
 * Contains the primary DB/cache plus any additional databases.
 */
export interface InfrastructureConfig {
  /** Primary database (used by all services unless overridden) */
  database: DatabaseConfig;
  /** Primary cache (used by workers, sagas, triggers) */
  cache: CacheConfig;
  /** Additional databases keyed by logical name (e.g., "mdb", "prosco") */
  additionalDatabases: Record<string, DatabaseConfig>;
  /** OTLP/gRPC telemetry endpoint */
  otlpEndpoint: string;
}
