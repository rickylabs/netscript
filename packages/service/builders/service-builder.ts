/**
 * ServiceBuilder - Fluent API for building Deno services.
 *
 * @example
 * ```typescript
 * import { createService } from '@netscript/service';
 *
 * await createService(router, { name: 'users', version: '1.0.0' })
 *   .withCors()
 *   .withLogger()
 *   .withDatabase(db)
 *   .withOpenAPI({ title: 'Users API' })
 *   .withDocs()
 *   .withRPC()
 *   .withHealth()
 *   .serve({ port: 3000 });
 * ```
 *
 * @module
 */

import { type Context, Hono, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { ensureLogging } from '@netscript/logger';
import { loggerMiddleware, type LoggerMiddlewareOptions } from '@netscript/logger/middleware';

// Context factory type for oRPC context injection
type ContextFactory = (c: Context) => Record<string, unknown>;
import {
  createHealthHandler,
  createLivenessHandler,
  createReadinessHandler,
  type HealthCheck,
  healthChecks,
} from '../primitives/health.ts';
import { createOpenAPISpec, createScalarDocs, createScalarJs } from '../primitives/openapi.ts';
import {
  createErrorHandler,
  createNotFoundHandler,
  createOpenAPIHandler,
  createRPCHandler,
} from '../primitives/handlers.ts';

// Router type that matches oRPC router structure
// deno-lint-ignore no-explicit-any
type AnyRouter = Record<string, any>;

// Database type for health checks
interface Database {
  $queryRaw: (query: TemplateStringsArray) => Promise<unknown>;
}

/** Any database context — single client or multi-db record. */
// deno-lint-ignore no-explicit-any
type AnyDbContext = Record<string, any>;

/**
 * Service configuration options.
 */
export interface ServiceConfig {
  /** Service name (used for logging, telemetry, health checks) */
  name: string;
  /** Service version (e.g., '1.0.0') */
  version?: string;
  /** Default port if not specified in serve() */
  port?: number;
}

/**
 * Fluent builder for creating Deno services with consistent patterns.
 *
 * Provides a Layer 2 API that allows customization while maintaining
 * sensible defaults. For a Layer 3 one-liner, use `defineService()`.
 *
 * @example
 * ```typescript
 * const builder = new ServiceBuilder(router, { name: 'users' })
 *   .withCors()
 *   .withHealth();
 *
 * // Get the Hono app for additional customization
 * const app = builder.build();
 *
 * // Or serve directly
 * await builder.serve({ port: 3000 });
 * ```
 */
export class ServiceBuilder<TRouter extends AnyRouter> {
  private app: Hono;
  private router: TRouter;
  private config: ServiceConfig;
  private healthChecks: HealthCheck[] = [];
  private readinessChecks: Array<() => Promise<boolean>> = [];
  private rpcConfigured = false;
  private openApiConfigured = false;
  private docsConfigured = false;
  private healthConfigured = false;
  private loggerEnabled = false;
  private startupHooks: Array<() => Promise<void>> = [];
  private contextFactory: ContextFactory = () => ({});
  private database: AnyDbContext | null = null;

  constructor(router: TRouter, config: ServiceConfig) {
    this.app = new Hono();
    this.router = router;
    this.config = config;
  }

  /**
   * Enables CORS middleware.
   *
   * @param options - CORS configuration options (from hono/cors)
   */
  withCors(options?: Parameters<typeof cors>[0]) {
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
  withLogger(options?: LoggerMiddlewareOptions) {
    this.loggerEnabled = true;
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
  withDatabase(db: AnyDbContext, healthCheckDb?: Database) {
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
  addHealthCheck(check: HealthCheck) {
    this.healthChecks.push(check);
    return this;
  }

  /**
   * Adds a custom readiness check.
   *
   * @param check - Async function returning true if ready
   */
  addReadinessCheck(check: () => Promise<boolean>) {
    this.readinessChecks.push(check);
    return this;
  }

  /**
   * Configures OpenAPI spec generation endpoint at /api/openapi.json.
   *
   * @param options - OpenAPI configuration
   */
  withOpenAPI(options?: { title?: string; description?: string }) {
    if (this.openApiConfigured) return this;
    this.openApiConfigured = true;

    this.app.get(
      '/api/openapi.json',
      createOpenAPISpec(this.router, {
        title: options?.title ?? `${this.config.name} API`,
        version: this.config.version ?? '1.0.0',
        description: options?.description,
      }),
    );
    return this;
  }

  /**
   * Configures Scalar documentation UI at /api/docs.
   *
   * @param options - Scalar docs configuration
   */
  withDocs(options?: { specUrl?: string }) {
    if (this.docsConfigured) return this;
    this.docsConfigured = true;

    // Serve the bundled Scalar JS for offline usage
    this.app.get('/api/docs/scalar.js', createScalarJs());

    this.app.get(
      '/api/docs',
      createScalarDocs({
        specUrl: options?.specUrl ?? '/api/openapi.json',
        title: `${this.config.name} API`,
      }),
    );
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
    options?: { rpcPath?: string; apiPath?: string; debug?: boolean; traceContext?: boolean },
  ) {
    if (this.rpcConfigured) return this;
    this.rpcConfigured = true;

    const rpcPath = options?.rpcPath ?? '/api/rpc';
    const apiPath = options?.apiPath ?? '/api';
    const debug = options?.debug;
    const traceContext = options?.traceContext !== false; // Default true

    const rpcHandler = createRPCHandler(this.router, { serviceName: this.config.name, debug });
    const openApiHandler = createOpenAPIHandler(this.router, {
      serviceName: this.config.name,
      debug,
    });

    // Helper to build context with database and optional trace headers
    const buildContext = (c: Context): Record<string, unknown> => {
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

      return ctx;
    };

    // oRPC RPC endpoint (for type-safe clients)
    this.app.use(`${rpcPath}/*`, async (c: Context, next: () => Promise<void>) => {
      const { matched, response } = await rpcHandler.handle(c.req.raw, {
        prefix: rpcPath as `/${string}`,
        context: buildContext(c),
      });

      if (matched) {
        return c.newResponse(response.body, response);
      }

      return await next();
    });

    // oRPC OpenAPI endpoint (for REST clients)
    this.app.use(`${apiPath}/*`, async (c: Context, next: () => Promise<void>) => {
      const { matched, response } = await openApiHandler.handle(c.req.raw, {
        prefix: apiPath as `/${string}`,
        context: buildContext(c),
      });

      if (matched) {
        return c.newResponse(response.body, response);
      }

      return await next();
    });

    return this;
  }

  /**
   * Sets a custom context factory for oRPC handlers.
   *
   * Use this to inject custom context into all oRPC handlers.
   *
   * @param factory - Function that receives Hono context and returns oRPC context
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
  withContext(factory: ContextFactory) {
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
   *     console.log('Jobs registered');
   *   })
   *   .serve()
   * ```
   */
  onStartup(hook: () => Promise<void>) {
    this.startupHooks.push(hook);
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
  withHealth(options?: { checks?: HealthCheck[]; includeDetails?: boolean }) {
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
   * @param middleware - Hono middleware handler
   */
  use(middleware: MiddlewareHandler) {
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
  // deno-lint-ignore no-explicit-any
  route(method: 'get' | 'post' | 'put' | 'delete' | 'patch', path: string, handler: any) {
    this.app[method](path, handler);
    return this;
  }

  /**
   * Configures the service root endpoint with service info.
   */
  withServiceInfo() {
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
   * Builds and returns the Hono app instance.
   * Adds error handlers and returns the app for further customization.
   */
  build(): Hono {
    this.app.notFound(createNotFoundHandler(this.config.name));
    this.app.onError(createErrorHandler(this.config.name));
    return this.app;
  }

  /**
   * Builds the app and starts the server.
   *
   * @param options - Server options
   */
  async serve(options?: { port?: number }): Promise<Hono> {
    // Ensure logging is configured if withLogger() was called
    if (this.loggerEnabled) {
      await ensureLogging();
    }

    // Run startup hooks
    for (const hook of this.startupHooks) {
      await hook();
    }

    const app = this.build();
    const port = options?.port ?? this.config.port ?? 3000;

    console.log(`🚀 ${this.config.name} running on http://localhost:${port}`);
    console.log(`📚 API Docs: http://localhost:${port}/api/docs`);
    console.log(`📄 OpenAPI Spec: http://localhost:${port}/api/openapi.json`);
    console.log(`💚 Health: http://localhost:${port}/health`);

    // Note: Deno.serve is non-blocking in this context, it returns immediately
    Deno.serve({ port }, app.fetch);

    return app;
  }
}

/**
 * Factory function to create a new ServiceBuilder.
 *
 * @example
 * ```typescript
 * await createService(router, { name: 'users', version: '1.0.0' })
 *   .withCors()
 *   .withLogger()
 *   .withOpenAPI()
 *   .withDocs()
 *   .withRPC()
 *   .withHealth()
 *   .serve({ port: 3000 });
 * ```
 */
export function createService<T extends AnyRouter>(
  router: T,
  config: ServiceConfig,
): ServiceBuilder<T> {
  return new ServiceBuilder(router, config);
}
