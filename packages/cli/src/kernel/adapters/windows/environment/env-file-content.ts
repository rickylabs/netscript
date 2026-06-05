/** Generate deploy-root .env and .env.template content for Windows deployments. */
import { CACHE_PROVIDERS } from '../../../constants/providers.ts';
import type { InfrastructureConfig } from '../../../domain/infrastructure-config.ts';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import {
  buildCacheUri,
  buildDatabaseUri,
  buildJdbcUri,
  collectTargetDerivedEnvVars,
  extractHost,
  extractPassword,
  extractPort,
  extractUser,
} from './env-file-values.ts';

// ============================================================================
// FORMATTED .ENV GENERATOR (with sections & comments)
// ============================================================================

/**
 * Generate a fully-formatted `.env` file string with section headers,
 * comments, and all environment variables.
 *
 * This format matches the standalone deploy-windows.ts output exactly:
 * structured sections, provider-specific grouping, and human-readable comments.
 */
export function generateEnvFileContent(
  allTargets: CompileTarget[],
  infra: InfrastructureConfig,
  _connectionStrings: Record<string, string>,
  options: {
    version?: string;
    installDir?: string;
    dashboardPort?: number;
    dashboardOtlpPort?: number;
    otlpEndpoint?: string;
    otlpProtocol?: string;
  },
): string {
  const db = infra.database;
  const cache = infra.cache;
  const targetEnv = collectTargetDerivedEnvVars(allTargets);
  const dbUri = buildDatabaseUri(db);
  const jdbcUri = buildJdbcUri(db);
  const cacheUri = buildCacheUri(cache);
  const dbPrefix = db.provider.toUpperCase();
  const cachePrefix = cache.provider.toUpperCase();

  const lines: string[] = [
    '# NetScript Environment Configuration (Aspire-compatible)',
    '# Auto-detected from .env.local / appsettings.json at build time.',
    `# Generated: ${new Date().toISOString()}`,
    '',
    '# ============================================================================',
    '# DATABASE CONFIGURATION',
    `# Provider: ${db.provider} | Mode: ${db.mode}`,
    '# ============================================================================',
    '',
    `DB_PROVIDER=${db.provider}`,
    `DATABASE_PROVIDER=${db.provider}`,
    `DATABASE_MODE=${db.mode}`,
    '',
  ];

  // Provider-specific variables
  const dbHost = extractHost(db.connectionString) ?? 'localhost';
  const dbPort = extractPort(db.connectionString, db.provider);
  const dbUser = extractUser(db.connectionString) ?? 'root';
  const dbPassword = extractPassword(db.connectionString) ?? '';

  lines.push(
    `# Provider-specific variables (${dbPrefix}_*)`,
    `${dbPrefix}_HOST=${dbHost}`,
    `${dbPrefix}_PORT=${dbPort}`,
    `${dbPrefix}_DATABASE=${db.name}`,
    `${dbPrefix}_DATABASENAME=${db.name}`,
    `${dbPrefix}_USER=${dbUser}`,
    `${dbPrefix}_USERNAME=${dbUser}`,
    `${dbPrefix}_PASSWORD=${dbPassword}`,
    `${dbPrefix}_URI=${dbUri}`,
    `${dbPrefix}_JDBCCONNECTIONSTRING=${jdbcUri}`,
    `ConnectionStrings__${db.provider}=${dbUri}`,
    '',
  );

  // Legacy format — Aspire uses POSTGRESDB_USERNAME, emit both _USER and _USERNAME
  lines.push(
    `# Legacy ${dbPrefix}DB_* format (${dbPrefix}DB_HOST, ${dbPrefix}DB_URI, etc.)`,
    `${dbPrefix}DB_HOST=${dbHost}`,
    `${dbPrefix}DB_PORT=${dbPort}`,
    `${dbPrefix}DB_DATABASE=${db.name}`,
    `${dbPrefix}DB_DATABASENAME=${db.name}`,
    `${dbPrefix}DB_USER=${dbUser}`,
    `${dbPrefix}DB_USERNAME=${dbUser}`,
    `${dbPrefix}DB_PASSWORD=${dbPassword}`,
    `${dbPrefix}DB_URI=${dbUri}`,
    `${dbPrefix}DB_JDBCCONNECTIONSTRING=${jdbcUri}`,
    `ConnectionStrings__${db.provider}db=${dbUri}`,
    '',
  );

  // Per-database URL
  lines.push(
    `# Per-database URL (multi-database support)`,
    `DATABASE_${db.name.toUpperCase()}_URL=${dbUri}`,
  );

  // Additional databases
  const additionalEntries = Object.entries(infra.additionalDatabases);
  if (additionalEntries.length > 0) {
    lines.push(
      '',
      '# ============================================================================',
      '# ADDITIONAL DATABASES (multi-database, multi-host)',
      '# ============================================================================',
      '',
    );

    for (const [resourceKey, additionalDb] of additionalEntries) {
      const additionalUri = buildDatabaseUri(additionalDb);
      const dbNameUpper = additionalDb.name.toUpperCase();
      const addHost = extractHost(additionalDb.connectionString) ?? 'localhost';
      const addPort = extractPort(additionalDb.connectionString, additionalDb.provider);

      lines.push(
        `# ${additionalDb.name} database (${addHost}:${addPort})`,
        `DATABASE_${dbNameUpper}_URL=${additionalUri}`,
        `ConnectionStrings__${resourceKey}=${additionalUri}`,
        '',
      );
    }
  }

  // Cache section
  lines.push(
    '',
    '# ============================================================================',
    '# CACHE CONFIGURATION',
    `# Provider: ${cache.provider} | Mode: ${cache.mode}`,
    '# ============================================================================',
    '',
    `CACHE_PROVIDER=${cache.provider}`,
    `CACHE_MODE=${cache.mode}`,
    '',
  );

  if (cache.provider === CACHE_PROVIDERS.DENOKV) {
    lines.push(
      `# Deno KV (local file-based)`,
      `DENO_KV_PATH=data/kv`,
    );
  } else {
    lines.push(
      `# Provider-specific variables (${cachePrefix}_*)`,
      `${cachePrefix}_HOST=${cache.host}`,
      `${cachePrefix}_PORT=${cache.port}`,
      `${cachePrefix}_SSL=false`,
      `${cachePrefix}_DATABASE=0`,
    );
    if (cache.password) {
      lines.push(`${cachePrefix}_PASSWORD=${cache.password}`);
    }
    lines.push(
      `${cachePrefix}_URI=${cacheUri}`,
      `ConnectionStrings__${cache.provider}=${cacheUri}`,
    );
    // REDIS_URI alias — queue factory detectProvider() checks this regardless of provider name
    if (cache.provider !== CACHE_PROVIDERS.REDIS) {
      lines.push(`REDIS_URI=${cacheUri}`);
    }
  }

  // OTEL section
  lines.push(
    '',
    '# ============================================================================',
    '# OPENTELEMETRY CONFIGURATION (matches Aspire WithDenoOpenTelemetry)',
    '# ============================================================================',
    '',
    `OTEL_EXPORTER_OTLP_ENDPOINT=${
      options.otlpEndpoint ?? infra.otlpEndpoint ?? 'http://localhost:4318'
    }`,
    `OTEL_EXPORTER_OTLP_PROTOCOL=${options.otlpProtocol ?? 'http/protobuf'}`,
    'OTEL_DENO=true',
    'OTEL_TRACES_SAMPLER=always_on',
    'OTEL_BSP_SCHEDULE_DELAY=1000',
    'OTEL_BLRP_SCHEDULE_DELAY=1000',
    'OTEL_METRIC_EXPORT_INTERVAL=1000',
    'OTEL_METRICS_EXEMPLAR_FILTER=trace_based',
    'DENO_ENV=production',
  );

  // Service discovery section
  lines.push(
    '',
    '# ============================================================================',
    '# SERVICE DISCOVERY (Aspire-style)',
    '# ============================================================================',
    '',
  );

  for (const target of allTargets) {
    if (target.port) {
      lines.push(`services__${target.name}__http__0=http://localhost:${target.port}`);
      lines.push(
        `${target.name.toUpperCase().replace(/-/g, '_')}_HTTP=http://localhost:${target.port}`,
      );
    }
  }

  // V8 memory section
  lines.push(
    '',
    '# ============================================================================',
    '# V8 MEMORY OPTIMIZATION',
    '# ============================================================================',
    '# V8 flags are baked into compiled binaries but can be overridden at runtime.',
    '# Set DENO_V8_FLAGS per-service in Servy XML to tune without recompilation.',
    '# Example: DENO_V8_FLAGS=--single-threaded,--max-old-space-size=128',
  );

  // Worker / saga config
  lines.push(
    '',
    '# ============================================================================',
    '# WORKER / SAGA / TRIGGER CONFIGURATION',
    '# ============================================================================',
    '# WORKER_CONCURRENCY controls the Web Worker pool size (parallel job execution).',
    '# Each Web Worker spawns its own V8 isolate (~20-40 MB). Keep low for memory.',
    '',
    '# QUEUE_PROVIDER=redis',
  );

  const orderedTargetKeys = [
    'WORKER_CONCURRENCY',
    'WORKERS_API_VERSION',
    'SAGAS_API_VERSION',
    'SAGA_CONCURRENCY',
    'TRIGGERS_API_VERSION',
    'TRIGGER_CONCURRENCY',
    'WEBHOOK_EXPORT_SECRET',
  ];

  for (const key of orderedTargetKeys) {
    if (key in targetEnv) {
      lines.push(`${key}=${targetEnv[key]}`);
    }
  }

  if (!('WEBHOOK_EXPORT_SECRET' in targetEnv)) {
    lines.push('# WEBHOOK_EXPORT_SECRET=your-secret-here');
  }

  // Trigger file-watch paths
  lines.push(
    '',
    '# ============================================================================',
    '# FILE-WATCH TRIGGER PATHS',
    '# ============================================================================',
    '# Semicolon-separated UNC or local paths watched by file-trigger processors.',
    '# Leave empty to disable the corresponding trigger (no crash, just skipped).',
    '# Example: TRIGGER_CSV_IMPORT_PATHS=//SERVER/Share$/data_in/prod;//SERVER/Share$/data_in/test',
    '',
    `TRIGGER_CSV_IMPORT_PATHS=${targetEnv.TRIGGER_CSV_IMPORT_PATHS ?? ''}`,
    `TRIGGER_PRODUCT_IMPORT_PATHS=${targetEnv.TRIGGER_PRODUCT_IMPORT_PATHS ?? ''}`,
    `TRIGGER_EXPORT_OUTGOING_PATH=${targetEnv.TRIGGER_EXPORT_OUTGOING_PATH ?? ''}`,
  );

  // Runtime config dir
  if (options.installDir) {
    lines.push(
      '',
      '# ============================================================================',
      '# RUNTIME CONFIG (hot-reload overrides)',
      '# ============================================================================',
      '# Root directory for job/saga/trigger/feature runtime overrides.',
      '# Populated from .deploy/windows/config/runtime/ at install time.',
      `# Update the pointer file (runtime/current) to switch to a new version set.`,
      '',
      `NETSCRIPT_RUNTIME_CONFIG_DIR=${options.installDir}/config/runtime`,
    );
  }

  // Dashboard section
  const dashboardPort = options.dashboardPort ?? 18888;
  const dashboardOtlpPort = options.dashboardOtlpPort ?? 4318;
  lines.push(
    '',
    '# ============================================================================',
    '# DASHBOARD',
    '# ============================================================================',
    '',
    `ASPIRE_DASHBOARD_PORT=${dashboardPort}`,
    `ASPIRE_DASHBOARD_OTLP_HTTP_PORT=${dashboardOtlpPort}`,
  );

  // Servy service account (propagated from build environment)
  const envAccount = Deno.env.get('SERVY_SERVICE_ACCOUNT');
  const envPassword = Deno.env.get('SERVY_SERVICE_PASSWORD');
  if (envAccount) {
    lines.push(
      '',
      '# ============================================================================',
      '# SERVY SERVICE ACCOUNT',
      '# ============================================================================',
      `SERVY_SERVICE_ACCOUNT=${envAccount}`,
    );
    if (envPassword) {
      lines.push(`SERVY_SERVICE_PASSWORD=${envPassword}`);
    }
  }

  return lines.join('\n');
}
