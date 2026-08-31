---
layout: layouts/base.vto
title: "@netscript/service"
---

# `@netscript/service`

Service bootstrap builders, health probes, and Hono/oRPC runtime wiring for NetScript
applications. This page is written against the package's public surface reported by `deno doc`.
For the full index of packages and plugins return to the
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

When a procedure declares `NetScriptProcedureMeta.access`, `createOpenAPISpec()` preserves the
operation and projects access as follows:

| Contract declaration | OpenAPI operation |
| --- | --- |
| `authentication: 'none'` | `security: []` |
| `authentication: 'required'` | `security: [{ bearerAuth: scopes }]` |
| Required `authorization.roles` | `x-netscript-roles: roles` |
| `authentication: 'optional'` | `security: [{}, { bearerAuth: [] }]` |
| No authentication declaration | No generated operation-level `security` field |

The generated `bearerAuth` component uses HTTP bearer authentication. Optional access remains
visible in the generated specification even though the current contract authorizer rejects it at
construction.

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
| `ServiceHandlerContext<TCustom>` | type alias | Readonly custom context plus optional framework-owned `db`, `traceHeaders`, and `principal` fields. |
| `Principal` | interface | Authenticated identity with subject, readonly scopes/roles, scheme, and verified claims. |
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
| `ContextFactory<TCustom>` | `type ContextFactory<TCustom extends object = Record<never, never>> = (context: ServiceContext) => TCustom` | Creates the custom part of each service handler context. |
| `ServiceHandlerContext<TCustom>` | `type ServiceHandlerContext<TCustom extends object = Record<never, never>> = Readonly<TCustom> & { db?; traceHeaders?; principal?; }` | Context visible after framework fields are composed. `principal` is optional and must be narrowed by handlers that require identity. |
| `DbContext` | `type DbContext = Record<string, unknown>` | Database context injected into service handler context. |

## Contract-declared authentication and authorization

`@netscript/service/auth` is provider-agnostic. `.withAuthn()` turns a request into the
service-owned `Principal`; `.withAuthz()` decides whether that principal may invoke the matched
procedure. The primary policy source is the procedure's own
`.meta({ access: { authentication, authorization? } })` declaration:

```ts
import { createService } from '@netscript/service';
import {
  createContractAuthorizer,
  createStaticCredentialAuthenticator,
} from '@netscript/service/auth';
import { OrdersContractV1 } from '@example/contracts';
import { router } from './router.ts';

const authenticator = createStaticCredentialAuthenticator({
  credentials: {
    local: {
      subject: 'service:orders',
      scopes: ['orders:read'],
      roles: ['service'],
    },
  },
});

const app = createService(router, { name: 'orders' })
  .withRPC()
  .withAuthn({ authenticator })
  .withAuthz({ authorizer: createContractAuthorizer(OrdersContractV1) })
  .build();
```

Contract enforcement is opt-in: existing unguarded services, scaffolds, and standalone
`createScopeAuthorizer()` consumers are unchanged. It activates only when an application passes a
`createContractAuthorizer(contract, { fallback? })` result to `.withAuthz()`.

Contract metadata wins on disagreement. A match-aware fallback, including
`createScopeAuthorizer()`, is consulted only when a matched procedure has no access metadata. No
metadata and no matching fallback rule denies, regardless of the fallback's standalone
`denyByDefault` option. The builder binds one resolver to the actual REST and RPC paths and their
aliases and shares it between authn and authz, so a declared public procedure is not rejected by an
earlier authentication stage.

`createScopeAuthorizer()` remains a supported standalone legacy path-prefix authorizer and a
match-aware migration fallback; it is not deprecated.

`authentication: 'optional'` is declared for future support, currently rejected.
`createContractAuthorizer()` throws
`[netscript.service.contract-policy] optional authentication is unsupported: <procedure>` during
construction, before any request.

### `@netscript/service/auth` surface

| Symbol | Description |
| --- | --- |
| `createContractAuthorizer` | Traverses a metadata-bearing contract and returns an opt-in authorizer bound by the service builder. |
| `createScopeAuthorizer` | Ordered scope/role rules usable standalone or as a match-aware legacy fallback. |
| `createStaticCredentialAuthenticator` | Maps configured credentials to principals. |
| `createTrustedHeaderAuthenticator` | Maps trusted upstream identity headers to principals. |
| `Principal` | Service-owned identity contract. |
| `ContractPolicyAuthorizerPort` | Authorizer that binds to the builder's REST/RPC projection paths. |

## Exports

The following entrypoints are published alongside the root export:

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/service` | `./mod.ts` | Full service surface (documented above). |
| `@netscript/service/auth` | `./src/auth/mod.ts` | Service authentication and authorization handlers. |
| `@netscript/service/rpc-path` | `./src/primitives/rpc-path.ts` | Type-safe RPC route mapping utilities. |

---

Back to the [reference overview](/reference/).
