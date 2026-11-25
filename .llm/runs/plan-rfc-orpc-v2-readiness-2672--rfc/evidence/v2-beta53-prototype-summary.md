# oRPC `2.0.0-beta.53` Throwaway Prototype Fallout Summary

- **Prototype date:** 2026-11-25
- **Base commit (`main`):** `87965d800b7d61312e8612c82bdb0cb98bdf5b29`
- **Target versions tested:** `@orpc/*@2.0.0-beta.53` (published 2026-11-23; latest v1 line on same date: `1.16.6`; NetScript locked v1 line: `^1.15.5`, with stale `1.15.0` lockfile entries for `@orpc/client` and `@orpc/tanstack-query`).
- **Runtime:** Deno `2.9.5`, TypeScript `6.0.3` (from workspace `.mise.toml`).
- **Workspace hygiene:** Executed in a throwaway detached git worktree, then deleted via `git worktree remove --force`. Zero dependency or lockfile changes were committed to `main` or either RFC branch.

## 1. Throwaway Manifest Diff Summary

`git diff --stat` inside the throwaway worktree after switching `@orpc/*` to `2.0.0-beta.53`, swapping `@orpc/otel` → `@orpc/opentelemetry`, adding `@orpc/json-schema`, and running `mise exec -- deno install`:

```text
 deno.json                              |  15 +-
 deno.lock                              | 466 +++++++++++++++++----------------
 packages/bench/deno.json               |   2 +-
 packages/cli/e2e/deno.json             |   2 +-
 packages/contracts/deno.json           |   2 +-
 packages/fresh/deno.json               |   2 +-
 packages/logger/deno.json              |   2 +-
 packages/plugin-ai-core/deno.json      |   4 +-
 packages/plugin-auth-core/deno.json    |   4 +-
 packages/plugin-workers-core/deno.json |   4 +-
 packages/plugin/deno.json              |   4 +-
 packages/sdk/deno.json                 |  12 +-
 packages/service/deno.json             |  10 +-
 packages/telemetry/package.json        |   2 +-
 14 files changed, 270 insertions(+), 261 deletions(-)
```

Noticeable lockfile / manifest finding:

- Root `deno.json` declares `@orpc/*` in `catalog`, while 11 workspace `deno.json` manifests repeat explicit `npm:@orpc/*@^1.15.5` specifiers instead of `catalog:` (and `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` pins `@orpc/client@1.15.5` and `@orpc/tanstack-query@1.15.5` inline).
- Because `@orpc/tanstack-query@1.15.0` remained referenced in the root `deno.lock` from a stale specifier, `deno install` also emitted a peer-dependency warning (`@orpc/tanstack-query@1.15.0` peer `@orpc/client@1.15.0` resolved to `2.0.0-beta.53`).

## 2. Type-Check Fallout (`deno check --unstable-kv`)

All 13 workspace target groups failed (`exit 1`) with **411 total TypeScript diagnostics** (plus `packages/cli/bin/netscript.ts` checked separately: **37 errors**, cascading from `@netscript/service`, `@netscript/contracts`, and `@netscript/telemetry`).

| Target group | Exit | Diagnostics | Affected files | Dominant root causes |
| --- | ---: | ---: | ---: | --- |
| `packages/contracts` (`mod.ts`, `crud/create-crud-contract.ts`, `command-contract.ts`) | 1 | 7 | 2 | `ContractProcedureBuilderWithInputOutput`/`WithOutput` renamed to `ContractBuilderWithInputOutput`/`WithOutput`; `ContractBuilder<TErrorMap>` arity 4→1; `oc.$meta` removed (`defineMeta`). |
| `packages/telemetry` (`tracing-plugin.ts`, `error-plugin.ts`) | 1 | 2 | 2 | `@orpc/otel` removed (replaced by `@orpc/opentelemetry`); `ORPCError` removed from `@orpc/contract`. |
| `packages/logger` (`orpc-plugin.ts`, `tests/orpc-plugin_test.ts`) | 1 | 1 | 1 | `HandlerPlugin` now extends `OrderablePlugin` requiring `name`; `init(options)` return-value contract not caught at compile time by `LoggingPlugin` wrapper (fails at runtime!). |
| `packages/service` (`mod.ts`, `auth/mod.ts`, `rate-limit/mod.ts`) | 1 | 20 | 7 | `toHttpPath` removed from `@orpc/client/standard`; `fallbackContractConfig`/`HTTPMethod` removed from `@orpc/contract`; `toRou3Pattern` removed from `@orpc/openapi/standard`; `traverseContractProcedures` removed from `@orpc/server`; `OpenAPI` namespace removed from `@orpc/openapi`; `OpenAPIGeneratorOptions.schemaConverters` → `converters`; `Router<TContext>` arity 2→1; `ZodSmartCoercionPlugin` removed from `@orpc/zod/zod4` (and `./zod4` subpath deleted). |
| `packages/sdk` (`mod.ts`, `client`, `query-client`, `desktop`, `openapi`) | 1 | 15 | 6 | `StandardLinkClientInterceptorOptions` → `StandardLinkInterceptorOptions`; `RPCLink` `url` split (`origin` + prefix `url`); custom `fetch(url, init)` first arg `Request` → `string` (`request.url` is `never`, `instanceof Request` error); `customJsonSerializers` removed on desktop `RPCLink`; `isContractProcedure` & `inferRPCMethodFromContractRouter` removed from `@orpc/contract`; `OpenAPIGenerator` `schemaConverters` → `converters`. |
| `packages/plugin` (`mod.ts`, `contract-base`, `service`) | 1 | 26 | 10 | `ContractProcedure` → `AnyProcedureContract`; `EnhancedContractRouter` removed; `oc.prefix()` & `.route()` removed; `os.prefix()` removed (`plugin-contract-binder.ts`); `BASE_PLUGIN_ERRORS` `status` field removed from `ErrorMapItem`. |
| `packages/plugin-auth-core` (`auth.contract.ts`, `auth-service-authenticator.ts`) | 1 | 30 | 11 | `ORPCError` from `@orpc/contract`, `.route()`, `status` in `ErrorMapItem`, `ContractProcedureBuilderWith*`, `error.defined` typing. |
| `packages/plugin-workers-core` (`workers.contract-definition.ts`) | 1 | 31 | 4 | `.route()` removed (23 `TS2551` sites) + transitive `base-contract` / `contract-mount` failures. |
| `packages/plugin-sagas-core` (`sagas.contract.ts`) | 1 | 17 | 4 | `.route()` removed (9 `TS2551` sites) + transitive `base-contract` / `contract-mount` failures. |
| `packages/plugin-triggers-core` (`triggers.contract.ts`) | 1 | 20 | 4 | `.route()` removed (12 `TS2551` sites) + transitive `base-contract` / `contract-mount` failures. |
| `packages/plugin-ai-core` (`ai.contract.ts`) | 1 | 17 | 5 | `.route()` removed + `Implementer` generic arity change (`TS2314`) + `base-error-adapter.ts` `status` property (`TS2353`). |
| `packages/fresh` (`bind-desktop-rpc-window.ts`) | 1 | 10 | 5 | `customJsonSerializers` removed from `RPCHandler` (MessagePort) + transitive SDK/contract errors. |
| `plugins/{auth,sagas,triggers,workers}/services` | 1 | 215 | 28 | Cascading `TS7031` (122) / `TS7006` (10) implicit-`any` from broken `implement()` / `baseContract` types, plus `ORPCError` imported from `@orpc/contract` and `withEventMeta` / `.route()` breaks. |
| **Total (13 groups)** | **13/13 fail** | **411** | **—** | — |
| `packages/cli/bin/netscript.ts` (supplementary check) | 1 | 37 | — | Cascades from `@netscript/service`, `@netscript/contracts`, `@netscript/telemetry`. |

## 3. Runtime Fallout (`deno test --no-check --allow-all --unstable-kv`)

Running tests with `--no-check` exposed immediate module-load and behavioral failures beyond TypeScript types:

1. **`packages/contracts/tests`** — `18 passed | 5 failed`:
   - `TypeError: oc.$meta is not a function` at `packages/contracts/src/application/contract-primitives.ts` (breaks `procedure-meta_test.ts`, `procedure-meta-inference_test.ts`, `schema-types_test.ts`).
2. **`packages/logger/tests/orpc-plugin_test.ts`** — `1 passed | 4 failed`:
   - `TypeError: Cannot read properties of undefined (reading 'routingInterceptors')`.
   - **Root cause:** In v2, `StandardHandlerPlugin.init(options)` MUST **return** the updated `options` object (`StandardHandlerOptions`) rather than mutating in place and returning `void`. Because `LoggingPlugin.init()` returned `undefined`, `StandardHandler` crashed immediately when reading `options.routingInterceptors`. The same silent runtime bug applies to `TracingPlugin`, `ErrorHandlingPlugin`, and `ServiceHandlerPlugin` (`packages/service/src/types.ts:266-275`).
3. **`packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`** — `0 passed | 1 failed`:
   - `SyntaxError: The requested module '@orpc/contract' does not provide an export named 'isContractProcedure'` at `packages/sdk/src/internal/client-contributions/stable-v1-adapter.ts:8`.
4. **`packages/telemetry`, `packages/service`, `packages/sdk`, `packages/plugin`, `packages/plugin-auth-core`** — immediate load failure:
   - `error: Import "@orpc/otel" not a dependency and not in import map` at `packages/telemetry/src/orpc/tracing-plugin.ts:13`.
5. **Secondary runtime pass** (temporarily rewriting only `'@orpc/otel'` → `'@orpc/opentelemetry'` in `tracing-plugin.ts` inside the throwaway worktree, then reverting):
   - `packages/telemetry/tests`: `64 passed | 1 failed` — `SyntaxError: '@orpc/contract' does not provide an export named 'ORPCError'` (`packages/telemetry/src/orpc/error-plugin.ts:17`).
   - `packages/sdk/tests/orpc-defined-error-narrowing_test.ts`: `SyntaxError: '@orpc/contract' does not provide an export named 'isContractProcedure'` (`stable-v1-adapter.ts:8`).
   - `packages/service/tests/handlers_test.ts` and `packages/sdk/tests/integration/service-client-runtime_test.ts`: `[ERR_PACKAGE_PATH_NOT_EXPORTED] Package subpath './zod4' is not defined by "exports" in @orpc/zod@2.0.0-beta.53` (`packages/service/src/primitives/handlers.ts`).
   - `packages/service/tests/auth/contract-procedure-index-conformance_test.ts`: `SyntaxError: '@orpc/contract' does not provide an export named 'fallbackContractConfig'` (`contract-procedure-index.ts:19`).

## 4. Direct Runtime & Type-Declaration Verification on `2.0.0-beta.53`

Probed via `deno eval` and inspected `.d.ts` files directly in the Deno npm cache:

- **`ORPCError` (`@orpc/client@2.0.0-beta.53/dist/error.d.ts`):**
  - Own runtime keys: `["stack", "message", "name", "defined", "code", "data"]`.
  - `"status" in err === false`; `"defined" in err === true`; `err.toJSON()` returns `{ defined, code, message, data }` (no `status`).
  - HTTP status is decoupled into server-side `errorStatusMap` / `COMMON_ERROR_STATUS_MAP`; decoded client HTTP errors attach `cause: new ResponseError({ response })` carrying the HTTP response/status.
  - **Hidden NetScript impact:** `packages/sdk/src/client/errors.ts` defines `DefinedError` and `DefinedErrorLike` with `readonly status: number`. Because `ORPCError` drops `status`, `Extract<TError, DefinedErrorLike>` in `@netscript/sdk/client`'s `safe()` and `isDefinedError()` would narrow every v2 `ORPCError` to `never` unless updated!
- **`safe()` (`@orpc/client@2.0.0-beta.53/dist/utils.d.ts`):**
  - `SafeResult` 4-tuple changed from `[error, data, isDefined: boolean, isSuccess: boolean]` to `[error, data, definedError: Extract<TError, AnyORPCError> | null, isSuccess: boolean]` (property `isDefined` removed, replaced by `definedError`).
  - Measured: `await safe(Promise.resolve("hi"))` → `[null, "hi", null]` (plus `isSuccess: true`); `await safe(Promise.reject(err))` → `[err, null, null]` (`"isSuccess" in obj === true`, `"isDefined" in obj === false`).
- **`@orpc/zod@2.0.0-beta.53`:**
  - `package.json` exports ONLY `"."` and `"./package.json"`. Subpath `./zod4` is deleted.
  - Root exports: `["JSON_SCHEMA_INPUT_REGISTRY", "JSON_SCHEMA_OUTPUT_REGISTRY", "JSON_SCHEMA_REGISTRY", "ZodToJsonSchemaConverter"]`. `ZodSmartCoercionPlugin` is deleted; replaced by `SmartCoercionHandlerPlugin` in `@orpc/json-schema`.
- **`@orpc/server@2.0.0-beta.53/plugins`:**
  - Exports `CORSHandlerPlugin`, `RequestHeadersHandlerPlugin`, `ResponseHeadersHandlerPlugin`, `RequestLimitHandlerPlugin`, `RequestCompressionHandlerPlugin`, `ResponseCompressionHandlerPlugin`, `GetMethodCsrfProtectionHandlerPlugin`, `HeadMethodHandlerPlugin`, `MethodOverrideHandlerPlugin`, `TimeoutHandlerPlugin`, `RethrowHandlerPlugin`, `SignalSyncHandlerPlugin`, `BatchHandlerPlugin` (and retains deprecated aliases `CORSPlugin`, `RequestHeadersPlugin`, `ResponseHeadersPlugin` in beta.53).
- **`@orpc/tanstack-query@2.0.0-beta.53`:**
  - Exports `createTanstackQueryUtils`, `createRouterUtils`, `createContractUtilsFactory`, `ContractOptionsUtilsPlugin`, `StreamQuerySSRUtilsPlugin`, `tanstackQuery`, `getTanstackQueryMeta`, `createHydrationOptions`, `createStructuralSharing`.
  - Streamed/live utility renames (`experimental_streamedKey`/`Options` → `streamedQueryKey`/`Options`, `experimental_liveKey`/`Options` → `liveQueryKey`/`Options`, `queryFnOptions` → `fnOptions`, `refetchMode: 'replace'` removed, `path` option → `prefix`) directly affect `packages/sdk/src/ports/service-query-utils.ts` and `packages/sdk/src/query-client/create-service-query-utils.ts`.
