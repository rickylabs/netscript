---
layout: layouts/base.vto
title: "@netscript/service"
---

# `@netscript/service`

Service bootstrap builders, health probes, and Hono/oRPC runtime wiring for NetScript
applications. This page is generated from the package's public surface with `deno doc`
(US-2). For the full index of packages and plugins return to the
[reference overview](/reference/).

The package has three layers. **Layer 1** exposes small primitives for health, error, RPC,
OpenAPI, and Scalar docs handlers. **Layer 2** exposes `createService()`, a fluent builder
that materializes a mountable `ServiceApp` or starts a listener. **Layer 3** exposes
`defineService()`, the preset used by generated service entrypoints.

The service router is always an input to the builder. `build()` returns a non-listening
`ServiceApp`, which keeps the RFC 14 unified-platform seam open for callers that mount
service apps into another host. `serve()` starts a Deno listener and returns a
`RunningService` handle with `stop()` for tests, local development, and process supervisors.

Public types are package-owned structural mirrors: callers do not need to import Hono or oRPC
types to describe a service surface. Runtime interoperability still uses the real Hono app and
oRPC handlers internally. `LoggerMiddlewareOptions` is re-exported from the sibling
[`@netscript/logger/middleware`](/reference/logger/) package because it is a first-party
`@netscript/*` contract, not an upstream vendor surface.

## Builder and presets

| Symbol | Signature | Description |
| --- | --- | --- |
| `createService` | `function createService<T extends ServiceRouter>(router: T, config: ServiceConfig): ServiceBuilder<T>` | Factory function to create a new service builder. |
| `defineService` | `async function defineService<T extends ServiceRouter>(router: T, options: DefineServiceOptions): Promise<RunningService>` | One-liner preset for creating a fully-configured service. |

## Health primitives

| Symbol | Signature | Description |
| --- | --- | --- |
| `createHealthHandler` | `function createHealthHandler(options?: HealthHandlerOptions): ServiceHandler` | Creates a comprehensive health check handler that runs all checks in parallel. |
| `createLivenessHandler` | `function createLivenessHandler(): ServiceHandler` | Creates a simple liveness check handler. |
| `createReadinessHandler` | `function createReadinessHandler(checks: Array<() => Promise<boolean>>): ServiceHandler` | Creates a readiness check handler that runs multiple async checks. |
| `healthChecks` | `const healthChecks: { database; kv; service; custom }` | Pre-built health checks for common dependencies (`database`, `kv`, `service`, `custom`). |
| `HEALTH_STATUS` | `const HEALTH_STATUS: { healthy; degraded; unhealthy }` | Health status values emitted by service health handlers. |

## RPC, OpenAPI, and docs handlers

| Symbol | Signature | Description |
| --- | --- | --- |
| `createRPCHandler` | `function createRPCHandler<T extends ServiceRouter>(router: T, config?: RPCHandlerConfig): FetchHandler` | Creates an oRPC RPC handler for type-safe client communication. |
| `createRPCPlugins` | `function createRPCPlugins(config: RPCHandlerConfig): ServiceHandlerPlugin[]` | Creates the standard set of oRPC plugins. |
| `createOpenAPIHandler` | `function createOpenAPIHandler<T extends ServiceRouter>(router: T, config?: RPCHandlerConfig): FetchHandler` | Creates an oRPC OpenAPI handler for REST-style API access. |
| `createOpenAPISpec` | `function createOpenAPISpec<T extends ServiceRouter>(router: T, config: OpenAPIConfig): ServiceHandler` | Creates an OpenAPI specification endpoint handler. |
| `createScalarDocs` | `function createScalarDocs(options: ScalarDocsOptions): ServiceHandler` | Creates a Scalar API documentation UI handler. |
| `createScalarJs` | `function createScalarJs(): ServiceHandler` | Creates a handler to serve the bundled Scalar JS file. |

## Error and routing handlers

| Symbol | Signature | Description |
| --- | --- | --- |
| `createErrorHandler` | `function createErrorHandler(serviceName: string): ServiceErrorHandler` | Creates a global error handler for uncaught exceptions. |
| `createNotFoundHandler` | `function createNotFoundHandler(serviceName: string): ServiceHandler` | Creates a 404 Not Found handler for unmatched routes. |

## Configuration and option types

| Symbol | Kind | Description |
| --- | --- | --- |
| `ServiceConfig` | interface | Service configuration options (input to `createService`). |
| `DefineServiceOptions` | interface | Options for the `defineService` preset. |
| `ServeOptions` | interface | Options for starting a service listener. |
| `CorsOptions` | interface | CORS options supported by `withCors()`. |
| `OpenAPIConfig` | interface | Configuration for OpenAPI spec generation. |
| `RPCHandlerConfig` | interface | Configuration options for RPC handlers. |
| `ScalarDocsOptions` | interface | Configuration for the Scalar docs UI. |
| `HealthHandlerOptions` | interface | Options for `createHealthHandler`. |
| `LoggerMiddlewareOptions` | interface | Options for the logger middleware (re-exported from `@netscript/logger/middleware`). |

## Service surface types

| Symbol | Kind | Description |
| --- | --- | --- |
| `ServiceBuilder` | interface | Fluent builder for configuring and materializing a NetScript service. |
| `ServiceApp` | interface | Minimal mountable service application returned by `build()`. |
| `RunningService` | interface | Running service handle returned by `serve()` and `defineService()`. |
| `RunningServiceAddress` | interface | Network address assigned to a running service listener. |
| `ServiceContext` | interface | Minimal context shape exposed to service middleware and handlers. |
| `ServiceRequest` | interface | Minimal request shape exposed to service middleware and handlers. |
| `ServiceMiddleware` | interface | Middleware function accepted by the service builder. |
| `ServiceHandler` | interface | Service route handler accepted by the builder route API. |
| `ServiceHandlerPlugin` | interface | Structural oRPC plugin accepted by service handler factories. |
| `ServiceErrorHandler` | interface | Error handler used by service applications. |
| `FetchHandler` | interface | Structural fetch handler used by RPC and OpenAPI service adapters. |
| `FetchHandlerResult` | interface | Result returned by oRPC-compatible fetch handlers. |

## Health types

| Symbol | Kind | Description |
| --- | --- | --- |
| `HealthCheck` | interface | A single health check definition. |
| `HealthResponse` | interface | Response format for the health endpoint. |
| `Database` | interface | Database client capable of a health-check query. |
| `HealthStatus` | type alias | Health status emitted by the service health endpoint (`typeof HEALTH_STATUS[keyof typeof HEALTH_STATUS]`). |

## Router and context type aliases

| Symbol | Signature | Description |
| --- | --- | --- |
| `ServiceRouter` | `type ServiceRouter = Record<string, unknown>` | Router definition accepted by the service builder and handler factories. |
| `ContextFactory` | `type ContextFactory = (context: ServiceContext) => Record<string, unknown>` | Creates per-request service handler context. |
| `DbContext` | `type DbContext = Record<string, unknown>` | Database context injected into service handler context. |

## Exports

`@netscript/service` publishes a single root entrypoint. There are no sub-path exports.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/service` | `./mod.ts` | Full service surface (documented above). |

---

Back to the [reference overview](/reference/).
