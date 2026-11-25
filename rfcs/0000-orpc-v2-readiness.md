---
rfc: 0000
title: oRPC v2 readiness and migration strategy
status: Draft
authors: ["@rickylabs"]
created: 2026-11-25
tracking-issue: https://github.com/rickylabs/netscript/issues/2672
target-milestone: 0.0.10
---

# oRPC v2 readiness and migration strategy

> **Draft evaluation notice.** This document is a **Draft** evaluation RFC produced for technical review. It does not authorize implementation, dependency, or lockfile changes under `packages/`, `plugins/`, `docs/site/`, `.github/`, `deno.json`, or `deno.lock`. Every statement about current NetScript or oRPC behavior below is tagged as **source-inspected** or **measured** (from the throwaway `2.0.0-beta.53` prototype summarized in `.llm/runs/plan-rfc-orpc-v2-readiness-2672--rfc/evidence/v2-beta53-prototype-summary.md` and standalone probes in `probes/v2-behavior-probes.ts`); proposed architecture and migration steps are tagged as **derived**. Phase 0a targets milestone `0.0.10`; Phase 2 (oRPC v2 GA cut-over) targets `0.1.0`. Companion pipeline evaluation: draft PR #2673 (tracking issue #2671).

## Summary

NetScript's contract, service, SDK, telemetry, logging, plugin, desktop RPC, and CLI scaffolding layers depend on `@orpc/*@^1.15.5` across **179 non-`.llm`, non-lock files** (**source-inspected**). Upstream oRPC v2 is in beta (`2.0.0-beta.53` on 2026-11-23; v1 line at `1.16.5` usable under Deno's dependency-age policy, `1.16.6` published 2026-11-25) and introduces pervasive breaking changes—including **silent data/runtime hazards** verified empirically in `probes/v2-behavior-probes.ts`: mixed v1/v2 RPC calls silently mis-decode `bigint` (`10n` → `"10"`) and degrade error messages; default `RPCHandler` rejects `GET` (breaking NetScript's 52 declared `GET` procedures); `StandardHandlerPlugin.init` requires returning options AND renaming `rootInterceptors` → `routingInterceptors` (while v1 `StandardHandler` ignores `routingInterceptors`, so switching before `0.1.0` breaks v1!); unmapped error codes flip from HTTP `500` to `400`; `ORPCError` ignores constructor `defined: true` and removes `status`; middleware deduplication is removed (running router+procedure middleware twice); and default `RPCLink` follows cross-origin `307` redirects, leaking custom headers, `traceparent`, and bodies. Prototyping an unmodified bump to `2.0.0-beta.53` in a throwaway worktree (**measured**) produced **411 raw diagnostics across 13/13 target groups** (186 raw diagnostics across the 11 core/plugin-core groups deduplicate to **99 unique sites in 25 files**, roughly half of which are `.route()` calls). We recommend a **staged, split-Phase-0 readiness strategy** (**derived**): **Phase 0a** (`0.0.10`, safe once authorized: `@orpc/*` catalog consolidation + updating isolated e2e lock probes off `1.15.0` + `@orpc/*`-scoped CI catalog check, `1.16.5` bump, moving `ORPCError` off `@orpc/contract`, plugin `name`/return-`init` keeping runtime attachment on `rootInterceptors` behind a NetScript helper + real-`RPCHandler` tests, additive `getErrorHttpStatus` + relaxed `DefinedErrorLike`, server-only `X-NetScript-RPC-Protocol` readiness in `withCors()` and v1 `426` reverse guard without emitting any new client header in `0.0.10`, and `redirect: 'error'`); **Phase 0b** (`0.0.11`, held until accepted: TanStack `streamedKey`/`streamedOptions`/`liveKey`/`liveOptions` aliases, server-free browser-safe contract helpers `routeMeta`/`accessMeta`/`policyMeta`/`defineContractErrors`, and RFC A Stage 1b); **Phase 1** (maintained `chore/orpc-v2-shadow` branch running weekly CI against latest beta/RC); and **Phase 2** (`0.1.0` after `@orpc/*@2.0.0` GA, shipping breaking v2 `CORSPlugin` tightening, `X-NetScript-RPC-Protocol: orpc-v2` client emission + `OPTIONS`-exempt `426` guard, `routingInterceptors` flip, standalone `errorStatusMap` `500` normalization, contract `GET`/`HEAD`/`PUT`/`PATCH`/`DELETE` parity, and RFC A Stage 2, while keeping `release/orpc-v1` on `0.0.12+` for 90 days post-GA).

## Motivation

### Why evaluate oRPC v2 readiness now? (**source-inspected** & **measured**)

1. **Wide surface coupling & manifest drift:** `@orpc/*` spans **179 non-`.llm`, non-lock files** across 18 workspace groups plus 3 RFC files. Although root `deno.json` defines `@orpc/*` in `"catalog"`, **11 workspace `deno.json` manifests**, one e2e fixture manifest (`packages/cli/e2e/fixtures/desktop-native/deno.json`), and inline specifiers in `packages/cli/e2e/src/application/gates/scaffold/{install-generated-probe_test.ts,locked-probes_test.ts,prepare-flow-b-fixture.ts}`, `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts`, and `packages/sdk/tests/client-contribution-observability_test.ts` bypass `catalog:`, and root `deno.lock` retains stale `1.15.0` entries for `@orpc/client` and `@orpc/tanstack-query` (already flagged as `WARN DEPS-NPM-CATALOG` by `.llm/tools/deps/scan-npm-catalog-compliance.ts`).
2. **Silent security, data-integrity, and observability traps on v2 (**measured** in `probes/v2-behavior-probes.ts`):**
   - **Silent mixed-version RPC corruption (B1):** A `1.15.5` `RPCLink` calling a `2.0.0-beta.53` `RPCHandler` succeeds on plain JSON calls, **silently delivers `bigint` `10n` as the string `"10"`**, and degrades custom error messages (`"nope"` → `"Not Found"`). Stale browser tabs, cached Fresh islands, and installed desktop clients cannot upgrade atomically with servers.
   - **GET-first queries break on cut-over (B2):** NetScript's SDK issues `GET` for every procedure declaring `method: 'GET'` (**52** first-party contract/template declarations across 25 files, plus CRUD `list`/`get`), driving `DedupeRequestsPlugin` and `force-cache` groups. Default `RPCHandler@2.0.0-beta.53` returns `matched: false` (404) for `GET`.
   - **Silent interceptor, error-status, and middleware-dedup regressions (B4):** `LoggingPlugin` and `TracingPlugin` push to `rootInterceptors`, which compiles against NetScript's structural `GenericHandlerOptions` while silently dropping all request logs and root spans on v2 (`routingInterceptors`); server-side `error.status` readers misclassify client errors as server errors; unmapped error codes flip from HTTP `500` to `400`; `new ORPCError(..., { defined: true })` is ignored (`plugins/auth/services/src/routers/v1-handlers.ts:97`); and router+procedure middleware runs **twice** (charging RFC A quotas twice).
   - **Cross-origin `307` redirect leakage (B7):** Removing `redirect: 'manual'` causes v2's default `RPCLink` to follow a cross-origin `307`, leaking custom headers (e.g., `x-api-key`), `traceparent`, and the full request body to the foreign origin and returning its response as the RPC result; meanwhile `redirect: 'manual'` silently resolves with `undefined`.
3. **Co-design with companion RFC A (PR #2673 / issue #2671):** Aligning RFC A's Stage 2 (`createRouterClientTransport`) and HTTP-edge v2 matcher (`RPCMatcher` + `OpenAPIMatcher`) with RFC B's `0.1.0` v2 GA cut-over avoids forcing downstream applications through two separate migrations.

## Guide-level explanation

> **Derived design.** All TypeScript idioms below are **type-valid** against `@orpc/*@2.0.0-beta.53` (verified in `probes/v2-behavior-probes.ts`). Note that oRPC contract builders (`oc`, `baseContract`) have **no `.use()` method** on v1 or v2; metadata and routes are composed via server-free, browser-safe `.meta(routeMeta(...))`, `.meta(accessMeta(...))`, and `.meta(policyMeta(...))` helpers backed exclusively by `@orpc/contract` `defineMeta` (keeping `@netscript/contracts` free of `@orpc/server` and `@orpc/openapi` runtime dependencies!).

### Contract authoring (server-free `routeMeta` + exact-key `accessMeta` & `policyMeta`)

```ts
// `@netscript/contracts` imports ONLY `@orpc/contract` and `zod` (browser-safe; zero `@orpc/server` dependency!).
// `routeMeta` writes `'~openapi'` (read natively by `@orpc/openapi` `getOpenAPIMeta` & `OpenAPIGenerator`),
// `accessMeta` writes `'access'` (`meta.access`), and `policyMeta` writes `'policy'` (`meta.policy`).
import {
  accessMeta,
  baseContract,
  defineContractErrors,
  policyMeta,
  routeMeta,
} from '@netscript/contracts';
import { z } from 'zod';

export const orderErrors = defineContractErrors({
  ORDER_LOCKED: { status: 409, message: 'Order is locked', data: z.object({ orderId: z.string() }) },
});

export const getOrder = baseContract
  .meta(routeMeta({ method: 'GET', path: '/orders/{id}' }))
  .meta(accessMeta({ authentication: 'required', authorization: { scopes: ['orders:read'] } }))
  .meta(policyMeta({ cache: 'force-cache' }))
  .errors(orderErrors.definitions)
  .input(z.object({ id: z.string() }))
  .output(z.object({ id: z.string(), totalMinor: z.number().int() }));
```

*(Transitional opt-in: server-only packages that temporarily wish to keep `.route(...)` syntax may import `'@orpc/openapi/extensions/route'` directly in their own runtime entrypoint, noting that `dist/extensions/route.js:3` imports `@orpc/server` at runtime and requires side-effect evaluation before any `.route()` call.)*

### Client error handling & TanStack Query v2 names

```ts
// Import error helpers from `@netscript/sdk/client` (never re-exporting raw ORPCError class per RFC 0001).
// Note: `getErrorHttpStatus(err)` reads `ResponseError` cause on HTTP; returns `undefined` on MessagePort & router-client!
import { getErrorHttpStatus, safe } from '@netscript/sdk/client';

const res = await safe(client.getOrder({ id }));
if (!res.isSuccess && res.isDefined) {
  console.log(res.error.code, getErrorHttpStatus(res.error));
}

// TanStack Query v2 names (verified in `@orpc/tanstack-query@2.0.0-beta.53/dist/procedure-utils.d.ts`):
// `streamedKey`, `streamedOptions`, `liveKey`, `liveOptions`, `fnOptions`.
const streamed = queryUtils.watchOrders.streamedOptions({
  input: { tenantId },
  fnOptions: { refetchMode: 'append', maxChunks: 200 },
});

// Replacing v1 `refetchMode: 'replace'` (do NOT blindly switch to `'reset'`, which clears data immediately!):
// Use a custom `queryFn` that buffers incoming chunks and resolves the replacement array on completion.
```

## Reference-level explanation

### 1. Complete repository inventory of `@orpc/*` usage (**source-inspected**)

On `main` (`87965d800`), `git grep -l '@orpc/' -- ':!.llm' ':!*deno.lock'` matched **179 files** across **18 workspace groups + 3 RFC documents** (19 table rows total; plus 8 lockfiles; 19 `@orpc/*` npm entries in root `deno.lock`). No top-level `samples/` or `examples/` directory exists; showcase/sample templates live inside `packages/cli/src/kernel/assets/showcase/`, `packages/cli/tests/showcase-ai/`, `packages/cli/e2e/fixtures/`, and `packages/bench/tasks/`.

| Workspace group / bucket | File count | Specifiers / key surfaces |
| --- | ---: | --- |
| `deno.json` (root) | 1 | `"catalog"` pins for `@orpc/{client,contract,openapi,otel,server,tanstack-query,zod}` (`^1.15.5`). |
| `packages/contracts` | 8 | `oc.$meta`, `ContractBuilder`, `ContractProcedureBuilderWith{InputOutput,Output}`, `commonErrorMap` (`status` in `ErrorMapItem`), `create-crud-contract.ts`, `command-contract.ts`. |
| `packages/service` | 20 | `RPCHandler`, `OpenAPIHandler`, `CORSPlugin`, `ZodSmartCoercionPlugin` (`@orpc/zod/zod4`), `ZodToJsonSchemaConverter`, `OpenAPIGenerator`, `traverseContractProcedures`, `Router<T, C>`, `contract-procedure-index.ts`, `openapi.ts:110` (`~orpc.route`), 14 test suites. |
| `packages/sdk` | 33 | `createORPCClient`, `RPCLink`, `StandardLinkClientInterceptorOptions`, custom `fetch(Request)`, `customJsonSerializers` (desktop MessagePort), `isContractProcedure`, `inferRPCMethodFromContractRouter`, `DefinedError.status`, `createTanstackQueryUtils`, `ServiceQueryUtils` (`experimental_streamed*`/`live*`, `queryFnOptions`, `refetchMode: 'replace'`), `ports/service-client.ts:59,72` (`~orpc.inputSchema`), `OpenAPIGenerator`, 21 tests/type-fixtures (incl. inline `@1.15.5` pins). |
| `packages/telemetry` | 4 | `ORPCInstrumentation` (`@orpc/otel`), `ORPCError` from `@orpc/contract`, `TracingPlugin` (`rootInterceptors`, `err.status`), `ErrorHandlingPlugin` (`err.status`, `toORPCError`). |
| `packages/logger` | 4 | `LoggingPlugin` (`HandlerPlugin` missing `name`, `void` `init`, `rootInterceptors`, `err.status`). |
| `packages/plugin` | 8 | `base-contract.ts` (`ContractProcedure`, `EnhancedContractRouter`, `oc.prefix`, `.route()`), `base-errors.ts` (`BASE_PLUGIN_ERRORS` with `status`), `contract-mount.ts`, `plugin-contract-binder.ts` (`os.prefix()`). |
| `packages/plugin-auth-core` | 6 | `auth.contract.ts`, `base-error-adapter.ts`, `auth-service-authenticator.ts` (`ORPCError` from `@orpc/contract`, `error.defined`). |
| `packages/plugin-workers-core` | 5 | `workers.contract-definition.ts` (23 `.route()` calls), `workers.contract-types.ts`. |
| `packages/plugin-sagas-core` | 2 | `sagas.contract.ts` (9 `.route()` calls). |
| `packages/plugin-triggers-core` | 2 | `triggers.contract.ts` (12 `.route()` calls). |
| `packages/plugin-ai-core` | 3 | `ai.contract.ts` (7 `.route()` calls, `Implementer` arity), `base-error-adapter.ts`. |
| `packages/fresh` | 5 | `bind-desktop-rpc-window.ts` (`RPCHandler` MessagePort + `customJsonSerializers`), desktop reload fixtures & tests. |
| `packages/cli` | 35 | `scaffold-app-catalog.ts`, `contract*.ts.template`, `generate-plugin-*.ts.template`, `showcase/service/commerce.ts.template`, `embedded.generated.ts`, `e2e/fixtures/desktop-native/deno.json`, `e2e/src/application/gates/scaffold/{install-generated-probe_test.ts,locked-probes_test.ts,prepare-flow-b-fixture.ts,service-client-runtime-probe.ts}` (`~orpc.inputSchema`, hardcoded `@orpc/client@1.15.0`/`1.15.5`). |
| `packages/bench` | 5 | Benchmark task reference routers & `deno.json`. |
| `packages/mcp` | 2 | Telemetry fixture JSONs referencing `@orpc/otel` span attributes. |
| `plugins/{auth,sagas,streams,triggers,workers}` | 17 | `package.json` deps, `v1-handlers.ts` (incl. `plugins/auth/services/src/routers/v1-handlers.ts:97` `defined: true`), `v1.ts`, `subscribe.ts`, tests. |
| `docs/site` + `docs/architecture` | 16 | Architecture, contracts, SDK/services guides, tutorials, telemetry docs, `02-public-surface.md`. |
| `rfcs/` (3 existing RFCs) | 3 | `0000-rust-workers-integration.md`, `0001-sdk-client-contributions.md`, `0005-devtools-contribution.md`. |
| **Total (19 rows, non-`.llm`, non-lock)** | **179** | **Top specifiers:** `@orpc/server` (159), `@orpc/contract` (116), `@orpc/client` (30), `@orpc/openapi` (18), `@orpc/zod` (14), `@orpc/otel` (13), `@orpc/tanstack-query` (11). |

### 2. Complete mapping of oRPC v2 breaking changes (`2.0.0-beta.53`) — including silent runtime hazards (**source-inspected** & **measured**)

| # | oRPC v2 breaking change | Affected NetScript files | Affected public APIs / behavior | Required behavior test & resolution |
| --- | --- | --- | --- | --- |
| **1** | **Mixed v1/v2 RPC silent wire incompatibility** (`bigint` `10n` → `"10"`, error `"nope"` → `"Not Found"`, reverse `MalformedResponseError`) | `packages/sdk/src/client/http-client-link.ts`, `packages/service/src/middleware/service-cors.ts:23`, `packages/service/src/builder/service-rpc.ts`, `packages/service/src/primitives/handlers.ts`, `packages/sdk/tests/integration/client-contribution-adapter_test.ts:25-30` | All browser, Fresh island, desktop, and service-to-service RPC calls; CORS preflights | **Decided (B1 + N1):** Phase 0a (`0.0.10`) prepares servers **only** (auto-include `X-NetScript-RPC-Protocol` in `withCors({ allowHeaders })` + v1 `OPTIONS`-exempt reverse `426` guard + `Vary: X-NetScript-RPC-Protocol` on `200`/`426`), keeping v1 SDK `RPCLink` header-neutral (zero new CORS preflights, `OMITTED_CONTRIBUTION_BASELINE` untouched). At `0.1.0`, v2 `RPCLink` emits `X-NetScript-RPC-Protocol: orpc-v2` and v2 handlers enforce `426` (exempting `OPTIONS`, `Vary` on `200` GET + `426`, `RPCHandlerConfig.cors` auto-including header) (§4.2). Verified in Probe B1. |
| **2** | **`RPCHandler` rejects `GET` by default** + `GetMethodCsrfProtectionHandlerPlugin` (`Sec-Fetch-*`) + `inferRPCMethodFromContractRouter` removed | `packages/sdk/src/internal/transport-policy.ts`, `packages/service/src/primitives/handlers.ts`, `packages/contracts/crud/create-crud-contract.ts:351-378`, `packages/sdk/tests/transport-policy_test.ts:13,35`, 52 `method: 'GET'` declarations across 25 first-party contracts/templates | All GET queries, CRUD `PATCH`/`DELETE`, `HEAD→GET`, `DedupeRequestsPlugin`, `force-cache` groups | **Decided (B2 + N3):** Allow `POST`/`PUT`/`PATCH`/`DELETE` (`RPC_DEFAULT_ALLOW_METHODS`) + contract-declared `GET`/`HEAD` (`allowMethods`) paired with `GetMethodCsrfProtectionHandlerPlugin` + `SameSite=Lax\|Strict` invariant. When a service sets `allowGetRpc: false` (`SameSite=None`), SDK callers MUST pair `transportPolicy: { method: () => 'POST' }`. SDK inference preserves `GET`, `HEAD→GET`, `POST`, `PUT`, `PATCH`, `DELETE` (§4.3). Verified in Probe B2. |
| **3** | **CORS plugin rename & default change:** `CORSPlugin` deprecated alias answers `*` with no `Vary: Origin` (silent!); v1 reflected request `Origin` | `packages/service/src/primitives/handlers.ts:112`, `packages/service/tests/cors-response-authority_test.ts:442-480` | `createRPCHandler`, `createOpenAPIHandler`, services without `withCors()` | **Decided (B3):** Keep `CORSPlugin` untouched on v1 in Phase 0a (preserving tested v1 behavior); remove implicit handler CORS at Phase 2 as an explicit **breaking security tightening** with opt-in `RPCHandlerConfig.cors` (auto-including `X-NetScript-RPC-Protocol` when `allowHeaders` is explicit) for standalone mounts (§4.4). |
| **4** | **Handler plugin `OrderablePlugin` (`name` required), return-based `init(options)`, AND silent `rootInterceptors` → `routingInterceptors` rename** | `packages/logger/orpc-plugin.ts:328-331`, `packages/telemetry/src/orpc/{tracing-plugin.ts:205,error-plugin.ts:342}`, `packages/telemetry/tests/orpc/plugin_test.ts:101`, `packages/service/src/types.ts:266-275` | `ServiceHandlerPlugin`, `LoggingPlugin`, `TracingPlugin`, `ErrorHandlingPlugin` | **B4 + N2 silent trap!** v1 `StandardHandler` ignores `routingInterceptors` (`rootRan: true, routingRan: false`), while v2 ignores `rootInterceptors`. Phase 0a keeps runtime attachment on `rootInterceptors` behind a shared NetScript helper (`attachRootHandlerInterceptor`) and updates `plugin_test.ts:101` to mount plugins in a **real `RPCHandler`** (not `{}`); Phase 2 flips the helper once to `routingInterceptors` (Probe B4). |
| **5** | **`ORPCError` removed from `@orpc/contract`; `status` removed from `ORPCError`/`ErrorMapItem`; server-side `error.status` readers break silently** | `packages/contracts/src/application/contract-primitives.ts`, `packages/plugin/src/contract-base/domain/base-errors.ts`, `packages/plugin-{auth,ai}-core/src/contracts/v1/base-error-adapter.ts`, `packages/sdk/src/client/errors.ts`, `packages/logger/orpc-plugin.ts:311`, `packages/telemetry/src/orpc/{error-plugin.ts:183,234,375,tracing-plugin.ts:23-65,276}`, `packages/service/src/primitives/handlers.ts:77-120`, `plugins/*/services/src/routers/*` | `DefinedError`, `safe()`, `isDefinedError()`, `LoggingPlugin`, `ErrorHandlingPlugin`, `TracingPlugin` (`TracingPluginOptions`), `commonErrorMap`, `BASE_PLUGIN_ERRORS` | **B4 + N2 silent traps!** (a) Relax `DefinedErrorLike` (optional `status`) + add `getErrorHttpStatus(err)` (`undefined` on MessagePort/router-client). (b) Add `errorStatusMap?: Readonly<Record<string, number>>` to `TracingPluginOptions`, `LoggingPluginOptions`, and `ErrorHandlingPluginOptions`, populated by `createRPCPlugins()`, and replace server `err.status` reads with shared `resolveErrorHttpStatus(err, errorStatusMap)` (defaulting unmapped codes to `500`, verified in Probe B4). |
| **6** | **Unmapped error code status fallback changes `500` → `400`** (`rpc-handler-codec.js:44`) + per-handler `errorStatusMap` vs per-procedure statuses + retry plugin stops retrying 4xx | `packages/service/src/primitives/handlers.ts:77-191`, `packages/telemetry/src/orpc/error-plugin.ts:215-275`, `plugins/auth/services/src/routers/v1-handlers.ts`, `plugins/sagas/services/src/routers/v1-handlers.ts:193` | HTTP status codes for standalone & service handlers; custom `err.code`s; `ClientRetryPlugin` | **B4 + N2 silent trap!** Do **not** rely on optional `ErrorHandlingPlugin` (omitted when `serviceName` is absent or `errorHandling: false` at `handlers.ts:91`). Instead, `createRPCHandler` and `createOpenAPIHandler` unconditionally merge standard + contract + config status maps (fail-fast on conflicts) wrapped in `createDefault500ErrorStatusMap` (Proxy returning `500` for unmapped codes via `get`/`getOwnPropertyDescriptor`), returning HTTP `500` while **preserving custom `err.code`** on standalone & service handlers (verified on both `RPCHandler` and `OpenAPIHandler` in Probe B4). |
| **7** | **`new ORPCError(code, { defined: true })` constructor option silently ignored** | `plugins/auth/services/src/routers/v1-handlers.ts:97` (`oauth_cookie_missing`), `plugins/sagas/services/src/routers/v1-handlers.ts:193` (`BAD_REQUEST`/`CONFLICT`/`SERVICE_UNAVAILABLE`) | Auth OAuth remedy message & saga SSE error reconciliation under production error masking | **B4 silent trap!** Switch to contract-bound `errors.<CODE>(...)` or `reconcileORPCError(errorMap, err)` (ensuring `CONFLICT`/`BAD_REQUEST`/`SERVICE_UNAVAILABLE` are declared in contract error maps & `errorStatusMap`) + behavior test asserting preserved remedy message (Probe B4). |
| **8** | **Middleware deduplication removed** (same middleware at router + procedure runs **twice**; `.concat` → `.use`; `.callable` no longer built in — opt-in `@orpc/server/extensions/callable`) | RFC A router-level procedure pipeline (`packages/service`), downstream custom routers | Rate-limit double-charging & double-authn if middleware is attached at both levels | **B4 silent trap!** Guard RFC A pipeline with BOTH per-leaf `WRAPPED_PROCEDURE_SERVICE` and per-call context symbol (`PIPELINE_EXECUTED_SYMBOL`), verified on `2.0.0-beta.53` (Probe B4). |
| **9** | **`['~orpc']` internal layout changes** (`inputSchemas`/`outputSchemas`, no `.route`) | `packages/service/src/primitives/openapi.ts:110`, `packages/service/src/auth/contract/contract-procedure-index.ts:79,210`, `packages/sdk/src/ports/service-client.ts:59,72`, `packages/cli/e2e/src/application/gates/scaffold/service-client-runtime-probe.ts:153,157` | OpenAPI security augmentation, contract index, e2e runtime probe, `ContractProcedureLike` | Replace direct `['~orpc'].route`/`inputSchema` reads with `getOpenAPIMeta`, `getAccessMeta`/`getPolicyMeta`, and v2 schema array helpers + behavior tests. |
| **10** | **`oc.$meta` removed → `defineMeta`; `.route()` removed (`@orpc/openapi/extensions/route` pulls `@orpc/server` at runtime!); `oc.prefix()`/`os.prefix()` removed; prefixes now apply to procedures without explicit `path`** | `packages/contracts/src/application/{contract-primitives.ts,command-contract.ts}`, `packages/contracts/src/domain/procedure-meta.ts`, `packages/contracts/tests/procedure-meta-independence_test.ts`, `packages/plugin/src/contract-base/domain/{base-contract.ts,contract-mount.ts}`, `packages/plugin/src/service/presentation/plugin-contract-binder.ts:149`, all 5 `plugin-*-core` contracts, CLI templates | `baseContract`, `BaseContractRoute`, `BaseContractOutputRoute`, `NetScriptProcedureMeta` (`access` & `policy.cache`), `mountPluginContract`, `assemblePluginContractRouter` | **Decided (B6 + N4):** Do **NOT** import `@orpc/openapi/extensions/route` inside `@netscript/contracts` (`dist/extensions/route.js:3` imports `@orpc/server` at runtime and misses `import type` / direct `oc` callers!). Instead export browser-safe, server-free `routeMeta` (`defineMeta('~openapi', ...)`), `accessMeta` (`defineMeta('access', ...)` → `.meta.access`), `policyMeta` (`defineMeta('policy', ...)` → `.meta.policy`), and `defineContractErrors` from `@netscript/contracts`, keeping `packages/contracts/deno.json` strictly on `[@orpc/contract, zod]` and keeping `@orpc/openapi/extensions/route` strictly as an optional server-only transitional opt-in (Probe B6). |
| **11** | **`RPCLink` transport changes:** `url` split (`origin` + prefix `url`); custom `fetch(url, init)` receives `string` URL; **`redirect: 'manual'` removed**; `StandardLinkClientInterceptorOptions` → `StandardLinkInterceptorOptions`; `customJsonSerializers` → `serializer: new RPCSerializer({ handlers })`; MessagePort `TimeoutError`/`ConnectionClosedError` (#2533) | `packages/sdk/src/client/http-client-link.ts`, `packages/sdk/src/desktop/application/desktop-rpc-client.ts`, `packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts`, PR #2659 fetch-link | `createHttpClientLink`, desktop RPC bridge | **Decided (B7):** Enforce **`redirect: 'error'`** AFTER `...init` spread in `http-client-link.ts:192` (throws `TypeError`, 0 requests to foreign 307 target — never `'manual'` which silently returns `undefined`!). Verified in Probe B7. |
| **12** | **`@orpc/tanstack-query` renames & removals:** `experimental_streamedKey`/`Options` → **`streamedKey`/`streamedOptions`**; `experimental_liveKey`/`Options` → **`liveKey`/`liveOptions`**; `queryFnOptions` → `fnOptions`; `refetchMode: 'replace'` removed; `path` → `prefix` | `packages/sdk/src/ports/service-query-utils.ts`, `packages/sdk/src/query-client/create-service-query-utils.ts:17-28`, `packages/sdk/tests/query-client/*`, `packages/sdk/tests/type-fixtures/service-query-utils-*` | `ServiceQueryUtils`, `ServiceProcedureQueryUtils`, `CreateServiceQueryUtilsOptions` | **Fixed (B5):** Use exact upstream names (`streamedKey`, `streamedOptions`, `liveKey`, `liveOptions`) in Phase 0b / Phase 2 and update `PARTITIONED_KEY_METHODS` / `PARTITIONED_OPTION_KEY_METHODS`. Replace `refetchMode: 'replace'` via custom `queryFn` (NOT `'reset'`). |
| **13** | **`safe()` tuple changed** (`[error, data, definedError \| null, isSuccess]`; `isDefined` removed) | `packages/sdk/src/client/errors.ts`, `packages/sdk/tests/orpc-defined-error-narrowing_test.ts` | `@netscript/sdk/client` `safe()` | `@netscript/sdk/client` owns its `safe()` wrapper and can retain `isDefined` while adding `definedError` (or align at `0.1.0`). |
| **14** | **Package & converter changes:** `@orpc/otel` → `@orpc/opentelemetry`; `@orpc/zod/zod4` & `ZodSmartCoercionPlugin` removed → root `@orpc/zod` + `@orpc/json-schema` `SmartCoercionHandlerPlugin`; `OpenAPI` namespace removed; `schemaConverters` → `converters`; `toHttpPath`/`toRou3Pattern`/`fallbackContractConfig`/`traverseContractProcedures`/`isContractProcedure` removed | `deno.json`, `packages/telemetry`, `packages/service/src/primitives/{handlers.ts,openapi.ts}`, `packages/service/src/auth/contract/contract-procedure-index.ts`, `packages/sdk/src/{openapi/helpers.ts,internal/client-contributions/stable-v1-adapter.ts}` | `TracingPlugin`, `createOpenAPIHandler`, `createOpenAPISpec`, `createContractAuthorizer` | Swap `@orpc/opentelemetry` & `@orpc/json-schema`; migrate `contract-procedure-index.ts` onto native v2 `RPCMatcher` + `OpenAPIMatcher` (aligned with RFC A B3). |
| **15** | **OpenAPI spec defaults to `3.2.0` and generator options move under `base`** | `packages/service/src/primitives/openapi.ts`, `packages/sdk/src/openapi/helpers.ts` | `/api/openapi.json` output & Scalar docs UI | Verify Scalar (`@scalar/api-reference`) compatibility with OpenAPI `3.2.0` (or explicitly set `specVersion` / `base` options) and update OpenAPI snapshot tests. |
| **16** | **Event-stream keep-alive interval increases from `5 s` to `15 s`** | `plugins/{workers,sagas,triggers,ai}` `eventIterator` SSE streams | Proxy/load-balancer idle timeouts & SSE keep-alive tests | Audit idle timeouts on proxies/tests expecting ≤5 s heartbeats; configure explicit keep-alive if shorter intervals are required. |

### 3. Throwaway `2.0.0-beta.53` prototype & v1 `1.16.5` verification (**measured**)

#### 3.1 Throwaway `2.0.0-beta.53` fallout (summary in `evidence/v2-beta53-prototype-summary.md`; throwaway worktree removed)

- **Raw vs deduplicated counts (B8):** Across all 13 target groups, `deno check --unstable-kv` emitted **411 raw diagnostics** (plus **37** in `packages/cli/bin/netscript.ts`). Because each target group transitively re-checked shared dependencies (`contract-primitives.ts`, `base-contract.ts`, `handlers.ts`), the raw total double-counts transitive files. Independently verified across the **11 core & plugin-core package groups**: **186 raw diagnostics deduplicate to 99 unique sites across 25 files**, of which roughly half (51+ sites across the 5 `plugin-*-core` contracts alone) are `.route()` calls eliminated by a single `@orpc/openapi/extensions/route` import (**measured**: workers 31→9, triggers 20→9, sagas 17→9). We explicitly drop the Round-0 ">60%" estimate in favor of these exact counts.
- **Runtime `--no-check` crashes:** `contracts` (5/23 failed: `oc.$meta is not a function`), `logger` (4/5 failed: `reading 'routingInterceptors'` from `void` `init`), `fresh` desktop (0/1 failed: `isContractProcedure` missing), and module-load failures across `telemetry`/`service`/`sdk`/`plugin` (`@orpc/otel` removed, `ORPCError` missing from `@orpc/contract`, `@orpc/zod/zod4` `ERR_PACKAGE_PATH_NOT_EXPORTED`, `fallbackContractConfig` missing).

#### 3.2 v1 `1.16.5` baseline verification (**measured**)

Because `1.16.6` (published 2026-11-25) is blocked on publication day by Deno's `minimumDependencyAge` policy, Phase 0a targets **`1.16.5`** (or `1.16.6` once past the age gate). Measured on `1.16.5`:
- `deno check`: **exit 0** across 9 package groups.
- `deno test`: `contracts` **29/0**, `logger` **5/0**, `telemetry` **68/0**, `service` **370/0**, `sdk` **192/3** (the 3 failures are strictly the frozen React fixture lockfile, which must be refreshed in the same PR).

### 4. Decided designs for blockers B1, B2, B3, B6, B7 & staged migration strategy (**derived**)

#### 4.1 Phase 0 split: Safe to start (`0.0.10`) vs Held until revised

| Phase | Target release | Items | Backward-compatible? |
| --- | --- | --- | --- |
| **Phase 0a (Safe to start once authorized)** | **`0.0.10`** (`@orpc/*@^1.16.5`) | 1. **Catalog consolidation (N5):** Move all 11 workspace `deno.json` manifests + `packages/cli/e2e/fixtures/desktop-native/deno.json` + workspace-internal inline pins (`service-query-utils-upstream_type.ts`, `client-contribution-observability_test.ts`, `installation-provisioning_test.ts`) onto `catalog:`. Update the two isolated temp-directory e2e lock tests (`locked-probes_test.ts:12,22`, `install-generated-probe_test.ts:12,46` — which run outside the workspace where `"catalog:"` cannot resolve) to read an active locked `@orpc/client` entry from root `deno.lock` before pruning stale `1.15.0` entries. Add a package-prefix scope flag (e.g., `--fail-on-package-prefix=@orpc/`) to `.llm/tools/deps/scan-npm-catalog-compliance.ts` so CI fails strictly on `@orpc/*` catalog regressions without tripping on unrelated pre-existing warnings.<br>2. **v1 `1.16.5` bump** (refreshing React fixture frozen lock so `sdk` 195/0 passes).<br>3. **Move `ORPCError` imports off `@orpc/contract`** to `@orpc/client` / `@orpc/server` (same runtime class on `1.15.5`/`1.16.5`).<br>4. **Handler plugin prep + real-`RPCHandler` behavior tests (N2):** Add `name` + return `options` in `LoggingPlugin`, `TracingPlugin`, `ErrorHandlingPlugin`, `ServiceHandlerPlugin`, routing root interceptor registration through a shared NetScript helper (`attachRootHandlerInterceptor`) that **keeps attaching to `rootInterceptors` on v1** (switching to `routingInterceptors` only at `0.1.0`, since v1 ignores `routingInterceptors`), and update `packages/telemetry/tests/orpc/plugin_test.ts:101` to mount plugins in a **real `RPCHandler`** (not `{}`).<br>5. **Additive error helpers:** Add `getErrorHttpStatus(error)` (explicitly documenting `undefined` on MessagePort/router-client) and relax `DefinedErrorLike` in `packages/sdk/src/client/errors.ts` so `status` is optional.<br>6. **Server-only protocol readiness (N1):** Auto-include `X-NetScript-RPC-Protocol` in `withCors({ allowHeaders })` (`packages/service/src/middleware/service-cors.ts:23`), mount v1's reverse `426` guard rejecting `orpc-v2` (explicitly **exempting `OPTIONS`**), and append `Vary: X-NetScript-RPC-Protocol` on `200` and `426` responses. **SDK `RPCLink` emits NO new header by default in `0.0.10`** (zero new CORS preflights, zero breakage on external gateways, `OMITTED_CONTRIBUTION_BASELINE` untouched).<br>7. **Redirect guard (B7):** Enforce `redirect: 'error'` after `...init` spread in `http-client-link.ts` + foreign-origin 307 test (consistent with PR #2659). | **Yes** (except explicit redirect refusal on misrouted 3xx RPC calls, which previously resolved silently as `undefined`). |
| **Phase 0b (Held until revised / accepted)** | **`0.0.11`** (additive) / **`0.1.0`** (breaking) | 1. **TanStack Query aliases (B5, `0.0.11`):** Add `streamedKey`, `streamedOptions`, `liveKey`, `liveOptions`, `fnOptions` (exact v2 names!) alongside deprecated `experimental_*` once accepted.<br>2. **Browser-safe contract helpers (B6 + N4, `0.0.11`):** Export server-free `routeMeta(...)` / `getRouteMeta`, `accessMeta(...)` / `getAccessMeta` (key `'access'`), `policyMeta(...)` / `getPolicyMeta` (key `'policy'`), and `defineContractErrors(...)` from `@netscript/contracts` (v1 shims returning `{ access }` / `{ policy }` / route descriptors on `0.0.11`, swapping to `defineMeta` at `0.1.0`).<br>3. **RFC A Stage 1b (`0.0.11`):** Held pending RFC A (`#2673`) acceptance.<br>4. **Breaking security tightenings held strictly for `0.1.0`:** Implicit `CORSPlugin` removal in `handlers.ts` + opt-in `RPCHandlerConfig.cors` (B3), and v2 SDK `X-NetScript-RPC-Protocol: orpc-v2` header emission (N1). | Additive aliases in `0.0.11`; breaking items strictly in `0.1.0`. |
| **Phase 1 (Maintained shadow branch & CI)** | Continuous during v2 beta / RC | Maintain a dedicated **`chore/orpc-v2-shadow`** branch (owned by framework maintenance rotation, rebased weekly and on every Phase 0 merge onto `main`) carrying the v2 code adaptations. A non-blocking weekly + `workflow_dispatch` GitHub Actions job checks out `chore/orpc-v2-shadow`, resolves the latest `@orpc/*@2.0.0-beta.x`/`rc` ephemerally (never mutating `main`'s `deno.lock`), and runs `deno check`, unit suites, and `probes/v2-behavior-probes.ts`. | Isolated from `main`. |
| **Phase 2 (Coordinated v2 GA cut-over)** | **`0.1.0`** (`@orpc/*@^2.0.0` GA) | Merge `chore/orpc-v2-shadow` once **every Phase 2 gate** is green: (1) `@orpc/*@2.0.0` stable GA published and past Deno's dependency-age gate; (2) `chore/orpc-v2-shadow` rebased onto `main` passes `deno task check`, `deno task test`, `deno task lint`, CLI e2e scaffold gates, and all B1–B7 + N1–N4 behavior probes on `2.0.0` GA. Ship new `netscript migrate orpc-v2` CLI command + RFC A Stage 2 (`createRouterClientTransport`). | **Breaking** (`0.1.0`). |

#### 4.2 Blocker B1 + N1 decision: Mixed v1/v2 RPC protocol guard, CORS preflight compatibility & non-atomic client rollout (**measured** Probe B1)

- **Two-step CORS-safe rollout (`X-NetScript-RPC-Protocol`):**
  - **Phase 0a (`0.0.10`, server-only — zero breaking CORS preflights!):**
    1. `withCors()` (`packages/service/src/middleware/service-cors.ts:23`) automatically appends `'X-NetScript-RPC-Protocol'` (case-insensitively deduplicated) whenever an explicit `allowHeaders` array is configured, preparing NetScript services ahead of `0.1.0`.
    2. v1 `RPCHandler` mounts the reverse protocol guard rejecting `orpc-v2` with HTTP `426` (`CLIENT_PROTOCOL_UNSUPPORTED`), **explicitly exempting `OPTIONS`**, and appending `Vary: X-NetScript-RPC-Protocol` on BOTH `200` (especially `GET`) and `426` responses.
    3. **SDK `RPCLink` does NOT emit `X-NetScript-RPC-Protocol: orpc-v1` by default in `0.0.10`** — preserving zero-preflight cross-origin `GET` simple requests on v1, avoiding breakage against external gateways / un-upgraded services with explicit `allowHeaders`, and keeping `OMITTED_CONTRIBUTION_BASELINE` (`packages/sdk/tests/integration/client-contribution-adapter_test.ts:25-30,389-406`) unchanged in `0.0.10`.
  - **Phase 2 (`0.1.0`, breaking wire & CORS shift):**
    1. v2 SDK `RPCLink` unconditionally emits `X-NetScript-RPC-Protocol: orpc-v2` (explicitly documented as a `0.1.0` breaking change: cross-origin browser `GET` RPC queries now trigger a CORS `OPTIONS` preflight, external reverse proxies/gateways with explicit `Access-Control-Allow-Headers` must allow `X-NetScript-RPC-Protocol`, and `OMITTED_CONTRIBUTION_BASELINE` in `client-contribution-adapter_test.ts` is updated at `0.1.0`).
    2. Both `withCors()` (`service-cors.ts:23`) and opt-in `RPCHandlerConfig.cors` (`CORSHandlerPlugin`) automatically include `'X-NetScript-RPC-Protocol'` whenever explicit `allowHeaders` is configured.
    3. v2 services enforce `X-NetScript-RPC-Protocol: orpc-v2` before `RPCHandler` decodes the request, **explicitly exempting `req.method === 'OPTIONS'`** (so browser CORS preflights pass through to `withCors()` / `CORSHandlerPlugin` and return **`204`**, never `426` — verified failing-then-passing in Probe B1!). Any `'orpc-v1'` or **missing** header (all v1 clients, open browser tabs, cached island bundles, un-upgraded desktop apps) fails closed immediately with HTTP **`426 Upgrade Required`** (`{ code: 'CLIENT_UPGRADE_REQUIRED', expectedProtocol: 'orpc-v2', receivedProtocol }`), and **both `200` (including `GET`) and `426` responses emit `Vary: X-NetScript-RPC-Protocol`** so CDN/proxy caches never mix v1 and v2 responses.
- **Multi-service & installed-client rollout order:**
  1. Deploy **Phase 0a (`0.0.10`)** on services first so `withCors()` allows `X-NetScript-RPC-Protocol` and v1 handlers reject `orpc-v2` cleanly with `426`.
  2. For single-workspace / lockstep deployments: deploy `0.1.0` servers and web bundles together; stale browser tabs (sending no header) hit `426` and reload cleanly.
  3. For multi-service or installed desktop/mobile deployments that cannot upgrade all callers simultaneously: **drop** the unworkable dual-major `/api/rpc/v2` in-process mount. Instead use either: (a) **gateway header routing** (`X-NetScript-RPC-Protocol: orpc-v2` → v2 green pool; absent/`orpc-v1` → v1 blue pool until v1 traffic drains to zero — requires zero custom header from v1 clients!), or (b) the empirically verified **`OpenAPILink` v1 → `OpenAPIHandler` v2 bridge** (proven in Probe B1 for JSON-safe procedures—strictly limited to JSON-representable types, no `BigInt` or RPC-only event metadata).

#### 4.3 Blocker B2 + N3 decision: Contract-declared `GET` allow-list, full HTTP-verb parity & paired `allowGetRpc: false` client contract (**measured** Probe B2)

- **Server `allowMethods` preserving `PUT`/`PATCH`/`DELETE`/`HEAD→GET` (N3):** Keep `GET`-first RPC queries for procedures explicitly declaring `method: 'GET'` or `method: 'HEAD'` in contract OpenAPI/route metadata **while preserving v2's `RPC_DEFAULT_ALLOW_METHODS` (`POST`, `PUT`, `PATCH`, `DELETE`)** so CRUD `PATCH` (`update`) and `DELETE` (`delete`) (`packages/contracts/crud/create-crud-contract.ts:367-378`, `workers.contract-definition.ts:534`) continue working identically:
  ```ts
  const DEFAULT_WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  allowMethods: (method, proc) => {
    if (DEFAULT_WRITE_METHODS.has(method)) return true;
    if (method === 'GET') {
      const declared = getOpenAPIMeta(proc)?.method;
      return declared === 'GET' || declared === 'HEAD';
    }
    return false;
  }
  ```
  Paired with `GetMethodCsrfProtectionHandlerPlugin`, this preserves all 52 first-party `GET` procedures, CRUD `PATCH`/`DELETE`, `HEAD→GET`, `DedupeRequestsPlugin`, `force-cache` / `default` cache groups, and HTTP/CDN caching.
- **Exact v1-parity replacement for `inferRPCMethodFromContractRouter` (N3):** Replace with a small NetScript helper in `packages/sdk/src/internal/transport-policy.ts` reading `getOpenAPIMeta(procedureNode)?.method`: maps `'HEAD' → 'GET'` (preserving `packages/sdk/tests/transport-policy_test.ts:35`), preserves `'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'`, and defaults omitted/other methods to `'POST'` (verified in Probe B2).
- **Measured CSRF matrix (Probe B2):**
  - `GET` on a `POST` mutation → `matched: false` (404).
  - `PUT` / `PATCH` / `DELETE` and `HEAD→GET` on matching procedures → `200`.
  - Server-to-server `GET` (no `Sec-Fetch-Site`) → `200`.
  - Same-origin / same-site browser `GET` → `200`.
  - Cross-site browser `fetch()` with full Fetch Metadata (`Sec-Fetch-Site: cross-site`, `Sec-Fetch-Mode: cors`, `Sec-Fetch-Dest: empty`) → **`200`** (governed by `withCors()` allowlist).
  - Cross-site `GET` with **missing `Sec-Fetch-Mode` or `Sec-Fetch-Dest`** OR top-level navigation (`Sec-Fetch-Mode: navigate`, `Sec-Fetch-Dest: document`) → **`403 FORBIDDEN`**.
- **Mandatory security prerequisite & paired client opt-out (N3):** GET-enabled RPC endpoints require session cookies marked `SameSite=Lax` or `SameSite=Strict`. Services that must accept cross-site `SameSite=None` cookies MUST set `allowGetRpc: false` (`POST`/`PUT`/`PATCH`/`DELETE` only) on `createService` / `RPCHandlerConfig` **AND pair every SDK client calling `GET`-declared procedures on that service with `createServiceClient({ ..., transportPolicy: { method: () => 'POST' } })`** (or use a `POST`-only RPC contract without `method: 'GET'`), because without the paired client override the SDK infers `GET` from the contract and hits `404` (`matched: false`, verified in Probe B2!).

#### 4.4 Blocker B3 decision: Preserving v1 CORS in Phase 0a; breaking tightening at `0.1.0`

- **Phase 0a (`0.0.10`):** Keep `new CORSPlugin()` in `packages/service/src/primitives/handlers.ts:112` untouched on v1 so `cors-response-authority_test.ts` (including standalone `createRPCHandler`/`createOpenAPIHandler` origin reflection) stays 100% green and backward-compatible. `withCors()` (`service-cors.ts:23`) auto-includes `X-NetScript-RPC-Protocol` when `allowHeaders` is explicitly configured.
- **Phase 2 (`0.1.0`, breaking security tightening):** Remove implicit handler-level CORS from `createRPCPlugins()` by default (never relying on v2's deprecated `CORSPlugin` alias, which silently answers `*` with no `Vary: Origin`). Services built with `createService` configure `withCors()` (`NETSCRIPT_CORS_ORIGINS`); standalone `createRPCHandler()` / `createOpenAPIHandler()` callers needing CORS pass explicit `cors: { origin: [...], allowHeaders?: [...] }` on `RPCHandlerConfig` (automatically including `X-NetScript-RPC-Protocol` when explicit `allowHeaders` is provided).

#### 4.5 Blocker B7 decision: `redirect: 'error'` enforced after spread (**measured** Probe B7)

- **Decision:** Enforce **`redirect: 'error'`** (NOT `'manual'`, which silently resolves with `undefined`) applied **after** spreading `...init` at the single HTTP link fetch call in `packages/sdk/src/client/http-client-link.ts:192`:
  ```ts
  return await transportFetch(request, {
    ...init,
    headers,
    cache: context?.cache as RequestCache,
    signal: context?.signal,
    redirect: 'error',
  });
  ```
- **Contract & parity:** Misrouted 3xx responses reject with a network `TypeError` (consistent with PR #2659's explicit redirect refusal), and foreign 307 targets receive **zero requests** (preventing leakage of custom headers such as `x-api-key`, `traceparent`, and request bodies, as well as cross-origin response spoofing—noting Deno's Fetch already strips `Authorization` and `Cookie` on cross-origin hops).

#### 4.6 `release/orpc-v1` version scheme & rollback (B8)

- **Version scheme under `0.0.x`:** Phase 0a ships as **`0.0.10`**, Phase 0b ships as **`0.0.11`**, and Phase 2 cuts over to **`0.1.0`** (new semver minor line on JSR), leaving `release/orpc-v1` on the **`0.0.x`** line (**`0.0.12+`**) for **90 days** after `0.1.0` GA. Downstream applications pinned to `^0.0.10` automatically resolve v1 security backports (`0.0.12+`) without colliding with `0.1.x`!
- **Rollback:** Before publishing `0.1.0`, revert the cut-over merge (single atomic revert via `catalog:`). After publishing `0.1.0`, backport critical fixes to `release/orpc-v1` (`0.0.12+`) during the 90-day overlap window.

### 5. Interaction with companion RFC A (PR #2673 / issue #2671)

- **RFC A Stage 1a (`0.0.10`, head `bd8d51c0`):** Independent of v2; unblocks PR #2659 and ships unified `requestId`, per-leaf + context-symbol idempotent router wrapping, and declarative `withProcedureRateLimit` (with `ResponseHeadersPlugin`), while **also keeping `CORSPlugin` untouched on v1** (fully aligned with RFC B §4.4!).
- **RFC A Stage 1b (`0.0.11`, gated on RFC A acceptance):** Retains `contract-procedure-index.ts` at the HTTP edge on v1 to preserve 401/403-before-413 and 404/410 parity, and migrates at **Phase 2 (`0.1.0`)** onto oRPC v2's native `RPCMatcher` (`@orpc/server/standard`) + `OpenAPIMatcher` (`@orpc/openapi/standard`) + `getOpenAPIMeta` (eliminating the 4 removed v1 helpers without weakening HTTP edge guards).
- **RFC A Stage 2 (`0.1.0`)** ships with RFC B Phase 2 so downstream applications adopt `createRouterClientTransport` and oRPC v2 in one release, with the per-leaf `WRAPPED_PROCEDURE_SERVICE` + per-invocation `PIPELINE_EXECUTED_SYMBOL` guards protecting against v2's middleware-dedup removal.

## Downstream consumers

> All downstream impact analysis below applies generically to any downstream application built on NetScript.

### Public API, behavior changes, and deprecations

- **Phase 0a (`0.0.10`, safe on v1):** Additive `getErrorHttpStatus(error)` (returns `undefined` for MessagePort and in-process router-client errors), relaxed `DefinedErrorLike` (optional `status`), server-only `X-NetScript-RPC-Protocol` readiness (`withCors` auto-`allowHeaders`, v1 `OPTIONS`-exempt reverse `426` guard, `Vary` on `200`/`426`; **zero new client header**), `redirect: 'error'` on `http-client-link.ts`, and `name` + return-based `ServiceHandlerPlugin` keeping `rootInterceptors` attachment behind a NetScript helper seam. Deprecated: importing `ORPCError` from `@orpc/contract`.
- **Phase 0b (`0.0.11`, additive aliases):** `streamedKey`, `streamedOptions`, `liveKey`, `liveOptions`, `fnOptions` on `ServiceQueryUtils`; server-free `routeMeta(...)`, `accessMeta(...)`, `policyMeta(...)`, and `defineContractErrors(...)` in `@netscript/contracts`.
- **Phase 2 (`0.1.0`, breaking):** Removes `oc.$meta`, `.route()` on `@netscript/contracts` builders (replaced by server-free `.meta(routeMeta(...))`, with `@orpc/openapi/extensions/route` available only as an optional server-side transitional import), `ErrorMapItem.status`, `ORPCError.status`, `experimental_streamed*`/`live*`, `queryFnOptions`, `refetchMode: 'replace'`, `@orpc/otel`, `@orpc/zod/zod4`, `ZodSmartCoercionPlugin`, `customJsonSerializers`, and implicit handler `CORSPlugin` (breaking security tightening with opt-in `RPCHandlerConfig.cors`). Emits `X-NetScript-RPC-Protocol: orpc-v2` on SDK `RPCLink` (triggering CORS `OPTIONS` preflight on cross-origin browser `GET` RPC queries and updating `OMITTED_CONTRIBUTION_BASELINE`) and enforces `426` on mismatch (`OPTIONS` exempt, `Vary` on `200` and `426`).

### Generated code and CLI scaffold changes

- Phase 0a moves workspace `deno.json` manifests and plugin templates onto `catalog:`, updates `@orpc/*` to `^1.16.5`, and updates isolated temp-dir e2e probes (`locked-probes_test.ts`, `install-generated-probe_test.ts`) to read an active locked `@orpc/client` entry instead of stale `1.15.0`.
- Phase 2 updates CLI templates (`packages/cli/src/kernel/assets/*`, `embedded.generated.ts`) to emit `@orpc/opentelemetry`, `@orpc/json-schema`, root `@orpc/zod`, `routeMeta(...)`, `accessMeta(...)`, `policyMeta(...)`, `defineContractErrors(...)`, and `streamedOptions`/`liveOptions`.

### Migration steps & new `netscript migrate orpc-v2` codemod

- `netscript migrate` does not exist today; Phase 2 introduces **`netscript migrate orpc-v2`** (`--dry-run` / `--apply`).
- **Automated rewrites:** `@orpc/otel` → `@orpc/opentelemetry`; `@orpc/zod/zod4` → `@orpc/zod`; `.route({ ... })` → `.meta(routeMeta({ ... }))`; `.meta({ access: ... })` → `.meta(accessMeta(...))`; `.meta({ policy: ... })` → `.meta(policyMeta(...))`; inline literal `.errors({ CODE: { status, ... } })` → `defineContractErrors(...)`; `experimental_streamedKey`/`Options` → `streamedKey`/`Options`; `experimental_liveKey`/`Options` → `liveKey`/`Options`; `queryFnOptions` → `fnOptions`; `error.status` → `getErrorHttpStatus(error)` (flagging MessagePort/router-client call sites); `deno.json` catalog pins.
- **Explicit codemod limits (flagged with `TODO(orpc-v2)` for manual review):**
  1. Cannot reliably disambiguate server vs client modules when retargeting `import { ORPCError } from '@orpc/contract'` (defaults to `@orpc/client` in client/shared modules and flags ambiguous files).
  2. Cannot statically split computed/dynamic error maps where `status` is assembled at runtime.
  3. Cannot auto-rewrite `refetchMode: 'replace'` (must convert to a custom buffering `queryFn`), `.callable()` (opt into `@orpc/server/extensions/callable` or switch to `call`/`createRouterClient`), `.concat()` → `.use()`, standalone `createRPCHandler()` callers requiring explicit `cors` options, or paired client `transportPolicy: { method: () => 'POST' }` when a service sets `allowGetRpc: false`.
- **Acceptance corpus:** Every codemod PR must pass cleanly (zero manual fixes, full `deno task check && deno task test`) against (1) a freshly scaffolded `netscript init` application and (2) the first-party commerce & AI showcase apps.

### Configuration changes

- `deno.json`: Swap `@orpc/otel` → `@orpc/opentelemetry`, add `@orpc/json-schema`, bump `@orpc/*` catalog to `^2.0.0`. `packages/contracts/deno.json` keeps strictly `@orpc/contract` and `zod` (zero `@orpc/server` or `@orpc/openapi` runtime dependency!).
- `createService` / `RPCHandlerConfig`: Supply `errorStatusMap` (auto-merged from `defineContractErrors` + standard codes with unconditional `500` default for unmapped codes, forwarded to `TracingPlugin`, `LoggingPlugin`, and `ErrorHandlingPlugin`); pass explicit `cors` only for standalone `createRPCHandler()`/`createOpenAPIHandler()` mounts outside `createService`; set `allowGetRpc: false` (paired with client `transportPolicy: { method: () => 'POST' }`) if a service requires `SameSite=None` cross-site cookies; allow `X-NetScript-RPC-Protocol` in any external reverse proxy / API gateway CORS `Access-Control-Allow-Headers` policy at `0.1.0`.
- *(Correction from Round 0: `createServiceClient` has no public custom `fetch` option—`HttpClientLinkOptions.fetch` is a private test seam in `packages/sdk/src/client/http-client-link.ts:66`—so downstream applications have no public custom `fetch` hook to migrate.)*

### Security implications

1. **CORS boundary & preflight safety (B3 + N1):** Permissive origin reflection already exists on v1 for services omitting `withCors()` and standalone handlers (`cors-response-authority_test.ts:442-480`). On v2 the deprecated `CORSPlugin` alias silently degrades to `*` with no `Vary: Origin`. Removing implicit handler CORS in `0.1.0` tightens security explicitly while giving standalone mounts an explicit `cors` option, auto-including `X-NetScript-RPC-Protocol` in explicit `allowHeaders` lists, and exempting `OPTIONS` from the `426` guard.
2. **Redirect SSRF & header/body leakage (B7):** Enforcing `redirect: 'error'` after `...init` spread in `http-client-link.ts` prevents v2's default redirect-following from leaking custom headers (`x-api-key`), `traceparent`, and request bodies to foreign 307 targets or accepting spoofed responses.
3. **GET RPC CSRF policy (B2 + N3):** Contract-declared `GET`/`HEAD` allow-list + `GetMethodCsrfProtectionHandlerPlugin` blocks cross-site top-level navigations and partial Fetch Metadata headers while keeping `POST`/`PUT`/`PATCH`/`DELETE` mutations non-GET; requires `SameSite=Lax|Strict` cookies (or `allowGetRpc: false` paired with client `transportPolicy: { method: () => 'POST' }` for `SameSite=None`).
4. **Protocol mismatch protection (B1 + N1):** Fail-closed `426` on `X-NetScript-RPC-Protocol` mismatch (`OPTIONS` exempt, `Vary` on `200` and `426`) prevents silent `bigint`/error corruption across mixed-version clients and servers without forcing CORS preflights in `0.0.10`.

### Compatibility window

- Phase 0a (`0.0.10`) and Phase 0b (`0.0.11`) run on the `0.0.x` / oRPC v1 (`^1.16.5`) line for at least **60 days** before `0.1.0` GA.
- After `0.1.0` ships, `release/orpc-v1` remains supported on `0.0.12+` for **90 days** for security and critical bug backports.

## Drawbacks

1. Maintaining `chore/orpc-v2-shadow` across beta releases incurs a small weekly rebase cost for the framework maintenance rotation.
2. Migrating `.route(...)` → `.meta(routeMeta(...))` touches contract declarations at `0.1.0` (automated by `netscript migrate orpc-v2`), whereas the optional `@orpc/openapi/extensions/route` shortcut pulls `@orpc/server` into runtime graphs and relies on side-effect import order.
3. Emitting `X-NetScript-RPC-Protocol: orpc-v2` at `0.1.0` adds a browser CORS `OPTIONS` preflight to cross-origin unauthenticated `GET` RPC queries (mitigated by `Access-Control-Max-Age` preflight caching and automatic `allowHeaders` wiring in `withCors()` / `RPCHandlerConfig.cors`; zero preflight impact in `0.0.10`).

## Rationale and alternatives

| Decision area | Alternative considered | Verdict & rationale |
| --- | --- | --- |
| **Cut-over timing** | Cut over immediately to `2.0.0-beta.53`, OR wait passively for GA and rewrite at once | **Rejected** — beta still has breaking churn (#2523/#2533); passive waiting leaves silent traps unaddressed. Staged Phase 0a/0b → shadow branch → `0.1.0` GA is safest. |
| **Contract `.route()` & metadata migration (B6 + N4)** | Invent NetScript-only `.use(withHttpRoute(...))` (Round 0 — **invalid**) OR import `@orpc/openapi/extensions/route` inside `@netscript/contracts` (Round 1 — pulls `@orpc/server` into browser bundles & misses `import type` / direct `oc` callers!) | **Adopted server-free `routeMeta` + `accessMeta` (`'access'`) + `policyMeta` (`'policy'`) via `@orpc/contract` `defineMeta`** — keeps `packages/contracts/deno.json` strictly on `[@orpc/contract, zod]` (browser-safe, passes `procedure-meta-independence_test.ts` and JSR `--isolatedDeclarations`), aligns exact `.meta.access`/`.meta.policy` keys, and works natively with `getOpenAPIMeta` and `OpenAPIGenerator`. `@orpc/openapi/extensions/route` remains documented only as an optional server-only transitional opt-in. |
| **GET-first RPC & HTTP verbs (B2 + N3)** | Switch all RPC calls to `POST`-only, OR restrict to `POST`+`GET` only (breaking CRUD `PATCH`/`DELETE` & `HEAD→GET`) | **Adopted `POST`/`PUT`/`PATCH`/`DELETE` + contract-declared `GET`/`HEAD` allow-list + CSRF plugin** (with paired `allowGetRpc: false` + client `transportPolicy: { method: () => 'POST' }` for `SameSite=None`) — preserves 52 first-party GET procedures, CRUD `PATCH`/`DELETE`, `HEAD→GET`, `DedupeRequestsPlugin`, and `force-cache` groups. |
| **Mixed-version RPC & CORS (B1 + N1)** | Dual-major `/api/rpc/v2` mount in one process, OR emitting `orpc-v1` unconditionally in `0.0.10` (breaking `withCors({ allowHeaders })` & triggering `GET` preflights on v1) | **Adopted server-only `0.0.10` readiness + `0.1.0` `orpc-v2` header + `OPTIONS`-exempt `426` guard + `Vary` on `200`/`426`** + blue-green gateway routing (`orpc-v2` → v2 pool, absent → v1 pool) / verified JSON-only `OpenAPILink` bridge. |

## Breaking changes and migration

Labeled `breaking` because `0.1.0` (Phase 2) upgrades to `@orpc/*@^2.0.0`, removes implicit handler `CORSPlugin`, changes RPC wire protocol (v2 client emits `X-NetScript-RPC-Protocol: orpc-v2` triggering cross-origin `GET` preflights; v2 handlers fail closed `426` exempting `OPTIONS`), and drops v1-only contract/error/query/package surfaces. Phase 0a (`0.0.10`) is backward-compatible except refusing misrouted 3xx RPC redirects (`redirect: 'error'`). See `## Downstream consumers` and §4 for the full split plan, codemod limits, and 90-day `0.0.12+` maintenance window.

## Prior art

- **oRPC v1→v2 migration guide:** <https://orpc.dev/docs/migrations/from-v1> (read in full, covering up to `2.0.0-beta.53`).
- **Accepted RFC 0001** (`rfcs/0001-sdk-client-contributions.md`) — adapter boundary keeping raw oRPC classes off NetScript's public surface.
- **Companion RFC A** (draft PR #2673, head `bd8d51c0`, tracking issue #2671) — oRPC-native procedure pipeline & router client (aligned on `CORSPlugin` deferral to `0.1.0` and v2 `RPCMatcher`/`OpenAPIMatcher`).
- **Draft PR #2659** (`rfcs/0000-in-process-service-link.md`, head `f8c8d8fd`) — in-process fetch-link sharing the `redirect: 'error'` and v2 `fetch(url, init)` alignment.

## Unresolved questions

1. **Contract metadata `~openapi` key stability across oRPC v2 beta → GA:** `deno publish --dry-run` (`--isolatedDeclarations`) has already been verified passing on `2.0.0-beta.53` with explicit `defineMeta` / `BaseContractRoute` annotations, and `routeMeta` via `defineMeta('~openapi', ...)` keeps `@netscript/contracts` free of `@orpc/server`. Verify in Phase 1 (`chore/orpc-v2-shadow`) that oRPC `2.0.0` GA preserves `'~openapi'` as the public `openapi` meta key (or adopt an official browser-safe `@orpc/openapi/meta` subpath if upstream splits it out before GA).
2. **Scalar UI compatibility with OpenAPI `3.2.0`:** Verify in Phase 1 whether NetScript's bundled `/api/docs/scalar.js` renders OpenAPI `3.2.0` documents cleanly or requires pinning `3.1.0` in `OpenAPIGenerator` options.
3. **`@netscript/sdk/client` `safe()` tuple index 2 at `0.1.0`:** Decide whether `@netscript/sdk/client`'s `safe()` retains `isDefined: boolean` permanently alongside adding `definedError`, or aligns tuple index 2 with upstream oRPC v2 (`definedError | null`) at `0.1.0`.

## Future possibilities

- Evaluating oRPC v2's `TimeoutHandlerPlugin`, `RequestCompressionHandlerPlugin` / `ResponseCompressionHandlerPlugin`, and `SignalSyncHandlerPlugin` post-`0.1.0`.
- Adopting `@orpc/tanstack-query` v2 `StreamQuerySSRUtilsPlugin` and `createHydrationOptions` inside `@netscript/fresh`.
