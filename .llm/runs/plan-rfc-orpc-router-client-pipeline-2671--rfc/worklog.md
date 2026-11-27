# Worklog — RFC A: oRPC-native procedure pipeline and router client

- **Date:** 2026-11-25
- **Tracking issue:** `#2671` (`0.0.10`)
- **PR:** `#2673` (accepted as **RFC 0012**, `rfcs/0012-orpc-router-client-pipeline.md`)
- **Base `main` SHA:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29`
- **Companion RFCs:** RFC 0011 (PR `#2659` / tracking issue `#451`), RFC 0013 (PR `#2674` / tracking issue `#2672`)

## Owner Mandate (verbatim, private prefix elided for public repository)

> "I'd put a neon lane to evaluate the migration to orpc router client including auth and others and also being orpc V2 ready (two RFC) reviewer Fable 5.2 including what it implies for our downstream consumers (without citing […] )"

*(Note: the private repository prefix in the owner's prompt is elided as `[…]` for public-repo hygiene, matching existing RFC worklog precedent.)*

## Round-0 Baseline & Round-1 Review (Fable 5.2)

- Round-0 draft committed at `8f4bc6af21984759ba52e7dbd0449167628830c5` on PR `#2673`.
- Fable 5.2 PLAN-EVAL (`issuecomment-7170492509`) returned `CHANGES_REQUESTED` with 6 concrete blockers (B1–B6; 4 reproduced via counter-probes), warm benchmark cross-check (2,000/5,000 iterations), 8 advisory findings, and a recommendation to amend and take PR #2659 off hold independently.

## Round-1 Revision Evidence Ledger

### 1. Additional Source & Upstream Verification

- Re-inspected `packages/service/src/auth/contract/{contract-authorizer.ts,contract-overlay-authorizer.ts,contract-procedure-index.ts,procedure-policy-decision.ts}`, `packages/service/src/auth/{auth-middleware.ts,scope-authorizer.ts,types.ts,internal-credential/internal-credential-authenticator.ts}`, `packages/service/src/rate-limit/middleware/rate-limit-middleware.ts`, `packages/plugin/src/service/presentation/{create-plugin-service.ts,plugin-contract-binder.ts}`, `packages/plugin-auth-core/src/sdk/bearer-contribution.ts`, `packages/sdk/src/ports/sdk-client-contribution.ts`, `packages/logger/orpc-plugin.ts` (`createRequestId()` at line 371), and `origin/main:rfcs/0008-rolling-service-quotas.md` (lines 109, 246–250).
- Inspected locked `@orpc/server@1.15.5/standard` (`StandardRPCMatcher`), `@orpc/openapi@1.15.5/standard` (`StandardOpenAPIMatcher`), and cached `2.0.0-beta.53` `@orpc/server/standard` (`RPCMatcher`), `@orpc/openapi/standard` (`OpenAPIMatcher`), and `@orpc/server/adapters/standard/handler.js` (confirming `StandardHandler.interceptors` runs post-`resolveProcedure` and pre-`decodeInput`).

### 2. Updated Empirical Probes (locked `@orpc/*@1.15.5`, Deno `2.9.5`, `--frozen`)

1. **Warm overhead benchmark** (`probes/overhead-benchmark.probe.ts`, raw JSON in `probes/overhead-results.json`):
   - Parameters upgraded to **2,000 warm-up / 5,000 measured** iterations, eliminating the Round-0 JIT warm-up artefact, and adding the **design-complete** authenticating router-client mode (root ALS snapshot + OTel detachment + logging/error/tracing interceptors + per-call `requestId` + scoped brand check + SHA-256 audit + `MemoryRateLimitStore`).
   - **Small unary (~100 B):** HTTP loopback `386.4 µs` (`2,588 ops/s`); fetch-link #2659 `212.2 µs` (`4,713 ops/s`); **router-client authenticating design-complete `38.2 µs` (`26,193 ops/s`, 5.6× vs fetch-link, ~0.17 ms/call saved, 10.1× vs HTTP)**; authenticating minimal `32.4 µs` (`30,834 ops/s`, 6.5× vs fetch-link); *off-by-default trusted-principal `22.3 µs` (`44,744 ops/s`, 9.5× vs fetch-link)*.
   - **Medium list (100 items, 12,822 B JSON):** HTTP loopback `590.5 µs` (`1,693 ops/s`); fetch-link `345.0 µs` (`2,899 ops/s`); **router-client authenticating design-complete `47.7 µs` (`20,952 ops/s`, 7.2× vs fetch-link, ~0.30 ms/call saved, 12.4× vs HTTP)**; authenticating minimal `43.4 µs` (`23,050 ops/s`, 7.9× vs fetch-link); *off-by-default trusted-principal `32.1 µs` (`31,123 ops/s`, 10.7× vs fetch-link)*.
   - **Concurrent burst (20 × 50 = 1,000 calls):** HTTP `4,290 ops/s`; fetch-link `8,524 ops/s`; **authenticating design-complete `42,301 ops/s` (5.0× vs fetch-link)**; *off-by-default trusted-principal `76,889 ops/s` (9.0× vs fetch-link)*.
   - Design-complete interceptor overhead measured at **+4.3 to +5.8 µs** (consistent with reviewer's 5–10 µs measurement).
2. **Comprehensive parity & security counter-probe suite** (`probes/router-client-parity.probe.ts`):
   - Covers B1 (unmarked → `403 authz.no-matching-rule`), B2 (5 path-based modes fail closed at construction + procedure fallback parity), B3 (401/403-before-413, 401-before-404/410, `procedure_not_found`, `procedure_retired`, `findInternalGuard`, `429` + `Retry-After`), B4 (failing-then-passing proofs for all 3 measured attacks + `AuthenticatorPort`-level single-authn count), B5 (failing-then-passing proofs for lazy snapshot capture & streaming pull isolation across all 3 `next()` pulls + `return()`), B6 (`setCookies` fail-closed/sink, public `clientAddress` quotas, `withRateLimit` mismatch fail-closed, `onStartup` fail-closed, idempotent double-wrap protection), and real RFC 0001 `bearer` + `locale` contribution projection with `options.path`.

## Validation Table (Round-1 Fix)

| Check | Command | Result |
| --- | --- | --- |
| Warm Overhead Benchmark (2,000 / 5,000) | `mise exec -- deno run --frozen -A .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/overhead-benchmark.probe.ts` | PASS (exit 0; valid JSON saved to `probes/overhead-results.json`) |
| Round-1 Parity & Counter-Probes (B1–B6) | `mise exec -- deno test --frozen -A .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/router-client-parity.probe.ts` | PASS (`6 passed \| 0 failed`, 117 ms) |
| Lockfile untouched | `git diff --stat deno.lock` | PASS (empty diff) |
| Scoped internal doc links | `mise exec -- deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-orpc-router-client-pipeline.md --pretty` | PASS (`broken-links=0 broken-anchors=0`) |
| Privacy & closing-keyword scan | Pattern scan on all modified/added files | PASS (`0 hits`) |

## Round-2 Review (Gemini Hydrogen) & Round-2 Fix Evidence Ledger

- Gemini Hydrogen Round-2 PLAN-EVAL (`issuecomment-7172432834`, reviewed head `af194d79a080b2b3efb83e6574deac3979642a38`) confirmed **B1**, **B2**, and core **B4** resolved, **B3**, **B5**, and **B6** partial, confirmed the warm benchmark headline (`6.6×` small unary, `7.8×` medium list on shared host), and raised six blocking findings (**N1–N6**) plus five advisories.

### 1. Additional Source & Upstream Verification (Round 2)

- Re-inspected `packages/service/src/primitives/handlers.ts:112`, `packages/service/tests/cors-response-authority_test.ts:442-480`, `packages/service/src/primitives/body-limit.ts:28` (`PAYLOAD_TOO_LARGE`), `packages/service/src/rate-limit/middleware/{rate-limit-middleware.ts:29-96,client-address.ts:59-80}`, `packages/service/src/auth/{static-credential-authenticator.ts:91-100,internal-credential/internal-credential-authenticator.ts:15,84,contract/contract-authorizer.ts:129-140}`, `packages/plugin/src/service/presentation/create-plugin-service.ts:185-210`, `packages/auth-kv-oauth/src/backend.ts:154-164`, `packages/auth-workos/src/workos-authenticator.ts:289-330`, all repo `new AsyncLocalStorage` sites (`packages/logger/config.ts:19`, `plugins/auth/services/src/request-context.ts:12`, `packages/plugin-triggers-core/src/adapters/watchers-file-watcher-adapter.ts:103`, `plugins/streams/services/src/sliding-stream-access.ts:64`), accepted `rfcs/0008-rolling-service-quotas.md`, PR `#2659` (`f8c8d8fd`, shared `Symbol.for('@netscript/async-context/active-store-probes')`), and PR `#2674` (`6501e41c`, §2 row 3 & §4.4 CORS decision).
- Verified empirically on locked `@orpc/server@1.15.5` (`ResponseHeadersPlugin`, `RPCHandler`, `OpenAPIHandler`, `RPCLink`, `withEventMeta`/`getEventMeta`, `AsyncIteratorClass[Symbol.asyncDispose]`), `@opentelemetry/api@^1.9.1` (`ROOT_CONTEXT.setValue` vs `trace.getActiveSpan()`), and cached `@orpc/server@2.0.0-beta.53/plugins` (`ResponseHeadersHandlerPlugin` export).

### 2. Round-2 Probes & Failing-Then-Passing Proofs (`probes/router-client-parity.probe.ts` & `probes/overhead-benchmark.probe.ts`)

- **N1 (`CORSPlugin` deferred to `0.1.0`):** Removed `CORSPlugin` removal from Stage 1a (`0.0.10`) across Summary, §1, Rationale, Downstream consumers, and Breaking changes; aligned Stage 2 (`0.1.0`) with companion PR `#2674` (`6501e41c` §4.4).
- **N2 (RFC 0008 + HTTP `429` `Retry-After` + disjoint stores + IPv6 `/64` + `PAYLOAD_TOO_LARGE`):** Failing-then-passing Test 3 proves bare `RPCHandler@1.15.5` returns `retry-after: null` on `ORPCError('RATE_LIMITED')`, whereas `ResponseHeadersPlugin` emits `429` + `Retry-After: 5` (from `decision.retryAt` `+5s`, not `resetAt` `+60s`) + typed oRPC envelope decoded by `RPCLink` (`isDefinedError === true`); proves synchronous construction-time `store.validate()` rejection (>365-day GCRA ceiling), `2×` double-counting on shared store vs `1×` each on disjoint stores, `413 PAYLOAD_TOO_LARGE`, and IPv6 `/64` `rateLimitAddressKey` bucketing.
- **N3 (Nested router double wrapping):** Failing-then-passing Test 6 reproduces `2×` execution under outer-only `WeakSet` on `{ v1: { orders: wrappedChild } }`, then proves per-leaf `WRAPPED_PROCEDURE_SERVICE` + per-invocation `PIPELINE_EXECUTED_SYMBOL` executes `1×` and fails closed on cross-service remount (`ROUTER_CLIENT_CROSS_SERVICE_MOUNT`).
- **N4 (`WeakMap<Principal, VerifiedPrincipalRecord>` hazards):** Failing-then-passing Test 4 proves rejection of overlapping live brands on shared `Principal` references (preserving `INTERNAL_PRINCIPALS` identity), immediate `WeakMap.delete()` on `requestScope.end()`, fail-closed `Number.isFinite` checks on `NaN` `expiresAtMs` and `claims.exp`, and private `record.internalAudience` + deep-freezing defeating shallow-frozen `claims.audience` mutation.
- **N5 (Unified root snapshot + non-span OTel + `[Symbol.asyncDispose]`):** Eliminated bare top-level `AsyncLocalStorage.snapshot()` from both probes; unified on PR `#2659`'s `Symbol.for('@netscript/async-context/active-store-probes')`; failing-then-passing Test 5 proves `ROOT_CONTEXT.setValue` bypasses `trace.getActiveSpan()` but is caught by `otelContext.active() !== ROOT_CONTEXT`, and proves `wrapDetachedAsyncIterator` isolates `next()`, `return()`, `throw()`, and `[Symbol.asyncDispose]()` while preserving `withEventMeta`/`getEventMeta`.
- **N6 (Pre-`authenticate()` cookie-sink check):** Failing-then-passing Test 6 proves post-`authenticate()` checking burns a single-use refresh token, whereas pre-`authenticate()` cookie/capability checking throws `500 authn.set-cookies-sink-required` with `authenticateCalls === 0` (token untouched!), construction-time `ROUTER_CLIENT_COOKIE_SINK_REQUIRED`, and atomic post-check preventing partial side effects.
- **Advisory #4:** Test 6 adds custom Hono `.use()` fail-closed (`ROUTER_CLIENT_HTTP_MIDDLEWARE_UNSUPPORTED`) and real `start()`/`stop()` lifecycle draining in-flight calls before reverse `onShutdown` hooks and DB disposal.

## Validation Table (Round-2 Fix)

| Check | Command | Result |
| --- | --- | --- |
| Frozen typecheck (both probes) | `mise exec -- deno check --frozen .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/overhead-benchmark.probe.ts .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/router-client-parity.probe.ts` | PASS (exit 0) |
| Round-2 Parity & Counter-Probes (B1–B6 + N2–N6) | `mise exec -- deno test --frozen -A .llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/probes/router-client-parity.probe.ts` | PASS (`6 passed \| 0 failed`, 68 ms) |
| Lockfile untouched | `git diff --stat deno.lock` | PASS (empty diff) |
| Scoped internal doc links | `mise exec -- deno run --no-lock --allow-read .llm/tools/validation/check-internal-doc-links.ts --root rfcs/0000-orpc-router-client-pipeline.md --pretty` | PASS (`docs=1 broken-links=0 broken-anchors=0 orphans=0`) |
| Privacy, closing-keyword & stale-symbol scans | Pattern scans on RFC + `.llm/runs/plan-rfc-orpc-router-client-pipeline-2671--rfc/` | PASS (`0 hits`) |

## Round-3 PLAN-EVAL & Acceptance (2026-11-27)

- Gemini 4 Hydrogen Round-3 PLAN-EVAL returned **`APPROVED`** on head `bd8d51c012abf1d8903860cdf6115196e547d214`.
- **Owner decision 2026-11-27: Accept and merge:** Assigned next free RFC number `0012` (`0001`–`0010` on `main`, `0011` in PR `#2659`), renamed `rfcs/0000-orpc-router-client-pipeline.md` → `rfcs/0012-orpc-router-client-pipeline.md` (`rfc: 0012`, `status: Accepted`), updated companion RFC references (`RFC 0011` `#2659`, `RFC 0013` `#2674`), recorded accepted resolution note in `## Unresolved questions`, verified tracking issue `#2671` keeps the `rfc` label (open for implementation), and updated PR `#2673` title/body (`Refs #2671` only — zero closing keywords), `status:ready-merge` label, and ready-for-review state (not merged here; awaiting Hydrogen pre-merge verification).
