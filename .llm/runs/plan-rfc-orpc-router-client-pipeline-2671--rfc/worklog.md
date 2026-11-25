# Worklog — RFC A: oRPC-native procedure pipeline and router client

- **Date:** 2026-11-25
- **Tracking issue:** `#2671`
- **Base `main` SHA:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29`
- **Companion RFC:** `#2672` (oRPC v2 readiness and migration strategy)

## Owner Mandate (verbatim, private prefix elided for public repository)

> "I'd put a neon lane to evaluate the migration to orpc router client including auth and others and also being orpc V2 ready (two RFC) reviewer Fable 5.2 including what it implies for our downstream consumers (without citing […] )"

*(Note: the private repository prefix in the owner's prompt is elided as `[…]` for public-repo hygiene, matching existing RFC worklog precedent.)*

## Evidence Ledger

### 1. Source Inspection & Official Documentation

- **NetScript MCP `find_guidance`** (`@netscript/mcp@0.0.9`): queried service pipeline and SDK architecture docs (`pages/reference/service`, `pages/reference/sdk`).
- **Locked oRPC inspection (`deno doc --frozen` + npm cache source on `@orpc/server@1.15.5`, `@orpc/otel@1.15.5`):**
  - Confirmed `createProcedureClient` runs `runWithSpan('call_procedure')` and `intercept(options.interceptors, ...)` identically to handler client interceptors.
  - Confirmed `os.use(...).router(router)` (`enhanceRouter`) shifts `inputValidationIndex` forward so router-level middleware runs *before* input schema validation across `RPCHandler`, `OpenAPIHandler`, `createRouterClient`, and bare `call()`.
  - Confirmed `ORPCInstrumentation` hooks `call_procedure`, `middleware.<name>`, and `handler` spans on `createRouterClient`.
- **Official oRPC docs reviewed:** `client/server-side`, `best-practices/optimize-ssr`, `integrations/opentelemetry`, `context`, `middleware`, `error-handling`, `rpc-handler`, `rpc-link`, `migrations/from-v1`.
- **NetScript codebase source-inspected:**
  - `packages/service/src/`: `builder/{service-builder-impl.ts,service-rpc.ts,service-listener.ts}`, `primitives/{handlers.ts,openapi.ts,body-limit.ts,health.ts,orpc-router.ts,rpc-path.ts}`, `middleware/service-cors.ts`, `rate-limit/middleware/rate-limit-middleware.ts`, `auth/{auth-middleware.ts,types.ts,options.ts,scope-authorizer.ts,composite-authenticator.ts,trusted-header-authenticator.ts,internal-credential/*,contract/*}`, `tests/body-limit_test.ts`.
  - `packages/telemetry/src/`: `orpc/{tracing-plugin.ts,error-plugin.ts}`, `hono/otel-middleware.ts`.
  - `packages/logger/`: `middleware.ts`, `orpc-plugin.ts`.
  - `packages/sdk/src/`: `client/{service-client.ts,http-client-link.ts,errors.ts}`, `internal/client-contributions/{stable-v1-adapter.ts,prepared-call.ts}`, `ports/sdk-client-contribution.ts`.
  - `packages/contracts/src/`: `application/contract-primitives.ts`, `domain/{procedure-meta.ts,schemas.ts}`.
  - First-party plugins: `plugins/auth`, `plugins/streams`, `plugins/workers`, `plugins/sagas`, `plugins/triggers`, `plugins/ai`.
  - Draft PR #2659 (`rfcs/0000-in-process-service-link.md`, head `d2c0e05b63b258e8513c4b4e9ec0362cf8241492`).

### 2. Empirical Probes (run against locked `@orpc/*@1.15.5`, Deno `2.9.5`, `--frozen`)

1. **Overhead benchmark** (`probes/overhead-benchmark.probe.ts`, raw JSON in `probes/overhead-results.json`):
   - Apples-to-apples control: silenced LogTape console output across both Hono apps and router-client, and added identical SHA-256 subject-hash audit work in the router-client pipeline so console I/O did not skew HTTP/fetch-link measurements.
   - **Small unary (~100 B, 500 iters):** HTTP loopback `536.5 µs` mean (`466.1 µs` p50, `1,864 ops/s`); fetch-link #2659 `259.3 µs` mean (`211.0 µs` p50, `3,856 ops/s`, 2.1×); `createRouterClient` w/ authn `78.7 µs` mean (`52.1 µs` p50, `12,701 ops/s`, 3.3× vs fetch-link / 6.8× vs HTTP); `createRouterClient` w/ verified principal `24.5 µs` mean (`20.2 µs` p50, `40,815 ops/s`, 10.6× vs fetch-link / 21.9× vs HTTP).
   - **Medium list (100 items / 12,822 B JSON, 500 iters):** HTTP loopback `745.6 µs` (`1,341 ops/s`); fetch-link `380.6 µs` (`2,627 ops/s`, 2.0×); `createRouterClient` w/ authn `48.1 µs` (`20,800 ops/s`, 7.9× vs fetch-link / 15.5× vs HTTP); `createRouterClient` w/ verified principal `36.4 µs` (`27,448 ops/s`, 10.5× vs fetch-link / 20.5× vs HTTP).
   - **Concurrent burst (20 × 25 = 500 calls):** HTTP loopback `5,191 ops/s`; fetch-link `8,574 ops/s`; `createRouterClient` w/ authn `30,828 ops/s` (3.6× vs fetch-link / 5.9× vs HTTP); `createRouterClient` w/ verified principal `68,324 ops/s` (8.0× vs fetch-link / 13.2× vs HTTP).
2. **Parity & security probe** (`probes/router-client-parity.probe.ts`):
   - `mise exec -- deno test --frozen -A ...`: **5 passed | 0 failed** (71 ms, resource & ops sanitizers ON).
   - Surfaced two concrete implementation subtleties incorporated into the RFC:
     - Router-level `ORPCError` throws must populate `data` conforming to `commonErrorMap`'s Zod schemas (`unauthorizedErrorSchema`, `forbiddenErrorSchema`, `rateLimitErrorSchema`, `serviceUnavailableErrorSchema`) and set `defined` against `procedure['~orpc'].errorMap`, or oRPC downgrades `defined` to `false` and breaks `isDefinedError()` narrowing.
     - `ServiceBuilderImpl.buildRpcContext()` spreads `...this.contextFactory(c)` before overwriting `principal` with `c.get('principal')`; HTTP-edge principal branding must therefore brand the `Principal` object stored on Hono context directly inside `createAuthnMiddleware`.

## Key Decisions

1. **Recommendation: Option 3 (Stage into Coexistence)** rather than replacing #2659 or shipping a throwaway v1 router-client surface right before oRPC v2.
2. **Dual-layer HTTP auth with `VERIFIED_PRINCIPAL_BRAND`:** Preserves 401-before-413, 404/410 anti-oracle, raw routes, and `Set-Cookie` on HTTP while running authentication exactly once per request and preventing unbranded `Principal` spoofing on `createRouterClient`.
3. **Explicit ALS detachment + opt-in trace propagation:** `AsyncLocalStorage.snapshot()` prevents accidental caller ALS leakage on every in-process call while allowing explicit W3C trace continuity.

## Validation Table

| Check | Command | Result |
| --- | --- | --- |
| RFC A Parity Probe | `mise exec -- deno test --frozen -A .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/router-client-parity.probe.ts` | PASS (`5 passed \| 0 failed`, 71 ms) |
| RFC A Overhead Benchmark | `mise exec -- deno run --frozen -A .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/overhead-benchmark.probe.ts` | PASS (exit 0; results saved) |
| Lockfile untouched | `git diff --stat deno.lock` | PASS (empty diff) |
| Scoped internal doc links | `mise exec -- deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-orpc-router-client-pipeline.md --pretty` | PASS (`broken-links=0 broken-anchors=0`) |
| Privacy & closing-keyword scan | Pattern scan on all added files | PASS (`0 hits`) |
