/** Environment variable collection and connection-string parsing for Windows deploys. */
import { CACHE_PROVIDERS } from '../../../constants/providers.ts';
import type {
  CacheConfig,
  DatabaseConfig,
  InfrastructureConfig,
} from '../../../domain/infrastructure-config.ts';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';

// ============================================================================
// URI BUILDERS
// ============================================================================

/**
 * Build a database connection URI from a DatabaseConfig.
 * Uses the connectionString if available, otherwise constructs from parts.
 */
export function buildDatabaseUri(db: DatabaseConfig): string {
  if (db.connectionString) return db.connectionString;
  return `${db.provider}://${db.databaseName ?? 'root'}@localhost/${db.name}`;
}

/**
 * Build a JDBC-style connection string from a DatabaseConfig.
 */
export function buildJdbcUri(db: DatabaseConfig): string {
  if (db.jdbcConnectionString) return db.jdbcConnectionString;
  // Construct from connectionString if no JDBC string is available
  return db.connectionString;
}

/**
 * Build a cache connection URI from a CacheConfig.
 * Matches Aspire format: redis://:@host:port/0 (empty-password separator + db index).
 */
export function buildCacheUri(cache: CacheConfig): string {
  if (cache.connectionString) return cache.connectionString;
  return cache.password
    ? `redis://:${cache.password}@${cache.host}:${cache.port}/0`
    : `redis://:@${cache.host}:${cache.port}/0`;
}

export function collectTargetDerivedEnvVars(allTargets: CompileTarget[]): Record<string, string> {
  const env: Record<string, string> = {};

  for (const target of allTargets) {
    Object.assign(env, target.environment ?? {});

    if (target.concurrencyEnvVar && target.defaultConcurrency !== undefined) {
      env[target.concurrencyEnvVar] = String(target.defaultConcurrency);
    }
  }

  return env;
}

// ============================================================================
// COMPREHENSIVE ENV VAR COLLECTOR
// ============================================================================

/**
 * Collect the COMPLETE set of environment variables for a deployment.
 *
 * This is a SUPERSET of all service env vars. Individual services read
 * only the vars they need. The env file is the single source of truth
 * for operators to inspect and override on the target machine.
 *
 * Matches the standalone deploy-windows.ts generateEnvVars() + generateEnvFile()
 * output exactly.
 */
export function collectAllEnvVars(
  allTargets: CompileTarget[],
  infra: InfrastructureConfig,
  connectionStrings: Record<string, string>,
  options: {
    version?: string;
    installDir?: string;
    dashboardPort?: number;
    dashboardOtlpPort?: number;
    otlpEndpoint?: string;
    otlpProtocol?: string;
  },
): Record<string, string> {
  const env: Record<string, string> = {};
  const db = infra.database;
  const cache = infra.cache;
  const targetEnv = collectTargetDerivedEnvVars(allTargets);

  const dbUri = buildDatabaseUri(db);
  const jdbcUri = buildJdbcUri(db);
  const cacheUri = buildCacheUri(cache);

  const dbPrefix = db.provider.toUpperCase();
  const cachePrefix = cache.provider.toUpperCase();

  // ── Database provider identity ───────────────────────────────────────────
  // DB_PROVIDER is read by services at startup (getEngineConfig) to select
  // the correct engine config (env var names, default ports, health checks).
  // Without it, services default to 'mysql' and fail when postgres is active.
  env['DB_PROVIDER'] = db.provider;
  env['DATABASE_PROVIDER'] = db.provider;
  env['DATABASE_MODE'] = db.mode;

  // ── Provider-specific vars (MYSQL_HOST, POSTGRES_HOST, etc.) ─────────────
  const dbUser = extractUser(db.connectionString) ?? 'root';
  env[`${dbPrefix}_HOST`] = extractHost(db.connectionString) ?? 'localhost';
  env[`${dbPrefix}_PORT`] = String(extractPort(db.connectionString, db.provider));
  env[`${dbPrefix}_DATABASE`] = db.name;
  env[`${dbPrefix}_DATABASENAME`] = db.name;
  env[`${dbPrefix}_USER`] = dbUser;
  env[`${dbPrefix}_USERNAME`] = dbUser; // Aspire canonical name
  env[`${dbPrefix}_PASSWORD`] = extractPassword(db.connectionString) ?? '';
  env[`${dbPrefix}_URI`] = dbUri;
  env[`${dbPrefix}_JDBCCONNECTIONSTRING`] = jdbcUri;

  // ── Legacy ${PROVIDER}DB_* format ────────────────────────────────────────
  // Aspire injects POSTGRESDB_USERNAME (not _USER) — emit both for compat.
  env[`${dbPrefix}DB_HOST`] = env[`${dbPrefix}_HOST`];
  env[`${dbPrefix}DB_PORT`] = env[`${dbPrefix}_PORT`];
  env[`${dbPrefix}DB_DATABASE`] = db.name;
  env[`${dbPrefix}DB_DATABASENAME`] = db.name;
  env[`${dbPrefix}DB_USER`] = dbUser;
  env[`${dbPrefix}DB_USERNAME`] = dbUser; // Aspire canonical name (POSTGRESDB_USERNAME)
  env[`${dbPrefix}DB_PASSWORD`] = env[`${dbPrefix}_PASSWORD`];
  env[`${dbPrefix}DB_URI`] = dbUri;
  env[`${dbPrefix}DB_JDBCCONNECTIONSTRING`] = jdbcUri;

  // ── ConnectionStrings (Aspire-compatible) ────────────────────────────────
  env[`ConnectionStrings__${db.provider}`] = dbUri;
  env[`ConnectionStrings__${db.provider}db`] = dbUri;

  // ── Per-database URL (multi-database support) ────────────────────────────
  env[`DATABASE_${db.name.toUpperCase()}_URL`] = dbUri;

  // ── Additional databases ─────────────────────────────────────────────────
  for (const [resourceKey, additionalDb] of Object.entries(infra.additionalDatabases)) {
    const additionalUri = buildDatabaseUri(additionalDb);
    const dbNameUpper = additionalDb.name.toUpperCase();
    env[`DATABASE_${dbNameUpper}_URL`] = additionalUri;
    env[`ConnectionStrings__${resourceKey}`] = additionalUri;
  }

  // ── Cache provider identity ──────────────────────────────────────────────
  env['CACHE_PROVIDER'] = cache.provider;
  env['CACHE_MODE'] = cache.mode;

  // ── Cache provider-specific vars ─────────────────────────────────────────
  if (cache.provider === CACHE_PROVIDERS.DENOKV) {
    env['DENO_KV_PATH'] = 'data/kv';
  } else {
    env[`${cachePrefix}_HOST`] = cache.host;
    env[`${cachePrefix}_PORT`] = String(cache.port);
    env[`${cachePrefix}_SSL`] = 'false';
    env[`${cachePrefix}_DATABASE`] = '0';
    if (cache.password) {
      env[`${cachePrefix}_PASSWORD`] = cache.password;
    }
    env[`${cachePrefix}_URI`] = cacheUri;
    env[`ConnectionStrings__${cache.provider}`] = cacheUri;
    // REDIS_URI alias — queue factory detectProvider() checks this regardless of provider name
    if (cache.provider !== CACHE_PROVIDERS.REDIS) {
      env['REDIS_URI'] = cacheUri;
    }
  }

  // ── Remaining raw connection strings ─────────────────────────────────────
  for (const [name, connStr] of Object.entries(connectionStrings)) {
    const key = `ConnectionStrings__${name}`;
    if (!(key in env)) {
      env[key] = connStr;
    }
  }

  // ── OpenTelemetry ────────────────────────────────────────────────────────
  const otlpEndpoint = options.otlpEndpoint ?? infra.otlpEndpoint ?? 'http://localhost:4318';
  const otlpProtocol = options.otlpProtocol ?? 'http/protobuf';

  env['OTEL_EXPORTER_OTLP_ENDPOINT'] = otlpEndpoint;
  env['OTEL_EXPORTER_OTLP_PROTOCOL'] = otlpProtocol;
  env['OTEL_DENO'] = 'true';
  env['OTEL_TRACES_SAMPLER'] = 'always_on';
  env['OTEL_BSP_SCHEDULE_DELAY'] = '1000';
  env['OTEL_BLRP_SCHEDULE_DELAY'] = '1000';
  env['OTEL_METRIC_EXPORT_INTERVAL'] = '1000';
  env['OTEL_METRICS_EXEMPLAR_FILTER'] = 'trace_based';

  // ── Runtime ──────────────────────────────────────────────────────────────
  env['DENO_ENV'] = 'production';
  if (options.version) {
    env['NETSCRIPT_VERSION'] = options.version;
  }

  // ── Service discovery (both Aspire-style and short-form) ─────────────────
  for (const target of allTargets) {
    if (target.port) {
      env[`services__${target.name}__http__0`] = `http://localhost:${target.port}`;
      const shortKey = `${target.name.toUpperCase().replace(/-/g, '_')}_HTTP`;
      env[shortKey] = `http://localhost:${target.port}`;
    }
  }

  // ── Plugin / background processor env vars ───────────────────────────────
  Object.assign(env, targetEnv);

  // ── Runtime config directory (hot-reload overrides for jobs/sagas/triggers) ─
  // Resolved at install time by servy.ts; here we propagate whatever is set in
  // the build environment so the generated .env is valid on the target machine.
  if (options.installDir) {
    env['NETSCRIPT_RUNTIME_CONFIG_DIR'] = `${options.installDir}/config/runtime`;
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  env['ASPIRE_DASHBOARD_PORT'] = String(options.dashboardPort ?? 18888);
  env['ASPIRE_DASHBOARD_OTLP_HTTP_PORT'] = String(options.dashboardOtlpPort ?? 4318);

  // ── Servy service account (propagated from build environment) ────────────
  const envAccount = Deno.env.get('SERVY_SERVICE_ACCOUNT');
  const envPassword = Deno.env.get('SERVY_SERVICE_PASSWORD');
  if (envAccount) {
    env['SERVY_SERVICE_ACCOUNT'] = envAccount;
    if (envPassword) {
      env['SERVY_SERVICE_PASSWORD'] = envPassword;
    }
  }

  return env;
}

// ============================================================================
// CONNECTION STRING PARSING HELPERS
// ============================================================================

/**
 * Extract the host from a connection URI or ADO.NET string.
 */
export function extractHost(connectionString: string): string | undefined {
  // URI format: scheme://user:password@host:port/db
  const uriMatch = connectionString.match(/@([^:/?]+)/);
  if (uriMatch) return uriMatch[1];

  // ADO.NET format: Server=host;Port=port;...
  const serverMatch = connectionString.match(/(?:Server|Host|Data Source)\s*=\s*([^;,]+)/i);
  if (serverMatch) {
    const server = serverMatch[1].trim();
    // Handle Server=host,port format (MSSQL)
    const commaIdx = server.indexOf(',');
    return commaIdx >= 0 ? server.substring(0, commaIdx) : server;
  }

  return undefined;
}

/**
 * Extract the port from a connection URI or ADO.NET string.
 * Falls back to default port for the given provider.
 */
export function extractPort(connectionString: string, provider: string): number {
  // URI format: scheme://user:password@host:port/db
  const uriMatch = connectionString.match(/@[^:/?]+:(\d+)/);
  if (uriMatch) return parseInt(uriMatch[1], 10);

  // ADO.NET format: Port=1234
  const portMatch = connectionString.match(/(?:Port)\s*=\s*(\d+)/i);
  if (portMatch) return parseInt(portMatch[1], 10);

  // MSSQL Server=host,port format
  const mssqlMatch = connectionString.match(/(?:Server|Data Source)\s*=\s*[^,]+,(\d+)/i);
  if (mssqlMatch) return parseInt(mssqlMatch[1], 10);

  // Default ports
  const defaults: Record<string, number> = {
    postgres: 5432,
    postgresql: 5432,
    mysql: 3306,
    mssql: 1433,
    sqlserver: 1433,
  };
  return defaults[provider.toLowerCase()] ?? 5432;
}

/**
 * Extract the username from a connection URI or ADO.NET string.
 */
export function extractUser(connectionString: string): string | undefined {
  // URI format: scheme://user:password@host
  const uriMatch = connectionString.match(/:\/\/([^:@]+)/);
  if (uriMatch) return uriMatch[1];

  // ADO.NET format: User=xxx or User Id=xxx or Uid=xxx
  const userMatch = connectionString.match(/(?:User|User Id|Uid)\s*=\s*([^;]+)/i);
  if (userMatch) return userMatch[1].trim();

  return undefined;
}

/**
 * Extract the password from a connection URI or ADO.NET string.
 */
export function extractPassword(connectionString: string): string | undefined {
  // URI format: scheme://user:password@host
  const uriMatch = connectionString.match(/:\/\/[^:]+:([^@]+)@/);
  if (uriMatch) return decodeURIComponent(uriMatch[1]);

  // ADO.NET format: Password=xxx or Pwd=xxx
  const pwMatch = connectionString.match(/(?:Password|Pwd)\s*=\s*([^;]+)/i);
  if (pwMatch) return pwMatch[1].trim();

  return undefined;
}
