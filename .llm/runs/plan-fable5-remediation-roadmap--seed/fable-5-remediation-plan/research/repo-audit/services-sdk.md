# Repo audit — service / SDK layer

Baseline: `plan/fable5-remediation-roadmap` @ `fac9e339042c` (== `origin/main`), 2026-08-08.
Scope: `packages/service`, `packages/sdk`, `packages/contracts`, the CLI scaffold assets that
generate service + client wiring, and `docs/site/services-sdk`.

All line references are to files at this baseline. Type claims marked **[probe]** were verified by
running `deno check --config deno.json <file>` against scratch files; the exact probe source is
reproduced inline so any reviewer can re-run it.

---

## 0. Version / dependency state

| Thing | Value | Citation |
| --- | --- | --- |
| `@netscript/sdk` | `0.0.4` | `packages/sdk/deno.json:3` |
| `@netscript/service` | `0.0.4` | `packages/service/deno.json:3` |
| oRPC family (workspace catalog) | `^1.14.6` (`@orpc/otel` `^1.14.7`) | `deno.json:215-221` |
| oRPC resolved in lock | `1.14.6` | `deno.lock:112-121` |
| oRPC latest on npm | `1.14.15` (`curl registry.npmjs.org/@orpc/client/latest`) | verified 2026-08-08 |
| zod (framework) | `^4.4.3` / `jsr:@zod/zod@4.4.3` | `deno.json:248`, `deno.lock:97` |
| zod (generated `contracts/deno.json`) | `npm:zod@^4.3.6` | `packages/cli/src/kernel/templates/workspace/contracts/deno-json.ts:16` |
| Hono | `jsr:@hono/hono@4.12.24` (pinned exact) | `packages/service/deno.json` imports |

Notes:

- The caret range means consumers *resolve* 1.14.6 from the committed lock while 1.14.15 is
  available; nothing is broken, but the SDK is 9 patch releases behind and none of the 1.14.7+
  link/plugin additions are surfaced.
- **Generated projects pin a different zod minor than the framework** (`^4.3.6` vs `^4.4.3`). The
  zod boundary doc (`docs/architecture/zod-dependency-boundary.md`) governs workspace members only;
  scaffolded projects are outside its guard (`deno task deps:check:zod`).
  → *gap: scaffold/generation failure (low severity, drift risk)*.

---

## 1. What exists and works

### 1.1 Contract layer (`@netscript/contracts`)

- Real oRPC contract builder, not a wrapper: `baseContract = oc.errors(commonErrorMap)`
  (`packages/contracts/src/application/contract-primitives.ts:81`) with six standard error codes
  (`NOT_FOUND`/`VALIDATION_ERROR`/`UNAUTHORIZED`/`FORBIDDEN`/`RATE_LIMITED`/`SERVICE_UNAVAILABLE`,
  lines 21-52), each with a real Zod `data` schema.
- Sound route annotations `BaseContractRoute<TIn,TOut>` / `BaseContractOutputRoute<TOut>` built on
  the genuine upstream `ContractProcedureBuilderWithInputOutput` (lines 125-159) — this is what
  keeps `--isolatedDeclarations` emitting for JSR without erasing `~orpc` to `any`.
- `createCrudContract` (`packages/contracts/crud`, `src/public/create-crud-contract.ts`, 16.9 KB)
  plus pagination/filter/transform helpers. Public surface curated in
  `packages/contracts/src/public/mod.ts:1-82`.

### 1.2 Server (`@netscript/service`)

Three declared layers, and all three actually exist (`packages/service/mod.ts:66-167`):

- **L1 primitives** — `createRPCHandler` / `createOpenAPIHandler` / `createRPCPlugins` /
  `createErrorHandler` / `createNotFoundHandler` (`src/primitives/handlers.ts`), health handlers,
  OpenAPI+Scalar, and `buildServiceRpcPath` (`src/primitives/rpc-path.ts:24-32`) — the single
  canonical `/{apiPath}/{apiVersion}/{routerName}` builder shared by server and client.
- **L2 builder** — `createService(router, config)` fluent builder
  (`src/builder/service-builder.ts:62-176`) with `withCors/withLogger/withDatabase/withHealthCheck/
  withReadinessCheck/withOpenAPI/withDocs/withRPC/withAuthn/withAuthz/withContext/onStartup/
  onShutdown/withHealth/use/route/withServiceInfo/build/serve`. `build()` returns a non-listening
  `ServiceApp` — the mount seam is genuinely open.
- **L3 preset** — `defineService(router, options)` (`src/presets/define-service.ts:216-276`),
  including real multi-database health-candidate resolution (lines 63-97) and a `$disconnect`
  shutdown hook (260-264).
- Server-side oRPC plugins are wired and real: `TracingPlugin`, `ErrorHandlingPlugin` (from
  `@netscript/telemetry/orpc`), `LoggingPlugin` (`@netscript/logger/orpc`), `CORSPlugin`, and
  `ZodSmartCoercionPlugin` on the OpenAPI handler (`src/primitives/handlers.ts:362-462`).
- Auth seam is real and provider-agnostic: `AuthenticatorPort`/`AuthorizerPort`/`Principal`,
  `createStaticCredentialAuthenticator` (reads `Authorization: Bearer …` and `x-api-key`,
  `src/auth/static-credential-authenticator.ts:108-117`), `createTrustedHeaderAuthenticator`,
  `createScopeAuthorizer`. The authenticated `Principal` **is** forwarded into the oRPC handler
  context (`src/builder/service-builder-impl.ts:276-278`).
- Per-request oRPC context is assembled from `contextFactory(c)` + `ctx.db` + `ctx.principal` +
  `ctx.traceHeaders` (`src/builder/service-builder-impl.ts:259-282`).
- Deprecated-path migration support: `withRPC({ rpcAliases, deprecatedRpcRoutes, rpcRouter })`
  with once-only warn logging (`src/builder/service-rpc.ts:60-121`).

### 1.3 Client (`@netscript/sdk`)

- `createServiceClient({contract, serviceName, routerName, protocol, apiPath, apiVersion,
  propagateTraceContext})` → `createORPCClient(link)` over a real `RPCLink`
  (`src/client/service-client.ts:41-66`, `src/client/http-client-link.ts:63-158`).
- HTTP method inference from the contract via upstream `inferRPCMethodFromContractRouter`
  (`http-client-link.ts:82`), plus a structural guard that rejects non-oRPC "contracts"
  (`isOrpcContractRouter`, lines 35-44 + throw at 71-73) — covered by
  `packages/sdk/tests/integration/service-client-runtime_test.ts:52`.
- Lazy URL resolution (`url: () => getServiceUrl(...)`, lines 78-81) so browser bundles can rely on
  SSR-injected Aspire discovery rather than `Deno.*` at import time. Genuinely load-bearing.
- W3C trace propagation, both automatic (`getTraceContext()`) and explicit-per-call
  (`context.traceHeaders`), plus a CLIENT span around every fetch with `rpc.system=orpc` /
  `server.address` attributes (`service-client.ts:17-33`, `http-client-link.ts:83-155`).
- Two upstream client plugins are installed: `ClientRetryPlugin` (default `retry: 0`) and
  `DedupeRequestsPlugin` scoped to GET with a `force-cache` group (`http-client-link.ts:102-126`).
  Because `ServiceClientContext extends ClientRetryPluginContext`, per-call `retry`/`retryDelay`/
  `shouldRetry`/`onRetry`/`signal`/`cache` **do** work — this is the one real per-request seam, and
  it is regression-tested (`service-client-runtime_test.ts:113`, `:153`).
- Query tiers: server-side cache-first `createQueryFactory`/`createQueryFactories`
  (`src/query/query-factory.ts`) over a KV cache provider, and a client-side bridge
  `createServiceQueryUtils` that delegates to upstream `createTanstackQueryUtils`
  (`src/query-client/create-service-query-utils.ts:53-64`). The two key tiers are deliberately
  separate and documented as such (`src/query-client/key-bridge.ts:65-75`).
- Second transport already exists: `@netscript/sdk/desktop` builds the same typed client over
  oRPC's MessagePort `RPCLink` with custom `Uint8Array` serializers
  (`src/desktop/application/desktop-rpc-client.ts:101-120`). Proof the link is swappable in
  principle — just not by a consumer.
- L3 composition preset `defineServices(map)` → `{clients, queries, queryUtils}`
  (`src/presets/define-services.ts:97-128`).

---

## 2. Question 1 — Can a plugin or app extend client construction / request context / headers /
auth today, and how ugly is the escape hatch?

### 2.1 Verdict: **No, not without abandoning `createServiceClient` entirely.**

`CreateServiceClientOptions` (`packages/sdk/src/ports/service-client.ts:203-222`) is a closed
9-field record:

```
contract, serviceName, routerName, protocol, apiPath, apiVersion, port, timeout,
propagateTraceContext
```

There is **no** `headers`, `fetch`, `interceptors`, `clientInterceptors`, `plugins`, `link`,
`method`, `maxUrlLength`, `customJsonSerializers`, or context-type parameter. Grepping the whole
SDK for header authoring finds only `Content-Type` and the two trace headers
(`http-client-link.ts:83-101`); there is not one occurrence of `Authorization` in
`packages/sdk/src/`.

Two of those nine options are **dead**: `port` and `timeout` are documented as
"Reserved …" (`ports/service-client.ts:216`, `:218`) and are never destructured by
`createServiceClient` (`src/client/service-client.ts:41-49`) — they are silently discarded.
`defineServices` dutifully forwards both into that ignoring function
(`src/presets/define-services.ts:113-114`), which makes the dead options look live at both L2 and
L3. → *gap: API/type-system seam (misleading public surface)*.

`ServiceClientContext` (`ports/service-client.ts:129-155`) is likewise a **closed, non-generic
interface**: `signal | cache | retry | retryDelay | shouldRetry | onRetry | traceHeaders`. A plugin
cannot add a typed field (e.g. `tenantId`, `authToken`) to per-call context, because
`ServiceClientMethod<TInput,TOutput>` hard-codes
`options?: ServiceRequestOptions` → `context?: ServiceClientContext` (lines 160-171). Upstream
oRPC parameterizes this: `Client<TClientContext, …>` and `RPCLink<T extends ClientContext>`.

### 2.2 The one thing that *does* work

Per-call transport knobs land: `client.foo(input, { context: { signal, cache, retry, onRetry } })`
reaches the link because `HttpRuntimeClientContext = ServiceClientContext & ClientRetryPluginContext`
(`http-client-link.ts:27`) and `RPCLink` forwards `options.context` verbatim. Cancellation and retry
exhaustion are both regression-tested (`tests/integration/service-client-runtime_test.ts:113,153`).

### 2.3 The escape hatch and how ugly it is

The intermediate seam is **package-private**:

- `createHttpClientLink` is *not* exported from `@netscript/sdk/client`
  (`src/client/mod.ts:15-36` exports only `createServiceClient`, `isDefinedError`, `safe`, types).
- `ClientLinkPort` / `ClientLinkCallOptions` (`src/ports/client-link-factory.ts:18-25`) are *not*
  exported from `@netscript/sdk/ports` (`src/ports/mod.ts:17-83`) — **even though that module's own
  doc comment claims ports cover "discovery metadata, and the transport seam"
  (`src/ports/mod.ts:7`)**. Documented seam, absent export.
  → *gap: docs/discovery failure + API/type-system seam*.

So the escape hatch is: **throw away the NetScript client and hand-build an oRPC one.** This is
*possible* in a scaffolded app — `@orpc/client`, `@orpc/contract`, `@orpc/server`,
`@orpc/tanstack-query`, `@orpc/zod` are all in the generated app import map
(`packages/cli/src/kernel/constants/scaffold/scaffold-app-catalog.ts:35-58`) — but the consumer must
re-implement, by hand, everything `createHttpClientLink` does:

1. `getServiceUrl(serviceName, protocol)` + `buildServiceRpcPath({routerName, apiPath, apiVersion})`
   URL assembly (both are exported: `@netscript/sdk/discovery`, `@netscript/service/rpc-path` — the
   only mercy here).
2. `inferRPCMethodFromContractRouter(contract)` (else every GET-routed procedure POSTs).
3. `ClientRetryPlugin` + `DedupeRequestsPlugin` with the GET/`force-cache` grouping.
4. The whole telemetry block: `withSpan(getTracer('@netscript/sdk'), SpanNames.RPC_CLIENT, …)`,
   `injectContext`, `contextWithSpan`, and the four span attributes — i.e. **a custom client loses
   NetScript's distributed tracing silently**, since nothing else injects the client span.

That is ~90 lines of copied framework internals per app, and it re-couples the app to
`@netscript/telemetry` internals (`SpanNames`, `contextWithSpan`, `injectContext`) that are not
part of the SDK's advertised surface. **Classification: API/type-system seam — the framework owns a
transport it does not let you extend, and the only override is a fork of the internal file.**

### 2.4 The concrete consequence: server auth exists, client auth does not

`@netscript/service/auth` ships `createStaticCredentialAuthenticator`, which reads
`Authorization: Bearer <token>` / `x-api-key`
(`packages/service/src/auth/static-credential-authenticator.ts:108-117`), and the docs promote
gating a service with it (`docs/site/services-sdk/services.md:384-428`). **`createServiceClient`
cannot send either header.** A NetScript app calling a NetScript service gated by the NetScript
service-auth seam has no supported way to authenticate. There is also no cookie/session forwarding:
grepping `packages/fresh` for `createServiceClient|ServiceClientContext|traceHeaders` returns
nothing, so an SSR loader cannot forward the incoming request's identity downstream.
→ *gap: plugin-composition failure (two first-party seams that do not meet)*.

---

## 3. Question 2 — Typed oRPC extension seams NetScript does **not** re-expose

Enumerated from `deno doc npm:@orpc/client@1.14.6[/fetch|/plugins|/standard]`,
`deno doc npm:@orpc/server@1.14.6`, `deno doc npm:@orpc/tanstack-query@1.14.6`.

### 3.1 Link construction (`StandardRPCLinkOptions` = `StandardLinkOptions` +
`StandardRPCLinkCodecOptions` + `StandardRPCJsonSerializerOptions`)

| Upstream seam | Type | NetScript re-exposes? |
| --- | --- | --- |
| `headers` | `Value<Promisable<StandardHeaders \| Headers>, [ClientOptions<T>, path, input]>` | ❌ — hard-coded to `Content-Type` + trace (`http-client-link.ts:83-101`) |
| `interceptors` | `Interceptor<StandardLinkInterceptorOptions<T>, Promise<unknown>>[]` | ❌ |
| `clientInterceptors` | `Interceptor<StandardLinkClientInterceptorOptions<T>, Promise<StandardLazyResponse>>[]` | ❌ (type is *imported* at `http-client-link.ts:14` for internal dedupe use only) |
| `plugins` | `StandardLinkPlugin<T>[]` | ❌ — two are hard-installed, no append |
| `fetch` | `(request, init, options, path, input) => Promise<Response>` | ❌ — hard-coded (`http-client-link.ts:127-155`) |
| `adapterInterceptors` | `Interceptor<LinkFetchInterceptorOptions<T>, Promise<Response>>[]` | ❌ |
| `method` / `fallbackMethod` | `Value<Promisable<HTTPMethod>>` | ❌ — always `inferRPCMethodFromContractRouter` |
| `maxUrlLength` | `Value<Promisable<number>>` (default 2083) | ❌ |
| `customJsonSerializers` | `StandardRPCCustomJsonSerializer[]` | ❌ on HTTP (⚠ used internally only on the desktop link, `src/desktop/.../desktop-rpc-client.ts:107`) |
| `T extends ClientContext` (link context type param) | generic | ❌ — pinned to `ServiceClientContext` |

### 3.2 Client plugins shipped by `@orpc/client/plugins`, none reachable

`BatchLinkPlugin` (request batching), `RetryAfterPlugin` (honor `Retry-After`),
`SimpleCsrfProtectionLinkPlugin` (CSRF). `ClientRetryPlugin` and `DedupeRequestsPlugin` are
installed but not configurable — the retry default is frozen at `retry: 0`
(`http-client-link.ts:103-107`) and the dedupe `filter`/`groups` are frozen (lines 108-125).

### 3.3 Client-level helpers not re-exposed

- `createSafeClient(client)` → `SafeClient<T>` — upstream's typed safe wrapper.
- `createORPCClient(link, options)` — the second `createORPCClientOptions` argument is dropped
  (`src/client/service-client.ts:65`).
- `consumeEventIterator`, `eventIteratorToStream`, `streamToEventIterator` — event-stream/SSE
  consumption helpers. `@netscript/sdk/streams` is a separate 1.2 KB module unrelated to oRPC
  event iterators.
- `createORPCErrorFromJson`, `ORPCError` construction, `fallbackORPCErrorStatus`.

### 3.4 The typed-error seam is not just un-exposed — it is **broken**

Upstream signature: `safe<TOutput, TError = ThrowableError>(promise: ClientPromiseResult<TOutput,
TError>): Promise<SafeResult<TOutput, TError>>` — the contract's error map flows into `TError`, and
`isDefinedError` then narrows to the declared union.

NetScript re-implements both without the error parameter
(`packages/sdk/src/client/errors.ts:86-92`, `:75-77`):

```ts
export async function safe<TOutput>(promise: PromiseLike<TOutput>): Promise<SafeResult<TOutput>>
// SafeResult<TOutput, TError = unknown>  → error is `unknown`
export function isDefinedError<T>(error: T): error is Extract<T, DefinedError>
// T = unknown  → Extract<unknown, DefinedError> = never
```

**[probe]** — `deno check --unstable-kv --config deno.json` on:

```ts
import { isDefinedError, safe } from 'packages/sdk/src/client/mod.ts';
declare const p: Promise<{ ok: boolean }>;
const [error, data, isDefined] = await safe(p);
if (error && isDefinedError(error)) { const c: string = error.code; }
```

→ `TS2339 [ERROR]: Property 'code' does not exist on type 'never'.`

This is **the exact code the published docs tell users to write**:
`docs/site/services-sdk/sdk.md:199` (tab "Safe error narrowing") contains
`if (isDefinedError(error)) return { code: error.code, status: error.status };`. The documented
example does not compile.
→ *gap: API/type-system seam + docs/discovery failure. High severity: oRPC's headline typed-error
DX is fully lost, and the docs assert it works.*

### 3.5 Contributing cause: the error map is widened at the contract root

`baseContract` is annotated `ReturnType<typeof oc.errors>`
(`packages/contracts/src/application/contract-primitives.ts:81`). `ReturnType` on a generic function
instantiates with the *constraint*, so the literal `commonErrorMap` keys are erased to the open
`ErrorMap` index signature.

**[probe]** — `deno check` accepts this:

```ts
const getItem = baseContract.route({method:'GET',path:'/i/{id}'}).input(In).output(Out);
type ErrMap = typeof getItem extends { '~orpc': { errorMap: infer E } } ? E : never;
const k: keyof ErrMap = 'TOTALLY_MADE_UP_CODE';   // ← compiles
```

A nonexistent code is assignable to `keyof ErrMap`, proving the six declared codes are not carried
in the type. So even a *correct* `safe()` implementation could not narrow to the NetScript error
vocabulary today. The doc comment on lines 54-69 claims the opposite ("genuinely typed rather than
erased to `any`") — true for input/output schemas, **false for the error map**.
→ *gap: API/type-system seam + docs/discovery failure.*

### 3.6 Server-side seams not re-exposed

- `RPCHandlerConfig` (`packages/service/src/primitives/handlers.ts:331-348`) declares
  `plugins`, `tracing`, `errorHandling`, `warnOnlyCodes`, `logging`, `deduplication` — but the
  builder calls `createRPCHandler(router, { serviceName, debug })` only
  (`src/builder/service-rpc.ts:57-58`). Neither `withRPC(...)`
  (`src/builder/service-builder.ts:91-104`) nor `DefineServiceOptions`
  (`src/presets/define-service.ts:112-143`) accepts `plugins` or `warnOnlyCodes`. **A plugin cannot
  add a server oRPC plugin through the supported builder**; it must drop to L1 and hand-mount into
  Hono.
- `deduplication` (`handlers.ts:340`) is declared and **never read** by `createRPCPlugins`
  (lines 362-404). Dead public option.
- `implement().use(middleware)` / `os.$context<T>()` / `decorateMiddleware` / `onStart|onSuccess|
  onError|onFinish` / `eventIterator` / `createRouterClient` / `call()` — none surfaced. The
  scaffold reaches around the framework and imports `implement` from `@orpc/server` directly
  (`packages/cli/src/kernel/assets/service/contract.ts.template:7`).
- `ServiceRouter = Record<string, unknown>` (`packages/service/src/types.ts:11`) erases the router
  type completely, and `ContextFactory = (context: Context) => Record<string, unknown>`
  (`src/types.ts:270-272`). So there is **zero compile-time link** between what the builder injects
  (`ctx.db`, `ctx.principal`, `ctx.traceHeaders` — `service-builder-impl.ts:259-282`) and what the
  router declared via `.$context<{db: PrismaClient}>()`. Rename the context key and you get a
  runtime `undefined`, not a type error. No `ServiceHandlerContext` type is exported;
  `ServiceContext` is just Hono's `Context` (`src/types.ts:240`).
  → *gap: API/type-system seam.*

### 3.7 TanStack bridge: NetScript's remap is strictly narrower than upstream

`createServiceQueryUtils` delegates to upstream but re-types the result through
`ServiceQueryUtils<TContract>` (`src/query-client/create-service-query-utils.ts:57-63`). Comparing
`packages/sdk/src/ports/service-query-utils.ts` to
`deno doc npm:@orpc/tanstack-query@1.14.6`:

| Upstream | NetScript | Effect |
| --- | --- | --- |
| `QueryOptionsIn = QueryKeyOptions<TInput> & context & Omit<QueryObserverOptions<TOutput,TError,TSelectData>,'queryKey'>` | `ServiceProcedureQueryOptions<TInput> = keyOptions & { context?, enabled?, staleTime? }` (`:73-80`) | `select`, `retry`, `refetchInterval`, `gcTime`, `placeholderData`, `initialData`, `throwOnError`, … all rejected |
| `TInput \| SkipToken` in `QueryKeyOptions` | no `SkipToken` (`:58-70`) | TanStack's canonical "don't run" idiom unavailable |
| `ProcedureUtils<TClientContext, TInput, TOutput, TError>` | `ServiceProcedureQueryUtils<TInput, TOutput>` (`:167`) | **`TError` dropped**; `ServiceProcedureQueryResult<TOutput>` (`:83-92`) has no error type |
| `TClientContext` inferred from the client | `ServiceQueryClientContext = Record<never, never>` (`:33`) | **hard-coded empty** — cannot pass `signal`/`cache`/`retry` through `queryOptions({context})`, even though the client itself accepts them |
| `CreateRouterUtilsOptions = { path?, experimental_defaults? }` | `CreateServiceQueryUtilsOptions = { path? }` (`create-service-query-utils.ts:19-22`) | per-procedure defaults unavailable |
| `experimental_ProcedureUtilsDefaults` | — | absent |

The fixture `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts:41` asserts
assignability *upstream → NetScript* only, which is exactly the direction that a narrowing remap
still satisfies. Nothing tests that NetScript's shape is not *lossier* than upstream.
→ *gap: API/type-system seam.*

### 3.8 The NetScript-owned server query factory drops the abort signal

`createQueryFactory`'s generated `queryOptions().queryFn` is `() => …` with no arguments
(`src/query/query-factory.ts:148-152`), and `mutationFn` is
`(input) => invokeClientProcedure(client, action, input)` (`:165-166`).
`invokeClientProcedure` calls `(candidate)(input)` — the second argument is structurally dropped
(`src/query/client-proxy.ts:265-267`). Therefore **TanStack's `QueryFunctionContext.signal` never
reaches the transport**, so query cancellation is a no-op for anything built from
`createQueryFactory` (which is what the scaffold uses). Upstream `@orpc/tanstack-query` forwards it.
→ *gap: runtime correctness.*

### 3.9 `createQueryFactory` has no nested-router support

`const actionNames = Object.keys(contract)` (`src/query/query-factory.ts:61`) treats **every**
top-level key as a callable procedure. The scaffolded contract is
`{ health: { check }, ...CrudContract }`
(`packages/cli/src/kernel/assets/service/contract.ts.template:52-59`), so a `factory.health(...)`
member is generated that throws
`Procedure "health" was not found on the service client.` at runtime
(`client-proxy.ts:261-263`). The mapped type `ContractProcedureNames` filters nested routers out at
the type level (`ports/service-client.ts:96-100`), so the runtime object has members the type says
do not exist — silent divergence, no compile error either way. Nested routers cannot be reached at
all through the query factory.
→ *gap: runtime correctness + API/type-system seam.*

---

## 4. Question 3 — Where hand-authored client+query+invalidation boilerplate lives in generated apps

### 4.1 The single hand-authored file, and it is a template with hard-coded identifiers

`netscript service add --with-client` writes exactly one file:
`apps/<app>/lib/<serviceName>.ts`, resolved by `findServiceClientPath`
(`packages/cli/src/kernel/adapters/service/client-scaffolder.ts:9-21`) and rendered from
`TEMPLATE_KEYS.appLibExampleService` (`:45-49`). Wired at
`packages/cli/src/public/features/services/add/add-service.ts:69-79`.

The whole generated wiring is 27 lines
(`packages/cli/src/kernel/assets/app/lib/example-service.ts.template`):

```ts
export const exampleServiceName        = '{{serviceName}}';
export const exampleServiceRouterName  = '{{serviceName | camelCase}}';
export const exampleServiceContract    = {{serviceName|pascalCase}}ContractV1;
export const exampleServiceListInvalidation = bridgeInvalidation(exampleServiceRouterName, 'list');
export const exampleServiceClient  = createServiceClient<typeof exampleServiceContract>({...});
export const exampleServiceQueries = createQueryFactories({ service: { contract, client } }).service;
```

Four defects, all structural:

**(a) Export names are hard-coded `exampleService*`, not derived from `serviceName`.** A project
with two services gets `apps/<app>/lib/users.ts` and `apps/<app>/lib/orders.ts` **both exporting
`exampleServiceClient`, `exampleServiceName`, `exampleServiceQueries`, …**. Any module importing
both must alias every symbol. → *scaffold/generation failure.*

**(b) The query-factory resource key is the literal string `'service'`, not the service name.**
`createQueryFactories({ service: {...} })` → `createQueryFactory('service', …)`
(`packages/sdk/src/query/query-factory.ts:218`), so every service's cache keys live under the same
`'service'` namespace: server keys `['service', action, JSON(input)]`
(`ports/query-key.ts:35-41`), client keys `['service', action, {input}]`
(`query-factory.ts:147`, `:177`). Two services with a `list` action **collide in both cache
tiers**, and `factory.invalidate()` (`query-factory.ts:56-58`) invalidates *all* services.
→ *runtime correctness.*

**(c) The generated invalidation constant does not match the generated query keys.**
`bridgeInvalidation(exampleServiceRouterName, 'list')` produces
`{ queryKey: ['<camelServiceName>', 'list'] }` (`src/query-client/key-bridge.ts:83-101`), e.g.
`['users','list']` for the default service name (`SCAFFOLD_DEFAULTS.SERVICE_NAME: 'users'`,
`packages/cli/src/kernel/constants/scaffold/scaffold-defaults.ts:10`). The actual keys are
`['service','list',{input}]` per (b). The memory-flow island calls
`queryClient.invalidateQueries(exampleServiceListInvalidation)` in two places —
`packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.memory.tsx.template:85`
(`onSettled` after an optimistic mutation) and `:115` (an "Invalidate list cache" button). **Both
are silent no-ops**: TanStack prefix-matching never reaches a key starting with `'service'`. The
optimistic-update demo therefore never reconciles with the server. No test covers this — grepping
`packages/sdk/tests` and `packages/cli/e2e/src` for `bridgeInvalidation|invalidateQueries` returns
nothing. → *runtime correctness (shipped in the flagship showcase).*

**(d) `defineServices()` — the advertised L3 one-liner — is never used by the scaffold.** Nothing
under `packages/cli/src/kernel/assets/` references it; the scaffold uses L1 `createServiceClient` +
L2 `createQueryFactories` and skips `createServiceQueryUtils` entirely. So the oRPC/TanStack bridge
(`.infiniteOptions()`, `.streamedOptions()`, `.key()`) that `@netscript/sdk/query-client` exists to
provide is not on any generated path. → *docs/discovery failure + scaffold/generation failure.*

### 4.2 Remaining hand-authored boilerplate in the generated app

- `apps/<app>/routes/examples/(_shared)/service-showcase.ts` re-declares the response shape by hand
  (`ServiceShowcaseListData`, `ServiceShowcasePagination`,
  `.../service-showcase.ts.template:14-26`) rather than inferring it from the contract — the memory
  variant *does* infer (`Awaited<ReturnType<typeof exampleServiceQueries.list>>`,
  `service-showcase.memory.ts.template:11`), so the two flows disagree on method.
- Manual dehydrate/hydrate plumbing: `createNetScriptQueryClient()` + `fetchQuery({queryKey,
  queryFn})` + `dehydrateQueryClient` in the loader (`service-showcase.ts.template:64-78`), and
  `getIslandQueryClient` + `hydrateFromDehydrated` + a `hydratedRef` guard in the island
  (`ServiceShowcaseLab.tsx.template:34-42`). Repeated verbatim in every showcase variant.
- Per-mutation `useMutation({mutationFn: xOptions.mutationFn, onSuccess, onError})` + a manual
  `refreshList()` calling `refetch()` (`ServiceShowcaseLab.tsx.template:55-89`) — i.e. the DB-flow
  island does not use invalidation at all, it re-fetches.
- The client-side `MutationContext` / optimistic `setQueryData` / rollback block is fully
  hand-written (`ServiceShowcaseLab.memory.tsx.template:57-83`).

### 4.3 Import maps

- Generated **app** carries the full oRPC set (`scaffold-app-catalog.ts:35-58`) — so the escape
  hatch of §2.3 is at least *reachable*.
- Generated **service** carries only `@<project>/contracts`, `@database`, `@netscript/service`
  (`packages/cli/src/kernel/templates/service/generate-service-deno-json.ts:66-71`). Note the
  service's `router.ts` uses `.$context<T>()` on a value imported from the contracts workspace, so
  it does not need `@orpc/server` directly — but any handler wanting `os`, `implement`, middleware,
  or `eventIterator` must edit `deno.json` first.
- Generated **contracts** workspace carries `@orpc/contract`, `@orpc/server`,
  `@netscript/contracts`, `zod` (`templates/workspace/contracts/deno-json.ts:12-17`).

---

## 5. Question 4 — Service internal folder conventions

### 5.1 What is generated (authoritative: `ServiceScaffolder.scaffold`,
`packages/cli/src/kernel/adapters/service/scaffolder.ts:39-102`)

```
services/<name>/
├── deno.json          # generate-service-deno-json.ts
└── src/
    ├── main.ts        # defineService(router, {...})            (service/main[.memory].ts.template)
    ├── router.ts      # { v1: { <svc>: {...V1, health} } }      (service/router.ts.template)
    └── routers/
        ├── v1.ts      # handler bindings                        (service/routers/v1[.memory].ts.template)
        └── health.ts                                            (service/routers/health.ts.template)
```

Exactly three directories and four files. The doc tree at
`docs/site/services-sdk/how-to/add-a-service.md:77-88` matches the code — this is one place where
docs and generator agree.

Contracts live in a *separate* workspace, versioned:
`contracts/versions/v<N>/<service>.contract.ts` + a regenerated `mod.ts` aggregate
(`packages/cli/src/kernel/adapters/contracts/version-registry.ts:33-74`), re-exported from
`contracts/mod.ts`. Version aggregation is real and discovery-driven.

### 5.2 The gap: **there is no internal folder convention at all**

- `src/routers/` is the *only* subdivision. There is no `domain/`, `application/`, `adapters/`, or
  `ports/` — the vocabulary the doctrine mandates for framework packages
  (`docs/architecture/doctrine/06-archetypes.md:55-60,92-99,132-133,229-230,291-296`;
  `docs/architecture/doctrine/05-folder-structure.md`).
- Nothing in the CLI, the doctrine, or `docs/site/services-sdk/services.md` tells a consumer where
  business logic, repositories, external clients, or domain types belong in a *generated* service.
  Grepping `docs/site/services-sdk/services.md` for `internal/|src/routers|folder` returns nothing.
- The generated `routers/v1.ts` consequently puts Prisma query construction, sort-field allow-lists,
  and pagination math **inline in the oRPC handler**
  (`packages/cli/src/kernel/assets/service/routers/v1.ts.template:12-53`). That is the pattern every
  consumer will copy, and it is precisely the "handler as god-object" shape the doctrine forbids for
  framework code.
- The doctrine's folder chapter is scoped to `packages/`/`plugins/`; there is no consumer-facing
  equivalent. So the framework holds itself to an architecture it neither generates nor documents
  for its users.
  → *gap: docs/discovery failure (primary) + scaffold/generation failure (the template teaches the
  anti-pattern).*

### 5.3 Also missing at the service seam

- No generated `tests/` directory, though the service `deno.json` declares
  `"test": "deno test -A src/"` (`generate-service-deno-json.ts:62`) — a task pointing at a tree
  with no tests.
- No generated service-level `README.md`.
- `contract.ts.template` re-exports `implement(...)` as `<Svc>V1` (line 64) but the *db* flow's
  `routers/v1.ts` binds through `v1.<svc>.$context<Ctx>()` from the contracts aggregate
  (`routers/v1.ts.template:6,13`) — two different paths to the same implementer coexist in the
  generated tree with no explanation of which is canonical.

---

## 6. Gap register (classified)

| # | Gap | Class | Severity | Citation |
| --- | --- | --- | --- | --- |
| S1 | `safe()`/`isDefinedError()` narrow to `never`; typed contract errors unreachable at the client | API/type-system seam | **High** | `sdk/src/client/errors.ts:75-92` **[probe]** |
| S2 | Docs publish the S1 code as a working example | docs/discovery failure | **High** | `docs/site/services-sdk/sdk.md:199` |
| S3 | `baseContract: ReturnType<typeof oc.errors>` erases the six-code error map | API/type-system seam | **High** | `contracts/src/application/contract-primitives.ts:81` **[probe]** |
| S4 | `createServiceClient` accepts no `headers`/`fetch`/`interceptors`/`plugins`/`link`/context type | API/type-system seam | **High** | `sdk/src/ports/service-client.ts:203-222`; `sdk/src/client/http-client-link.ts:63-158` |
| S5 | Server auth reads `Authorization`/`x-api-key`; the typed client cannot send either; no SSR cookie/identity forwarding | plugin-composition failure | **High** | `service/src/auth/static-credential-authenticator.ts:108-117` vs `sdk/src/client/http-client-link.ts:83-101` |
| S6 | Scaffolded `bridgeInvalidation` key never matches generated query keys → showcase invalidation is a silent no-op | runtime correctness | **High** | `app/lib/example-service.ts.template:11-14,22-27` vs `sdk/src/query/query-factory.ts:147,218`; consumed at `ServiceShowcaseLab.memory.tsx.template:85,115` |
| S7 | Query-factory resource is the literal `'service'` → cross-service cache-key collision + over-broad `invalidate()` | runtime correctness | **High** | `app/lib/example-service.ts.template:22-27`; `sdk/src/query/query-factory.ts:56-58,218` |
| S8 | `queryFn`/`mutationFn` drop TanStack's `AbortSignal`; query cancellation is a no-op on the factory path | runtime correctness | Medium | `sdk/src/query/query-factory.ts:148-166`; `sdk/src/query/client-proxy.ts:265-267` |
| S9 | `createQueryFactory` iterates all top-level keys → throwing members for nested routers; no nested support | runtime correctness + API seam | Medium | `sdk/src/query/query-factory.ts:61`; `client-proxy.ts:261-263`; contract shape at `service/contract.ts.template:52-59` |
| S10 | `ServiceQueryClientContext = Record<never,never>` + closed `enabled`/`staleTime` options → strictly narrower than upstream `QueryOptionsIn`; `TError` dropped; no `SkipToken` | API/type-system seam | Medium | `sdk/src/ports/service-query-utils.ts:33,58-92,167` vs `deno doc npm:@orpc/tanstack-query@1.14.6` |
| S11 | `port`/`timeout` are public, forwarded, and silently ignored | API/type-system seam | Medium | `ports/service-client.ts:216,218`; `client/service-client.ts:41-49`; `presets/define-services.ts:113-114` |
| S12 | `ClientLinkPort` is documented as an exported "transport seam" but is not exported; `createHttpClientLink` is private | docs/discovery failure + API seam | Medium | `sdk/src/ports/mod.ts:7` vs `:17-83`; `sdk/src/ports/client-link-factory.ts:18-25`; `sdk/src/client/mod.ts:15-36` |
| S13 | `RPCHandlerConfig.plugins`/`warnOnlyCodes`/`tracing`/`errorHandling`/`logging` unreachable from `withRPC()`/`defineService()`; `deduplication` is dead | API/type-system seam | Medium | `service/src/primitives/handlers.ts:331-348,362-404`; `service/src/builder/service-rpc.ts:57-58`; `service/src/builder/service-builder.ts:91-104` |
| S14 | `ServiceRouter = Record<string, unknown>` + `ContextFactory → Record<string, unknown>` → no compile-time link between injected context (`db`/`principal`/`traceHeaders`) and the router's `$context<T>()`; no exported handler-context type | API/type-system seam | Medium | `service/src/types.ts:11,240,270-272`; `service/src/builder/service-builder-impl.ts:259-282` |
| S15 | Generated client module hard-codes `exampleService*` export names → collisions across services | scaffold/generation failure | Medium | `app/lib/example-service.ts.template:8-27`; `client-scaffolder.ts:45-49` |
| S16 | `defineServices()` / `createServiceQueryUtils()` never appear on any scaffolded path | scaffold/generation failure + docs/discovery | Medium | grep of `packages/cli/src/kernel/assets/`; `sdk/src/presets/define-services.ts` |
| S17 | Docs name the `defineServices` result `{clients, queryFactories, queryUtils}`; the code returns `queries` | docs/discovery failure | Low | `docs/site/services-sdk/sdk.md:164` vs `sdk/src/presets/define-services.ts:127` |
| S18 | Scaffolded services get no internal folder convention; the generated handler embeds ORM + pagination logic | docs/discovery failure + scaffold/generation | Medium | `cli/.../service/scaffolder.ts:39-102`; `service/routers/v1.ts.template:12-53`; doctrine `06-archetypes.md:55-60` |
| S19 | Generated service has a `test` task but no `tests/` tree and no README | scaffold/generation failure | Low | `generate-service-deno-json.ts:62`; `scaffolder.ts:39-102` |
| S20 | Generated `contracts/deno.json` pins `zod ^4.3.6` vs framework `^4.4.3`; outside `deps:check:zod` | scaffold/generation failure | Low | `templates/workspace/contracts/deno-json.ts:16`; `deno.json:248` |
| S21 | Upstream client plugins never reachable: `BatchLinkPlugin`, `RetryAfterPlugin`, `SimpleCsrfProtectionLinkPlugin`; installed retry/dedupe are frozen | API/type-system seam | Medium | `sdk/src/client/http-client-link.ts:102-126` vs `deno doc npm:@orpc/client@1.14.6/plugins` |
| S22 | oRPC pinned `^1.14.6`, locked at 1.14.6, latest 1.14.15 | product-expectation / maintenance | Low | `deno.json:215-221`; `deno.lock:112-121`; npm registry |

**Out of scope / not a framework defect**: a bespoke per-app cache policy, a custom HTTP transport
for a non-Aspire deployment target, and browser CSRF token handling are legitimately consumer
concerns — but only *after* S4/S12 exist. Today they are unreachable, which converts them from
"product-expectation outside framework scope" into framework gaps.

---

## 7. Prior art on the board (dedup input)

- **#451** `feat(sdk): in-process link-mode adapter for single-process service mounting` — OPEN,
  `Backlog / Triage`. Directly adjacent to S4/S12: an in-process link *requires* a public link seam.
  Any S4 remediation should subsume or unblock it.
- **#960** `fix(sdk): plugin RPC route shape does not match createServiceClient routerName — 404 on
  triggerJob` — CLOSED. Same `routerName`/`buildServiceRpcPath` surface.
- **#279** `plugin-workers + SDK: 5 correctness/DX gaps surfaced wiring eis-chat …` — CLOSED. Prior
  evidence that real-app integration is where these seams surface.
- **#836** `feat(sdk): end-user health surface widget over the control plane [SD-6]` — OPEN,
  milestone `0.0.13`.

No open issue covers S1/S3 (typed errors), S6/S7 (scaffold invalidation + resource-key collision),
or S18 (service folder convention).

---

## 8. Reproduction commands

```bash
# S1
cat > /tmp/p2.ts <<'EOF'
import { isDefinedError, safe } from '<repo>/packages/sdk/src/client/mod.ts';
declare const p: Promise<{ ok: boolean }>;
const run = async () => {
  const [error] = await safe(p);
  if (error && isDefinedError(error)) { const c: string = error.code; console.log(c); }
};
void run;
EOF
deno check --unstable-kv --config deno.json /tmp/p2.ts   # TS2339 … on type 'never'

# S3
# build a route from baseContract, then assert a bogus key is assignable to keyof its errorMap
deno check --unstable-kv --config deno.json /tmp/p1.ts   # passes → error map is widened

# surfaces
deno doc --filter baseContract packages/contracts/mod.ts
deno doc npm:@orpc/client@1.14.6/standard | grep -A 25 'StandardRPCLinkCodecOptions'
deno doc npm:@orpc/client@1.14.6/plugins
deno doc npm:@orpc/tanstack-query@1.14.6
```
