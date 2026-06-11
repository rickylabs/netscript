/**
 * @netscript/service
 *
 * Service bootstrap factory with health, OpenAPI, and RPC setup.
 * Reduces service main.ts files from 150+ lines to 1-10 lines.
 *
 * @example Layer 3: One-liner (most common)
 * ```typescript
 * import { defineService } from '@netscript/service';
 * import { router } from './router.ts';
 * import { db } from '@database';
 *
 * await defineService(router, { name: 'users', port: 3000, db });
 * ```
 *
 * @example Layer 2: Customized
 * ```typescript
 * import { createService } from '@netscript/service';
 *
 * await createService(router, { name: 'custom' })
 *   .withCors({ origin: 'https://example.com' })
 *   .withLogger()
 *   .withDatabase(db)
 *   .withOpenAPI({ title: 'Custom API' })
 *   .withDocs()
 *   .withRPC()
 *   .withHealth()
 *   .serve({ port: 3005 });
 * ```
 *
 * @example Layer 1: Full control
 * ```typescript
 * import { createHealthHandler, healthChecks } from '@netscript/service';
 *
 * const app = new Hono();
 * app.get('/health', createHealthHandler({
 *   checks: [healthChecks.database(db)],
 * }));
 * ```
 *
 * @module
 */

// Layer 1: Primitives
export {
  createHealthHandler,
  createLivenessHandler,
  createReadinessHandler,
  type HealthCheck,
  healthChecks,
  type HealthHandlerOptions,
  type HealthResponse,
} from './src/primitives/health.ts';

export {
  createOpenAPISpec,
  createScalarDocs,
  createScalarJs,
  type OpenAPIConfig,
  type ScalarDocsOptions,
} from './src/primitives/openapi.ts';

export {
  createErrorHandler,
  createNotFoundHandler,
  createOpenAPIHandler,
  createRPCHandler,
  createRPCPlugins,
  type RPCHandlerConfig,
} from './src/primitives/handlers.ts';

export type {
  ContextFactory,
  CorsOptions,
  Database,
  DbContext,
  FetchHandler,
  FetchHandlerResult,
  RunningService,
  RunningServiceAddress,
  ServiceApp,
  ServiceContext,
  ServiceHandler,
  ServiceHandlerPlugin,
  ServiceMiddleware,
  ServiceRequest,
  ServiceRouter,
} from './src/types.ts';

// Layer 2: Builders
export {
  createService,
  ServiceBuilder,
  type ServiceConfig,
} from './src/builder/service-builder.ts';

// Re-export logger types for convenience
export type { LoggerMiddlewareOptions } from '@netscript/logger/middleware';

// Layer 3: Presets
export {
  defineService,
  type DefineServiceOptions,
} from './src/presets/define-service.ts';
