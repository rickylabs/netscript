# oRPC `2.0.0-beta.53` Prototype & v1 `1.16.5` Fallout Summary (Historical `87965d800` Snapshot)

> **Historical baseline note (2026-11-26):** Sections 1–5 below record the original throwaway `2.0.0-beta.53` prototype and v1 `1.16.5` verification measured on 2026-11-25 against `main` `87965d800` (Deno `2.9.5`, `@orpc/*@^1.15.5`). On current `origin/main` (`00325a531`), `#2689` pinned Deno `2.9.8` and `#2690` landed `@orpc/*@^1.16.6` (with fixture lock refreshes, while retaining stale `1.15.0` entries in root `deno.lock`). Live Round-3 behavior probes (`probes/v2-behavior-probes.ts`) are verified on Deno `2.9.8` against `@orpc/*@1.16.6` vs `2.0.0-beta.53`.

- **Prototype date:** 2026-11-25
- **Base commit (`main`):** `87965d800b7d61312e8612c82bdb0cb98bdf5b29`
- **Target versions tested (historical):** `@orpc/*@2.0.0-beta.53` (published 2026-11-23), `@orpc/*@1.15.5` (historical locked baseline), and `@orpc/*@1.16.5` (v1 target before `#2690` landed `1.16.6`).
- **Runtime:** Deno `2.9.5`, TypeScript `6.0.3` (from workspace `.mise.toml`).
- **Workspace hygiene:** Executed in a throwaway detached git worktree, then deleted via `git worktree remove --force`. Zero dependency or lockfile changes were committed to `main` or either RFC branch.

## 1. Throwaway Manifest Diff Summary (`2.0.0-beta.53`)

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

Manifest/lockfile findings verified via `.llm/tools/deps/scan-npm-catalog-compliance.ts`:
- 11 workspace `deno.json` manifests + `packages/cli/e2e/fixtures/desktop-native/deno.json` + inline specifiers in `packages/cli/e2e/src/application/gates/scaffold/{install-generated-probe_test.ts,locked-probes_test.ts,prepare-flow-b-fixture.ts}`, `packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts`, `packages/sdk/tests/client-contribution-observability_test.ts`, and `packages/cli/src/kernel/templates/aspire/helpers/tests/installation-provisioning_test.ts` bypass root `catalog:`.
- Root `deno.lock` contains stale `1.15.0` entries for `@orpc/client` and `@orpc/tanstack-query` with no remaining dependent, emitting a peer-dependency warning during `deno install`.

## 2. Exact `deno check --unstable-kv` Commands, Raw Counts, and Unique Sites (`2.0.0-beta.53`)

Each row below was executed with `mise exec -- deno check --unstable-kv <entry points>` inside the throwaway worktree. Because groups share transitive dependencies (`contract-primitives.ts`, `base-contract.ts`, `handlers.ts`), raw diagnostics double-count transitive errors. Across the first **11 core & plugin-core groups** (186 raw diagnostics, independently reproduced in Round-1 evaluation), deduplication yields **99 unique diagnostic sites across 25 unique files**, roughly half of which are `.route()` calls eliminated by importing `@orpc/openapi/extensions/route` (workers 31→9, triggers 20→9, sagas 17→9).

| # | `deno check --unstable-kv` entry points | Exit | Raw diagnostics | Files in output | Dominant root causes |
| ---: | --- | ---: | ---: | ---: | --- |
| 1 | `packages/contracts/mod.ts packages/contracts/crud/create-crud-contract.ts packages/contracts/src/application/command-contract.ts` | 1 | 7 | 2 | `ContractProcedureBuilderWith*` → `ContractBuilderWith*`; `ContractBuilder<TErrorMap>` arity 4→1; `oc.$meta` removed. |
| 2 | `packages/telemetry/src/orpc/tracing-plugin.ts packages/telemetry/src/orpc/error-plugin.ts` | 1 | 2 | 2 | `@orpc/otel` removed; `ORPCError` removed from `@orpc/contract`. |
| 3 | `packages/logger/orpc-plugin.ts packages/logger/tests/orpc-plugin_test.ts` | 1 | 1 | 1 | `HandlerPlugin` extends `OrderablePlugin` (`name` required); `void` `init` + `rootInterceptors` rename not caught structurally! |
| 4 | `packages/service/mod.ts packages/service/src/auth/mod.ts packages/service/src/rate-limit/mod.ts` | 1 | 20 | 7 | `toHttpPath`, `fallbackContractConfig`, `HTTPMethod`, `toRou3Pattern`, `traverseContractProcedures`, `OpenAPI` namespace, `schemaConverters` → `converters`, `Router<TContext>` arity 2→1, `ZodSmartCoercionPlugin` / `@orpc/zod/zod4` removed. |
| 5 | `packages/sdk/mod.ts packages/sdk/src/client/mod.ts packages/sdk/src/query-client/mod.ts packages/sdk/src/desktop/mod.ts packages/sdk/src/openapi/helpers.ts` | 1 | 15 | 6 | `StandardLinkClientInterceptorOptions` renamed, `RPCLink` `origin`+`url` split, custom `fetch(url, init)` string first arg, `customJsonSerializers` removed, `isContractProcedure` & `inferRPCMethodFromContractRouter` removed, `OpenAPIGenerator` `schemaConverters` → `converters`. |
| 6 | `packages/plugin/mod.ts packages/plugin/src/contract-base/mod.ts packages/plugin/src/service/mod.ts` | 1 | 26 | 10 | `ContractProcedure` → `AnyProcedureContract`, `EnhancedContractRouter` removed, `oc.prefix()` / `.route()` / `os.prefix()` removed, `BASE_PLUGIN_ERRORS` `status` field removed. |
| 7 | `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts packages/plugin-auth-core/src/adapters/auth-service-authenticator.ts` | 1 | 30 | 11 | `ORPCError` from `@orpc/contract`, `.route()`, `status` in `ErrorMapItem`, `ContractProcedureBuilderWith*`. |
| 8 | `packages/plugin-workers-core/src/contracts/v1/workers.contract-definition.ts` | 1 | 31 | 4 | 23 `.route()` sites (reduced 31→9 with `@orpc/openapi/extensions/route`) + transitive `base-contract`. |
| 9 | `packages/plugin-sagas-core/src/contracts/v1/sagas.contract.ts` | 1 | 17 | 4 | 9 `.route()` sites (reduced 17→9 with extension) + transitive `base-contract`. |
| 10 | `packages/plugin-triggers-core/src/contracts/v1/triggers.contract.ts` | 1 | 20 | 4 | 12 `.route()` sites (reduced 20→9 with extension) + transitive `base-contract`. |
| 11 | `packages/plugin-ai-core/src/contracts/v1/ai.contract.ts` | 1 | 17 | 5 | 7 `.route()` sites + `Implementer` generic arity + `base-error-adapter.ts` `status`. |
| — | **Subtotal (groups 1–11)** | **11/11 fail** | **186 raw** | **25 unique files / 99 unique sites** | ~Half of unique sites are `.route()`. |
| 12 | `packages/fresh/src/runtime/desktop/bind-desktop-rpc-window.ts` | 1 | 10 | 5 | `customJsonSerializers` removed on MessagePort `RPCHandler` + transitive SDK errors. |
| 13 | `plugins/auth/services/src/main.ts plugins/sagas/services/src/main.ts plugins/triggers/services/src/main.ts plugins/workers/services/src/service.ts` | 1 | 215 | 28 | 122 cascading `TS7031` / 10 `TS7006` implicit-`any` from broken `implement()`/`baseContract`, plus `ORPCError` from `@orpc/contract`. |
| — | **Total (13 groups)** | **13/13 fail** | **411 raw** | — | — |
| 14 | `packages/cli/bin/netscript.ts` (supplementary) | 1 | 37 | — | Cascading from `@netscript/service`, `@netscript/contracts`, `@netscript/telemetry`. |

## 3. Runtime Fallout (`deno test --no-check --allow-all --unstable-kv` on `2.0.0-beta.53`)

1. `packages/contracts/tests`: **18 passed | 5 failed** — `TypeError: oc.$meta is not a function`.
2. `packages/logger/tests/orpc-plugin_test.ts`: **1 passed | 4 failed** — `TypeError: Cannot read properties of undefined (reading 'routingInterceptors')` (caused by `void`-returning `init(options)`). Even after adding `name` + returning `options`, **2 of 5 tests still fail** because `LoggingPlugin` pushes to `rootInterceptors` while v2 executes `routingInterceptors`!
3. `packages/fresh/src/runtime/desktop/bind-desktop-rpc-window_test.ts`: **0 passed | 1 failed** — `SyntaxError: '@orpc/contract' does not provide an export named 'isContractProcedure'`.
4. `packages/{telemetry,service,sdk,plugin,plugin-auth-core}`: immediate `@orpc/otel` import error. Secondary pass swapping only `@orpc/otel` → `@orpc/opentelemetry` exposed: `ORPCError` missing from `@orpc/contract` (`error-plugin.ts:17`), `isContractProcedure` missing (`stable-v1-adapter.ts:8`), `@orpc/zod/zod4` `ERR_PACKAGE_PATH_NOT_EXPORTED` (`handlers.ts`), and `fallbackContractConfig` missing (`contract-procedure-index.ts:19`).

## 4. Direct Runtime & `.d.ts` Verification (`2.0.0-beta.53` & `probes/v2-behavior-probes.ts`)

- **`ORPCError` (`@orpc/client@2.0.0-beta.53/dist/error.d.ts`):** `status` removed (`"status" in err === false`); `defined` retained on instance (`toJSON: { defined, code, message, data }`), **but constructor `{ defined: true }` is ignored** (`defined === false` unless reconciled via `reconcileORPCError(map, err)` or contract `errors.<CODE>()`). Unmapped error codes return HTTP **`400`** (`rpc-handler-codec.js:44`, was `500` in v1).
- **`safe()` (`@orpc/client@2.0.0-beta.53/dist/utils.d.ts`):** 4-tuple changed to `[error, data, definedError | null, isSuccess]`; `isDefined` property removed.
- **`@orpc/tanstack-query@2.0.0-beta.53/dist/procedure-utils.d.ts`:** Exact method names on `ProcedureUtils` are **`streamedKey`**, **`streamedOptions`**, **`liveKey`**, **`liveOptions`** (NOT `streamedQuery*` / `liveQuery*`), with `fnOptions` replacing `queryFnOptions`, `prefix` replacing `path`, and `refetchMode: 'replace'` removed (replaced by custom `queryFn`).
- **`@orpc/openapi@2.0.0-beta.53/extensions/route`:** Restores `.route(meta: OpenAPIMeta)` via module augmentation on `ContractBuilder*`, `Builder*`, and `DecoratedProcedure`. Does NOT restore `.prefix()` or `.tag()`.
- **Standalone behavior probes (`probes/v2-behavior-probes.ts`, `deno test --no-lock --no-config -A`):**
  - **B1:** Verified `1.15.5` `RPCLink` → `2.0.0-beta.53` `RPCHandler` silently delivers `10n` as `"10"` and degrades `"nope"` → `"Not Found"`; verified `X-NetScript-RPC-Protocol` `426` guard blocks both directions and missing headers; verified `OpenAPILink@1.15.5` → `OpenAPIHandler@2.0.0-beta.53` works on JSON-safe payloads.
  - **B2:** Verified default `RPCHandler` rejects `GET` (`matched: false`); verified explicit contract-declared `GET` allow-list + `GetMethodCsrfProtectionHandlerPlugin` (`200` for S2S, same-origin, same-site, and cross-site `cors`+`empty`; `403` for cross-site missing `sec-fetch-dest` and `navigate`+`document`; `matched: false` for `GET` on POST mutation).
  - **B4:** Verified `rootInterceptors` silently ignored vs `routingInterceptors` firing; unmapped error code returning HTTP `400`; `defined: true` ignored vs `reconcileORPCError`; duplicate middleware running twice on v2 vs context-symbol guard running once.
  - **B6:** Verified `@orpc/openapi/extensions/route` + `defineMeta` powering `.route(...)` + `.meta(accessMeta(...))`.
  - **B7:** Verified default v2 `RPCLink` follows cross-origin `307` leaking `x-api-key`, `traceparent`, and request body; `redirect: 'manual'` resolves silently with `undefined`; **`redirect: 'error'`** enforced after `...init` spread throws `TypeError` with **0 foreign hits**.

## 5. v1 `1.16.5` Baseline Run (Recorded from Round-1 Verification)

- `1.16.6` (published 2026-11-25) is rejected by Deno's `minimumDependencyAge` policy on publication day; `1.16.5` is the usable v1 target.
- `deno check`: exit `0` across 9 package groups.
- `deno test`: `contracts` 29/0, `logger` 5/0, `telemetry` 68/0, `service` 370/0, `sdk` 192/3 (all 3 failures are strictly the React fixture frozen lockfile, refreshed in the same bump).
