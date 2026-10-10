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

## Request-body limit

| Symbol | Signature | Description |
| --- | --- | --- |
| `createBodyLimitMiddleware` | `function createBodyLimitMiddleware(options: ServiceBodyLimitOptions): ServiceMiddleware` | Creates middleware that rejects request bodies larger than `maxBytes` with a typed JSON `413` before any handler parses them. Throws `RangeError` unless `maxBytes` is a positive safe integer. |
| `PAYLOAD_TOO_LARGE_ERROR` | `const PAYLOAD_TOO_LARGE_ERROR: 'PAYLOAD_TOO_LARGE'` | Error code carried by the JSON body of a `413` body-limit rejection. |

The builder form is `createService(...).withBodyLimit({ maxBytes })` and the preset form is
`defineService(router, { bodyLimit: { maxBytes } })`. A request that declares `Content-Length` is
rejected from the header. A chunked request is counted as it streams and rejected once it passes
the limit, so at most `maxBytes` plus one chunk is buffered. The rejection body is a
`PayloadTooLargeResponse`: `{ error: 'PAYLOAD_TOO_LARGE', message, maxBytes }`. There is no read
timeout.

### Pipeline order

`defineService` and a builder chain installed in the same order produce this request pipeline:

| Order | Stage | Installed by |
| --- | --- | --- |
| 1 | Tracing | always, at construction |
| 2 | CORS | `withCors()` |
| 3 | Request logging | `withLogger()` |
| 4 | Caller middleware, in order | `use()` / `DefineServiceOptions.middleware` |
| 5 | Authentication, then authorization | `withAuthn()` / `withAuthz()`, installed by `build()` |
| 6 | Request-body limit | `withBodyLimit()` / `DefineServiceOptions.bodyLimit`, installed by `build()` |
| 7 | OpenAPI spec, docs, RPC and OpenAPI projections, custom routes | `build()` |

`use()` registers middleware immediately, so builder middleware runs in call order relative to
`withCors()` and `withLogger()`. It always runs before the stages that `build()` installs. A
rejection returned at stage 4 or 6 keeps the CORS headers and is logged.

## Error and routing handlers

| Symbol | Signature | Description |
| --- | --- | --- |
| `createErrorHandler` | `function createErrorHandler(serviceName: string): ServiceErrorHandler` | Creates a global error handler for uncaught exceptions. |
| `createNotFoundHandler` | `function createNotFoundHandler(serviceName: string): ServiceHandler` | Creates a 404 Not Found handler for unmatched routes. |

## Configuration and option types

| Symbol | Kind | Description |
| --- | --- | --- |
| `ServiceConfig` | interface | Service configuration options (input to `createService`). |
| `DefineServiceOptions` | interface | Options for the `defineService` preset, including `cors` (explicit origins or the `NETSCRIPT_CORS_ORIGINS` workspace allowlist), `middleware` (caller middleware after CORS and logging, before auth) and the opt-in `bodyLimit`. |
| `ServiceBodyLimitOptions` | interface | `{ maxBytes }` request-body limit accepted by `withBodyLimit()` and `DefineServiceOptions.bodyLimit`. |
| `PayloadTooLargeResponse` | interface | JSON body of a `413` body-limit rejection: `{ error: 'PAYLOAD_TOO_LARGE', message, maxBytes }`. |
| `ServeOptions` | interface | Options for starting a service listener. |
| `CorsOptions` | interface | CORS options supported by `withCors()`. Omitted `origin` reads comma-separated exact HTTP(S) origins from `NETSCRIPT_CORS_ORIGINS`; unset/blank denies cross-origin access. Explicit origins override the environment; wildcard with credentials fails `build()`. |
| `OpenAPIConfig` | interface | Configuration for OpenAPI spec generation. |
| `RPCHandlerConfig` | interface | Configuration options for RPC handlers. |
| `ScalarDocsOptions` | interface | Configuration for the Scalar docs UI. |
| `HealthHandlerOptions` | interface | Options for `createHealthHandler`. |
| `LoggerMiddlewareOptions` | interface | Options for the logger middleware (re-exported from `@netscript/logger/middleware`). |

### CORS origins

`DefineServiceOptions.cors` configures the same policy as `withCors()`. If `origin` is omitted,
the builder snapshots `NETSCRIPT_CORS_ORIGINS`: comma-separated exact HTTP(S) origins, without
paths or trailing slashes. Unset or blank means no cross-origin browser access. For example,
`NETSCRIPT_CORS_ORIGINS='https://app.example,https://admin.example'` permits those two origins.
An explicit `cors: { origin: ['https://app.example'] }` overrides the environment; `origin: []`
denies all cross-origin access. Invalid environment entries fail configuration. Wildcard origins
with `credentials: true` fail before the listener starts.

Generated CLI/Aspire helpers supply the enabled web apps' allocated HTTP endpoint origins to every
service and plugin service resource. This generated value overrides a declared resource environment
value; a workspace without enabled web apps supplies an empty allowlist. Independent services must
configure their launch environment themselves. Origins outside the allowlist receive no
`Access-Control-Allow-Origin` header. CORS controls browser response access; it does not authenticate
callers. The chosen [browser authentication topology](https://github.com/rickylabs/netscript/blob/main/docs/architecture/doctrine/07-composition-and-extension.md#browser-authentication-topology-008-owner-decision)
uses a BFF; scaffolding that topology is separate follow-up scope.

### Listener bind address

`ServeOptions.hostname` and `DefineServiceOptions.hostname` choose the interface the listener binds.
The value is forwarded unchanged to `Deno.serve` on both the plain and the TLS listener, and
`RunningService.addr.hostname` reports the address that was bound. Omitting it keeps Deno's
default, so the listener binds every IPv4 interface (`0.0.0.0`). Pass `'127.0.0.1'` to keep an
endpoint, such as an unauthenticated local control surface, reachable only from the same machine.

```ts
import { createService } from '@netscript/service';

const running = await createService({}, { name: 'control' })
  .withHealth()
  .serve({ hostname: '127.0.0.1', port: 0 }); // port 0: the OS picks a free port

console.log(running.addr.hostname); // '127.0.0.1'
await running.stop();
```

Generated service scaffolds leave `hostname` unset. Inside a container, a loopback-only bind makes
the service unreachable through its published ports, so narrow the bind per service, where you know
who must reach it.

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
`createContractAuthorizer(contract, { fallback?, rawRoutes? })` result to `.withAuthz()`.

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

### Raw routes beside a contract router

A request under the guarded prefix that matches no contract procedure is denied with
`authz.no-contract-procedure`, including raw routes added with `.route(method, path, handler)`.
Declare each raw route that should be served through the `rawRoutes` option:

```ts
const authorizer = createContractAuthorizer(OrdersContractV1, {
  rawRoutes: [{ path: '/api/tools/mcp', authentication: 'required' }],
});

const app = createService(router, { name: 'orders' })
  .withRPC()
  .withAuthn({ authenticator })
  .withAuthz({ authorizer })
  .route('all', '/api/tools/mcp', handler)
  .build();
```

A declared raw route requires a successfully authenticated principal. This applies even when its path
is outside `protect` or inside `allowAnonymous`, so a declaration never makes a path public. An
optional `authorization: { scopes?, roles? }` is enforced like a procedure's declared
authorization. Matching is exact and case-sensitive, and ignores only a trailing slash. Declaring
`/api/tools/mcp` covers neither `/api/tools/mcp-admin` nor `/api/tools/mcp/nested`, and every
undeclared sibling stays denied with `authz.no-contract-procedure`.

Declarations are validated before any request. Construction throws
`[netscript.service.contract-policy] invalid raw route: <path> ...` for a path that is not absolute,
a path containing `*`, `:`, `{`, `}`, `?` or `#`, an `authentication` other than `'required'`, or a
path declared twice. Binding then throws
`[netscript.service.contract-policy] raw route overlaps the contract projection: <path>` when the
path falls under an RPC mount or alias or matches a REST procedure path. Binding happens in
`.build()`.

### Internal procedures and the internal service credential

`.meta({ access: { audience: 'internal' } })` restricts a procedure to service-to-service callers
of the same installation: workers, sagas and triggers presenting the internal service credential.
Both contract authorizers enforce it on the RPC projection and on the OpenAPI projection, including
oRPC's default OpenAPI path (`POST <apiPath>/<router>/<procedure>`) when the contract declares no
`route.path`. Requests resolve to the procedure oRPC executes: the undecoded pathname is matched
with oRPC's own route patterns and `rou3` precedence (static before parameter before wildcard),
not contract declaration order. A request using a method no procedure declares on an internal
procedure's OpenAPI path fails closed toward that procedure. A user session never satisfies the
audience, and the check uses the principal's identity, not its claims or roles. Construction
throws for an `'internal'` audience combined with `authentication: 'none'`, for any other audience
value, and for procedures with different access that share one OpenAPI route.

`createContractOverlayAuthorizer(contract, { fallback?, isInternalCaller? })` governs only
procedures that declare `meta.access`. Every other request keeps the service's own policy: the
`protect`/`allowAnonymous` path guard, plus the optional fallback authorizer. Marking a few
internal procedures therefore never forces authentication onto public ones. To keep an otherwise
public service public, set `allowAnonymous: ['/api', '/health']`; access-marked procedures are
resolved before the path guard. `createContractAuthorizer` also enforces the audience, but it
still governs every procedure in the contract.

The credential is derived from one per-installation secret. Carriers deliver
`NETSCRIPT_INSTALLATION_SECRET_FILE`, a file reference, never the value. `loadInstallationSecret()`
reads it once at startup. The file holds a textual secret, such as base64 or hex, with surrounding
whitespace trimmed (4 KiB maximum, 32 bytes minimum). In-memory `Uint8Array` material passed to
`createInstallationSecret()` is used verbatim. Each service accepts only the bearer
derived for its own name (HKDF-SHA-256), so a credential cannot be replayed across services. A
credential expires by rotation: once the secret changes, every credential derived from the old one
is rejected. `createCompositeAuthenticator([...])` lets one guarded service accept the internal
credential alongside user sessions over the single `AuthenticatorPort`. Callers send the
credential with the SDK's `createInternalCredentialSdkClientContribution({ service })`.

```ts
import { createService } from '@netscript/service';
import {
  createCompositeAuthenticator,
  createContractOverlayAuthorizer,
  createInternalCredentialAuthenticator,
  loadInstallationSecret,
} from '@netscript/service/auth';
import { OrdersContractV1 } from '@example/contracts';
import { router } from './router.ts';
import { sessionAuthenticator } from './session.ts';

const secret = await loadInstallationSecret();
const app = createService(router, { name: 'orders' })
  .withRPC()
  .withAuthn({
    authenticator: createCompositeAuthenticator([
      createInternalCredentialAuthenticator({ secret, service: 'orders' }),
      sessionAuthenticator,
    ]),
  })
  .withAuthz({ authorizer: createContractOverlayAuthorizer(OrdersContractV1) })
  .build();
```

### Explicit service posture

`ServiceAuthPolicy` records either native guards (`{ authn, authz? }`) or a deliberate
public opt-out (`{ public: true, reason }`). `ServiceGuardedAuthPolicy` and
`ServicePublicAuthPolicy` are mutually exclusive; a public reason must be nonblank.
`assertServiceAuthPolicy(value)` rejects absent or ambiguous postures and malformed callable
ports with a redacted `TypeError`. It preserves the original options: a custom
`allowAnonymous` list replaces the native default; the assertion does not add `/health`.
It validates configuration only and does not authenticate requests or install middleware.
The existing `defineService` preset has not yet adopted this required posture contract.

```ts
import { assertServiceAuthPolicy, type ServiceAuthPolicy } from '@netscript/service/auth';

const policy: ServiceAuthPolicy = {
  public: true,
  reason: 'Public status service with no protected operations',
};
assertServiceAuthPolicy(policy);
```

### `@netscript/service/auth` surface

| Symbol | Description |
| --- | --- |
| `ServiceAuthPolicy` | Native guarded posture or an explicit public opt-out. |
| `ServiceGuardedAuthPolicy` | Native authentication with optional authorization; excludes public fields. |
| `ServicePublicAuthPolicy` | Literal public opt-out with a nonblank reason; excludes guard fields. |
| `assertServiceAuthPolicy` | Validates an explicit posture and required callable ports without changing options. |
| `createContractAuthorizer` | Traverses a metadata-bearing contract and returns an opt-in authorizer bound by the service builder. |
| `createContractOverlayAuthorizer` | Enforces only access-marked procedures and leaves every other request to the service's own policy. |
| `createInternalCredentialAuthenticator` | Accepts the internal bearer derived for this service and mints internal service principals. |
| `isInternalServicePrincipal` | Default `InternalCallerPredicate`; true only for principals minted by the internal-credential authenticator. |
| `createCompositeAuthenticator` | Tries authenticators in order over one `AuthenticatorPort` and returns the first success. |
| `loadInstallationSecret` / `createInstallationSecret` | Import the per-installation secret from its file reference or from memory. |
| `deriveInternalCredential` | Derives the per-service internal bearer from the installation secret. |
| `createScopeAuthorizer` | Ordered scope/role rules usable standalone or as a match-aware legacy fallback. |
| `createStaticCredentialAuthenticator` | Maps configured credentials to principals. |
| `createTrustedHeaderAuthenticator` | Maps trusted upstream identity headers to principals. |
| `Principal` | Service-owned identity contract. |
| `ContractPolicyAuthorizerPort` | Authorizer that binds to the builder's REST/RPC projection paths. |
| `ContractAuthorizerRawRoute` | Exact, authentication-required raw route declared through `createContractAuthorizer(contract, { rawRoutes })`. |

## Exports

The following entrypoints are published alongside the root export:

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/service` | `./mod.ts` | Full service surface (documented above). |
| `@netscript/service/commands/relay` | `./commands-relay.ts` | Decoded bounded relay and checked sink lifecycle. |
| `@netscript/service/commands/testing` | `./commands-testing.ts` | Atomic memory store and explicit test controls. |
| `@netscript/service/commands` | `./commands.ts` | Opaque command definitions, once-only executor and codecs. |
| `@netscript/service/auth` | `./src/auth/mod.ts` | Service authentication and authorization handlers. |
| `@netscript/service/rpc-path` | `./src/primitives/rpc-path.ts` | Type-safe RPC route mapping utilities. |
| `@netscript/service/internal-credential` | `./src/auth/internal-credential/mod.ts` | Dependency-free installation secret loading and internal credential derivation. |

## Command definitions and codecs

`@netscript/service/commands` defines immutable command policies and bounded canonical codecs
without executing handlers. Importing, defining and encoding require no permissions; execution
uses the explicitly supplied store/business operations and their permissions. JSON uses `jcs-v1`
with RFC 8785 ordering and numeric/string serialization. Default limits are depth 64, 10,000
aggregate values/keys and 1 MiB UTF-8 bytes; options may only tighten these bounds. Stored text must
match canonical serialization exactly. Synchronous schema validation must preserve canonical JSON
identity to keep replay stable.

| Symbol                      | Kind             | Description                                                       |
| --------------------------- | ---------------- | ----------------------------------------------------------------- |
| `defineCommand`             | function         | Validates durable identity and freezes an opaque definition.      |
| `jsonCodec`                 | function         | Synchronous Standard Schema validation with stable bounded JSON.  |
| `canonicalCommandJson`      | function         | Produces bounded canonical JSON text.                             |
| `commandTraceContext` | function | Reuses strict W3C parent/state validation at producer boundaries. |
| `parseCanonicalCommandJson` | function         | Accepts only bounded canonical stored text.                       |
| `CommandCodec`              | type alias       | Typed response/payload encoding and decoding boundary.            |
| `CommandJsonLimits`         | type alias       | Tighten-only depth, item and byte safeguards.                     |
| `CommandJson`               | type alias       | Readonly recursive I-JSON values.                                 |
| `CommandActor`              | type alias       | Principal or system identity, excluding roles and claims.         |
| `CommandEnvelope`           | type alias       | Input, actor and transport fields with string version tokens.     |
| `CommandTraceContext`       | type alias       | Validated W3C traceparent and optional tracestate.                               |
| `CommandAuditInput`         | type alias       | Redacted audit intent.                                            |
| `CommandContext`            | interface        | Transaction handle and synchronous side-record operations.        |
| `CommandDefinition`         | interface        | Opaque immutable identity, replay policy and record requirements. |
| `CommandDefinitionSpec`     | type alias       | Construction specification with privately bound handler.          |
| `commandDefinitionBinding`  | type-only symbol | Opaque marker; unavailable as a runtime export.                   |
| `commandExecutorCapability` | type-only symbol | Private binding capability; unavailable as a runtime export.      |
| `CommandIdempotency`        | type alias       | Frozen semantic scope, fingerprint and replay codec.              |
| `CommandIdempotencyMode`    | type alias       | Required or optional key policy.                                  |
| `CommandIdempotencySpec`    | type alias       | Construction policy defaulting to required keys.                  |
| `CommandOutboxInput`        | type alias       | Delivery intent with typed codec.                                 |
| `CommandRecordRequirement`  | type alias       | Required, optional or forbidden side-record policy.               |
| `CommandError`              | class            | Frozen redacted failure with a trusted nonserialized cause.       |
| `CommandFailure`            | type alias       | Bounded discriminated failure and retry vocabulary.               |
| `IsolationLevel` | type alias | Database-owned transaction isolation vocabulary, re-exported as a type. |

---

Back to the [reference overview](/reference/).

## Command testing

`@netscript/service/commands/testing` exports `createMemoryCommandStore`, `MemoryCommandStore`,
`MemoryCommandBusiness`, `MemoryCommandSnapshot`, `MemoryCommandStoreOptions` and
`CommandStoreBarrier`. The store atomically commits business, receipt, audit and outbox drafts and
exposes frozen detached snapshots. A one-use before-commit barrier controls concurrency. Explicit
receipt seeding and outside-transaction business writes support corruption and rollback negative
controls. These helpers require no permissions and certify no real provider. The fake supports
Serializable isolation, zero claim wait, a bounded cooperative timeout, terminal busy and one
callback attempt; it may reject disjoint concurrent drafts because it uses a global state revision.

## Command executor

| Symbol | Kind | Description |
| --- | --- | --- |
| `createCommandExecutor` | function | Compose once-only execution over a bound same-commit store. |
| `CommandExecutor` | interface | Execute a genuine definition and await the store boundary. |
| `CommandExecution` | type alias | Decoded value, applied/replayed outcome, idempotency state and original correlation. |
| `CommandExecutorOptions` | type alias | Store, optional clock/IDs/telemetry, claim wait and tighten-only record limits. |
| `CommandRecordLimits` | type alias | 64 audit/64 outbox defaults; aggregate canonical side-row byte default 64 KiB. |
| `CommandClock` | interface | Injected valid Date source, detached by the executor. |
| `CommandIdSource` | interface | Fresh bounded identifiers. |
| `CommandTelemetryPort` | interface | Once-only tracing extension preserving values and errors. |
| `CommandTelemetrySpan` | interface | Finish with finite outcome/count vocabulary after the boundary. |
| `CommandTelemetryStart` | type alias | Name/version, requested or default isolation, provider and keyed state. |
| `CommandTelemetryResult` | type alias | Finite outcome/idempotency/counts and optional bounded failure kind. |

The executor freezes detached bounded I-JSON input before the two identity callbacks, each called
once. Required keys are 16–256 UTF-8 bytes; scope and other identity/header strings are bounded to
1–256 bytes. Identity uses exact canonical semantic material and a separate key digest, excluding
scheme, correlation and W3C transport fields. Buffers include full side-row metadata in their shared
byte budget; limits only tighten published defaults. Transactions receive a five-second timeout.

Replay validates receipt material without handler/side writes. Busy and cancellation surface only
after rollback; arbitrary business errors retain identity. Provider failures use the database-owned
`CommandStoreError` contract. Audit, outbox and receipt completion share the winning receipt ID and
flush in that order. Optional unkeyed attempts skip receipts. The telemetry port prepares the later
adapter; no transport, hidden retry or production fault option is provided.

### Command conformance fixtures

The focused `@netscript/service/commands/testing` subpath provides an instance-bound
`CommandFaultController`, `createTestingCommandExecutor()` and a generic
`CommandConformanceFixture<TTx>`. Production executor options contain no fault controls. The testing
factory uses the production algorithm and the exact seven command boundaries, including a
postcommit response-loss boundary whose same-key retry must replay the original receipt.

`runCommandConformance(createFixture)` checks atomic rollback and recovery, ordered side writes,
replay/mismatch and namespace/version changes, corrupt replay, CAS, cancellation, busy, callback
counts and retry refusal. `createMemoryCommandConformanceFixture()` supplies a simulated fixture.
An outside-transaction business write is an explicit negative control: the shared suite must detect
its surviving effect after rollback. Database-owned store/row types and the generic business handle
allow provider adapters to supply their own inspection and fixture operations. This finite suite
certifies no real driver, locking strategy or pooled session settings.

`assertCommandDeterminism()` samples actual scope/fingerprint identity logic over equivalent frozen
inputs and actor material, without a transaction or handler. Its bounded 2–32 samples (default four)
can detect changing closure state in those invocations; `sampled_equivalence` is no universal purity
proof. Supplied provider operations need their own permissions; imports and simulated fixtures do
not.

Future traceparent fields remain opaque after known W3C prefix validation, with a bounded HTTP
field-value guard rejecting CR, LF, NUL and other ASCII control bytes except HTAB. SP, HTAB and
obs-text remain accepted in the opaque suffix; empty tracestate positives are preserved. This follows
[RFC9110 field values](https://www.rfc-editor.org/rfc/rfc9110.html#section-5.5) and
[W3C traceparent versioning](https://www.w3.org/TR/trace-context/#versioning-of-traceparent).

## Command outbox relay

`createCommandOutboxRelay` starts no resource: existing scheduling calls `drainOnce` and shutdown
awaits `stop`. It decodes canonical bounded payload and W3C fields, snapshots sink registration,
publishes before settlement and preserves stable identities across retries/crashes. All drains
share one bounded concurrency ceiling; stopping prevents claims and awaits every active/queued
drain. Invalid classifier/backoff cannot write arbitrary failure text or lose leases. Worker
acceptance is checked and normalized before the database writes it together with publication.
Uncertain settlement errors surface without a speculative release. Optional C4-compatible tracing
selects finite command attributes and preserves deferred/producer propagation without raw identity
attributes. The database owns leases; no second relay, queue or runtime DDL is introduced.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createCommandOutboxRelay` | function | `function createCommandOutboxRelay(options): RunningCommandOutboxRelay` | Compose the one bounded decoded relay. |
| `CommandOutboxDelivery` | type alias | `type CommandOutboxDelivery` | Frozen decoded delivery and transport context. |
| `CommandOutboxRelayOptions` | type alias | `type CommandOutboxRelayOptions` | Explicit finite lifecycle/retry policy and supplied ports. |
| `CommandOutboxSink` | interface | `interface CommandOutboxSink` | Documented acceptance boundary. |
| `CommandRelayTelemetryPort` | interface | `interface CommandRelayTelemetryPort` | Privacy-safe structural C4 observer extension. |
| `RunningCommandOutboxRelay` | interface | `interface RunningCommandOutboxRelay` | Drain/stop lifecycle. |
| `CommandRelayError` | class | `class CommandRelayError` | Closed sink/decode diagnostic. |
| `COMMAND_RELAY_FAILURE_CLASSES` | const | `readonly tuple` | Closed persisted relay failure vocabulary. |
| `CommandRelayFailureClass` | type alias | `type CommandRelayFailureClass` | One of six finite failures. |
| `ClaimedCommandOutboxRow` | type alias | `type ClaimedCommandOutboxRow` | Database-owned raw leased row. |
| `CommandOutboxAcceptance` | type alias | `type CommandOutboxAcceptance` | Checked normalized receipt identity/time. |
| `CommandOutboxClaim` | type alias | `type CommandOutboxClaim` | Bounded clock/generation request. |
| `CommandOutboxPublication` | type alias | `type CommandOutboxPublication` | One publication/acceptance settlement. |
| `CommandOutboxRelayStore` | interface | `interface CommandOutboxRelayStore` | Raw claim/mark/release port. |
| `CommandOutboxRelease` | type alias | `type CommandOutboxRelease` | Retried or retained terminal row. |
