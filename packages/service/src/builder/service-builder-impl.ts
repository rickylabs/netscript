/**
 * Internal implementation of the {@link ServiceBuilder} fluent API.
 *
 * The public surface (interface + factory) lives in `service-builder.ts`; this
 * file holds the mutable builder class. Heavy concerns are delegated:
 * - oRPC endpoint wiring → `service-rpc.ts` ({@link wireRpc})
 * - HTTP listener lifecycle → `service-listener.ts` ({@link startServiceListener})
 *
 * @module
 */

import { type Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { ensureLogging } from '@netscript/logger';
import { loggerMiddleware, type LoggerMiddlewareOptions } from '@netscript/logger/middleware';
import { createAuthnMiddleware, createAuthzMiddleware } from '../auth/auth-middleware.ts';
import type { AuthnOptions, AuthzOptions } from '../auth/options.ts';
import {
  createHealthHandler,
  createLivenessHandler,
  createReadinessHandler,
  type HealthCheck,
  healthChecks,
} from '../primitives/health.ts';
import { createOpenAPISpec, createScalarDocs, createScalarJs } from '../primitives/openapi.ts';
import { createErrorHandler, createNotFoundHandler } from '../primitives/handlers.ts';
import type {
  ContextFactory,
  CorsOptions,
  Database,
  DbContext,
  RunningService,
  ServeOptions,
  ServiceApp,
  ServiceHandler,
  ServiceMiddleware,
  ServiceRouteMethod,
  ServiceRouter,
  ShutdownHook,
} from '../types.ts';
import type { ServiceBuilder, ServiceConfig } from './service-builder.ts';
import { type RpcWiringOptions, wireRpc } from './service-rpc.ts';
import { startServiceListener } from './service-listener.ts';

interface DeferredRoute {
  readonly method: ServiceRouteMethod;
  readonly path: string;
  readonly handler: ServiceHandler;
}

/**
 * Internal builder implementation for creating Deno services with consistent patterns.
 *
 * Provides a Layer 2 API that allows customization while maintaining sensible
 * defaults. For a Layer 3 one-liner, use `defineService()`. Construct via the
 * `createService()` factory rather than directly.
 */
export class ServiceBuilderImpl<TRouter extends ServiceRouter> implements ServiceBuilder<TRouter> {
  private app: Hono;
  private router: TRouter;
  private config: ServiceConfig;
  private healthChecks: HealthCheck[] = [];
  private readinessChecks: Array<() => Promise<boolean>> = [];
  private rpcConfigured = false;
  private openApiConfigured = false;
  private docsConfigured = false;
  private healthConfigured = false;
  private startupHooks: Array<() => Promise<void>> = [];
  private shutdownHooks: ShutdownHook[] = [];
  private contextFactory: ContextFactory = () => ({});
  private database: DbContext | null = null;
  private authnOptions: AuthnOptions | null = null;
  private authzOptions: AuthzOptions | null = null;
  private authInstalled = false;
  private rpcOptions: (RpcWiringOptions & { traceContext?: boolean }) | null = null;
  private openApiOptions: { title?: string; description?: string } | null = null;
  private docsOptions: { specUrl?: string } | null = null;
  private deferredRoutes: DeferredRoute[] = [];
  private deferredRoutesInstalled = false;

  constructor(router: TRouter, config: ServiceConfig) {
    this.app = new Hono();
    this.router = router;
    this.config = config;
  }

  /**
   * Enables CORS middleware.
   *
   * @param options - CORS configuration options
   */
  withCors(options?: CorsOptions): ServiceBuilder<TRouter> {
    this.app.use('*', cors(options ?? { origin: '*' }));
    return this;
  }

  /**
   * Enables request logging middleware using @netscript/logger.
   *
   * Provides structured logging with:
   * - Automatic request ID generation/propagation
   * - Request start/completion timing
   * - Configurable skip paths (health checks skipped by default)
   * - Logger injection into context (access via `ctx.get('logger')`)
   *
   * @param options - Logger middleware configuration
   */
  withLogger(options?: LoggerMiddlewareOptions): ServiceBuilder<TRouter> {
    this.app.use('*', loggerMiddleware(this.config.name, options));
    return this;
  }

  /**
   * Adds a database health check, readiness check, and injects db into oRPC context.
   *
   * The database will be available in your router handlers via `context.db`.
   *
   * @param db - Prisma client instance or database object
   *
   * @example
   * ```typescript
   * // In your service setup:
   * createService(router, { name: 'users' })
   *   .withDatabase(db.postgres)
   *   .withRPC()
   *   .serve();
   *
   * // In your router handlers, access via context:
   * const handler = base.handler(async ({ context }) => {
   *   const users = await context.db.user.findMany();
   *   return users;
   * });
   * ```
   */
  withDatabase(db: DbContext, healthCheckDb?: Database): ServiceBuilder<TRouter> {
    // Store database reference for context injection
    this.database = db;

    // Wire up health + readiness checks only when a $queryRaw-capable client is supplied.
    // For single-db usage pass `db` directly; for multi-db pass the primary client separately.
    if (healthCheckDb) {
      this.healthChecks.push(healthChecks.database(healthCheckDb));

      this.readinessChecks.push(async () => {
        try {
          await healthCheckDb.$queryRaw`SELECT 1`;
          return true;
        } catch {
          return false;
        }
      });
    }

    return this;
  }

  /**
   * Adds a custom health check.
   *
   * @param check - Health check definition
   */
  withHealthCheck(check: HealthCheck): ServiceBuilder<TRouter> {
    this.healthChecks.push(check);
    return this;
  }

  /**
   * Adds a custom readiness check.
   *
   * @param check - Async function returning true if ready
   */
  withReadinessCheck(check: () => Promise<boolean>): ServiceBuilder<TRouter> {
    this.readinessChecks.push(check);
    return this;
  }

  /**
   * Configures OpenAPI spec generation endpoint at /api/openapi.json.
   *
   * @param options - OpenAPI configuration
   */
  withOpenAPI(options?: { title?: string; description?: string }): ServiceBuilder<TRouter> {
    if (this.openApiConfigured) return this;
    this.openApiConfigured = true;
    this.openApiOptions = options ?? {};
    return this;
  }

  /**
   * Configures Scalar documentation UI at /api/docs.
   *
   * @param options - Scalar docs configuration
   */
  withDocs(options?: { specUrl?: string }): ServiceBuilder<TRouter> {
    if (this.docsConfigured) return this;
    this.docsConfigured = true;

    this.docsOptions = options ?? {};
    return this;
  }

  /**
   * Configures oRPC handlers for both RPC and OpenAPI endpoints.
   *
   * - /api/rpc/* - Type-safe RPC endpoint
   * - /api/* - REST-style OpenAPI endpoint
   *
   * @param options - RPC configuration
   * @param options.rpcPath - Path for RPC endpoint (default: '/api/rpc')
   * @param options.apiPath - Path for OpenAPI endpoint (default: '/api')
   * @param options.debug - Enable debug mode for verbose oRPC logging (default: NETSCRIPT_DEBUG env var)
   * @param options.traceContext - Enable trace context propagation (default: true)
   */
  withRPC(
    options?: {
      rpcPath?: string;
      apiPath?: string;
      debug?: boolean;
      traceContext?: boolean;
    },
  ): ServiceBuilder<TRouter> {
    if (this.rpcConfigured) return this;
    this.rpcConfigured = true;
    this.rpcOptions = options ?? {};

    return this;
  }

  /** Enables authentication middleware for guarded paths. */
  withAuthn(options: AuthnOptions): ServiceBuilder<TRouter> {
    this.authnOptions = options;
    return this;
  }

  /** Enables authorization middleware for guarded paths. */
  withAuthz(options: AuthzOptions): ServiceBuilder<TRouter> {
    this.authzOptions = options;
    return this;
  }

  /**
   * Builds the per-request oRPC context: custom factory output plus the optional
   * database handle and distributed-trace headers.
   */
  private buildRpcContext(c: Context, traceContext: boolean): Record<string, unknown> {
    const ctx = this.contextFactory(c);

    // Add database to context if configured via withDatabase()
    if (this.database) {
      ctx.db = this.database;
    }

    // Add trace context headers for distributed tracing propagation
    if (traceContext) {
      const traceparent = c.req.header('traceparent');
      const tracestate = c.req.header('tracestate');
      if (traceparent || tracestate) {
        ctx.traceHeaders = { traceparent, tracestate };
      }
    }

    const principal = c.get('principal');
    if (principal) {
      ctx.principal = principal;
    }

    return ctx;
  }

  /**
   * Sets a custom context factory for oRPC handlers.
   *
   * Use this to inject custom context into all oRPC handlers.
   *
   * @param factory - Function that receives service context and returns oRPC context
   *
   * @example
   * ```typescript
   * createService(router, { name: 'users' })
   *   .withContext((c) => ({
   *     userId: c.req.header('X-User-ID'),
   *     tenant: c.req.header('X-Tenant-ID'),
   *   }))
   *   .withRPC()
   * ```
   */
  withContext(factory: ContextFactory): ServiceBuilder<TRouter> {
    this.contextFactory = factory;
    return this;
  }

  /**
   * Registers an async startup hook to run before the server starts.
   *
   * Use this for initialization tasks like registering jobs, seeding data,
   * or connecting to external services.
   *
   * @param hook - Async function to run on startup
   *
   * @example
   * ```typescript
   * createService(router, { name: 'workers' })
   *   .onStartup(async () => {
   *     await registerPluginJobs();
   *   })
   *   .serve()
   * ```
   */
  onStartup(hook: () => Promise<void>): ServiceBuilder<TRouter> {
    this.startupHooks.push(hook);
    return this;
  }

  /**
   * Registers an async teardown hook to run during graceful shutdown.
   *
   * Hooks run in reverse registration order when `RunningService.stop()` is
   * called or when the listener receives a handled OS signal.
   *
   * @param hook - Async or sync teardown function to run on shutdown
   *
   * @example
   * ```typescript
   * createService(router, { name: 'users' })
   *   .onShutdown(async () => {
   *     await db.$disconnect();
   *   })
   *   .serve()
   * ```
   */
  onShutdown(hook: ShutdownHook): ServiceBuilder<TRouter> {
    this.shutdownHooks.push(hook);
    return this;
  }

  /**
   * Configures health check endpoints.
   *
   * - /health - Comprehensive health check with all registered checks
   * - /health/live - Simple liveness probe
   * - /health/ready - Readiness probe with dependency checks
   *
   * @param options - Health check configuration
   */
  withHealth(
    options?: { checks?: HealthCheck[]; includeDetails?: boolean },
  ): ServiceBuilder<TRouter> {
    if (this.healthConfigured) return this;
    this.healthConfigured = true;

    if (options?.checks) {
      this.healthChecks.push(...options.checks);
    }

    this.app.get(
      '/health',
      createHealthHandler({
        checks: this.healthChecks,
        version: this.config.version,
        includeDetails: options?.includeDetails ?? true,
      }),
    );
    this.app.get('/health/live', createLivenessHandler());
    this.app.get('/health/ready', createReadinessHandler(this.readinessChecks));

    return this;
  }

  /**
   * Adds custom middleware to the service.
   *
   * @param middleware - Service middleware handler
   */
  use(middleware: ServiceMiddleware): ServiceBuilder<TRouter> {
    this.app.use('*', middleware);
    return this;
  }

  /**
   * Adds a custom route to the service.
   *
   * @param method - HTTP method
   * @param path - Route path
   * @param handler - Route handler
   */
  route(
    method: ServiceRouteMethod,
    path: string,
    handler: ServiceHandler,
  ): ServiceBuilder<TRouter> {
    this.deferredRoutes.push({ method, path, handler });
    return this;
  }

  /**
   * Configures the service root endpoint with service info.
   */
  withServiceInfo(): ServiceBuilder<TRouter> {
    this.app.get('/', (c: Context) =>
      c.json({
        service: this.config.name,
        version: this.config.version ?? '1.0.0',
        endpoints: {
          rpc: '/api/rpc/*',
          openapi: '/api/*',
          spec: '/api/openapi.json',
          docs: '/api/docs',
          health: '/health',
        },
      }));
    return this;
  }

  /**
   * Builds and returns the service app instance.
   * Adds error handlers and returns the app for further customization.
   */
  build(): ServiceApp {
    this.installAuth();
    this.installDeferredRoutes();
    this.app.notFound(createNotFoundHandler(this.config.name));
    this.app.onError(createErrorHandler(this.config.name));
    return this.app;
  }

  private installAuth(): void {
    if (this.authInstalled) return;
    this.authInstalled = true;

    if (this.authnOptions) {
      this.app.use('*', createAuthnMiddleware(this.authnOptions));
    }

    if (this.authzOptions) {
      this.app.use(
        '*',
        createAuthzMiddleware({
          ...this.authzOptions,
          protect: this.authnOptions?.protect,
          allowAnonymous: this.authnOptions?.allowAnonymous,
        }),
      );
    }
  }

  private installDeferredRoutes(): void {
    if (this.deferredRoutesInstalled) return;
    this.deferredRoutesInstalled = true;

    if (this.openApiConfigured) {
      this.app.get(
        '/api/openapi.json',
        createOpenAPISpec(this.router, {
          title: this.openApiOptions?.title ?? `${this.config.name} API`,
          version: this.config.version ?? '1.0.0',
          description: this.openApiOptions?.description,
        }),
      );
    }

    if (this.docsConfigured) {
      this.app.get('/api/docs/scalar.js', createScalarJs());
      this.app.get(
        '/api/docs',
        createScalarDocs({
          specUrl: this.docsOptions?.specUrl ?? '/api/openapi.json',
          title: `${this.config.name} API`,
        }),
      );
    }

    if (this.rpcConfigured) {
      const traceContext = this.rpcOptions?.traceContext !== false;
      wireRpc(
        this.app,
        this.router,
        this.config.name,
        (c) => this.buildRpcContext(c, traceContext),
        this.rpcOptions ?? undefined,
      );
    }

    for (const route of this.deferredRoutes) {
      if (route.method === 'all') {
        this.app.all(route.path, route.handler);
      } else {
        this.app[route.method](route.path, route.handler);
      }
    }
  }

  /**
   * Builds the app and starts the server.
   *
   * @param options - Server options
   */
  async serve(options?: ServeOptions): Promise<RunningService> {
    await ensureLogging();

    // Run startup hooks before binding the listener.
    for (const hook of this.startupHooks) {
      await hook();
    }

    const app = this.build();
    return startServiceListener(
      app,
      this.config.name,
      this.config.port ?? 3000,
      options,
      this.shutdownHooks,
    );
  }
}
