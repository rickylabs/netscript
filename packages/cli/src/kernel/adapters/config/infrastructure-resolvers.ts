import {
  CACHE_DEFAULT_PORT,
  CACHE_PROVIDERS,
  DB_DEFAULT_PORTS,
  DB_PASSWORD_ENV_VARS,
  DB_PROVIDERS,
} from '../../constants/providers.ts';
import type { CacheConfig, DatabaseConfig } from '../../domain/infrastructure-config.ts';
import { findAspireContainer, inspectDockerContainer } from './infrastructure-docker.ts';
import {
  buildCacheUri,
  buildDatabaseUri,
  inferDbProvider,
  parseCacheConnectionString,
  type ParsedDbConnection,
  parseMssqlConnectionString,
  parseMysqlConnectionString,
  parsePostgresConnectionString,
} from './infrastructure-connection-strings.ts';

// ============================================================================
// DATABASE DETECTION
// ============================================================================

/**
 * Resolve a single database configuration from all available sources.
 *
 * @param name - Logical database name (e.g., "netscript", "mdb")
 * @param providerHint - Provider from appsettings.json (optional)
 * @param connectionStrings - Raw connection strings from appsettings
 */
export async function resolveDatabase(
  name: string,
  providerHint: string | undefined,
  connectionStrings: Record<string, string>,
  databaseName?: string,
): Promise<DatabaseConfig> {
  // 1. Connection string from environment (injected by Aspire or --env-file)
  //
  // Check multiple env var formats in priority order:
  //   a. Aspire-style:    ConnectionStrings__postgres
  //   b. Screaming snake: CONNECTION_STRING_POSTGRES
  //   c. DatabaseName URI: POSTGRESDB_URI  (databaseName + "DB_URI")
  //   d. Provider URI:     POSTGRES_URI    (provider + "_URI")
  //   e. Generic:          DATABASE_URL    (Prisma / common convention)
  //
  // .env.local typically sets POSTGRESDB_URI and POSTGRES_HOST/PORT via Aspire,
  // NOT ConnectionStrings__postgres.
  const earlyProvider = providerHint?.toLowerCase() ?? Deno.env.get('DB_PROVIDER')?.toLowerCase() ??
    undefined;
  const dbNameUpper = databaseName?.toUpperCase();
  const providerUpper = earlyProvider?.toUpperCase();

  const envConnStr = Deno.env.get(`ConnectionStrings__${name}`) ??
    Deno.env.get(`CONNECTION_STRING_${name.toUpperCase()}`) ??
    (dbNameUpper ? Deno.env.get(`${dbNameUpper}_URI`) : undefined) ??
    (providerUpper ? Deno.env.get(`${providerUpper}DB_URI`) : undefined) ??
    (providerUpper ? Deno.env.get(`${providerUpper}_URI`) : undefined) ??
    Deno.env.get('DATABASE_URL');

  const rawConnStr = envConnStr ?? connectionStrings[name];

  if (rawConnStr) {
    const provider = providerHint?.toLowerCase() ?? inferDbProvider(rawConnStr);
    let parsed: ParsedDbConnection;

    if (provider === DB_PROVIDERS.MYSQL) {
      parsed = parseMysqlConnectionString(rawConnStr);
    } else if (provider === DB_PROVIDERS.MSSQL || provider === DB_PROVIDERS.SQLSERVER) {
      parsed = parseMssqlConnectionString(rawConnStr);
    } else {
      parsed = parsePostgresConnectionString(rawConnStr);
    }

    return {
      name,
      provider: provider as DatabaseConfig['provider'],
      mode: 'external',
      connectionString: buildDatabaseUri(parsed),
      databaseName,
    };
  }

  // 2. Docker container inferion (Aspire-managed)
  const provider = providerHint?.toLowerCase() ?? DB_PROVIDERS.POSTGRES;
  const containerBaseName = name === 'netscript' ? 'postgres' : name;
  const containerPort = DB_DEFAULT_PORTS[provider] ?? 5432;
  const passwordEnvVar = DB_PASSWORD_ENV_VARS[provider] ?? 'POSTGRES_PASSWORD';

  const containerName = await findAspireContainer(containerBaseName);
  if (containerName) {
    const docker = await inspectDockerContainer(containerName, containerPort, passwordEnvVar);
    if (docker) {
      const parsed: ParsedDbConnection = {
        provider,
        host: '127.0.0.1',
        port: docker.hostPort,
        database: databaseName ?? 'postgresdb',
        user: provider === DB_PROVIDERS.MYSQL ? 'root' : 'postgres',
        password: docker.password ?? '',
      };
      return {
        name,
        provider: provider as DatabaseConfig['provider'],
        mode: 'container',
        connectionString: buildDatabaseUri(parsed),
        databaseName,
      };
    }
  }

  // 3. Hardcoded defaults (localhost + standard port, no password)
  const defaultPort = DB_DEFAULT_PORTS[provider] ?? 5432;
  const defaultUser = provider === DB_PROVIDERS.MYSQL ? 'root' : 'postgres';
  const parsed: ParsedDbConnection = {
    provider,
    host: 'localhost',
    port: defaultPort,
    database: databaseName ?? 'postgres',
    user: defaultUser,
    password: '',
  };

  return {
    name,
    provider: provider as DatabaseConfig['provider'],
    mode: 'external',
    connectionString: buildDatabaseUri(parsed),
    databaseName,
  };
}

// ============================================================================
// CACHE DETECTION
// ============================================================================

/**
 * Resolve cache configuration from all available sources.
 *
 * Detection priority:
 * 1. Explicit CACHE_PROVIDER env var (denokv | deno-kv | redis | garnet)
 * 2. Environment connection strings (ConnectionStrings__*, *_URI, *_URL)
 * 3. Docker container inferion (Aspire-managed)
 * 4. Hardcoded defaults (localhost + standard port)
 *
 * The CACHE_PROVIDER env var ensures all subsystems (CLI, KV, SDK, queue)
 * resolve the same backend consistently.
 */
export async function resolveCache(
  name: string,
  providerHint: string | undefined,
  connectionStrings: Record<string, string>,
): Promise<CacheConfig> {
  // 0. Explicit CACHE_PROVIDER takes precedence over all inferion
  const cacheProviderEnv = Deno.env.get('CACHE_PROVIDER')?.toLowerCase();
  const provider = cacheProviderEnv === 'redis' || cacheProviderEnv === 'garnet'
    ? (cacheProviderEnv === 'garnet' ? CACHE_PROVIDERS.GARNET : CACHE_PROVIDERS.REDIS)
    : (providerHint?.toLowerCase() ?? CACHE_PROVIDERS.GARNET);

  // 1. Explicit environment variable
  //
  // Cache resources may be injected under multiple aliases depending on the
  // runtime adapter and platform wiring:
  // - ConnectionStrings__garnet / ConnectionStrings__redis
  // - GARNET_URI / REDIS_URI
  // - GARNET_URL / REDIS_URL
  // - explicit CACHE_PROVIDER-driven aliases
  //
  // The active provider contract must win over heuristic fallback so shared KV,
  // queue, SDK, and app runtimes all resolve the same backend consistently.
  const nameUpper = name.toUpperCase();
  const providerUpper = provider.toUpperCase();
  const envConnStr = Deno.env.get(`ConnectionStrings__${name}`) ??
    Deno.env.get(`${nameUpper}_CONNECTION_STRING`) ??
    Deno.env.get(`${nameUpper}_URI`) ??
    Deno.env.get(`${nameUpper}_URL`) ??
    (providerUpper !== nameUpper ? Deno.env.get(`${providerUpper}_URI`) : undefined) ??
    (providerUpper !== nameUpper ? Deno.env.get(`${providerUpper}_URL`) : undefined);

  const rawConnStr = envConnStr ?? connectionStrings[name];

  if (rawConnStr) {
    const parsed = parseCacheConnectionString(rawConnStr, provider);
    return {
      name,
      provider: provider as CacheConfig['provider'],
      mode: 'external',
      host: parsed.host,
      port: parsed.port,
      password: parsed.password,
      connectionString: buildCacheUri(parsed.host, parsed.port, parsed.password, provider),
    };
  }

  // 2. Docker container inferion
  const containerName = await findAspireContainer(name);
  if (containerName) {
    const docker = await inspectDockerContainer(
      containerName,
      CACHE_DEFAULT_PORT,
      `${name.toUpperCase()}_PASSWORD`,
    );
    if (docker) {
      return {
        name,
        provider: provider as CacheConfig['provider'],
        mode: 'container',
        host: '127.0.0.1',
        port: docker.hostPort,
        password: docker.password,
        connectionString: buildCacheUri('127.0.0.1', docker.hostPort, docker.password, provider),
      };
    }
  }

  // 3. Defaults
  const defaultHost = provider === CACHE_PROVIDERS.GARNET ? '127.0.0.1' : 'localhost';
  return {
    name,
    provider: provider as CacheConfig['provider'],
    mode: 'external',
    host: defaultHost,
    port: CACHE_DEFAULT_PORT,
    connectionString: buildCacheUri(defaultHost, CACHE_DEFAULT_PORT, undefined, provider),
  };
}
