/**
 * Plugin service factory that applies the mandated `@netscript/service` builder
 * chain in an un-violable order.
 *
 * Plugin connectors describe their service as DATA; the factory drives the
 * builder so the chain order — and the invariant that context precedes RPC and
 * RPC precedes health — cannot be expressed incorrectly by a connector.
 *
 * @module
 */

import {
  type ContextFactory,
  type CorsOptions,
  createService,
  type DbContext,
  type HealthCheck,
  type ServiceBuilder,
  type ServiceConfig,
  type ServiceMiddleware,
  type ServiceRouter,
} from '@netscript/service';

/**
 * Options forwarded to `ServiceBuilder.withDatabase()`.
 *
 * Carries the per-request database context and an optional Prisma-style client
 * used for the readiness health probe.
 */
export interface PluginDatabaseConfig {
  /** Per-request database context merged into the oRPC handler context. */
  readonly context: DbContext;
  /** Optional client used for the database health/readiness check. */
  readonly healthClient?: { $queryRaw(query: TemplateStringsArray): Promise<unknown> };
}

/**
 * Data-only description of a plugin service.
 *
 * Extends {@link ServiceConfig} with the plugin-relevant knobs the factory
 * applies in the mandated builder order. Every field is plain data so a
 * connector cannot reorder the chain.
 */
export interface PluginServiceConfig extends ServiceConfig {
  /** Forwarded to `withRPC({ traceContext })`; defaults to `true`. */
  readonly traceContext?: boolean;
  /** Per-request oRPC context factory applied via `withContext()`. */
  readonly context?: ContextFactory;
  /** Database wiring applied via `withDatabase()`. */
  readonly database?: PluginDatabaseConfig;
  /** Middleware applied in order via `use()`, before context. */
  readonly middleware?: readonly ServiceMiddleware[];
  /** CORS options applied via `withCors()`. When omitted, CORS is enabled with defaults. */
  readonly cors?: CorsOptions;
  /** Disables the default CORS middleware when set to `false`. */
  readonly enableCors?: boolean;
  /** Logger middleware options applied via `withLogger()`. */
  readonly logger?: Parameters<ServiceBuilder<ServiceRouter>['withLogger']>[0];
  /** OpenAPI metadata applied via `withOpenAPI()`. */
  readonly openApi?: { title?: string; description?: string };
  /** Scalar docs options applied via `withDocs()`. */
  readonly docs?: { specUrl?: string };
  /** Health checks applied via `withHealth({ checks })`. */
  readonly healthChecks?: readonly HealthCheck[];
  /** Async startup hooks applied via `onStartup()`, run in order before the server starts. */
  readonly onStartup?: readonly (() => Promise<void>)[];
  /** Async shutdown hooks applied via `onShutdown()`, run in reverse order during graceful shutdown. */
  readonly onShutdown?: readonly (() => Promise<void>)[];
}

/**
 * Builds a plugin service builder with the mandated chain pre-applied.
 *
 * The chain order is fixed: cors → logger → openapi → docs → database →
 * use(middleware) → context → withRPC → withHealth → withServiceInfo →
 * onStartup(hooks) → onShutdown(hooks). The caller receives a ready
 * {@link ServiceBuilder} and only calls `.serve()`.
 *
 * @typeParam TRouter - The oRPC router type served by the plugin.
 * @param router - The oRPC router to serve.
 * @param config - Data-only description of the plugin service.
 * @returns A configured {@link ServiceBuilder} the caller serves with `.serve()`.
 *
 * @example
 * ```ts
 * import { createPluginService } from '@netscript/plugin/service';
 *
 * const running = await createPluginService(router, {
 *   name: 'workers',
 *   version: '1.0.0',
 *   openApi: { title: 'Workers API' },
 * }).serve({ port: 3000 });
 *
 * await running.stop();
 * ```
 */
export function createPluginService<TRouter extends ServiceRouter>(
  router: TRouter,
  config: PluginServiceConfig,
): ServiceBuilder<TRouter> {
  const { name, version, port } = config;
  let builder: ServiceBuilder<TRouter> = createService<TRouter>(router, { name, version, port });

  if (config.enableCors !== false) {
    builder = builder.withCors(config.cors);
  }

  builder = builder.withLogger(config.logger);

  if (config.openApi !== undefined) {
    builder = builder.withOpenAPI(config.openApi);
  }

  if (config.docs !== undefined) {
    builder = builder.withDocs(config.docs);
  }

  if (config.database !== undefined) {
    builder = builder.withDatabase(config.database.context, config.database.healthClient);
  }

  for (const middleware of config.middleware ?? []) {
    builder = builder.use(middleware);
  }

  if (config.context !== undefined) {
    builder = builder.withContext(config.context);
  }

  builder = builder.withRPC({ traceContext: config.traceContext ?? true });

  builder = builder.withHealth(
    config.healthChecks !== undefined ? { checks: [...config.healthChecks] } : undefined,
  );

  builder = builder.withServiceInfo();

  for (const hook of config.onStartup ?? []) {
    builder = builder.onStartup(hook);
  }

  for (const hook of config.onShutdown ?? []) {
    builder = builder.onShutdown(hook);
  }

  return builder;
}
