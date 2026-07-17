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
import type { AuthnOptions, AuthzOptions } from '../auth/options.ts';
import { createDatabaseConnectivityStartupHook } from '../diagnostics/database-connectivity.ts';
import { healthChecks } from '../primitives/health.ts';
import type {
  Database,
  DbContext,
  RunningService,
  ServiceRouter,
  ServiceTlsOptions,
} from '../types.ts';

interface DisconnectCapableDatabase extends Database {
  $disconnect(): Promise<void>;
}

interface DatabaseHealthCandidate {
  readonly name: string;
  readonly database: Database;
  readonly configured: boolean;
}

/**
 * Extract a `$queryRaw`-capable client from a db context object.
 *
 * - Single-db: `db` itself has `$queryRaw` → return it directly
 * - Multi-db: every `$queryRaw` client becomes a named candidate; the key matching
 *   `DB_PROVIDER` / `DATABASE_PROVIDER` is configured and the others are excluded
 *
 * Returns an empty array if no such client is found (health checks are skipped).
 */
function findDatabaseHealthCandidates(db: DbContext): readonly DatabaseHealthCandidate[] {
  if (isDatabase(db)) {
    return [{ name: 'database', database: db, configured: true }];
  }

  const candidates = Object.entries(db)
    .filter((entry): entry is [string, Database] => isDatabase(entry[1]));
  if (candidates.length === 0) return [];

  const provider = readConfiguredProvider();
  const configuredIndex = provider === undefined
    ? 0
    : candidates.findIndex(([name]) => databaseNamesMatch(name, provider));
  const selectedIndex = configuredIndex >= 0 ? configuredIndex : 0;

  return candidates.map(([name, database], index) => ({
    name: `database:${name}`,
    database,
    configured: index === selectedIndex,
  }));
}

function readConfiguredProvider(): string | undefined {
  return Deno.env.get('DB_PROVIDER') ?? Deno.env.get('DATABASE_PROVIDER') ?? undefined;
}

function databaseNamesMatch(name: string, provider: string): boolean {
  const normalizedName = name.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
  const normalizedProvider = provider.toLowerCase().replaceAll(/[^a-z0-9]/g, '');
  if (normalizedName === normalizedProvider) return true;
  return (normalizedName === 'postgres' && normalizedProvider === 'postgresql') ||
    (normalizedName === 'postgresql' && normalizedProvider === 'postgres') ||
    (normalizedName === 'mssql' && normalizedProvider === 'sqlserver') ||
    (normalizedName === 'sqlserver' && normalizedProvider === 'mssql');
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
  /**
   * Opt-in TLS material. When set, the service serves HTTPS and negotiates
   * HTTP/2 via ALPN. When omitted, the listener still honors the
   * `NETSCRIPT_TLS_CERT_FILE` / `NETSCRIPT_TLS_KEY_FILE` env pair before
   * defaulting to plain HTTP/1.1.
   */
  tls?: ServiceTlsOptions;
  /** Optional authentication and authorization stages for guarded service paths. */
  auth?: {
    /** Authentication middleware options. */
    readonly authn: AuthnOptions;
    /** Optional authorization middleware options. */
    readonly authz?: AuthzOptions;
  };
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
 * @example
 * ```typescript
 * // With auth enabled for /api paths
 * import { defineService } from '@netscript/service';
 * import {
 *   createScopeAuthorizer,
 *   createStaticCredentialAuthenticator,
 * } from '@netscript/service/auth';
 *
 * await defineService(router, {
 *   name: 'users',
 *   auth: {
 *     authn: {
 *       authenticator: createStaticCredentialAuthenticator({
 *         credentials: {
 *           'local-token': {
 *             subject: 'service:local',
 *             scopes: ['users:read'],
 *           },
 *         },
 *       }),
 *     },
 *     authz: {
 *       authorizer: createScopeAuthorizer({
 *         rules: [{
 *           match: (request) => request.path.startsWith('/api/users'),
 *           requireScopes: ['users:read'],
 *         }],
 *       }),
 *     },
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
    const databaseCandidates = findDatabaseHealthCandidates(options.db);
    const healthCheckDb = databaseCandidates.find((candidate) => candidate.configured)?.database;
    builder.withDatabase(options.db);

    for (const candidate of databaseCandidates) {
      builder.withHealthCheck(
        healthChecks.database(candidate.database, {
          name: candidate.name,
          configured: candidate.configured,
        }),
      );
    }

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

  if (options.auth) {
    builder.withAuthn(options.auth.authn);
    if (options.auth.authz) {
      builder.withAuthz(options.auth.authz);
    }
  }

  return await builder.withHealth().serve(options.tls ? { tls: options.tls } : undefined);
}
