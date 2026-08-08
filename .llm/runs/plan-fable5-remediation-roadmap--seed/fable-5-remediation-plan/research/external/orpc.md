# oRPC extension model vs. NetScript's plugin → SDK/client contribution seam

**Scope:** oRPC's extension mechanisms as documented upstream and as *actually shipped in the version
NetScript pins*, mapped against NetScript's current wrapper surfaces (`@netscript/sdk`,
`@netscript/service`, `@netscript/plugin`) and the plugin-contribution seam.
**Baseline:** worktree `plan/fable5-remediation-roadmap` @ `fac9e339042c` (2026-08-08).
**Method:** primary docs + the pinned package `.d.ts` in the Deno npm cache + repo source + one
executed `deno check` type-probe. Every load-bearing claim carries a citation.

---

## 0. What NetScript pins (verified)

| Package | deno.json range | deno.lock resolved | npm `latest` |
|---|---|---|---|
| `@orpc/client` | `^1.14.6` (`deno.json:215`) | `1.14.6` (`deno.lock:1355`) | `1.14.15` |
| `@orpc/contract` | `^1.14.6` (`deno.json:216`) | `1.14.6` (`deno.lock:1364`) | `1.14.15` |
| `@orpc/openapi` | `^1.14.6` (`deno.json:217`) | `1.14.6` (`deno.lock:1396`) | `1.14.15` |
| `@orpc/otel` | `^1.14.7` (`deno.json:218`) | `1.14.7` (`deno.lock:1410`) | `1.14.15` |
| `@orpc/server` | `^1.14.6` (`deno.json:219`) | `1.14.6` (`deno.lock:1418`) | `1.14.15` |
| `@orpc/tanstack-query` | `^1.14.6` (`deno.json:220`) | `1.14.6` (`deno.lock:1501`) | `1.14.15` |
| `@orpc/zod` | `^1.14.6` (`deno.json:221`) | `1.14.6` (`deno.lock:1509`) | `1.14.15` |

Facts established by direct inspection (not inference):

- **`.resources/deps-docs/` does not exist** in this worktree (`ls .resources` → exit 2). There is a
  `resources/` dir containing only `design/`. No local oRPC extract exists; this report reads the
  cached package tarballs at `/home/codex/.cache/deno/npm/registry.npmjs.org/@orpc/*/1.14.6/dist/`
  and the live docs.
- **npm publish timeline** (`registry.npmjs.org/@orpc/server`): `1.14.6` = 2026-06-12,
  `1.14.15` = 2026-08-07. NetScript is **~2 months / 9 patch releases behind**, but only by
  *lockfile*: the declared range `^1.14.6` already admits `1.14.15`.
- **`@orpc/server`'s public surface is byte-identical between 1.14.6 and 1.14.15.** Diffing the
  export lists of `dist/index.d.ts`, `dist/plugins/index.d.ts`, and `dist/adapters/fetch/index.d.ts`
  from the cached 1.14.6 against the freshly downloaded `server-1.14.15.tgz` produced **no
  differences**. `deno task deps:latest` reports the gap; `deno outdated --update` closes it.
  → **Conclusion: the pinned version is not the constraint. Every gap below is NetScript's own.**
- **`dist-tags` on `@orpc/server` include `beta: 2.0.0-beta.25`.** oRPC v2 is in public beta; the
  v2 `main` branch already carries `feat(rpc): restrict RPC handlers to POST, PUT, PATCH and DELETE
  by default` and `feat(server): add MethodOverrideHandlerPlugin`
  (`gh api repos/dinwwwh/orpc/commits`, both absent from the 1.14.15 tarball). Those are the real
  future breakages — see §7.
- **`orpc.unnoq.com` 301-redirects to `orpc.dev`** (observed on every fetch). Canonical doc host is
  now `orpc.dev`; URLs below are the post-redirect canonical ones. The pinned `.d.ts` JSDoc already
  emits `orpc.dev` links (e.g. `@orpc/server/dist/shared/server.qKsRrdxW.d.ts:105`).

---

## 1. oRPC's extension model — mechanism by mechanism

### 1.1 Context typing: initial vs execution context

Two distinct context layers, both type-tracked
(<https://orpc.dev/docs/context>):

- **Initial context** — declared with `os.$context<T>()`, *supplied by the caller* at
  `handler.handle(request, { context: { … } })`. Doc snippet:
  `const base = os.$context<{ headers: Headers, env: { DB_URL: string } }>()`.
- **Execution context** — produced during the call by middleware `next({ context })`.

The builder tracks both as separate type parameters:

```ts
// @orpc/server@1.14.6 dist/index.d.ts:473,491
declare class Builder<TInitialContext extends Context, TCurrentContext extends Context, …>
  $context<U extends Context>(): Builder<U & Record<never, never>, U, …>;
```

Merging is a real type operation, not a cast
(`dist/shared/server.qKsRrdxW.d.ts:6-7`):

```ts
type MergedInitialContext<TInitial, TAdditional, TCurrent> = TInitial & Omit<TAdditional, keyof TCurrent>;
type MergedCurrentContext<T, U> = Omit<T, keyof U> & U;
```

`InferRouterInitialContexts` / `InferRouterCurrentContexts` let a host *derive* the context a router
demands (`server.qKsRrdxW.d.ts:161,170`). **This is the single most important mechanism for a
plugin host** — it is how a framework can compile-time prove "the context factory supplies what
every mounted plugin router requires."

### 1.2 Middleware

`Middleware` is a 3-arg function returning `{ output, context }`
(`server.qKsRrdxW.d.ts:107-109`, `78-101`):

```ts
interface Middleware<TInContext, TOutContext, TInput, TOutput, TErrorConstructorMap, TMeta> {
  (options: MiddlewareOptions<TInContext, TOutput, TErrorConstructorMap, TMeta>,
   input: TInput, output: MiddlewareOutputFn<TOutput>): Promisable<MiddlewareResult<TOutContext, TOutput>>;
}
interface MiddlewareOptions<…> { context; path; procedure; signal?; lastEventId; next; errors }
```

Key properties:

- `next({ context })` **adds** to the execution context and the addition is captured in
  `TOutContext`; `.use()` returns a builder whose `TCurrentContext` is
  `MergedCurrentContext<TCurrentContext, UOutContext>` (`index.d.ts:533`).
- **Dependent context**: `os.$context<T>().middleware(…)` declares a middleware that *requires* `T`;
  applying it to a builder whose current context lacks `T` is a type error
  (`index.d.ts:517-518`; docs <https://orpc.dev/docs/middleware>).
- `DecoratedMiddleware.mapInput` / `.concat` compose middlewares before they reach a procedure
  (`index.d.ts:440-459`).
- **Dedupe**: `os.$config({ dedupeLeadingMiddlewares: false })`
  (`BuilderConfig`, `index.d.ts:462-466`;
  <https://orpc.dev/docs/best-practices/dedupe-middleware>). "Deduplication occurs only if the
  router middlewares is a subset of the leading procedure middlewares and appears in the same
  order."
- Middleware can be attached at **procedure**, **router** (`RouterBuilder.use`), or **contract
  implementer** level (`RouterImplementer.use`, `index.d.ts:721`).

### 1.3 Interceptors — six distinct slots

Interceptors are `Interceptor<Options, Result>` functions (from `@orpc/shared`), *not* classes.
Server side (`@orpc/server/dist/shared/server.7cEtMB30.d.ts:47-62`):

```ts
interface StandardHandlerOptions<TContext extends Context> {
  plugins?: StandardHandlerPlugin<TContext>[];
  interceptors?:       Interceptor<StandardHandlerInterceptorOptions<TContext>, Promise<StandardHandleResult>>[];
  rootInterceptors?:   Interceptor<StandardHandlerInterceptorOptions<TContext>, Promise<StandardHandleResult>>[];
  clientInterceptors?: Interceptor<ProcedureClientInterceptorOptions<TContext, Record<never,never>, Meta>, Promise<unknown>>[];
}
```

Client side (`@orpc/client/dist/shared/client.2jUAqzYU.d.ts:30-34`):

```ts
interface StandardLinkOptions<T extends ClientContext> {
  interceptors?:       Interceptor<StandardLinkInterceptorOptions<T>, Promise<unknown>>[];
  clientInterceptors?: Interceptor<StandardLinkClientInterceptorOptions<T>, Promise<StandardLazyResponse>>[];
  plugins?: StandardLinkPlugin<T>[];
}
```

Plus a fetch-adapter slot (`@orpc/client/dist/adapters/fetch/index.d.ts`):

```ts
interface LinkFetchClientOptions<T extends ClientContext> extends ToFetchRequestOptions {
  fetch?: (request, init, options, path, input) => Promise<Response>;
  adapterInterceptors?: Interceptor<LinkFetchInterceptorOptions<T>, Promise<Response>>[];
  plugins?: LinkFetchPlugin<T>[];
}
```

So the extension surface is **6 interceptor arrays + 3 plugin arrays**, each with a different
options shape and a different point in the request lifecycle
(<https://orpc.dev/docs/rpc-handler>, <https://orpc.dev/docs/client/rpc-link>).

### 1.4 Plugins — a two-method interface, nothing more

```ts
// server: dist/shared/server.7cEtMB30.d.ts:7-10
interface StandardHandlerPlugin<T extends Context> {
  order?: number;
  init?(options: StandardHandlerOptions<T>, router: Router<any, T>): void;
}
// client: dist/shared/client.2jUAqzYU.d.ts:5-8
interface StandardLinkPlugin<T extends ClientContext> {
  order?: number;
  init?(options: StandardLinkOptions<T>): void;
}
```

A plugin is *a function that mutates the handler/link options object at construction time* — it
pushes interceptors, sets defaults, and orders itself relative to other plugins via `order`.
`CompositeStandardHandlerPlugin` / `CompositeStandardLinkPlugin` sort and fan out `init`.
Registration is a plain `plugins: []` array on the handler/link constructor
(<https://orpc.dev/docs/plugins/cors>: `new RPCHandler(router, { plugins: [new CORSPlugin({…})] })`).

**Built-ins shipped in the pinned 1.14.6** (verified from the tarball export lines, not the docs):

| Entrypoint | Exports |
|---|---|
| `@orpc/server/plugins` | `BatchHandlerPlugin`, `CORSPlugin`, `RequestHeadersPlugin`, `ResponseHeadersPlugin`, `SimpleCsrfProtectionHandlerPlugin`, `StrictGetMethodPlugin`, `experimental_RethrowHandlerPlugin` |
| `@orpc/server/fetch` | `BodyLimitPlugin`, `CompressionPlugin` (+ `FetchHandlerPlugin`, `CompositeFetchHandlerPlugin`) |
| `@orpc/client/plugins` | `BatchLinkPlugin`, `ClientRetryPlugin`, `DedupeRequestsPlugin`, `RetryAfterPlugin`, `SimpleCsrfProtectionLinkPlugin` |
| `@orpc/contract/plugins` | `RequestValidationPlugin`, `ResponseValidationPlugin` |
| `@orpc/openapi/plugins` | `OpenAPIReferencePlugin` |

Note the adapter-level extension hook: `LinkFetchPlugin` adds `initRuntimeAdapter?(options)` on top
of `StandardLinkPlugin` — a plugin may reach the fetch layer specifically.

### 1.5 Client links

`ClientLink` is a one-method interface (`client.i2uoJbEp.d.ts:25-27`):

```ts
interface ClientLink<TClientContext extends ClientContext> {
  call: (path: readonly string[], input: unknown, options: ClientOptions<TClientContext>) => Promise<unknown>;
}
```

`createORPCClient(link)` turns it into a proxy-typed nested client. Extension points on the concrete
`RPCLink` (`StandardRPCLinkCodecOptions`, `client.B3pNRBih.d.ts`):

- `url`, `method`, `fallbackMethod`, `maxUrlLength` — all `Value<…, [options, path, input]>`, i.e.
  **per-call functions that receive the client context**.
- `headers?: Value<Promisable<StandardHeaders | Headers>, [options: ClientOptions<T>, path, input]>`
  — this is oRPC's *native credential-injection seam*. Docs snippet:
  `headers: async ({ context }) => ({ 'x-api-key': context?.something ?? '' })`
  (<https://orpc.dev/docs/client/rpc-link>).
- `customJsonSerializers?: readonly StandardRPCCustomJsonSerializer[]` — extend the wire format.
- `DynamicLink` (`@orpc/client` index.d.ts:218) resolves a *different link per call* from
  `(options, path, input)` — oRPC's equivalent of tRPC's `splitLink`.

Crucially, **`ClientContext = Record<PropertyKey, any>` is a free type parameter**
(`client.i2uoJbEp.d.ts:5`) and `ClientRest` makes it *required at the call site* when non-empty
(`client.i2uoJbEp.d.ts:16`): if a link declares `RPCLink<{ token: string }>`, every call must pass
`{ context: { token } }` or fail to compile. That is the composition primitive for
plugin-contributed credentials.

### 1.6 Contract-first router extension

`implement(contract)` returns an `Implementer` that is a *structural mirror of the contract tree*,
each node carrying `$context`, `$config`, `.use`, `.router`, `.lazy`, `.handler`
(`@orpc/server/dist/index.d.ts:744-759`, `702-742`;
<https://orpc.dev/docs/contract-first/implement-contract>). The contract builder `oc`
(`@orpc/contract`) is transport-free — it carries `.route`, `.meta`, `.errors`, `.input`, `.output`
only. `EnhancedRouter` (`server.ChyoA9XY.d.ts`) is the type-level result of applying router-level
middlewares/prefix/tags/errors to a subtree, preserving each leaf's own generics.

`setHiddenRouterContract` / `getHiddenRouterContract` (`index.d.ts:799-800`) let a host attach the
originating contract to an assembled router — the mechanism a plugin registry would use to recover
"what contract does this mounted subtree implement."

### 1.7 Procedure metadata

`os.$meta<T>(initialMeta)` fixes a metadata type for the whole builder
(`index.d.ts:497`); `.meta(m)` spread-merges (`index.d.ts:540`). Middleware reads it off the
procedure handle it is given: `procedure['~orpc'].meta.cache`
(<https://orpc.dev/docs/metadata>). `MiddlewareOptions.procedure` and
`ProcedureHandlerOptions.procedure` are both typed `Procedure<…, TMeta>`
(`server.qKsRrdxW.d.ts:48,96`), so metadata is **typed all the way into middleware** — this is the
native home for policy metadata (`requiresAuth`, `scopes`, `rateLimit`, `cache`).

### 1.8 Type-safe errors

`.errors({ CODE: { status, message, data: <StandardSchema> } })` builds an `ErrorMap`; the handler
receives an `ORPCErrorConstructorMap` (`errors.NOT_FOUND({ data })`) and the client's promise type
carries the error union (`server.qKsRrdxW.d.ts:10-15,116`;
<https://orpc.dev/docs/error-handling>):

```ts
type ProcedureClient<TClientContext, TInputSchema, TOutputSchema, TErrorMap> =
  Client<TClientContext, InferSchemaInput<TInputSchema>, InferSchemaOutput<TOutputSchema>, ErrorFromErrorMap<TErrorMap>>;
type ClientPromiseResult<TOutput, TError> = PromiseWithError<TOutput, TError>;
```

`safe()` then **discriminates on `isDefined`** (`@orpc/client/dist/index.d.ts:139-158`):

```ts
declare function safe<TOutput, TError = ThrowableError>(promise: ClientPromiseResult<TOutput, TError>): Promise<SafeResult<TOutput, TError>>;
// SafeResult = success | [Exclude<TError, ORPCError<any,any>>, undefined, false, false] | [Extract<TError, ORPCError<any,any>>, undefined, true, false]
```

`InferClientErrors` / `InferClientErrorUnion` expose the per-procedure error union to consumers
(`client.i2uoJbEp.d.ts:71-81`).

---

## 2. Contrast: tRPC's extension model

| Concern | oRPC 1.14.x | tRPC v11 |
|---|---|---|
| Server extension unit | `StandardHandlerPlugin` (`init(options, router)`) + 3 interceptor arrays | Middleware (`t.middleware`) only; no handler-plugin concept |
| Client extension unit | `ClientLink` + `StandardLinkPlugin` + 3 interceptor arrays | `TRPCLink` chain (`links: []`), observable-based |
| Link composition | `DynamicLink` resolves per call; plugins push interceptors | `splitLink`, `loggerLink`, `retryLink`; "links execute in the order they are added … and again in reverse when handling a response" (<https://trpc.io/docs/client/links>) |
| Custom link shape | `call(path, input, options) => Promise<unknown>` — a plain async fn | `() => ({ next, op }) => observable(observer => …)` — requires the observable runtime (<https://trpc.io/docs/client/links>) |
| Per-call client context | `ClientContext` type param, **required at the call site** when non-empty | No typed per-call context; `httpLink({ headers: ctx => … })` reads `op`, untyped |
| Contract-first | First-class: `@orpc/contract` + `implement()`; contract has no server dep | Not supported — the router *is* the contract |
| Procedure metadata | `os.$meta<T>()`, typed into middleware via `procedure['~orpc'].meta` | `initTRPC.meta<T>()` + `.meta()`, read via `opts.meta` — comparable |
| Type-safe errors | `.errors({…})` → per-procedure error union on client, `safe()` discriminates `isDefined` | Fixed `TRPCError` code enum + `errorFormatter`; the tRPC error-handling docs cover codes and `getHTTPStatusCodeFromError` but **do not document per-procedure client-side error payload inference** (<https://trpc.io/docs/server/error-handling>) |
| OpenAPI | First-party `@orpc/openapi` + `.route()` on the contract | Community (`trpc-openapi`) |

**Takeaway for NetScript:** oRPC already provides *more* extension surface than tRPC in exactly the
four dimensions a plugin system needs — typed per-call client context, contract-first router
composition, typed procedure metadata, and per-procedure typed errors. NetScript's problem is not
a missing upstream primitive; it is that its wrappers **erase** all four.

---

## 3. What NetScript has today — what exists and works

1. **Real oRPC handler plugins are authored in-repo and do work.**
   `packages/telemetry/src/orpc/tracing-plugin.ts` wraps the first-party `ORPCInstrumentation` from
   `@orpc/otel`; `packages/telemetry/src/orpc/error-plugin.ts` and `packages/logger/orpc-plugin.ts`
   implement `init(handlerOptions, router)` and push root/client interceptors
   (`packages/logger/orpc-plugin.ts:173`). These are legitimate `StandardHandlerPlugin`s.
2. **A composed default plugin stack exists.**
   `createRPCPlugins()` (`packages/service/src/primitives/handlers.ts:69-108`) assembles
   Tracing → ErrorHandling → Logging → CORS and appends `config.plugins`.
   `createOpenAPIHandler` additionally adds `ZodSmartCoercionPlugin`
   (`handlers.ts:164`).
3. **Client link uses genuine oRPC plugin composition.**
   `createHttpClientLink` builds an `RPCLink` with `ClientRetryPlugin` + `DedupeRequestsPlugin`,
   context-driven dedupe groups, `inferRPCMethodFromContractRouter`, and a custom `fetch` that opens
   a CLIENT span (`packages/sdk/src/client/http-client-link.ts:75-156`). This is idiomatic oRPC.
4. **Contract-first is real.** `BASE_PLUGIN_CONTRACT_ROUTES` is built with the actual contract
   builder `oc` and carries the base error map + capabilities output schema
   (`packages/plugin/src/contract-base/domain/base-contract.ts:106-114`); `BasePluginContract`
   constrains extra routes to `AnyContractRouter`, so `satisfies` is a genuine guard
   (`base-contract.ts:73-79`).
5. **A shared, typed error map exists.** `BASE_PLUGIN_ERRORS` (`NOT_FOUND` 404 / `VALIDATION_ERROR`
   422 / `INTERNAL` 500) with Standard-Schema `data` payloads, shaped for spread into
   `.errors({…})` (`packages/plugin/src/contract-base/domain/base-errors.ts:98-118`).
6. **The upstream TanStack bridge is wired.** `createServiceQueryUtils` really calls
   `createTanstackQueryUtils` (`packages/sdk/src/query-client/create-service-query-utils.ts:12,57`).
7. **Desktop transport reuses oRPC's MessagePort link** with custom JSON serializers
   (`packages/sdk/src/desktop/application/desktop-rpc-client.ts:18-21`).
8. **The reference plugin uses `$context` correctly.**
   `workersContractV1.$context<WorkersRequestContext>()`
   (`plugins/workers/services/src/routers/router-context.ts:41-43`) preserves the implementer type
   and derives handler types with a mapped type rather than `any`
   (`router-context.ts:59-62`).

---

## 4. Gaps — classified

### G1. There is no plugin → SDK/client contribution group at all
**Class: plugin-composition failure.**

`PluginContributions` (`packages/plugin/src/config/domain/plugin-contributions.ts:12-39`) enumerates
`cli`, `services`, `backgroundProcessors`, `streamTopics`, `databaseSchemas`,
`runtimeConfigTopics`, `contractVersions`, `e2e`, `telemetry`, `migrations`, `aspire`, `doctor`.
**None of these is a client-side contribution.** There is no `linkPlugins`, `handlerPlugins`,
`clientContext`, `headers`, `queryFactories`, `invalidation`, or `policy` group. A plugin therefore
has *no declarative way* to influence the SDK client, the query layer, or the server handler stack.

Corroborating: `ServiceContribution` is three fields — `name`, `entrypoint`, `port?`
(`packages/plugin/src/config/domain/service-contribution.ts:2-9`).

Sub-finding (same class): the one CLI contribution slot is a **closed literal union naming a
first-party plugin**: `readonly doctorChecks?: readonly 'auth-backend'[]`
(`plugin-contributions.ts:16`). A third-party plugin cannot contribute a doctor check without
editing framework source.

### G2. The service client has no credential/header injection seam
**Class: API/type-system seam.**

- `CreateServiceClientOptions` (`packages/sdk/src/ports/service-client.ts:203-222`) exposes
  `contract, serviceName, routerName, protocol, apiPath, apiVersion, port, timeout,
  propagateTraceContext`. **No `headers`, no `context`, no `plugins`, no `interceptors`,
  no `fetch`.**
- `createHttpClientLink`'s `headers` callback is hard-coded to `Content-Type` + trace propagation
  (`packages/sdk/src/client/http-client-link.ts:83-101`) and its `plugins` array is a **literal**
  (`http-client-link.ts:102-126`) — nothing can be appended.
- `DefineServiceConfig` (`packages/sdk/src/presets/define-services.ts:22-44`) adds only `options`
  and `queryPath`; same absence.
- The desktop link is likewise closed (`desktop-rpc-client.ts:18-21`).

oRPC hands this over for free (`headers: Value<…, [ClientOptions<T>, path, input]>`,
`plugins: StandardLinkPlugin<T>[]`, `interceptors`, `clientInterceptors`, `adapterInterceptors`,
`fetch`). **NetScript closes all six.**

### G3. Client context is fixed and closed — it cannot carry plugin-contributed credentials
**Class: API/type-system seam.**

`ServiceClientContext` (`packages/sdk/src/ports/service-client.ts:129-155`) is a **concrete
interface** with exactly `signal`, `cache`, `retry`, `retryDelay`, `shouldRetry`, `onRetry`,
`traceHeaders`. It is not a type parameter. Every call site is typed
`ServiceClientMethod<TInput, TOutput> = (input, options?: { context?: ServiceClientContext }) => Promise<TOutput>`
(`service-client.ts:168-171`).

Worse on the query side:

```ts
// packages/sdk/src/ports/service-query-utils.ts:33
/** Empty oRPC client context used by SDK-created service clients. */
export type ServiceQueryClientContext = Record<never, never>;
```

The TanStack surface **hard-codes an empty client context**. So even if a plugin could reach the
link, no per-call token/tenant/scope could be threaded through `queryOptions({ context })` — the
exact mechanism oRPC's docs prescribe for `x-api-key`-style injection.

### G4. `ServiceClient<T>` re-derives oRPC's client instead of using `RouterClient<T>` — and drops the error type
**Class: API/type-system seam. Verified by executed type-check.**

`ServiceClientShape` / `ServiceClientMethod` (`service-client.ts:168-196`) reconstruct the client
tree structurally, returning `Promise<TOutput>`. oRPC returns
`ClientPromiseResult<TOutput, ErrorFromErrorMap<TErrorMap>>`
(`server.qKsRrdxW.d.ts:116-117`). **The `TError` channel is discarded at the SDK boundary.**

Consequence, and this is the sharpest finding in the report:

`packages/sdk/src/client/errors.ts:86` declares `safe<TOutput>(promise): Promise<SafeResult<TOutput>>`
— one generic, `TError` defaulted to `unknown` (`errors.ts:49`). Then
`isDefinedError<T>(error: T): error is Extract<T, DefinedError>` (`errors.ts:75`). With
`T = unknown`, `Extract<unknown, DefinedError>` evaluates to `never`.

Executed probe (scratchpad file, root `deno.json`):

```ts
const [error, data] = await safe(p);
if (error && isDefinedError(error)) { const c = error.code; }
```

```
$ deno check --unstable-kv --config deno.json <scratch>/probe.ts
TS2339 [ERROR]: Property 'code' does not exist on type 'never'.
    const c = error.code;
Found 2 errors.
```

**The SDK's documented error-handling pattern does not compile.** The published docs assert the
opposite:

- `docs/site/services-sdk/how-to/discover-services.md:138-146` — "narrow defined errors with
  `isDefinedError`" then `// error.code and error.data are typed from the contract`.
- `docs/site/services-sdk/sdk.md:199` — the same `safe`/`isDefinedError` snippet.
- `packages/sdk/README.md:156` lists `isDefinedError` as a `./client` export.

And the guard that should have caught it is neutralised: the README doctest **re-declares** the
helpers with different signatures rather than importing them —
`declare function safe<T>(value: Promise<T>): Promise<[unknown, T | undefined]>;` and
`declare function isDefinedError(error: unknown): error is { readonly code: string; readonly data: unknown };`
(`packages/sdk/tests/readme-doctest_test.ts:36-37`). The doctest passes against a fiction.

This is simultaneously a **docs/discovery failure** (docs claim a capability that is absent) and an
**API/type-system seam** (the wrapper drops a generic).

### G5. The plugin contract binder erases the implementer type
**Class: API/type-system seam.**

```ts
// packages/plugin/src/service/presentation/plugin-contract-binder.ts:18
export type PluginContractRouter = object;
```

`PluginContractImplementer.$context<TContext>(): PluginContractRouter` throws away
`Implementer<TContract, TInitialContext, TCurrentContext>`; route keys are then recovered
structurally by probing for `{ handler: (...args: never[]) => unknown }`
(`plugin-contract-binder.ts:33-35`). Consequences:

- **No `.use()` is exposed on the binder at all** — a plugin cannot contribute oRPC middleware
  through the sanctioned seam, even though `RouterImplementer.use` exists upstream
  (`@orpc/server/dist/index.d.ts:721`).
- Contract error maps and metadata do not survive to the handler map type.
- First-party plugins annotate the result as `Readonly<Record<string, unknown>>`
  (`plugins/workers/services/src/router.ts:11`, `plugins/sagas/services/src/router.ts:11`,
  `plugins/auth/services/src/router.ts:11`, `plugins/triggers/services/src/router.ts:15`).

Divergence worth flagging (**scaffold/generation failure**): the CLI scaffold emits
`bindPluginContract(...)` (`packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts:660,667`,
asserted by `new-plugin_test.ts:75`), but **no first-party plugin uses it** — they call
`assemblePluginContractRouter` directly, and `workers` bypasses the seam entirely with
`workersContractV1.$context<WorkersRequestContext>()`. Generated plugins therefore start on a
different, less-used path than the reference implementations.

### G6. `ServiceHandlerPlugin` is an untyped shim; `StandardHandlerOptions<T>` never reaches plugin authors
**Class: API/type-system seam.**

```ts
// packages/service/src/types.ts:216-225
export interface ServiceHandlerPlugin {
  readonly order?: number;
  init?(options: unknown, router: unknown): void;
  initRuntimeAdapter?(options: unknown): void;
}
```

Upstream gives `init?(options: StandardHandlerOptions<T>, router: Router<any, T>)`. Because
NetScript hands over `unknown`, every plugin author must cast before touching
`options.interceptors` / `rootInterceptors` / `clientInterceptors` — which is exactly what the
in-repo logger plugin does (`packages/logger/orpc-plugin.ts` redeclares its own
`RootLoggingInterceptorOptions` / `ClientLoggingInterceptorOptions` shims, lines 11-42). The
framework's own plugins are the proof that the seam is unusable as typed.

### G7. The `plugins` option is unreachable from the builder path
**Class: runtime correctness / plugin-composition failure.**

`RPCHandlerConfig.plugins` exists (`packages/service/src/primitives/handlers.ts:45`) — but the only
non-doc call site in the repo is:

```ts
// packages/service/src/builder/service-rpc.ts:57
const rpcHandler = createRPCHandler(options?.rpcRouter ?? router, { serviceName, debug });
```

`plugins` is never populated. And `ServiceBuilder.withRPC` accepts only
`{ rpcPath, apiPath, debug, traceContext, rpcAliases, deprecatedRpcRoutes, rpcRouter }`
(`packages/service/src/builder/service-builder-impl.ts:222-240`) — **no `plugins`, no
`interceptors`**. `createPluginService` likewise passes none
(`packages/plugin/src/service/presentation/create-plugin-service.ts:165-178`). So the documented
extension point is dead code on every path a plugin or app actually takes.

### G8. "Middleware" in NetScript means Hono middleware, not oRPC middleware
**Class: API/type-system seam / docs-discovery failure.**

```ts
// packages/service/src/types.ts:243
export type ServiceMiddleware = MiddlewareHandler;   // from hono
```

`createPluginService`'s `config.middleware` feeds `builder.use(middleware)`
(`create-plugin-service.ts:157-159`) → Hono. There is **no** seam anywhere that accepts an
`@orpc/server` `Middleware`. Credential extraction, tenant resolution, and policy enforcement
therefore cannot produce *typed execution context*; they can only mutate Hono's context bag.

### G9. The oRPC context contract is unverified at the host boundary
**Class: runtime correctness.**

```ts
// packages/service/src/types.ts:270
export type ContextFactory = (context: Context) => Record<string, unknown>;
```

`buildRpcContext` then bolts on `ctx.db`, `ctx.traceHeaders`, `ctx.principal`
(`packages/service/src/builder/service-builder-impl.ts:255-281`), and
`packages/service/src/primitives/orpc-router.ts:10` declares
`OrpcRouter = Router<never, Record<PropertyKey, unknown>>`.

Meanwhile the workers connector *asserts* `WorkersRequestContext = { db; traceHeaders?; workers }`
(`plugins/workers/services/src/routers/router-context.ts:35-39`) and re-narrows at runtime with a
throw:

```ts
// router-context.ts:63-69
export function getWorkersRuntime(context: unknown): WorkersServiceRuntime {
  const runtime = (context as Partial<WorkersRequestContext>).workers;
  if (!runtime) throw new Error('Workers service runtime missing from request context.');
```

oRPC's `InferRouterInitialContexts` (`server.qKsRrdxW.d.ts:161`) exists precisely so the host can
*prove* the factory satisfies every mounted router. NetScript instead converts a compile-time
guarantee into a runtime `throw`.

### G10. Two incompatible query/invalidation systems, neither aligned with oRPC keys
**Class: API/type-system seam + product-expectation drift.**

- `createQueryFactory` (`packages/sdk/src/query/query-factory.ts`) is hand-rolled: it enumerates
  procedures with `Object.keys(contract)` (**line 61**, so *flat contracts only* — a nested
  contract router silently contributes zero actions), emits keys
  `[resource, action, { input }]` (**line 147**) and `[resource, action]` (**line 165**), and
  invalidates via a bespoke `getCacheProvider().invalidateQueries([resource, action])`
  (**lines 56-58, 87-89**).
- `createServiceQueryUtils` delegates to upstream `createTanstackQueryUtils`, whose keys are
  `[path: readonly string[], options: { type, input, fnOptions }]`
  (`@orpc/tanstack-query/dist/index.d.ts:39`, generated by `generateOperationKey`, line 109).

`defineServices` returns **both** (`packages/sdk/src/presets/define-services.ts:83-92`:
`clients`, `queries`, `queryUtils`). The two key algebras do not overlap, so
`queryClient.invalidateQueries(utils.orders.key())` cannot invalidate anything the `queries` factory
cached, and vice versa. Also unavailable on the hand-rolled path: `infiniteOptions`,
`experimental_streamedOptions`, `experimental_liveOptions`, `mutationKey`, and
`experimental_defaults` (`@orpc/tanstack-query/dist/index.d.ts:135-243`) — all of which
`@orpc/tanstack-query@1.14.6` already ships.

### G11. Procedure metadata is entirely unused — the natural policy seam is empty
**Class: plugin-composition failure.**

`grep -rnE '\$meta<|\.meta\(\{ *(policy|scope|auth|requires)'` over `packages/` + `plugins/` returns
**zero hits**. No contract calls `oc.$meta<T>()`; no procedure calls `.meta({…})`. The only `.meta(`
matches in the repo are Zod schema annotations (`packages/aspire/config.ts:348…`).

oRPC's metadata is typed into `MiddlewareOptions.procedure` (`server.qKsRrdxW.d.ts:96`) and
`ProcedureHandlerOptions.procedure` (line 48) — i.e. it is the designed home for
`requiresAuth` / `scopes` / `rateLimit` / `cache` policy that middleware and plugins read. NetScript
instead performs auth/authz as Hono-level path guards (`withAuthn`/`withAuthz`,
`service-builder-impl.ts:244-252`), which cannot see procedure identity.

---

## 5. Mechanism → NetScript seam map

| Seam NetScript needs | oRPC gives free (1.14.6, verified) | NetScript must add | Gap ref |
|---|---|---|---|
| **Credential injection (client)** | `RPCLink.headers: Value<…, [ClientOptions<T>, path, input]>`; `ClientContext` as a type parameter required at the call site | Open `CreateServiceClientOptions` to `headers`/`context`/`plugins`/`interceptors`; make `ServiceClientContext` a *parameter* with a NetScript base, not a closed interface | G2, G3 |
| **Header/trace/tenant contribution from a plugin** | `StandardLinkPlugin.init(options)` pushing `clientInterceptors`; `RequestHeadersPlugin`/`ResponseHeadersPlugin` server-side | A `linkPlugins` (client) + `handlerPlugins` (server) contribution group in `PluginContributions`, and an aggregation point that concatenates them into the link/handler arrays | G1, G2, G7 |
| **Query factories** | `createTanstackQueryUtils` with `queryOptions/mutationOptions/infiniteOptions/streamedOptions`, `experimental_defaults`, nested routers | Delete or reduce the bespoke `createQueryFactory` to a thin adapter over upstream utils; make the cache provider key off `generateOperationKey` | G10 |
| **Invalidation** | `.key()` partial-match keys `[path[], { type, input }]`; `queryClient.invalidateQueries(utils.x.key())` | One key algebra. Today there are two, and they are disjoint | G10 |
| **Policy metadata** | `os.$meta<T>()` / `oc.$meta<T>()`, typed into `MiddlewareOptions.procedure['~orpc'].meta` | Define a NetScript `ProcedureMeta` (auth/scopes/rate-limit/cache), thread `$meta` through `contract-base`, and ship a middleware/plugin that reads it | G11, G8 |
| **Typed execution context from plugins** | `Middleware` + `next({ context })` + `MergedCurrentContext`; `$context<T>()` dependent-context guards | A seam that accepts `@orpc/server` `Middleware` (not Hono `MiddlewareHandler`), plus `InferRouterInitialContexts`-based verification that `ContextFactory` satisfies every mounted router | G8, G9, G5 |
| **Typed errors end-to-end** | `.errors()` → `ErrorFromErrorMap` → `ClientPromiseResult<TOutput, TError>` → `safe()` discriminating `isDefined` | Stop re-deriving the client: alias `ServiceClient<T>` to `RouterClient<…>` (or add the `TError` channel), and give `safe`/`isDefinedError` the second generic | G4 |
| **Contract-first plugin routers** | `implement()` → `Implementer` with `$context`/`$config`/`.use`/`.router`/`.lazy`; `setHiddenRouterContract` | Stop erasing to `object`; expose `.use()`; keep the contract handle on the assembled router so the registry can recover it | G5 |

---

## 6. What the pinned version *cannot* do

Almost nothing NetScript needs is blocked by `1.14.6`:

- Every mechanism cited in §1 is present in the cached 1.14.6 `.d.ts` — plugins, six interceptor
  arrays, `$context`/`$meta`/`$config`, typed errors, `DynamicLink`, `customJsonSerializers`,
  contract-first `implement()`, and the full TanStack utils surface incl. `infiniteOptions`,
  `experimental_streamedOptions`, `experimental_liveOptions`, `experimental_defaults`.
- The `@orpc/server` public export list is **identical** in 1.14.6 and 1.14.15 (diff run, §0).

Genuine limits of the pinned line:

1. `experimental_` prefixes on `streamedOptions` / `liveOptions` / `RethrowHandlerPlugin` /
   `ProcedureUtilsDefaults` — API stability is not guaranteed inside 1.x. Anything NetScript builds
   on those needs a wrapper it controls.
2. `@orpc/tanstack-query` `CreateProcedureUtilsOptions` / `CreateRouterUtilsOptions` carry
   `@todo remove default generic types on v2` (`dist/index.d.ts:246,261`) — a signposted v2 break.
3. `@orpc/otel` is at `1.14.7` while everything else is `1.14.6` — a mixed-version island
   (`deno.lock:1410` vs `1418`), which also drags a second `@orpc/shared@1.14.7`
   (`deno.lock:1445`) into the graph alongside `1.14.6` (line 1434). Duplicate `@orpc/shared` copies
   are a known source of `instanceof ORPCError` cross-context failures — the pinned client even
   ships a `Symbol.hasInstance` workaround for exactly this class of problem
   (`@orpc/client/dist/index.d.ts:118-129`).

**Upgrade implications**

- **1.14.6 → 1.14.15: patch-level, zero public-surface change on `@orpc/server`.** Do it, if only to
  collapse the `@orpc/shared` 1.14.6/1.14.7 duplication. `deno task deps:latest` already flags all
  seven packages; `.agents/skills/netscript-deno-toolchain` owns the mechanics.
- **2.0.0-beta.25 is published on the `beta` dist-tag.** The v2 `main` branch already contains
  `feat(rpc): restrict RPC handlers to POST, PUT, PATCH and DELETE by default` and
  `feat(server): add MethodOverrideHandlerPlugin` (`gh api repos/dinwwwh/orpc/commits`; neither is
  in the 1.14.15 tarball). The first of those directly threatens NetScript's GET-based caching path:
  `createHttpClientLink` sets `method: inferRPCMethodFromContractRouter(contract)` and dedupes on
  `request.method === 'GET'` (`packages/sdk/src/client/http-client-link.ts:82,109`). **Plan the
  remediation so the transport policy lives behind one NetScript-owned function**, not scattered
  across link construction — otherwise the v2 migration touches every client call path.
- The oRPC GitHub org moved (`unnoq/orpc` → `dinwwwh/orpc`) and `orpc.unnoq.com` now 301s to
  `orpc.dev`. Any doc links NetScript ships pointing at `orpc.unnoq.com` should be rewritten.

---

## 7. Recommended remediation shape (ordered by leverage)

1. **Reopen the client link.** Add `headers` / `context` / `plugins` / `interceptors` /
   `clientInterceptors` / `fetch` passthrough to `CreateServiceClientOptions` and
   `DefineServiceConfig`; make `ServiceClientContext` a type parameter with a NetScript base.
   Unblocks G2, G3, and most of G1's client half. *(API/type-system seam.)*
2. **Restore the error channel.** Give `ServiceClientMethod` a `TError`, and `safe` /
   `isDefinedError` their second generic. Then delete the fictitious declarations from
   `readme-doctest_test.ts:36-37` so the doctest actually type-checks the shipped helpers.
   Fixes the only *verified compile failure* in this report. *(API/type-system seam + docs.)*
3. **Add a client/server contribution group to `PluginContributions`** (`linkPlugins`,
   `handlerPlugins`, `middleware` as oRPC `Middleware`, `procedureMeta`), and wire an aggregation
   point into `createServiceClient` and `withRPC`. This is the seam that does not exist today.
   *(plugin-composition.)*
4. **Un-erase the binder.** `PluginContractRouter = object` → the real `Implementer`; expose `.use`.
   Then reconcile the scaffold (`bindPluginContract`) with what first-party plugins actually do
   (`assemblePluginContractRouter` / raw `$context`). *(API seam + scaffold/generation.)*
5. **Pick one query algebra.** Reduce `createQueryFactory` to an adapter over
   `createTanstackQueryUtils` keys, or drop it. Two disjoint invalidation namespaces returned from
   the same `defineServices()` call is a correctness trap, not just duplication. *(API seam.)*
6. **Introduce `$meta`-based policy** and move authn/authz from Hono path guards to oRPC middleware
   that reads `procedure['~orpc'].meta`. *(plugin-composition.)*
7. **Verify the context contract** with `InferRouterInitialContexts` instead of
   `Record<string, unknown>` + runtime throws. *(runtime correctness.)*
8. **Bump 1.14.6 → 1.14.15** and de-duplicate `@orpc/shared`. Low risk (identical surface), removes
   a real `instanceof` hazard.

---

## 8. Citation index

**Primary docs (canonical host `orpc.dev`; `orpc.unnoq.com` 301s here):**
<https://orpc.dev/docs/context> ·
<https://orpc.dev/docs/middleware> ·
<https://orpc.dev/docs/metadata> ·
<https://orpc.dev/docs/error-handling> ·
<https://orpc.dev/docs/rpc-handler> ·
<https://orpc.dev/docs/client/rpc-link> ·
<https://orpc.dev/docs/plugins/cors> ·
<https://orpc.dev/docs/contract-first/implement-contract> ·
<https://orpc.dev/docs/integrations/tanstack-query> ·
<https://orpc.dev/docs/best-practices/dedupe-middleware> ·
<https://trpc.io/docs/client/links> ·
<https://trpc.io/docs/server/error-handling>

**Pinned package sources** (`/home/codex/.cache/deno/npm/registry.npmjs.org/@orpc/…/1.14.6/dist/`):
`server/index.d.ts`, `server/plugins/index.d.ts`, `server/adapters/fetch/index.d.ts`,
`server/shared/server.qKsRrdxW.d.ts`, `server/shared/server.7cEtMB30.d.ts`,
`server/shared/server.ChyoA9XY.d.ts`, `client/index.d.ts`, `client/plugins/index.d.ts`,
`client/adapters/fetch/index.d.ts`, `client/shared/client.i2uoJbEp.d.ts`,
`client/shared/client.2jUAqzYU.d.ts`, `client/shared/client.B3pNRBih.d.ts`,
`contract/plugins/index.d.ts`, `openapi/plugins/index.d.ts`, `tanstack-query/index.d.ts`.
1.14.15 comparison tarball: `registry.npmjs.org/@orpc/server/-/server-1.14.15.tgz`.

**Repo files cited:** `deno.json:215-221`; `deno.lock:1355-1509`;
`packages/sdk/src/client/http-client-link.ts`; `packages/sdk/src/client/service-client.ts`;
`packages/sdk/src/client/errors.ts`; `packages/sdk/src/ports/service-client.ts`;
`packages/sdk/src/ports/service-query-utils.ts`; `packages/sdk/src/ports/client-link-factory.ts`;
`packages/sdk/src/query/query-factory.ts`; `packages/sdk/src/query-client/create-service-query-utils.ts`;
`packages/sdk/src/presets/define-services.ts`; `packages/sdk/src/desktop/application/desktop-rpc-client.ts`;
`packages/sdk/tests/readme-doctest_test.ts`; `packages/sdk/README.md:156`;
`packages/service/src/types.ts`; `packages/service/src/primitives/handlers.ts`;
`packages/service/src/primitives/orpc-router.ts`; `packages/service/src/builder/service-builder-impl.ts`;
`packages/service/src/builder/service-rpc.ts`;
`packages/plugin/src/service/presentation/plugin-contract-binder.ts`;
`packages/plugin/src/service/presentation/create-plugin-service.ts`;
`packages/plugin/src/contract-base/domain/base-contract.ts`;
`packages/plugin/src/contract-base/domain/base-errors.ts`;
`packages/plugin/src/config/domain/plugin-contributions.ts`;
`packages/plugin/src/config/domain/service-contribution.ts`;
`packages/logger/orpc-plugin.ts`; `packages/telemetry/src/orpc/tracing-plugin.ts`;
`packages/cli/src/public/features/plugins/new/new-plugin-use-case.ts:660,667`;
`plugins/workers/services/src/routers/router-context.ts`;
`plugins/{workers,sagas,auth,triggers}/services/src/router.ts`;
`docs/site/services-sdk/sdk.md:199`; `docs/site/services-sdk/how-to/discover-services.md:138-146`.

**Executed evidence:** `deno check --unstable-kv --config deno.json <scratch>/probe.ts` →
`TS2339: Property 'code' does not exist on type 'never'` (§G4);
`deno task deps:latest | grep -i orpc` → all seven at `1.14.6/1.14.7 → 1.14.15`;
export-list diff of `@orpc/server` 1.14.6 vs 1.14.15 → empty;
`curl registry.npmjs.org/@orpc/server` → publish times + `dist-tags.beta = 2.0.0-beta.25`.
