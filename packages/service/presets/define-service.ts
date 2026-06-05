/**
 * defineService - Layer 3 one-liner preset for service creation.
 *
 * @example
 * ```typescript
 * import { defineService } from '@netscript/service';
 * import { router } from './router.ts';
 * import { db } from '@database';
 *
 * await defineService(router, { name: 'users', port: 3000, db });
 * ```
 *
 * This creates a fully-configured service with:
 * - CORS enabled
 * - Request logging
 * - OpenAPI spec at /api/openapi.json
 * - Scalar docs at /api/docs
 * - oRPC RPC endpoint at /api/rpc/*
 * - oRPC OpenAPI endpoint at /api/*
 * - Health checks at /health, /health/live, /health/ready
 * - Database health check (if db provided)
 * - Service info at /
 *
 * @module
 */

import { createService, type ServiceConfig } from '../builders/service-builder.ts';
import { ensureLogging } from '@netscript/logger';

// Router type that matches oRPC router structure
// deno-lint-ignore no-explicit-any
type AnyRouter = Record<string, any>;

// Minimal interface for health-check queries
interface Database {
  $queryRaw: (query: TemplateStringsArray) => Promise<unknown>;
}

/**
 * Extract a `$queryRaw`-capable client from any db context object.
 *
 * - Single-db: `db` itself has `$queryRaw` → return it directly
 * - Multi-db:  first value in `db` that has `$queryRaw` → use as primary
 *
 * Returns `undefined` if no such client is found (health check is skipped).
 */
// deno-lint-ignore no-explicit-any
function findHealthCheckDb(db: Record<string, any>): Database | undefined {
  if (typeof db.$queryRaw === 'function') return db as Database;
  for (const value of Object.values(db)) {
    if (value && typeof value.$queryRaw === 'function') return value as Database;
  }
  return undefined;
}

// ============================================================================
// ENGINE-AGNOSTIC DATABASE CONFIG
// ============================================================================

type DbEngine = 'mysql' | 'postgres' | 'mssql';

interface EngineConfig {
  displayName: string;
  defaultPort: number;
  uriEnv: string;
  connStringEnv: string;
  hostEnv: string;
  portEnv: string;
  databaseEnv: string;
  databaseAltEnv?: string;
  userEnv: string;
  tcpCheck: { command: string; dockerGrep: string; dockerRun: (port: number) => string; installUrl: string };
  queryCheck: { loginCommand: (host: string, port: number) => string; listCommand: string; authHint: string };
}

const ENGINE_CONFIGS: Record<DbEngine, EngineConfig> = {
  mysql: {
    displayName: 'MySQL',
    defaultPort: 3306,
    uriEnv: 'MYSQLDB_URI',
    connStringEnv: 'ConnectionStrings__mysqldb',
    hostEnv: 'MYSQLDB_HOST',
    portEnv: 'MYSQLDB_PORT',
    databaseEnv: 'MYSQLDB_DATABASE',
    databaseAltEnv: 'MYSQLDB_DATABASENAME',
    userEnv: 'MYSQLDB_USER',
    tcpCheck: {
      command: 'mysqladmin ping',
      dockerGrep: 'mysql',
      dockerRun: (port: number) => `docker run -d -p ${port}:3306 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes mysql:8.4`,
      installUrl: 'https://dev.mysql.com/downloads/',
    },
    queryCheck: {
      loginCommand: (host: string, port: number) => `mysql -h ${host} -P ${port} -u root`,
      listCommand: 'mysql -e "SHOW DATABASES"',
      authHint: 'Check MySQL user grants and bind-address config',
    },
  },
  postgres: {
    displayName: 'PostgreSQL',
    defaultPort: 5432,
    uriEnv: 'POSTGRESDB_URI',
    connStringEnv: 'ConnectionStrings__postgresdb',
    hostEnv: 'POSTGRESDB_HOST',
    portEnv: 'POSTGRESDB_PORT',
    databaseEnv: 'POSTGRESDB_DATABASE',
    databaseAltEnv: 'POSTGRESDB_DATABASENAME',
    userEnv: 'POSTGRESDB_USER',
    tcpCheck: {
      command: 'pg_isready',
      dockerGrep: 'postgres',
      dockerRun: (port: number) => `docker run -d -p ${port}:5432 -e POSTGRES_PASSWORD=postgres postgres:18`,
      installUrl: 'https://postgresql.org/download/windows/',
    },
    queryCheck: {
      loginCommand: (host: string, port: number) => `psql -h ${host} -p ${port} -U postgres`,
      listCommand: 'psql -l',
      authHint: 'Check pg_hba.conf allows password auth from localhost',
    },
  },
  mssql: {
    displayName: 'SQL Server',
    defaultPort: 1433,
    uriEnv: 'MSSQLDB_URI',
    connStringEnv: 'ConnectionStrings__mssqldb',
    hostEnv: 'MSSQLDB_HOST',
    portEnv: 'MSSQLDB_PORT',
    databaseEnv: 'MSSQLDB_DATABASE',
    databaseAltEnv: 'MSSQLDB_DATABASENAME',
    userEnv: 'MSSQLDB_USER',
    tcpCheck: {
      command: 'sqlcmd -Q "SELECT 1"',
      dockerGrep: 'mssql',
      dockerRun: (port: number) =>
        `docker run -d -p ${port}:1433 -e ACCEPT_EULA=Y -e SA_PASSWORD=YourStrong!Passw0rd mcr.microsoft.com/mssql/server:2025-latest`,
      installUrl: 'https://learn.microsoft.com/sql/database-engine/install-windows/',
    },
    queryCheck: {
      loginCommand: (host: string, port: number) => `sqlcmd -S ${host},${port} -U sa`,
      listCommand: 'sqlcmd -Q "SELECT name FROM sys.databases"',
      authHint: 'Check SQL Server authentication mode and user credentials',
    },
  },
};

/** Resolve the active engine config from DB_PROVIDER env var. */
function getEngineConfig(): EngineConfig {
  const provider = (Deno.env.get('DB_PROVIDER') ?? 'mysql') as DbEngine;
  return ENGINE_CONFIGS[provider] ?? ENGINE_CONFIGS.mysql;
}

/**
 * Options for defineService preset.
 */
export interface DefineServiceOptions extends ServiceConfig {
  /**
   * Database context injected into handler context as `context.db`.
   *
   * Accepts either a single Prisma client (with `$queryRaw`) or a multi-db
   * record such as `{ netscript, mdb, prosco, prev }`. The health-check client
   * is resolved automatically: the first value (or the object itself) that
   * exposes `$queryRaw` is used for `/health` and `/health/ready` probes.
   */
  // deno-lint-ignore no-explicit-any
  db?: Record<string, any>;
  /** OpenAPI configuration */
  openapi?: {
    title?: string;
    description?: string;
  };
  /** Enable debug mode for verbose oRPC logging (default: NETSCRIPT_DEBUG env var) */
  debug?: boolean;
}

/**
 * One-liner preset for creating a fully-configured service.
 *
 * This is the Layer 3 API - maximum convenience with sensible defaults.
 * For more control, use `createService()` (Layer 2) or individual
 * primitives (Layer 1).
 *
 * @example
 * ```typescript
 * // Minimal usage
 * import { defineService } from '@netscript/service';
 * import { router } from './router.ts';
 *
 * await defineService(router, { name: 'users', port: 3000 });
 * ```
 *
 * @example
 * ```typescript
 * // With database health check
 * import { defineService } from '@netscript/service';
 * import { router } from './router.ts';
 * import { db } from '@database';
 *
 * await defineService(router, {
 *   name: 'users',
 *   port: 3000,
 *   db,
 *   openapi: {
 *     title: 'Users API',
 *     description: 'User management service',
 *   },
 * });
 * ```
 *
 * @param router - oRPC router with contract handlers
 * @param options - Service configuration options
 */
export async function defineService<T extends AnyRouter>(
  router: T,
  options: DefineServiceOptions,
): Promise<void> {
  // Ensure logging is configured before starting the service
  await ensureLogging();

  const builder = createService(router, {
    name: options.name,
    version: options.version,
    port: options.port,
  })
    .withCors()
    .withLogger()
    .withOpenAPI(options.openapi)
    .withDocs()
    .withRPC({ debug: options.debug })
    .withServiceInfo();

  if (options.db) {
    const healthCheckDb = findHealthCheckDb(options.db);
    builder.withDatabase(options.db, healthCheckDb);

    // Verify database connectivity at startup to surface connection errors early
    // rather than failing silently on the first request with a cryptic Prisma error.
    //
    // Prisma v7 with driver adapters wraps connection errors as
    // "Invalid `prisma.$queryRaw()` invocation:" with NO details.
    // We do a raw TCP check first to give a clear diagnostic message.
    if (healthCheckDb) builder.onStartup(async () => {
      const serviceName = options.name ?? 'unknown';
      const engineCfg = getEngineConfig();
      console.log(`🔌 [${serviceName}] Verifying ${engineCfg.displayName} connectivity...`);

      // Parse host/port from env for a pre-Prisma TCP check
      const dbUri = Deno.env.get(engineCfg.uriEnv) ?? Deno.env.get(engineCfg.connStringEnv);
      let dbHost = Deno.env.get(engineCfg.hostEnv) ?? 'localhost';
      let dbPort = parseInt(Deno.env.get(engineCfg.portEnv) ?? String(engineCfg.defaultPort), 10);

      if (dbUri) {
        try {
          const url = new URL(dbUri);
          dbHost = url.hostname || dbHost;
          dbPort = parseInt(url.port, 10) || dbPort;
        } catch { /* use env fallbacks */ }
      }

      // Retry logic - DB might still be starting up
      const maxRetries = 3;
      const retryDelayMs = 2000;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // Step 1: Raw TCP connectivity check (bypasses Prisma's opaque error wrapper)
        const tcpReachable = await checkTcpPort(dbHost, dbPort, 3000);
        if (!tcpReachable) {
          const isLastAttempt = attempt === maxRetries;
          if (!isLastAttempt) {
            console.warn(
              `⚠️  [${serviceName}] ${engineCfg.displayName} not reachable at ${dbHost}:${dbPort} ` +
                `(attempt ${attempt}/${maxRetries}). Retrying in ${retryDelayMs / 1000}s...`,
            );
            await new Promise((r) => setTimeout(r, retryDelayMs));
            continue;
          }

          // Final attempt - DB is genuinely unreachable
          printConnectionDiagnostics(serviceName, dbHost, dbPort, 'TCP_UNREACHABLE', undefined, engineCfg);
          return; // Don't throw - let service start for health checks
        }

        // Step 2: Prisma query check (TCP is open, test actual DB connectivity)
        try {
          await healthCheckDb.$queryRaw`SELECT 1`;
          console.log(`✅ [${serviceName}] Database connection verified (${dbHost}:${dbPort})`);
          return; // Success
        } catch (err) {
          const rootCause = extractRootCause(err);
          const displayMessage = rootCause || (err instanceof Error ? err.message : String(err));
          const isLastAttempt = attempt === maxRetries;

          if (!isLastAttempt) {
            console.warn(
              `⚠️  [${serviceName}] Database query check failed (attempt ${attempt}/${maxRetries}): ${displayMessage}`,
            );
            console.warn(`   Retrying in ${retryDelayMs / 1000}s...`);
            await new Promise((r) => setTimeout(r, retryDelayMs));
            continue;
          }

          // Final attempt failed - TCP is open but queries fail
          // This means auth failure, missing database, or Prisma/adapter issue
          printConnectionDiagnostics(serviceName, dbHost, dbPort, 'QUERY_FAILED', displayMessage, engineCfg);
          if (err instanceof Error && err.stack) {
            console.error(`   Stack: ${err.stack}`);
          }
        }
      }
    });
  }

  await builder.withHealth().serve();
}

// ============================================================================
// DATABASE CONNECTIVITY HELPERS
// ============================================================================

/**
 * Check if a TCP port is reachable (without Prisma's opaque error wrapper).
 *
 * This gives us a clear "DB is not listening" signal before Prisma can
 * swallow the real error into its unhelpful
 * "Invalid `prisma.$queryRaw()` invocation:" message.
 */
async function checkTcpPort(host: string, port: number, timeoutMs = 3000): Promise<boolean> {
  // Resolve 'localhost' to '127.0.0.1' to avoid IPv6 (::1) mismatch.
  // Docker containers (especially Aspire-managed) bind to 127.0.0.1 only.
  // Deno resolves 'localhost' to ::1 first on Windows, which times out
  // before falling back to IPv4 — causing false "unreachable" diagnostics.
  const resolvedHost = host === 'localhost' ? '127.0.0.1' : host;

  try {
    const conn = await Promise.race([
      Deno.connect({ hostname: resolvedHost, port }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TCP timeout')), timeoutMs)
      ),
    ]);
    conn.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * Print detailed connection diagnostics with actionable troubleshooting steps.
 */
function printConnectionDiagnostics(
  serviceName: string,
  host: string,
  port: number,
  reason: 'TCP_UNREACHABLE' | 'QUERY_FAILED',
  errorMessage?: string,
  engineCfg?: EngineConfig,
): void {
  const cfg = engineCfg ?? getEngineConfig();
  const uri = Deno.env.get(cfg.uriEnv) ?? '(not set)';
  const maskedUri = uri !== '(not set)'
    ? (() => {
      try {
        const u = new URL(uri);
        return `${u.protocol}//${u.username}:***@${u.hostname}:${u.port}${u.pathname}`;
      } catch {
        return '(unparseable)';
      }
    })()
    : '(not set)';

  console.error('');
  console.error('   ┌─────────────────────────────────────────────────────────────');
  if (reason === 'TCP_UNREACHABLE') {
    console.error(
      `   │ ❌ [${serviceName}] ${cfg.displayName} is NOT reachable at ${host}:${port}`,
    );
    console.error('   │');
    console.error('   │ The TCP port is not accepting connections. This means');
    console.error(`   │ ${cfg.displayName} is either not running or not listening on this`);
    console.error('   │ host/port combination.');
  } else {
    console.error(
      `   │ ❌ [${serviceName}] ${cfg.displayName} is reachable at ${host}:${port}`,
    );
    console.error('   │    but database queries are failing.');
    if (errorMessage) {
      console.error(`   │ Error: ${errorMessage}`);
    }
    console.error('   │');
    console.error('   │ Possible causes: wrong credentials, database does not exist,');
    console.error(`   │ Prisma schema mismatch, or ${cfg.queryCheck.authHint}.`);
  }
  console.error('   ├─────────────────────────────────────────────────────────────');
  console.error('   │ When running outside Aspire (e.g. Windows Services via Servy),');
  console.error(`   │ ${cfg.displayName} must be running independently. Aspire manages its`);
  console.error(`   │ own ${cfg.displayName} container only during \`aspire run\`.`);
  console.error('   │');
  console.error(`   │ ${cfg.uriEnv}:${' '.repeat(Math.max(1, 14 - cfg.uriEnv.length))}${maskedUri}`);
  console.error(`   │ ${cfg.hostEnv}:${' '.repeat(Math.max(1, 14 - cfg.hostEnv.length))}${Deno.env.get(cfg.hostEnv) ?? '(not set)'}`);
  console.error(`   │ ${cfg.portEnv}:${' '.repeat(Math.max(1, 14 - cfg.portEnv.length))}${Deno.env.get(cfg.portEnv) ?? '(not set)'}`);
  console.error(
    `   │ ${cfg.databaseEnv}:${' '.repeat(Math.max(1, 14 - cfg.databaseEnv.length))}${
      Deno.env.get(cfg.databaseEnv) ?? (cfg.databaseAltEnv ? Deno.env.get(cfg.databaseAltEnv) : undefined) ?? '(not set)'
    }`,
  );
  console.error('   │');
  console.error('   │ Quick checks:');
  if (reason === 'TCP_UNREACHABLE') {
    console.error(`   │   1. Is ${cfg.displayName} running? ${cfg.tcpCheck.command} -h ${host} -p ${port}`);
    console.error(`   │   2. If using Docker: docker ps | grep ${cfg.tcpCheck.dockerGrep}`);
    console.error(`   │   3. Start it: ${cfg.tcpCheck.dockerRun(port)}`);
    console.error(`   │   4. Or install: ${cfg.tcpCheck.installUrl}`);
  } else {
    console.error(`   │   1. Test login: ${cfg.queryCheck.loginCommand(host, port)}`);
    console.error(`   │   2. Check database exists: ${cfg.queryCheck.listCommand}`);
    console.error('   │   3. Run migrations: deno task prisma:migrate');
    console.error(`   │   4. ${cfg.queryCheck.authHint}`);
  }
  console.error('   └─────────────────────────────────────────────────────────────');
  console.error('');
}

/**
 * Extract the real underlying error from Prisma's error wrapper.
 *
 * Prisma v7 with driver adapters wraps connection/driver errors as
 * `PrismaClientKnownRequestError` with an unhelpful message like:
 *   "Invalid `prisma.$queryRaw()` invocation:"
 *
 * The actual error (e.g. ECONNREFUSED, auth failure) is buried in:
 * - `error.cause` (Error.cause chain)
 * - `error.meta.cause` (Prisma-specific metadata)
 * - `error.meta.message` (Prisma-specific metadata)
 *
 * @param err - The error thrown by Prisma
 * @returns The root cause message, or undefined if not extractable
 */
function extractRootCause(err: unknown): string | undefined {
  if (!(err instanceof Error)) return undefined;

  // Walk the Error.cause chain to find the deepest cause
  // deno-lint-ignore no-explicit-any
  let current: any = err;
  let deepestCause: string | undefined;

  while (current) {
    // Check Prisma's .meta property for driver-level error info
    if (current.meta) {
      if (typeof current.meta.cause === 'string' && current.meta.cause) {
        deepestCause = current.meta.cause;
      }
      if (typeof current.meta.message === 'string' && current.meta.message) {
        deepestCause = current.meta.message;
      }
    }

    // Check Error.cause chain
    if (current.cause instanceof Error) {
      current = current.cause;
      // Prefer the deepest cause's message if it's informative
      if (current.message && !current.message.includes('invocation:')) {
        deepestCause = current.message;
        // Include errno/code if present (e.g. ECONNREFUSED)
        if (current.code) {
          deepestCause = `${current.code}: ${deepestCause}`;
        }
      }
    } else if (typeof current.cause === 'string' && current.cause) {
      deepestCause = current.cause;
      break;
    } else {
      break;
    }
  }

  return deepestCause;
}
