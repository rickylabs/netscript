# Worklog — RFC 0013 S2

## Design Checkpoint & Plan-Gate Record

- **Plan-Gate:** N/A — slice executes accepted RFC 0013 §4.1 Phase 0a items 2–4 (`rfcs/0013-orpc-v2-readiness.md`, owner-accepted 2026-11-27 in PR `#2674`) with no unapproved scope expansion.
- **Baseline:** Branched from `origin/main` `05065efea` (post-S1 PR `#2704`). Sub-issue `#2706` filed and linked.

## Execution Log

- **2026-11-28 (Pass 1):**
  - Moved all 6 `ORPCError` imports off `@orpc/contract` to `@orpc/client` (`packages/telemetry/src/orpc/error-plugin.ts`) and `@orpc/server` (`packages/plugin-auth-core/src/adapters/auth-service-authenticator.ts`, `auth-service-authenticator.http_test.ts`, `packages/sdk/tests/integration/workers-trigger-rpc_test.ts`, `plugins/auth/services/src/routers/v1-handlers.ts`, `plugins/auth/tests/services/auth-service_test.ts`). Updated `packages/telemetry/package.json` with `"@orpc/client": "catalog:"` (`dependencies`) and `"@orpc/server": "catalog:"` (`devDependencies`).
  - Added stable `name` properties, return-based `init()`, `attachRootHandlerInterceptor` seam (keeping `rootInterceptors` on v1 `^1.16.6`), and `errorStatusMap` + `resolveErrorHttpStatus` to `TracingPlugin`, `ErrorHandlingPlugin`, and `LoggingPlugin`. Updated `ServiceHandlerPlugin` (`name`, return-compatible `init`/`initRuntimeAdapter`) and `RPCHandlerConfig` / `createRPCPlugins` (`errorStatusMap` forwarding).
  - Updated `packages/telemetry/tests/orpc/plugin_test.ts` to test `TracingPlugin` and `ErrorHandlingPlugin` inside a real `RPCHandler` (not `{}`), and added matching tests to `packages/logger/tests/orpc-plugin_test.ts`, `packages/service/tests/handlers_test.ts`, and `packages/service/tests/type-assignability_test.ts`.
  - Added `getErrorHttpStatus(error)` and relaxed `DefinedError` / `DefinedErrorLike` / `SafeFailure` / `isDefinedError` (`status?: number`) in `packages/sdk/src/client/errors.ts`, exported from `packages/sdk/src/client/mod.ts` (and root `@netscript/sdk`), updated `docs/site/reference/sdk/index.md` and MCP export corpus, and added compile-time + runtime tests in `packages/sdk/tests/orpc-defined-error-narrowing_test.ts`.
  - Refreshed `deno.lock` and `packages/fresh-ui/deno.lock` (`+2` telemetry workspace deps only), regenerated `export-surface-corpus.generated.ts` and `agent-docs-prose.generated.ts`.
- **Pass-1 Local Verification (Deno 2.9.8):**
  - `grep -rn "ORPCError.*@orpc/contract|@orpc/contract.*ORPCError" packages/ plugins/ tools/` — 0 matches
  - `deno ci` — PASS
  - `deno task deps:check` — PASS (`reference-lock PASS locks=3`, 0 `@orpc/` violations, `private-lock-workspace PASS locks=1`, `zod-alignment PASS`, `db-alignment PASS`)
  - `deno task check` — PASS (0 errors)
  - `deno task lint` — PASS (0 errors)
  - `deno task fmt:check` — PASS (0 findings)
  - `deno task quality:cli` — PASS (0 findings)
  - `deno task quality:gate` (`quality:scan` + `arch:check`) — PASS
  - `deno task docs:exports-drift` — PASS
  - `deno task check:mcp-export-corpus` — PASS
  - `deno task check:agent-docs-prose` (including full `docs/site` build) — PASS
  - `deno task check:netscript-jsr-specifiers` — PASS
  - `deno task publish:dry-run` (all 37 publishable packages) — PASS
  - `deno doc --lint packages/logger/orpc.ts packages/sdk/src/client/mod.ts packages/service/mod.ts` — PASS (0 errors)
  - Sanitized S2 test suite (`--frozen --unstable-kv --allow-all --sanitize-ops --sanitize-resources`) — **37 passed, 0 failed**
  - Full affected package test suites (`telemetry`, `logger`, `service` handlers/types, `sdk` error/narrowing/doctest/workers-rpc, `plugin-auth-core`, `plugins/auth` auth-service, `mcp` export corpus) — **124 passed, 0 failed**
- **2026-11-28 (Pass 2 — Sol 6.2 xhigh Pass-1 IMPL-EVAL `IC_kwDOSxcnO88AAAABr3PlYg` remediation):**
  - **Finding 1 (MCP publish provenance):** Re-ran all three doc/publish generators in sequence (`gen:mcp-export-corpus --allow-dirty`, `gen:agent-docs-prose`, `gen:publish-assets`) after Pass-2 doc updates; verified `check:publish-assets`, `check:assets-barrel`, `release:preflight`, and all 12 tests across `release-embedded-docs-corpus_test.ts`, `published-docs-corpus_test.ts`, and `embedded-export-surface-corpus_test.ts`.
  - **Finding 2 (Invalid HTTP error status validation):** Restricted `resolveErrorHttpStatus` in both `packages/telemetry/src/orpc/_utils.ts` and `packages/logger/orpc-plugin.ts` via `isValidErrorHttpStatus` (`400`–`599` integers only) for both `error.status` and `errorStatusMap[code]`, and updated `toORPCError` in `packages/telemetry/src/orpc/error-plugin.ts` to sanitize out-of-range `ORPCError.status` values so `RPCHandler.handle()` never rejects with `RangeError`. Added real-`RPCHandler` tests for `errorStatusMap: { ORDER_LOCKED: 700 }` -> `500` and explicit `status: 0` (plain error and `ORPCError`) -> `409` in both `packages/telemetry/tests/orpc/plugin_test.ts` and `packages/logger/tests/orpc-plugin_test.ts`.
  - **Finding 3 (Beta.53 standard status table parity):** Added `LENGTH_REQUIRED: 411` and `PRECONDITION_REQUIRED: 428` to `DEFAULT_ORPC_ERROR_STATUS_MAP` in both `packages/telemetry/src/orpc/_utils.ts` and `packages/logger/orpc-plugin.ts` (full parity with oRPC `v2.0.0-beta.53` `COMMON_ERROR_STATUS_MAP`) and verified both with empty custom maps `{}` inside real `RPCHandler` tests.
  - **Finding 4 (SDK `getErrorHttpStatus` transport provenance & real adapter coverage):** Updated `getErrorHttpStatus`, `DefinedError`, and `isDefinedError` JSDoc in `packages/sdk/src/client/errors.ts` and the table entry in `docs/site/reference/sdk/index.md` to accurately reflect transport provenance (v1 `ORPCError.status` across fetch/MessagePort/router-client, response-backed `.response.status` on error or `.cause`, returning `undefined` when no status/response provenance is present, and v1 runtime `isDefinedError` delegation vs compile-time optional-`status` narrowing). Added real v1 fetch, real v1 `MessageChannel` (`MessagePort`), and real v1 `createRouterClient` adapter tests plus v2-shaped response-backed and statusless/response-less tests in `packages/sdk/tests/orpc-defined-error-narrowing_test.ts`.
