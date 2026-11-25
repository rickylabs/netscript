# Worklog — RFC A: oRPC-native procedure pipeline and router client

- **Date:** 2026-11-25
- **Tracking issue:** `#2671` (`0.0.10`)
- **Draft PR:** `#2673`
- **Base `main` SHA:** `87965d800b7d61312e8612c82bdb0cb98bdf5b29`
- **Companion RFC:** PR `#2674` (tracking issue `#2672`)

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
