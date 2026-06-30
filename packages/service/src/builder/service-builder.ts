/**
 * ServiceBuilder - Fluent API for building Deno services.
 *
 * This module is the public surface: the {@link ServiceConfig} and
 * {@link ServiceBuilder} contracts plus the {@link createService} factory. The
 * mutable implementation lives in `service-builder-impl.ts`, with oRPC wiring and
 * HTTP listener mechanics further split into `service-rpc.ts` and
 * `service-listener.ts`.
 *
 * @example
 * ```typescript
 * import { createService } from '@netscript/service';
 *
 * const running = await createService(router, { name: 'users', version: '1.0.0' })
 *   .withCors()
 *   .withLogger()
 *   .withDatabase(db)
 *   .withOpenAPI({ title: 'Users API' })
 *   .withDocs()
 *   .withRPC()
 *   .withHealth()
 *   .serve({ port: 3000 });
 *
 * await running.stop();
 * ```
 *
 * @module
 */

import type { LoggerMiddlewareOptions } from '@netscript/logger/middleware';
import type { AuthnOptions, AuthzOptions } from '../auth/options.ts';
import type { HealthCheck } from '../primitives/health.ts';
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
import { ServiceBuilderImpl } from './service-builder-impl.ts';

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

/** Fluent builder for configuring and materializing a NetScript service. */
export interface ServiceBuilder<TRouter extends ServiceRouter> {
  /** Enables CORS middleware. */
  withCors(options?: CorsOptions): ServiceBuilder<TRouter>;

  /** Enables structured request logging middleware. */
  withLogger(options?: LoggerMiddlewareOptions): ServiceBuilder<TRouter>;

  /** Adds database context, health, and readiness wiring. */
  withDatabase(db: DbContext, healthCheckDb?: Database): ServiceBuilder<TRouter>;

  /** Adds a custom health check. */
  withHealthCheck(check: HealthCheck): ServiceBuilder<TRouter>;

  /** Adds a custom readiness check. */
  withReadinessCheck(check: () => Promise<boolean>): ServiceBuilder<TRouter>;

  /** Configures the OpenAPI JSON endpoint. */
  withOpenAPI(
    options?: { title?: string; description?: string },
  ): ServiceBuilder<TRouter>;

  /** Configures the Scalar API documentation UI. */
  withDocs(options?: { specUrl?: string }): ServiceBuilder<TRouter>;

  /** Configures oRPC RPC and OpenAPI request handlers. */
  withRPC(
    options?: {
      rpcPath?: string;
      apiPath?: string;
      debug?: boolean;
      traceContext?: boolean;
    },
  ): ServiceBuilder<TRouter>;

  /**
   * Enables authentication for guarded service paths.
   *
   * @example
   * ```typescript
   * createService(router, { name: 'users' })
   *   .withAuthn({ authenticator })
   *   .withRPC();
   * ```
   */
  withAuthn(options: AuthnOptions): ServiceBuilder<TRouter>;

  /**
   * Enables authorization for authenticated requests.
   *
   * @example
   * ```typescript
   * createService(router, { name: 'users' })
   *   .withAuthn({ authenticator })
   *   .withAuthz({ authorizer })
   *   .withRPC();
   * ```
   */
  withAuthz(options: AuthzOptions): ServiceBuilder<TRouter>;

  /** Sets the per-request oRPC context factory. */
  withContext(factory: ContextFactory): ServiceBuilder<TRouter>;

  /** Registers an async startup hook. */
  onStartup(hook: () => Promise<void>): ServiceBuilder<TRouter>;

  /**
   * Registers an async teardown hook run during graceful shutdown.
   *
   * @example
   * ```typescript
   * const running = await createService(router, { name: 'users' })
   *   .onShutdown(async () => {
   *     await db.$disconnect();
   *   })
   *   .serve({ port: 3000 });
   *
   * await running.stop();
   * ```
   */
  onShutdown(hook: ShutdownHook): ServiceBuilder<TRouter>;

  /** Configures health check endpoints. */
  withHealth(
    options?: { checks?: HealthCheck[]; includeDetails?: boolean },
  ): ServiceBuilder<TRouter>;

  /** Adds custom middleware to the service. */
  use(middleware: ServiceMiddleware): ServiceBuilder<TRouter>;

  /** Adds a custom (raw, non-oRPC) route to the service. `'all'` matches every method. */
  route(
    method: ServiceRouteMethod,
    path: string,
    handler: ServiceHandler,
  ): ServiceBuilder<TRouter>;

  /** Configures the root service information endpoint. */
  withServiceInfo(): ServiceBuilder<TRouter>;

  /** Builds a mountable service app without starting a listener. */
  build(): ServiceApp;

  /** Starts the service listener. */
  serve(options?: ServeOptions): Promise<RunningService>;
}

/**
 * Factory function to create a new service builder.
 *
 * @example
 * ```typescript
 * const running = await createService(router, { name: 'users', version: '1.0.0' })
 *   .withCors()
 *   .withLogger()
 *   .withOpenAPI()
 *   .withDocs()
 *   .withRPC()
 *   .withHealth()
 *   .serve({ port: 3000 });
 *
 * await running.stop();
 * ```
 */
export function createService<T extends ServiceRouter>(
  router: T,
  config: ServiceConfig,
): ServiceBuilder<T> {
  return new ServiceBuilderImpl(router, config);
}
