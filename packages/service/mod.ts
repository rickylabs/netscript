/**
 * @module @netscript/service
 *
 * Service bootstrap builders, health probes, and Hono/oRPC runtime wiring for
 * NetScript applications.
 *
 * The package has three layers. Layer 1 exposes small primitives for health,
 * error, RPC, OpenAPI, and Scalar docs handlers. Layer 2 exposes
 * `createService()`, a fluent builder that materializes a mountable
 * `ServiceApp` or starts a listener. Layer 3 exposes `defineService()`, the
 * preset used by generated service entrypoints.
 *
 * The service router is always an input to the builder. `build()` returns a
 * non-listening `ServiceApp`, which keeps the RFC 14 unified-platform seam open
 * for callers that mount service apps into another host. `serve()` starts a
 * Deno listener and returns a `RunningService` handle with `stop()` for tests,
 * local development, and process supervisors.
 *
 * Public types are package-owned structural mirrors. Callers do not need to
 * import Hono or oRPC types to describe a service surface. Runtime
 * interoperability still uses the real Hono app and oRPC handlers internally.
 *
 * `LoggerMiddlewareOptions` is re-exported from the sibling
 * `@netscript/logger/middleware` package because it is a first-party
 * `@netscript/*` contract, not an upstream vendor surface.
 *
 * @example Define a generated service entrypoint.
 * ```typescript
 * import { defineService, type ServiceRouter } from '@netscript/service';
 *
 * declare const router: ServiceRouter;
 *
 * const service = await defineService(router, {
 *   name: 'users',
 *   port: 3000,
 * });
 *
 * await service.stop();
 * ```
 *
 * @example Customize the builder before serving.
 * ```typescript
 * import { createService } from '@netscript/service';
 *
 * const service = await createService(router, { name: 'custom' })
 *   .withCors({ origin: 'https://example.com' })
 *   .withLogger()
 *   .withOpenAPI({ title: 'Custom API' })
 *   .withDocs()
 *   .withRPC()
 *   .withHealth()
 *   .serve({ port: 3005 });
 *
 * await service.stop();
 * ```
 *
 * @example Use health primitives directly in a host app.
 * ```typescript
 * import { createHealthHandler, healthChecks } from '@netscript/service';
 *
 * app.get('/health', createHealthHandler({
 *   checks: [healthChecks.database(db)],
 * }));
 * ```
 */

// Layer 1: Primitives
export {
  createHealthHandler,
  createLivenessHandler,
  createReadinessHandler,
  HEALTH_STATUS,
  type HealthCheck,
  type HealthCheckAdapterOptions,
  healthChecks,
  type HealthHandlerOptions,
  type HealthResponse,
  type HealthStatus,
} from './src/primitives/health.ts';

export type { AuthnOptions, AuthzOptions, ContractAuthorizerOptions } from './src/auth/options.ts';
export type {
  ContractAuthorizerFactory,
  ContractPolicyAuthorizerPort,
  ContractPolicyBindingOptions,
  ContractPolicyContract,
  ContractPolicyRpcRouteAlias,
  ProcedureAccessPolicy,
  ProcedurePolicyRequest,
  ProcedurePolicyResolution,
  ProcedurePolicyResolver,
} from './src/auth/contract-policy.ts';
export { createContractAuthorizer } from './src/auth/contract-authorizer.ts';
export type {
  AuthenticatorPort,
  AuthnRequest,
  AuthnResult,
  AuthorizerMatch,
  AuthorizerPort,
  AuthzDecision,
  AuthzRequest,
  MatchAwareAuthorizerPort,
  Principal,
} from './src/auth/types.ts';

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

export {
  buildServiceRpcPath,
  DEFAULT_RPC_API_PATH,
  DEFAULT_RPC_API_VERSION,
  type ServiceRpcPathOptions,
} from './src/primitives/rpc-path.ts';

export type {
  ContextFactory,
  CorsOptions,
  Database,
  DbContext,
  FetchHandler,
  FetchHandlerResult,
  RunningService,
  RunningServiceAddress,
  ServeOptions,
  ServiceApp,
  ServiceContext,
  ServiceErrorHandler,
  ServiceHandler,
  ServiceHandlerContext,
  ServiceHandlerPlugin,
  ServiceMiddleware,
  ServiceNotFoundHandler,
  ServiceRequest,
  ServiceRouteMethod,
  ServiceRouter,
  ServiceTlsOptions,
  ShutdownContext,
  ShutdownHook,
  ShutdownHookOutcome,
  ShutdownReason,
  ShutdownReport,
} from './src/types.ts';

export {
  createRuntimeHost,
  RUNTIME_HOST_SHUTDOWN_PHASES,
  type RuntimeHost,
  type RuntimeHostDrain,
  type RuntimeHostDrainOutcome,
  type RuntimeHostDrainStatus,
  type RuntimeHostOptions,
  type RuntimeHostShutdownPhase,
  type RuntimeHostShutdownReport,
  type RuntimeHostState,
} from './src/runtime/runtime-host.ts';

// Layer 2: Builders
export {
  createService,
  type ServiceBuilder,
  type ServiceConfig,
} from './src/builder/service-builder.ts';

// Re-export logger types for convenience
export type { LoggerMiddlewareOptions } from '@netscript/logger/middleware';

// Layer 3: Presets
export { defineService, type DefineServiceOptions } from './src/presets/define-service.ts';
