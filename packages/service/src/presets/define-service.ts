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

import { createService, type ServiceConfig } from '../builder/service-builder.ts';
import { createDatabaseConnectivityStartupHook } from '../diagnostics/database-connectivity.ts';
import type { Database, DbContext, RunningService, ServiceRouter } from '../types.ts';

interface DisconnectCapableDatabase extends Database {
  $disconnect(): Promise<void>;
}

/**
 * Extract a `$queryRaw`-capable client from a db context object.
 *
 * - Single-db: `db` itself has `$queryRaw` → return it directly
 * - Multi-db:  first value in `db` that has `$queryRaw` → use as primary
 *
 * Returns `undefined` if no such client is found (health check is skipped).
 */
function findHealthCheckDb(db: DbContext): Database | undefined {
  if (isDatabase(db)) return db;
  for (const value of Object.values(db)) {
    if (isDatabase(value)) return value;
  }
  return undefined;
}

function isDatabase(value: unknown): value is Database {
  return typeof value === 'object' &&
    value !== null &&
    typeof (value as { $queryRaw?: unknown }).$queryRaw === 'function';
}

function isDisconnectCapableDatabase(value: Database): value is DisconnectCapableDatabase {
  return typeof (value as { $disconnect?: unknown }).$disconnect === 'function';
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
  db?: DbContext;
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
export async function defineService<T extends ServiceRouter>(
  router: T,
  options: DefineServiceOptions,
): Promise<RunningService> {
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

    if (healthCheckDb) {
      builder.onStartup(
        createDatabaseConnectivityStartupHook({
          serviceName: options.name ?? 'unknown',
          database: healthCheckDb,
        }),
      );

      if (isDisconnectCapableDatabase(healthCheckDb)) {
        builder.onShutdown(async () => {
          await healthCheckDb.$disconnect();
        });
      }
    }
  }

  return await builder.withHealth().serve();
}
