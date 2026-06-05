/** Build per-service environment variables for Servy-managed Windows binaries. */
import { join } from '@std/path';
import {
  CACHE_PROVIDERS,
  DB_DEFAULT_PORTS,
  DB_DEFAULT_USERS,
  JDBC_PROTOCOLS,
} from '../../../constants/providers.ts';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import type { InfrastructureConfig } from '../../../domain/infrastructure-config.ts';
import { getManifestEnvVars, type ManifestContext } from '../manifest/manifest-resolver.ts';

// ============================================================================
// ENVIRONMENT VARIABLE BUILDER
// ============================================================================

/**
 * Build the environment variable map for a service.
 *
 * Injects:
 * - Runtime identity (DENO_ENV, NETSCRIPT_VERSION, NETSCRIPT_PROJECT_ROOT)
 * - DB_PROVIDER / DATABASE_PROVIDER (critical for service startup checks)
 * - Connection strings (DB, cache) from infrastructure
 * - Provider-specific vars (POSTGRESDB_HOST, etc.) for health-check diagnostics
 * - Service discovery URLs (Aspire-compatible format: services__{name}__http__0)
 * - OTEL configuration
 * - Port
 * - Project root (for compiled binaries to locate netscript.config.ts in VFS)
 *
 * Env files (.env.local / .env) are loaded by Deno's built-in --env-file flag
 * at process startup. Values are already in Deno.env by the time this runs.
 *
 * When a `manifestCtx` is provided, env vars are resolved from the Aspire manifest
 * first (ensuring production parity with dev). CLI-only vars (DENO_ENV, WORKER_ID,
 * NETSCRIPT_PROJECT_ROOT, etc.) are always applied on top regardless of manifest.
 */
export function buildServiceEnvironment(
  target: CompileTarget,
  allTargets: CompileTarget[],
  infra: InfrastructureConfig,
  installDir: string,
  connectionStrings: Record<string, string>,
  projectRoot: string,
  version?: string,
  manifestCtx?: ManifestContext | null,
): Record<string, string> {
  const env: Record<string, string> = {};

  // ── Manifest-driven env vars (primary source) ────────────────────────────
  // When the Aspire manifest is available, start from its resolved env var set.
  // This ensures the full env parity with what Aspire injects in development.
  // CLI-only vars and production overrides are applied below.
  const manifestEnv = getManifestEnvVars(target, manifestCtx ?? null);
  if (manifestEnv) {
    Object.assign(env, manifestEnv);
  }

  // ── Production overrides (always applied, even over manifest values) ─────
  // DENO_ENV: manifest uses "development", production must be "production"
  env.DENO_ENV = 'production';
  if (version) {
    env.NETSCRIPT_VERSION = version;
  }

  // Project root (embedded in binary VFS — not in manifest)
  env.NETSCRIPT_PROJECT_ROOT = projectRoot;

  // Port — use production port from target config, not manifest's dev binding
  if (target.port) {
    env.PORT = String(target.port);
  }

  // OTEL endpoint — override manifest's dev endpoint with production endpoint
  env.OTEL_EXPORTER_OTLP_ENDPOINT = infra.otlpEndpoint;

  // ── Database provider identity (not in manifest) ─────────────────────────
  // CRITICAL: services read DB_PROVIDER at startup to determine which engine
  // config to use (env var names, default ports, health-check commands).
  // Without this, services default to 'mysql' and fail when postgres is active.
  const dbProvider = infra.database.provider;
  env.DB_PROVIDER = dbProvider;
  env.DATABASE_PROVIDER = dbProvider;
  env.DATABASE_MODE = infra.database.mode;

  // Primary database — full parity with standalone script generateEnvVars().
  // Parse the connection string once to extract host/port/db/user for all var families.
  const dbUri = infra.database.connectionString;
  const dbDefaultPort = DB_DEFAULT_PORTS[dbProvider] ?? 5432;
  let dbHost = 'localhost';
  let dbPort = String(dbDefaultPort);
  let dbDatabase = infra.database.name;
  let dbUser = DB_DEFAULT_USERS[dbProvider] ?? 'postgres';
  let dbPassword = '';
  let jdbcUri = dbUri; // fallback

  try {
    const url = new URL(dbUri);
    dbHost = url.hostname || dbHost;
    dbPort = url.port || dbPort;
    dbDatabase = (url.pathname || '').replace(/^\//, '') || dbDatabase;
    dbUser = url.username || dbUser;
    dbPassword = url.password || dbPassword;
    const jdbcProtocol = JDBC_PROTOCOLS[dbProvider] ?? 'jdbc:postgresql';
    jdbcUri = `${jdbcProtocol}://${dbHost}:${dbPort}/${dbDatabase}`;
  } catch { /* non-URI connection string — keep safe defaults */ }

  const dbPrefix = dbProvider.toUpperCase(); // e.g. POSTGRES
  const dbNamePrefix = infra.database.databaseName
    ? infra.database.databaseName.toUpperCase()
    : dbPrefix + 'DB'; // e.g. POSTGRESDB

  // Provider-prefixed family: POSTGRES_HOST, POSTGRES_URI, etc.
  env[`${dbPrefix}_HOST`] = dbHost;
  env[`${dbPrefix}_PORT`] = dbPort;
  env[`${dbPrefix}_DATABASE`] = dbDatabase;
  env[`${dbPrefix}_DATABASENAME`] = dbDatabase;
  env[`${dbPrefix}_USER`] = dbUser;
  env[`${dbPrefix}_USERNAME`] = dbUser; // Aspire canonical name
  if (dbPassword) env[`${dbPrefix}_PASSWORD`] = dbPassword;
  env[`${dbPrefix}_URI`] = dbUri;
  env[`${dbPrefix}_JDBCCONNECTIONSTRING`] = jdbcUri;

  // Legacy ${provider}DB_ family: POSTGRESDB_HOST, POSTGRESDB_URI, etc.
  // Consumed by packages/service define-service.ts ENGINE_CONFIGS and prisma.config.ts
  // Aspire injects POSTGRESDB_USERNAME (not _USER) — inject both for compat.
  env[`${dbNamePrefix}_HOST`] = dbHost;
  env[`${dbNamePrefix}_PORT`] = dbPort;
  env[`${dbNamePrefix}_DATABASE`] = dbDatabase;
  env[`${dbNamePrefix}_DATABASENAME`] = dbDatabase;
  env[`${dbNamePrefix}_USER`] = dbUser;
  env[`${dbNamePrefix}_USERNAME`] = dbUser; // Aspire canonical name (POSTGRESDB_USERNAME)
  if (dbPassword) env[`${dbNamePrefix}_PASSWORD`] = dbPassword;
  env[`${dbNamePrefix}_URI`] = dbUri;
  env[`${dbNamePrefix}_JDBCCONNECTIONSTRING`] = jdbcUri;

  // ConnectionStrings — Aspire alternate format consumed by .NET and some Deno libs
  env[`ConnectionStrings__${infra.database.name}`] = dbUri; // by resource name
  env[`ConnectionStrings__${dbProvider}`] = dbUri; // by provider name
  env[`ConnectionStrings__${dbProvider}db`] = dbUri; // legacy alias

  // Per-database URL: DATABASE_{DBNAME}_URL consumed by database helpers
  env[`DATABASE_${dbDatabase.toUpperCase()}_URL`] = dbUri;

  // Additional databases
  for (const [name, db] of Object.entries(infra.additionalDatabases)) {
    env[`ConnectionStrings__${name}`] = db.connectionString;
    if (db.databaseName) {
      const prefix = db.databaseName.toUpperCase();
      env[`${prefix}_URI`] = db.connectionString;
      env[`DATABASE_${prefix}_URL`] = db.connectionString;
    }
  }

  // Cache provider identity
  env.CACHE_PROVIDER = infra.cache.provider;
  env.CACHE_MODE = infra.cache.mode;

  // Cache — full parity with standalone script generateEnvVars():
  // 1. <PROVIDER>_URI — redis:// URI used by queue factory detectProvider() (CRITICAL)
  // 2. <PROVIDER>_HOST/PORT/SSL/DATABASE/PASSWORD — individual vars for SDK access
  // 3. ConnectionStrings__<name>: StackExchange format (host:port[,password=X]) for .NET/KV module
  const cacheProvider = infra.cache.provider.toUpperCase();
  // Aspire format: redis://:@host:port/0 (empty-password separator + db index suffix).
  // Queue factory detectProvider() checks GARNET_URI; Redis adapter uses it as connection URL.
  const cacheUri = infra.cache.password
    ? `redis://:${infra.cache.password}@${infra.cache.host}:${infra.cache.port}/0`
    : `redis://:@${infra.cache.host}:${infra.cache.port}/0`;

  env[`${cacheProvider}_URI`] = cacheUri;
  // Also set REDIS_URI as alias — some packages check REDIS_URI regardless of provider name
  if (infra.cache.provider !== CACHE_PROVIDERS.REDIS) {
    env.REDIS_URI = cacheUri;
  }
  env[`${cacheProvider}_HOST`] = infra.cache.host;
  env[`${cacheProvider}_PORT`] = String(infra.cache.port);
  env[`${cacheProvider}_SSL`] = 'false';
  env[`${cacheProvider}_DATABASE`] = '0';
  if (infra.cache.password) {
    env[`${cacheProvider}_PASSWORD`] = infra.cache.password;
  }
  // ConnectionStrings__<name>: StackExchange format consumed by KV module
  const cacheStackExchangeUri = infra.cache.password
    ? `${infra.cache.host}:${infra.cache.port},password=${infra.cache.password}`
    : `${infra.cache.host}:${infra.cache.port}`;
  env[`ConnectionStrings__${infra.cache.name}`] = cacheStackExchangeUri;

  // Raw connection strings from appsettings (for services that need them directly)
  for (const [name, connStr] of Object.entries(connectionStrings)) {
    if (!(`ConnectionStrings__${name}` in env)) {
      env[`ConnectionStrings__${name}`] = connStr;
    }
  }

  // Service discovery: Aspire-compatible format.
  // Aspire uses the original service name with hyphens preserved:
  //   services__workers-api__http__0=http://localhost:8091
  // NOT underscores (services__workers_api__http__0).
  for (const other of allTargets) {
    if (other.port) {
      const envKey = `services__${other.name}__http__0`;
      env[envKey] = `http://localhost:${other.port}`;
    }
  }

  // OpenTelemetry — full parity with Aspire live resource env vars.
  // Plugins (workers-api, sagas-api, triggers-api) and worker binaries get
  // OTEL_SERVICE_VERSION as a standalone var in addition to OTEL_RESOURCE_ATTRIBUTES.
  // Services and apps only get OTEL_RESOURCE_ATTRIBUTES.
  env.OTEL_DENO = 'true';
  env.OTEL_SERVICE_NAME = target.name;
  if (version) {
    env.OTEL_RESOURCE_ATTRIBUTES = `service.version=${version}`;
    if (target.type === 'plugin' || target.type === 'worker') {
      env.OTEL_SERVICE_VERSION = version;
    }
  }
  env.OTEL_EXPORTER_OTLP_ENDPOINT = infra.otlpEndpoint;
  env.OTEL_EXPORTER_OTLP_PROTOCOL = 'http/protobuf';
  env.OTEL_TRACES_SAMPLER = 'always_on';
  env.OTEL_BSP_SCHEDULE_DELAY = '1000';
  env.OTEL_BLRP_SCHEDULE_DELAY = '1000';
  env.OTEL_METRIC_EXPORT_INTERVAL = '1000';
  env.OTEL_METRICS_EXEMPLAR_FILTER = 'trace_based';

  // Service discovery — Aspire format AND shorthand _HTTP format used by some services
  // (service discovery loop above already set services__<name>__http__0)
  for (const other of allTargets) {
    if (other.port) {
      const shortKey = `${other.name.toUpperCase().replace(/-/g, '_')}_HTTP`;
      env[shortKey] = `http://localhost:${other.port}`;
    }
  }

  // Plugin- and entrypoint-defined env vars from the plugin registry.
  Object.assign(env, target.environment ?? {});

  // Runtime config directory — needed by both worker binaries (for hot-reload
  // of job/saga/trigger overrides) and plugin API services (triggers-api uses
  // loadRuntimeConfig + watchRuntimeConfig to apply trigger enabled/disabled
  // state from files). Set for ALL service types so every process can find
  // the runtime config tree at {installDir}/config/runtime/.
  env.NETSCRIPT_RUNTIME_CONFIG_DIR = join(installDir, 'config', 'runtime');

  // Worker-type binaries need installDir as project root so the VFS finds netscript.config.ts.
  if (target.type === 'worker') {
    env.NETSCRIPT_PROJECT_ROOT = installDir;
    env.NETSCRIPT_TASKS_DIR = join(installDir, 'config', 'runtime', 'tasks');
  }

  if (target.concurrencyEnvVar && target.defaultConcurrency !== undefined) {
    env[target.concurrencyEnvVar] = String(target.defaultConcurrency);
  }

  if (target.assignWorkerId) {
    env.WORKER_ID = `${target.name}-1`;
  }

  return env;
}
