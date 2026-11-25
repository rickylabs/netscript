---
rfc: 0000
title: oRPC v2 readiness and migration strategy
status: Draft
authors: ["@rickylabs"]
created: 2026-11-25
tracking-issue: https://github.com/rickylabs/netscript/issues/2672
target-milestone: Backlog / Triage
---

# oRPC v2 readiness and migration strategy

> **Draft evaluation notice.** This document is a **Draft** evaluation RFC produced for technical review. It does not authorize implementation, dependency, or lockfile changes under `packages/`, `plugins/`, `docs/site/`, `.github/`, `deno.json`, or `deno.lock`. Every baseline claim about NetScript or oRPC below is tagged as **source-inspected** or **measured** (from the throwaway `2.0.0-beta.53` prototype summarized in `.llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/evidence/v2-beta53-prototype-summary.md`); proposed architecture and migration steps are tagged as **derived**.

## Summary

NetScript's contract, service, SDK, telemetry, logging, plugin, desktop RPC, and CLI scaffolding layers currently depend directly on `@orpc/*@^1.15.5` across **179 non-`.llm`, non-lock files** (**source-inspected**). Upstream oRPC v2 is actively progressing in beta (`2.0.0-beta.53` published 2026-11-23; v1 line at `1.16.6` on 2026-11-25) with pervasive breaking changes across contract metadata (`oc.$meta` → `defineMeta`), routing (`.route()` / `.prefix()` removed in favor of `openapi()` + path meta), error models (`ORPCError` removed from `@orpc/contract`, `status` removed from `ORPCError` and `ErrorMapItem`, `safe()` tuple changed), handler plugins (`OrderablePlugin` + return-based `init(options)`, interceptor and plugin renames), link transports (`RPCLink` `origin` + path-prefix `url`, custom `fetch(url, init)` receiving `string` instead of `Request`, `redirect: 'manual'` removed), packages (`@orpc/otel` → `@orpc/opentelemetry`, `@orpc/zod/zod4` deleted, `ZodSmartCoercionPlugin` → `@orpc/json-schema` `SmartCoercionHandlerPlugin`), TanStack Query utilities, and RPC wire compatibility. Prototyping an unmodified bump to `2.0.0-beta.53` in a throwaway worktree (**measured**) produced **411 TypeScript diagnostics across 13/13 failing target groups** (plus **37 errors** in `packages/cli/bin/netscript.ts`) and immediate module-load/runtime crashes in every core test suite. We recommend a **three-phase readiness strategy** (**derived**): (0) **pre-v2-stable hardening on v1** that hides raw oRPC idioms behind NetScript-owned adapters, consolidates manifests onto `catalog:`, migrates contract authorization to procedure-level (companion RFC `#2671`), and removes v1-only imports; (1) **dual-line shadow CI** against upstream `2.0.0-beta.x` / RC without touching `main`'s `deno.lock`; and (2) a **single coordinated v2 GA cut-over** accompanied by an automated codemod so downstream applications upgrade once on stable `2.0.0` rather than tracking beta churn.

## Motivation

### Why evaluate oRPC v2 readiness now? (**source-inspected** & **measured**)

1. **Deep surface coupling across NetScript:** `@orpc/*` is not isolated to a single adapter — it appears in 179 source, template, test, and doc files across 21 workspace groups, including public types re-exported or structurally mirrored by `@netscript/contracts`, `@netscript/service`, `@netscript/sdk`, `@netscript/plugin`, `@netscript/telemetry`, `@netscript/logger`, `@netscript/fresh`, all five `@netscript/plugin-*-core` packages, all five first-party plugins, and CLI code generators.
2. **Silent runtime traps in v2 that TypeScript alone does not always flag:** Our throwaway `2.0.0-beta.53` prototype uncovered four high-severity behavioral/type traps:
   - `StandardHandlerPlugin.init(options)` MUST **return** the updated options object instead of mutating in place (`void`). `LoggingPlugin` had only 1 TS error (`name` property) yet crashed 4/5 runtime tests with `TypeError: Cannot read properties of undefined (reading 'routingInterceptors')`!
   - `packages/sdk/src/client/errors.ts` structurally defines `DefinedErrorLike` with `readonly status: number`. Because v2 `ORPCError` removes `status` (**measured**: `"status" in err === false`), `Extract<TError, DefinedErrorLike>` in `@netscript/sdk/client`'s `safe()` and `isDefinedError()` would silently collapse every v2 `ORPCError` to **`never`**!
   - `RPCLink` custom `fetch(url, init)` changes its first parameter from `Request` to a `string` URL. Any caller inspecting `request instanceof Request` or reading `request.headers` without adapting `init.headers` risks silently dropping authentication/trace headers at runtime.
   - **RPC wire incompatibility:** oRPC v2 alters the RPC serializer format and omits `status` from serialized error JSON (`{ defined, code, message, data }`). A v1 `RPCLink` cannot talk to a v2 `RPCHandler` and vice versa (upstream explicitly notes only `OpenAPILink 1.16.0+` interoperates with v2 OpenAPI handlers).
3. **Manifest & lockfile drift already exists on `main`:** Root `deno.json` declares `@orpc/*` in `"catalog"`, yet 11 workspace `deno.json` manifests repeat explicit `npm:@orpc/*@^1.15.5` specifiers, `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` hardcodes `@1.15.5`, and root `deno.lock` retains stale `1.15.0` entries alongside `1.15.5` for `@orpc/client` and `@orpc/tanstack-query` (**source-inspected**).
4. **Co-design with RFC A (`#2671`):** Moving contract authorization from `contract-procedure-index.ts` into oRPC procedure middleware (RFC A) eliminates four of the nastiest v2-removed imports (`toHttpPath`, `toRou3Pattern`, `fallbackContractConfig`, `HTTPMethod`) ahead of cut-over, and aligning RFC A's public `createRouterClient` API with oRPC v2 avoids forcing downstream applications through two separate migrations.

## Guide-level explanation

> **Derived design.** Once Phase 0 (v1 prep) and Phase 2 (v2 GA cut-over) ship, downstream applications interact exclusively with NetScript-owned contract, service, and SDK primitives rather than raw `@orpc/*` APIs (aligning with RFC 0001's prohibition on exposing raw oRPC link types).

### Before (v1 idioms exposed in contracts, handlers, and clients)

```ts
// Contract (coupled to oRPC v1 .route(), .meta(), and ErrorMapItem.status)
import { baseContract } from '@netscript/contracts';
import { ORPCError } from '@orpc/contract'; // removed in v2!

export const getOrder = baseContract
  .route({ method: 'GET', path: '/orders/{id}' })
  .meta({ access: { authentication: 'required', authorization: { scopes: ['orders:read'] } } })
  .errors({ ORDER_LOCKED: { status: 409, message: 'Locked', data: LockedSchema } })
  .input(GetOrderInput)
  .output(OrderSchema);

// Client error check (coupled to status on DefinedError and experimental_* query utils)
const res = await safe(client.getOrder({ id }));
if (!res.isSuccess && res.isDefined) {
  console.log(res.error.code, res.error.status); // .status removed in v2!
}
const opts = queryUtils.getOrder.experimental_streamedOptions({ input: { id }, queryFnOptions: { refetchMode: 'replace' } });
```

### After (NetScript-owned adapter boundary — works identically across v1 Phase 0 and v2 GA)

```ts
// Contract (NetScript-owned helpers isolate oRPC v1 vs v2 meta/openapi/error-status internals)
import { baseContract, withAccess, withHttpRoute, defineError } from '@netscript/contracts';
import { ORPCError } from '@netscript/service'; // or @netscript/sdk/client — never @orpc/contract

export const getOrder = baseContract
  .use(withHttpRoute({ method: 'GET', path: '/orders/{id}' })) // or helper combinator on v1→v2
  .use(withAccess({ authentication: 'required', authorization: { scopes: ['orders:read'] } }))
  .errors({ ORDER_LOCKED: defineError({ status: 409, message: 'Locked', data: LockedSchema }) })
  .input(GetOrderInput)
  .output(OrderSchema);

// Client error check (NetScript safe() preserves named discriminants; HTTP status via helper)
import { safe, getErrorHttpStatus } from '@netscript/sdk/client';

const res = await safe(client.getOrder({ id }));
if (!res.isSuccess && res.isDefined) {
  console.log(res.error.code, getErrorHttpStatus(res.error)); // reads ResponseError cause on HTTP
}

// TanStack Query streamed/live options (v2-aligned naming)
const opts = queryUtils.getOrder.streamedQueryOptions({
  input: { id },
  fnOptions: { refetchMode: 'reset' },
});
```

## Reference-level explanation

### 1. Complete repository inventory of `@orpc/*` usage (**source-inspected**)

On `main` (`87965d800`), `git grep -l '@orpc/' -- ':!.llm' ':!*deno.lock'` matched **179 files** across 21 workspace groups (plus 8 lockfiles; 19 `@orpc/*` npm entries in root `deno.lock`). Note that the repository has no top-level `samples/` or `examples/` directory — sample/showcase apps and fixtures live inside `packages/cli/src/kernel/assets/showcase/`, `packages/cli/tests/showcase-ai/`, `packages/cli/e2e/fixtures/`, and `packages/bench/tasks/`.

| Workspace group | File count | Specifiers / key surfaces |
| --- | ---: | --- |
| `deno.json` (root) | 1 | `"catalog"` pins for `@orpc/{client,contract,openapi,otel,server,tanstack-query,zod}` (`^1.15.5`). |
| `packages/contracts` | 8 | `oc.$meta`, `ContractBuilder`, `ContractProcedureBuilderWith{InputOutput,Output}`, `commonErrorMap` (`status` in `ErrorMapItem`), `create-crud-contract.ts`, `command-contract.ts`. |
| `packages/service` | 20 | `RPCHandler`, `OpenAPIHandler`, `CORSPlugin`, `ZodSmartCoercionPlugin` (`@orpc/zod/zod4`), `ZodToJsonSchemaConverter`, `OpenAPIGenerator` (`schemaConverters`, `OpenAPI` namespace), `traverseContractProcedures`, `Router<T, C>`, `toHttpPath`, `toRou3Pattern`, `fallbackContractConfig`, `HTTPMethod`, 14 test suites. |
| `packages/sdk` | 33 | `createORPCClient`, `RPCLink`, `StandardLinkClientInterceptorOptions`, custom `fetch(Request)`, `customJsonSerializers` (desktop MessagePort), `isContractProcedure`, `inferRPCMethodFromContractRouter`, `isDefinedError`, `DefinedError.status`, `createTanstackQueryUtils`, `ServiceQueryUtils` (`experimental_streamed*`/`live*`, `queryFnOptions`, `refetchMode: 'replace'`), `OpenAPIGenerator`, 21 test/type-fixture files (including inline `@1.15.5` pins). |
| `packages/telemetry` | 4 | `ORPCInstrumentation` (`@orpc/otel`), `ORPCError` from `@orpc/contract`, `TracingPlugin`, `ErrorHandlingPlugin` (`init(options)` mutating in place, no `name`). |
| `packages/logger` | 4 | `LoggingPlugin` (`HandlerPlugin` missing `name`, `init(options)` returning `void`). |
| `packages/plugin` | 8 | `base-contract.ts` (`ContractProcedure`, `EnhancedContractRouter`, `oc.prefix`, `.route()`), `base-errors.ts` (`BASE_PLUGIN_ERRORS` with `status`), `contract-mount.ts`, `plugin-contract-binder.ts` (`os.prefix()`). |
| `packages/plugin-auth-core` | 6 | `auth.contract.ts`, `base-error-adapter.ts`, `auth-service-authenticator.ts` (`ORPCError` from `@orpc/contract`, `error.defined`). |
| `packages/plugin-workers-core` | 5 | `workers.contract-definition.ts` (23 `.route()` calls), `workers.contract-types.ts`. |
| `packages/plugin-sagas-core` | 2 | `sagas.contract.ts` (9 `.route()` calls). |
| `packages/plugin-triggers-core` | 2 | `triggers.contract.ts` (12 `.route()` calls). |
| `packages/plugin-ai-core` | 3 | `ai.contract.ts` (7 `.route()` calls, `Implementer` generic arity), `base-error-adapter.ts`. |
| `packages/fresh` | 5 | `bind-desktop-rpc-window.ts` (`RPCHandler` MessagePort + `customJsonSerializers`), desktop reload fixtures & type tests. |
| `packages/cli` | 35 | `scaffold-app-catalog.ts` (`^1.15.5` pins), `contract.ts.template`, `contract.memory.ts.template`, `generate-plugin-contracts-1.ts.template`, `generate-plugin-service-2.ts.template`, `showcase/service/commerce.ts.template`, `templates/workspace/contracts/deno-json.ts`, `templates/plugins/generate-plugin-deno-json.ts`, `embedded.generated.ts`, `tests/showcase-ai/*.template`, `e2e/` fixtures & tests. |
| `packages/bench` | 5 | Benchmark task reference routers (`t1-storefront-api`, `t2-saga-queue-cron`) & `deno.json`. |
| `packages/mcp` | 2 | Telemetry fixture JSONs referencing `@orpc/otel` span attributes. |
| `plugins/{auth,sagas,streams,triggers,workers}` | 17 | `package.json` deps, `v1-handlers.ts` / `v1.ts` / `subscribe.ts` (`implement()`, `ORPCError` from `@orpc/contract`, `withEventMeta`), service tests. |
| `docs/site` + `docs/architecture` | 16 | Architecture, contracts, SDK/services guides, tutorials, telemetry docs, `02-public-surface.md`. |
| `rfcs/` | 3 | `0000-rust-workers-integration.md`, `0001-sdk-client-contributions.md`, `0005-devtools-contribution.md`. |
| **Total (non-`.llm`, non-lock)** | **179** | **Top specifiers:** `@orpc/server` (159), `@orpc/contract` (116), `@orpc/client` (30), `@orpc/openapi` (18), `@orpc/zod` (14), `@orpc/otel` (13), `@orpc/tanstack-query` (11). |

### 2. Complete mapping of oRPC v2 breaking changes (`2.0.0-beta.53`) to NetScript files & public APIs (**source-inspected** & **measured**)

Every breaking change documented in oRPC's [v1→v2 migration guide](https://orpc.dev/docs/migrations/from-v1) and `middleapi/orpc` releases up to `v2.0.0-beta.53` (2026-11-23) was mapped against NetScript:

| oRPC v2 breaking change | Affected NetScript files | Affected public NetScript APIs | Severity & notes |
| --- | --- | --- | --- |
| **1. `oc.$meta` removed → `defineMeta` + `.meta(fn())`** | `packages/contracts/src/application/contract-primitives.ts:160`, `packages/contracts/src/domain/procedure-meta.ts`, `packages/contracts/tests/procedure-meta*_test.ts` | `baseContract`, `BaseContractMeta`, `NetScriptProcedureMeta` | **High.** Crashes immediately at runtime (`TypeError: oc.$meta is not a function`). Every downstream `.meta({ access: ... })` call breaks unless wrapped via NetScript helpers or codemodded to `meta(accessMeta(...))`. |
| **2. `.route()` and `oc.prefix()` / `os.prefix()` removed → `openapi()` + `path` meta** | `packages/plugin/src/contract-base/domain/{base-contract.ts,contract-mount.ts}`, `packages/plugin/src/service/presentation/plugin-contract-binder.ts:149`, all 5 `packages/plugin-*-core/src/contracts/v1/*.ts` (51+ call sites), `packages/contracts/crud/create-crud-contract.ts`, CLI contract templates, docs | `baseContract.route(...)`, `basePluginContract`, `mountPluginContract`, `bindPluginContract`, generated contracts | **High.** Largest single diagnostic volume (65+ `TS2551` sites across plugin-core contracts alone) plus all downstream contracts calling `.route({ method, path })`. |
| **3. Contract type renames & arity changes** (`ContractBuilder<TErrorMap>` 4→1; `ContractProcedureBuilderWith*` → `ContractBuilderWith*`; `ContractProcedure` → `AnyProcedureContract`; `Router<TContext>` 2→1; `Implementer` arity; `EnhancedContractRouter`, `isContractProcedure`, `inferRPCMethodFromContractRouter`, `fallbackContractConfig`, `HTTPMethod`, `traverseContractProcedures` removed) | `packages/contracts/src/application/{contract-primitives.ts,command-contract.ts}`, `packages/plugin/src/contract-base/domain/{base-contract.ts,contract-mount.ts}`, `packages/service/src/primitives/{orpc-router.ts,openapi.ts}`, `packages/service/src/auth/contract/contract-procedure-index.ts`, `packages/sdk/src/internal/{client-contributions/stable-v1-adapter.ts,transport-policy.ts}`, `packages/plugin-ai-core/src/contracts/v1/ai.contract.ts` | `BaseContractRoute`, `BaseContractOutputRoute`, `OrpcRouter`, `ServiceRouter`, `createContractAuthorizer` | **High.** `isContractProcedure` and `fallbackContractConfig` cause immediate runtime `SyntaxError` module-load failures in SDK, Fresh desktop, and Service tests. RFC A eliminates `contract-procedure-index.ts`'s 4 broken imports completely! |
| **4. `ORPCError` moved out of `@orpc/contract`; `status` removed from `ORPCError`, `ORPCErrorOptions`, `ORPCErrorJSON`, and `ErrorMapItem`; `ORPCError.code`/`data` readonly (#2523)** | `packages/telemetry/src/orpc/error-plugin.ts:17`, `packages/contracts/src/application/contract-primitives.ts:35-105`, `packages/plugin/src/contract-base/domain/base-errors.ts`, `packages/plugin-{auth,ai}-core/src/contracts/v1/base-error-adapter.ts`, `packages/plugin-auth-core/src/adapters/auth-service-authenticator.ts:103`, `packages/sdk/src/client/errors.ts`, `plugins/{auth,sagas,triggers,workers}/services/src/routers/*` | `CommonErrorMap`, `commonErrorMap`, `BASE_PLUGIN_ERRORS`, `DefinedError`, `safe()`, `isDefinedError()` | **Critical.** `ORPCError` still has `defined: boolean` at runtime (**measured**), but drops `status`. HTTP status moves to server `errorStatusMap` / `COMMON_ERROR_STATUS_MAP` and client `error.cause` (`ResponseError`). NetScript's `DefinedErrorLike` in `packages/sdk/src/client/errors.ts` currently requires `status: number`, which silently narrows every v2 `ORPCError` to `never`! |
| **5. `safe()` 4-tuple & object shape changed** (`[error, data, definedError \| null, isSuccess]`; `isDefined` removed) | `packages/sdk/src/client/errors.ts`, `packages/sdk/tests/orpc-defined-error-narrowing_test.ts`, any consumer importing `safe` directly from `@orpc/client` | `@netscript/sdk/client` `safe()`, `SafeResult`, `SafeFailure` | **Medium (mitigable!).** Because `@netscript/sdk/client` owns its own `safe()` wrapper around `orpcIsDefinedError`, NetScript can preserve `result.isDefined` (or add `result.definedError` alongside it) for consumers importing from `@netscript/sdk/client`, while fixing `DefinedErrorLike` to drop mandatory `status`. |
| **6. Handler plugin overhaul:** `StandardHandlerPlugin extends OrderablePlugin` (`name` required), **`init(options)` MUST RETURN updated options**, interceptors renamed (`routingInterceptors`, `transportInterceptors`), plugin renames (`CORSHandlerPlugin` defaults to `origin: '*'`, `RequestLimitHandlerPlugin`, `RequestHeadersHandlerPlugin`, `ResponseHeadersHandlerPlugin`, split `RequestCompressionHandlerPlugin`/`ResponseCompressionHandlerPlugin`), `StrictGetMethodPlugin` removed & **`RPCHandler` rejects `GET` by default** | `packages/logger/orpc-plugin.ts`, `packages/telemetry/src/orpc/{tracing-plugin.ts,error-plugin.ts}`, `packages/service/src/types.ts:266-275`, `packages/service/src/primitives/handlers.ts` | `ServiceHandlerPlugin`, `LoggingPlugin`, `TracingPlugin`, `ErrorHandlingPlugin`, `createRPCHandler`, `createOpenAPIHandler` | **Critical.** Returning `void` from `init(options)` crashed 4/5 `LoggingPlugin` runtime tests (`reading 'routingInterceptors'`). `CORSHandlerPlugin` `origin: '*'` default is a security footgun if left in `handlers.ts`. Default `GET` rejection on `RPCHandler` affects any client issuing `GET` RPC calls (though NetScript's `RPCLink` already defaults to `POST` via `transport-policy.ts` except explicit `GET` procedures). |
| **7. `@orpc/otel` removed → `@orpc/opentelemetry`** | `deno.json`, `packages/telemetry/package.json`, `packages/telemetry/src/orpc/tracing-plugin.ts:13`, `docs/site/observability/telemetry.md` | `TracingPlugin`, `@netscript/telemetry` | **High (isolated).** Blocked 5 test suites from loading in prototype; straightforward 1-package swap once v2 ships. |
| **8. `@orpc/zod/zod4` subpath & `ZodSmartCoercionPlugin` removed → root `@orpc/zod` + `@orpc/json-schema` `SmartCoercionHandlerPlugin`** | `packages/service/src/primitives/{handlers.ts,openapi.ts}`, `packages/sdk/src/openapi/helpers.ts`, `deno.json`, `packages/service/deno.json` | `createOpenAPIHandler`, `generateOpenAPISpec`, SDK OpenAPI helpers | **High.** Importing `@orpc/zod/zod4` throws `ERR_PACKAGE_PATH_NOT_EXPORTED` at runtime (**measured**). Requires adding `@orpc/json-schema` to catalog & service deps. |
| **9. `OpenAPI` namespace removed; `OpenAPIGeneratorOptions.schemaConverters` → `converters`; `OpenAPIObject` drops index signature** | `packages/service/src/primitives/openapi.ts`, `packages/sdk/src/openapi/helpers.ts` | `createOpenAPISpec`, SDK OpenAPI helpers | **Medium.** Mechanical update to `converters` and typed path-item access. |
| **10. `RPCLink` transport changes:** `url` split into `origin` + path-prefix `url`; **custom `fetch(url, init)` receives `string` URL instead of `Request`**; links no longer set `redirect: 'manual'`; `StandardLinkClientInterceptorOptions` → `StandardLinkInterceptorOptions`; `customJsonSerializers` removed → `serializer: new RPCSerializer({ handlers })`; MessagePort `TimeoutError`/`ConnectionClosedError` (#2533) | `packages/sdk/src/client/http-client-link.ts`, `packages/sdk/src/internal/transport-policy.ts`, `packages/sdk/src/desktop/application/desktop-rpc-client.ts`, `packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts` | `createServiceClient`, desktop RPC bridge, PR #2659 fetch-link | **Critical.** Custom `fetch` expecting `Request` fails type-check AND risks silently dropping auth/trace headers if cast. Removing `redirect: 'manual'` means `RPCLink` follows 3xx redirects by default unless NetScript explicitly re-sets `redirect: 'manual'` or `'error'` in `http-client-link.ts` (security invariant against credential-forwarding SSRF!). |
| **11. `.callable` removed; middleware dedup removed & `.concat` → `.use`** | Checked repo via `git grep`: zero production `.callable` or `.concat` calls in `packages/`/`plugins/` (**source-inspected**); `packages/service` and `plugins/*` already use `implement()` + `os.use()`. | None in core (audit downstream apps via codemod) | **Low** for NetScript core; potential impact on downstream custom routers using `.callable()` or `.concat()`. |
| **12. `@orpc/tanstack-query` renames & removals** (`experimental_streamed*` → `streamedQuery*`, `experimental_live*` → `liveQuery*`, `queryFnOptions` → `fnOptions`, `refetchMode: 'replace'` removed, `path` → `prefix`) | `packages/sdk/src/ports/service-query-utils.ts`, `packages/sdk/src/query-client/create-service-query-utils.ts`, `packages/sdk/tests/query-client/*`, `packages/sdk/tests/type-fixtures/service-query-utils-*` | `ServiceQueryUtils`, `ServiceProcedureQueryUtils`, `ServiceStreamedKeyOptions`, `createServiceQueryUtils` | **High (public SDK API).** Directly exposed to Fresh/Preact UI consumers; requires deprecation aliases or clean major-version rename + codemod. |
| **13. RPC wire-protocol incompatibility** | All `RPCLink` ↔ `RPCHandler` boundaries (browser, SSR, internal service-to-service, desktop MessagePort) | Wire protocol between NetScript SDK clients and services | **Critical (operational).** v1 `RPCLink` cannot call v2 `RPCHandler` and vice versa. Requires coordinated client+server cut-over (or temporary OpenAPI/versioned mount bridge for rolling deployments). |

### 3. Throwaway `2.0.0-beta.53` prototype fallout (**measured**)

A throwaway detached worktree bumped root `deno.json` + 11 workspace `deno.json` files + `packages/telemetry/package.json` to `2.0.0-beta.53` (adding `@orpc/opentelemetry` and `@orpc/json-schema`), ran `mise exec -- deno install`, executed `deno check --unstable-kv` across 13 target groups and `deno test --no-check --allow-all --unstable-kv` across 8 test suites, and was then removed cleanly via `git worktree remove --force`. Full logs and diff stats are recorded in `.llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/evidence/v2-beta53-prototype-summary.md`.

| Check category (**measured**) | Result | Key finding |
| --- | --- | --- |
| `deno check --unstable-kv` (13 workspace target groups) | **13/13 failed — 411 TS diagnostics** | Breakdown: `contracts` (7), `telemetry` (2), `logger` (1), `service` (20), `sdk` (15), `plugin` (26), `plugin-auth-core` (30), `plugin-workers-core` (31), `plugin-sagas-core` (17), `plugin-triggers-core` (20), `plugin-ai-core` (17), `fresh` (10), `plugins/{auth,sagas,triggers,workers}/services` (215, driven by 122 cascading `TS7031` implicit-`any` from broken `baseContract`/`implement`). |
| `deno check --unstable-kv packages/cli/bin/netscript.ts` | **Failed — 37 TS diagnostics** | Cascading from `@netscript/service`, `@netscript/contracts`, `@netscript/telemetry`. |
| `deno test --no-check` (`packages/contracts/tests`) | **18 passed \| 5 failed** | `TypeError: oc.$meta is not a function`. |
| `deno test --no-check` (`packages/logger/tests/orpc-plugin_test.ts`) | **1 passed \| 4 failed** | `TypeError: Cannot read properties of undefined (reading 'routingInterceptors')` due to `void`-returning `init(options)`. |
| `deno test --no-check` (`packages/fresh/.../bind-desktop-rpc-window_test.ts`) | **0 passed \| 1 failed** | `SyntaxError: '@orpc/contract' does not provide an export named 'isContractProcedure'`. |
| `deno test --no-check` (`telemetry`, `service`, `sdk`, `plugin`, `plugin-auth-core`) | **All 5 failed at module load** | First blocker: missing `@orpc/otel`. Secondary pass (temporarily swapping only `@orpc/otel` → `@orpc/opentelemetry` inside throwaway) exposed immediate secondary failures: `ORPCError` missing from `@orpc/contract` (`error-plugin.ts`), `isContractProcedure` missing (`stable-v1-adapter.ts`), `@orpc/zod/zod4` `ERR_PACKAGE_PATH_NOT_EXPORTED` (`handlers.ts`), and `fallbackContractConfig` missing (`contract-procedure-index.ts`). |

### 4. Migration strategy (**derived**)

#### 4.1 Adapter and shim boundary (shielding NetScript users from raw oRPC)

Extending RFC 0001's principle ("never expose raw oRPC link types on NetScript's public surface") across contracts, services, and SDK:

1. **`@netscript/contracts` adapter seam:** Own contract authoring combinators (`baseContract`, `withAccess`, `withHttpRoute`, `defineErrorMap`) so downstream contracts never call `oc.$meta`, `.route()`, or raw `ErrorMapItem.status` directly. Maintain `commonErrorStatusMap` separately from schema definitions so both v1 `ErrorMapItem.status` and v2 `errorStatusMap` are generated from one NetScript source of truth.
2. **`@netscript/service` adapter seam:** Own `ServiceHandlerPlugin` (with explicit `name`, `order`, and return-based `init(options)`), `createService` / `defineService` procedure pipeline (RFC A), and `createRouterClient(...)` so user services never construct `RPCHandler`, `OpenAPIHandler`, `CORSHandlerPlugin`, or `SmartCoercionHandlerPlugin` directly. Re-export `ORPCError` (or a NetScript-typed `ServiceError` alias) from `@netscript/service` and `@netscript/sdk/client` so user code never imports `ORPCError` from `@orpc/contract`.
3. **`@netscript/sdk` adapter seam:** Keep `createServiceClient`, `safe()`, `isDefinedError()`, `getErrorHttpStatus(error)`, and `createServiceQueryUtils` as NetScript-owned ports. Explicitly enforce `redirect: 'manual'` (or `'error'`) in `http-client-link.ts` across v1 and v2 to protect bearer/internal credentials from unintended cross-origin redirect forwarding.
4. **Single-source dependency pinning:** Move all 11 workspace `deno.json` manifests (and CLI scaffold templates) onto `catalog:` entries for `@orpc/*`, remove hardcoded `@1.15.5` pins from `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts`, and prune the stale `1.15.0` entries from `deno.lock`.

#### 4.2 Staged rollout plan

| Phase | Target oRPC line | Scope & deliverables | Risk |
| --- | --- | --- | --- |
| **Phase 0: Pre-v2-stable prep (safe on v1 now)** | `^1.15.5` → `^1.16.6` (v1 stable) | 1. Consolidate all workspace `deno.json` files onto root `catalog:` and prune stale `1.15.0` lockfile entries.<br>2. Stop importing `ORPCError` from `@orpc/contract` everywhere in `packages/`, `plugins/`, CLI templates, and docs (switch to `@orpc/client` / `@orpc/server` / NetScript re-exports).<br>3. Ship RFC A Stage 1 (procedure-native contract authz, deleting `contract-procedure-index.ts`'s v1-only imports; remove redundant `CORSPlugin` from `handlers.ts`).<br>4. Introduce NetScript contract helpers (`withAccess`, `withHttpRoute`, `defineErrorMap`) and `getErrorHttpStatus(err)` as additive v1 APIs; relax `DefinedErrorLike` so `status` is optional; deprecate `experimental_streamed*`/`live*` & `refetchMode: 'replace'` in `ServiceQueryUtils` with v2-named aliases (`streamedQuery*`, `liveQuery*`, `fnOptions`).<br>5. Upgrade `ServiceHandlerPlugin`, `LoggingPlugin`, `TracingPlugin`, and `ErrorHandlingPlugin` to carry `name` and return `options` from `init(options)` (already valid on v1!). | **Low** — 100% backward-compatible on v1; shrinks v2 cut-over diff by >60%. |
| **Phase 1: Dual-line shadow CI (during v2 beta / RC)** | Mainline on v1 `1.16.x`; shadow job on `2.0.0-beta.x` / RC | Add a non-blocking weekly + `workflow_dispatch` GitHub Actions workflow that checks out `main`, runs a deterministic manifest-rewrite script (pinning `@orpc/*` to latest `2.0.0-beta.x`/`rc`, swapping `@orpc/otel` → `@orpc/opentelemetry`, adding `@orpc/json-schema`, no commit to `deno.lock`), and runs `deno check` + targeted tests on the v2 adapter branch. Tracks upstream beta churn automatically without blocking PRs on `main`. | **Low** — isolated from `main` CI and `deno.lock`. |
| **Phase 2: Coordinated v2 GA cut-over** | `@orpc/*@^2.0.0` (only after upstream `2.0.0` stable GA) | Cut over `deno.json` catalog, all `packages/*`, all `plugins/*`, CLI scaffold templates + `embedded.generated.ts`, docs, and RFC A Stage 2 (`service.createRouterClient(...)`) in one coordinated NetScript release. Ship `netscript migrate orpc-v2` codemod for downstream applications. Publish release notes highlighting RPC wire cut-over requirements. | **Medium** — single clean cut-over once upstream API is frozen. |

#### 4.3 Risks and rollback

- **Upstream beta churn risk:** Between `2.0.0-beta.50` and `2.0.0-beta.53` (2026-11-23), upstream still altered `ORPCError` readonly properties (#2523), `RetryAfterLinkPlugin` (#2525), and MessagePort error classes (#2533). **Mitigation:** Do **not** cut over `main` before `@orpc/*@2.0.0` GA; track churn in Phase 1 shadow CI only.
- **Mixed-version RPC deployment risk:** Because v1 `RPCLink` and v2 `RPCHandler` are wire-incompatible, rolling deploys that upgrade one service before its callers (or browser bundles before backend APIs) will fail RPC deserialization. **Mitigation:** (a) Single-repo NetScript workspaces upgrade services + SDK + Fresh apps atomically per deployment; (b) multi-service environments that must roll out incrementally can temporarily route cross-version traffic over OpenAPI (`OpenAPILink 1.16.0+` → v2 `OpenAPIHandler`, which upstream explicitly supports) or mount a versioned `/api/rpc/v2` prefix during cut-over.
- **Rollback strategy:**
  - *Before publish:* Revert the Phase 2 cut-over branch/commit and restore `deno.lock` (`catalog:` makes rollback a single atomic revert).
  - *After publish:* Keep a `release/orpc-v1` maintenance branch on NetScript's last v1-compatible minor (`@orpc/*@^1.16.6`) during the downstream compatibility window so critical security/bug fixes can be backported without forcing immediate v2 upgrades.

### 5. Interaction between RFC A (`#2671`) and RFC B (`#2672`)

RFC A and RFC B reinforce each other and **must be sequenced together**:

1. **RFC A removes RFC B's worst v2 blocker in `@netscript/service`:** `contract-procedure-index.ts` fails on v2 in four separate ways (`toHttpPath`, `toRou3Pattern`, `fallbackContractConfig`, `HTTPMethod`). Implementing RFC A Stage 1 (procedure-native contract authz) on v1 eliminates that entire file's dependency on oRPC routing internals *before* v2 cut-over.
2. **RFC B shapes RFC A's public Stage 2 surface:**
   - Procedure metadata should be accessed through a NetScript-owned helper (`getProcedureAccessPolicy(procedure)`), backed by `procedure['~orpc'].meta` on v1 and `@orpc/contract` `defineMeta` on v2.
   - `ServiceHandlerPlugin` should adopt `name` + return-based `init(options)` in Phase 0 so RFC A's unified `LoggingPlugin` / `TracingPlugin` / `ErrorHandlingPlugin` do not get rewritten twice.
   - `ORPCError` thrown by RFC A's procedure pipeline should avoid depending on `error.status` on the client side and reconcile contract error maps via a thin adapter (`defined: code in errorMap` on v1 → `reconcileORPCError` on v2).
   - Exposing `service.createRouterClient(...)` publicly in **Phase 2 / Stage 2** (aligned with oRPC v2 GA, where `.callable` is removed and `createRouterClient` is oRPC's canonical server-side client) ensures downstream applications undergo **one** migration rather than adopting a v1 router-client API and immediately migrating it for v2.
   - Note for PR #2659 (fetch-link): #2659's custom `fetch(request, init)` wrapper MUST handle both v1 (`Request`) and v2 (`string` URL + `RequestInit`) signatures — a trivial 3-line guard (`new Request(input, init)`) that keeps #2659 seamlessly v2-ready!

## Downstream consumers

> All downstream impact analysis below applies generically to any downstream application built on NetScript.

### Public API, behavior changes, and deprecations

- **Phase 0 (v1, non-breaking with deprecation warnings):**
  - Deprecated: importing `ORPCError` from `@orpc/contract`; using `ServiceQueryUtils` `experimental_streamedKey`/`Options`, `experimental_liveKey`/`Options`, `queryFnOptions`, and `refetchMode: 'replace'`; reading `.status` directly off `DefinedError` without `getErrorHttpStatus(error)`.
  - Added: NetScript contract helpers (`withAccess`, `withHttpRoute`, `defineErrorMap`), `getErrorHttpStatus(error)`, v2-aligned query utility aliases (`streamedQueryKey`/`Options`, `liveQueryKey`/`Options`, `fnOptions`), and `name` / return-based `ServiceHandlerPlugin`.
- **Phase 2 (v2 GA cut-over, breaking release):**
  - Removed: `.route()`, `oc.$meta`, `oc.prefix()`, `os.prefix()`, `ErrorMapItem.status`, `ORPCError.status`, `experimental_streamed*`/`live*`, `queryFnOptions`, `refetchMode: 'replace'`, `@orpc/otel`, `@orpc/zod/zod4`, `ZodSmartCoercionPlugin`, `customJsonSerializers` option, and direct v1 `RPCLink` wire compatibility.
  - Changed: `RPCLink` custom `fetch` signature (`string` URL + `init`), `RPCLink` `url` split (`origin` + prefix `url`), `RPCHandler` rejects `GET` by default unless opted in, `safe()` from `@orpc/client` changes tuple element 3 to `definedError | null` (while `@netscript/sdk/client`'s `safe()` retains named `isDefined` + `definedError` compatibility).

### Generated code and CLI scaffold changes

- `netscript init`, `netscript contract`, `netscript service`, `netscript plugin new`, and `netscript generate` templates (`packages/cli/src/kernel/assets/*`, `scaffold-app-catalog.ts`, `templates/workspace/contracts/deno-json.ts`, `templates/plugins/generate-plugin-deno-json.ts`, `embedded.generated.ts`) will be updated in Phase 0 to use `catalog:` and NetScript-owned helpers, and in Phase 2 to emit v2 imports (`@orpc/opentelemetry`, `@orpc/json-schema`, root `@orpc/zod`, `defineMeta`/`openapi`, `errorStatusMap`).
- Downstream applications regenerating plugin stubs or contract bindings after Phase 2 will receive v2-compatible code automatically; pre-existing user-authored contract files and custom service handlers will be upgraded via codemod.

### Migration steps and codemod (`netscript migrate orpc-v2`)

1. **Step 1 (on latest NetScript v1 / Phase 0):** Upgrade to the final v1-compatible NetScript release (`@orpc/*@^1.16.6`), fix deprecation warnings (switch `ORPCError` imports off `@orpc/contract`, migrate `experimental_streamed*`/`live*` query options, switch `error.status` checks to `getErrorHttpStatus(error)`).
2. **Step 2 (at Phase 2 v2 GA release):** Run `netscript migrate orpc-v2 --dry-run`, inspect diffs, then apply:
   - Rewrites `import { ORPCError } from '@orpc/contract'` → `@netscript/service` / `@netscript/sdk/client`.
   - Rewrites `@orpc/otel` → `@orpc/opentelemetry` and `@orpc/zod/zod4` → `@orpc/zod`.
   - Rewrites `.route({ method, path })` & `.meta({ access })` → NetScript v2 contract helpers (`withHttpRoute` / `withAccess` or `openapi()` + `defineMeta`).
   - Splits `status` out of inline `.errors({ CODE: { status, message, data } })` into `defineErrorMap` / `errorStatusMap`.
   - Rewrites `experimental_streamed*` / `experimental_live*` / `queryFnOptions` and flags `refetchMode: 'replace'` or custom `.callable()` / `.concat()` / custom `fetch(req)` hooks for manual review.
   - Updates `deno.json` `@orpc/*` entries to `catalog:` / `^2.0.0`.
3. **Step 3 (verification):** Run `deno task check && deno task test && deno task lint` and perform an atomic full-stack deploy (services + BFF + browser bundles together) to respect RPC wire cut-over.

### Configuration changes

- `deno.json`: Replace `@orpc/otel` with `@orpc/opentelemetry`, add `@orpc/json-schema`, and bump `@orpc/*` catalog entries to `^2.0.0`.
- `createService` / `defineService`: Services declaring custom HTTP status codes for contract errors supply `errorStatusMap` (automatically synthesized when using NetScript's `defineErrorMap`). Services explicitly requiring `GET` RPC endpoints must opt in once `RPCHandler` rejects `GET` by default.
- `createServiceClient`: Any application supplying a custom `fetch` transport hook must accept `(url: string | URL | Request, init?: RequestInit)` and read/merge headers from `init?.headers` rather than assuming a `Request` instance.

### Security implications

1. **CORS `origin: '*'` default trap:** oRPC v2's `CORSHandlerPlugin` defaults to `origin: '*'`. Removing `CORSPlugin` from `packages/service/src/primitives/handlers.ts` (Phase 0 / RFC A) guarantees NetScript's `withCors()` allowlist remains the sole CORS authority and prevents accidental wildcard CORS exposure on upgrade.
2. **HTTP redirect credential leakage (`redirect: 'manual'` removed):** oRPC v2 links no longer force `redirect: 'manual'`. NetScript's `http-client-link.ts` MUST explicitly set `redirect: 'manual'` (or `'error'`) so authenticated SDK requests carrying `Authorization: Bearer ...` or internal HKDF credentials never automatically follow 3xx redirects to untrusted hosts.
3. **CSRF / `GET` RPC hardening:** oRPC v2's `RPCHandler` rejects `GET` requests by default (superseding `StrictGetMethodPlugin`), which strengthens CSRF posture for mutating RPC procedures.
4. **Authorization layer move (with RFC A):** Moving contract authorization from `contract-procedure-index.ts` into oRPC procedure middleware eliminates URL-parsing desyncs while preserving HTTP-edge 401-before-413 and 404/410 anti-oracle defenses (see RFC A `#2671` §3.3).

### Compatibility window

- **Minimum overlap:** Maintain Phase 0 deprecation compatibility on the NetScript v1 (`@orpc/*@^1.16.6`) line for at least **one minor release cycle (and no less than 60 days)** before shipping the Phase 2 oRPC v2 cut-over, plus security/critical backports on `release/orpc-v1` for an overlapping migration window after v2 ships.
- **Gate for Phase 2:** Upstream `@orpc/*@2.0.0` stable GA published (no beta/RC cut-over on `main`) AND Phase 1 shadow CI green across all core packages, plugins, and CLI e2e gates.

## Drawbacks

1. **Maintaining dual-line shadow CI during beta:** Keeping a weekly v2 shadow job healthy while oRPC v2 iterates through beta/RC costs minor ongoing maintainer attention, though far less than chasing beta breaks directly on `main`.
2. **Temporary adapter indirection in Phase 0:** Introducing NetScript contract helpers (`withAccess`, `withHttpRoute`, `defineErrorMap`) adds a small compatibility surface on v1, though it permanently reduces NetScript's blast radius for future oRPC major versions (v3+).
3. **Coordinated RPC wire cut-over:** Multi-service deployments cannot mix v1 and v2 `RPCLink`/`RPCHandler` endpoints without an OpenAPI or versioned-mount bridge.

## Rationale and alternatives

| Alternative | Assessment | Verdict |
| --- | --- | --- |
| **A. Cut over immediately to `2.0.0-beta.53`** | Upstream is still shipping breaking beta tweaks (as recently as 2026-11-23), breaks all 13 workspace target groups (411 diagnostics) plus all downstream apps, and risks multiple breaking releases before 2.0.0 GA. | **Rejected** |
| **B. Wait passively until v2 GA, then do a big-bang rewrite** | Leaves 179 files tightly coupled to v1 idioms (`oc.$meta`, `.route()`, `contract-procedure-index.ts`, `ORPCError` from `@orpc/contract`, `DefinedError.status`), creates a huge risky cut-over PR, and forces RFC A (`createRouterClient`) to ship a throwaway v1 public API. | **Rejected** |
| **C. Three-phase staged readiness (Phase 0 v1 prep → Phase 1 shadow CI → Phase 2 v2 GA cut-over)** | De-risks >60% of the diff safely on v1 today, aligns directly with RFC A, tracks upstream beta changes automatically without destabilizing `main`, and gives downstream apps a single codemod-assisted migration on stable `2.0.0`. | **Recommended** |

## Breaking changes and migration

This RFC is labeled `breaking` because Phase 2 (the `@orpc/*@^2.0.0` cut-over) introduces breaking changes to NetScript contract authoring, error status typing, `ServiceHandlerPlugin`, `ServiceQueryUtils` streamed/live methods, custom link `fetch` hooks, and RPC wire compatibility. Phase 0 is strictly additive and non-breaking on v1. See `## Downstream consumers` above for the full migration plan and `netscript migrate orpc-v2` codemod scope.

## Prior art

- **oRPC official v1→v2 migration guide:** <https://orpc.dev/docs/migrations/from-v1> (reviewed in full on 2026-11-25, covering up to `v2.0.0-beta.53`).
- **Accepted RFC 0001** (`rfcs/0001-sdk-client-contributions.md`): established the NetScript adapter boundary hiding raw oRPC link types from SDK consumers.
- **Companion RFC A** (`#2671`, `rfcs/0000-orpc-router-client-pipeline.md`): migrates contract authorization and procedure pipeline into oRPC, removing `contract-procedure-index.ts`'s v1-only imports ahead of v2.
- **Draft PR #2659** (`rfcs/0000-in-process-service-link.md`, head `d2c0e05b`): fetch-based in-process link whose custom `fetch` wrapper is trivially v1/v2 compatible.

## Unresolved questions

1. **Contract helper ergonomics:** Should Phase 0 introduce standalone builder helpers (`withHttpRoute` / `withAccess`) or a single NetScript `defineProcedure({ route, access, errors, input, output })` factory in `@netscript/contracts` to insulate downstream contracts completely from oRPC's `.route()` → `openapi()` / `defineMeta` shift?
2. **`@netscript/sdk/client` `safe()` return shape on v2:** Should NetScript keep `isDefined: boolean` permanently alongside adding `definedError` (preserving 100% source compatibility for `@netscript/sdk/client` callers), or align tuple index 2 with upstream oRPC v2's `definedError | null` at Phase 2?
3. **Rolling multi-service upgrades:** Does NetScript need an official `OpenAPILink` fallback mode or dual-mount helper for deployments that cannot upgrade all RPC callers and servers simultaneously during Phase 2?
4. **Upstream `2.0.0` GA timeline:** Exact release date of `@orpc/*@2.0.0` stable is external; Phase 1 shadow CI should report readiness status weekly until upstream tags RC1 / GA.

## Future possibilities

- **Adopting oRPC v2 native plugins where appropriate:** Evaluating v2's built-in `TimeoutHandlerPlugin`, `RequestCompressionHandlerPlugin` / `ResponseCompressionHandlerPlugin`, and `SignalSyncHandlerPlugin` once on `2.0.0` GA (while retaining NetScript's HTTP-edge `withCors` and 401-before-413 `withBodyLimit` invariants).
- **Contract-first `@orpc/tanstack-query` SSR streaming:** Adopting v2's `StreamQuerySSRUtilsPlugin` and `createHydrationOptions` inside `@netscript/fresh` + `@netscript/sdk` for zero-boilerplate streaming SSR hydration.
