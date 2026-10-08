# IMPL-EVAL — remote-session--1383

- Implementation evaluator session: Muse Spark (`opencode-go/muse-spark-1.3-contributor`), resumed independent session `ses_f82065586ffeLljGd8IO7l8SLt` (same session/family as PLAN-EVAL `PASS` at `4c020c538`; distinct from generator session/thread `01a07872-49d0-74e3-a8b1-a20a6e091064`), 2026-09-08
- Run: `remote-session--1383` (branch `feat/remote-session-authenticator`, baseline `3330d6f9c`)
- Source reviewed: product diff `3330d6f9c..a8d0e236d` (implementation), receipts through `0be1e77ba`, HEAD `175e7748a` (run-dir only). PR #2002 reviewed by reference; no merge/publish/release performed.
- Surface / archetype: Archetype 2 (auth-core adapter) + Archetype 5 (plugin leaf + `session()` handler); `SCOPE-service.md`
- Requested route: `implementation_evaluation` tier `complex`: `muse_spark_1_3@max` (matrix-implementation-evaluator.json). Observed evaluator: Muse Spark @ max — non-OpenAI family, independent of Astra-medium generator. No self-certification; this verdict does not rest on the prior plan PASS.
- Compliance: read-only evaluation. Wrote only this file (plus the pre-existing `impl-eval-launch.jsonl` launcher trace, not edited by hand). No product edits, commits, merges, publishes, releases, issues, AppHost/container starts, or resident-resource changes. Full `scaffold.runtime` / exact-head CI merge gates remain coordinator-owned and are NOT claimed. No live IdP, Cockpit, or installed-artifact PASS follows.

## What was implemented (source)

1. `packages/plugin-auth-core/src/adapters/` (new, `./authenticator` export): `createAuthServiceAuthenticator` (required `serviceName`/`timeoutMs`, optional `routerName`/`protocol`/`allowInsecureTransport`), strict `readBearerCredential`, `REMOTE_SESSION_REJECTIONS`, `RemoteSessionVerificationError` (4 codes: `transport`/`timeout`/`malformed_response`/`remote_error`, fixed message, `toJSON` limited to code+procedurePath, no cause/body/credential).
2. `plugins/auth/src/public/authenticator.ts` (new `./authenticator` leaf): re-exports the five runtime symbols **plus** the four canonical service types (`AuthenticatorPort/AuthnRequest/AuthnResult/Principal`) — recorded deviation from the planned five-symbol leaf, assessed below.
3. `plugins/auth/services/src/main.ts`: context factory gains `request: currentAuthRequest()` (existing bridge, existing seam; one field).
4. `plugins/auth/services/src/routers/v1-handlers.ts` `session()` only: builds `request` once, passes `token: readBearerCredential(request)` alongside `sessionId`/`request`. `me`/`signout` diffs empty.
5. Tests: adapter unit (options validation, no-permission bearer-missing, redacted discovery throw), fault-fixture HTTP (denial/provider/timeout/contradictory/expired + malformed wire), native kv-oauth HTTP acceptance (typed SDK → native service → in-memory kv-oauth: bearer/cookie/direct, precedence, malformed fall-through, 12-request concurrency isolation, revocation re-read), middleware 401/503 + `/health`-public integration, leaf identity test.
6. Docs/carriers: README + reference rows, regenerated corpus/prose/assets; receipts retained.

## Verification (independent, source-backed)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| Scoped check (75 files) | PASS, re-run | `run-deno-check.ts --root packages/plugin-auth-core --root plugins/auth --ext ts`: 0 occurrences |
| Scoped tests (adapters + plugin services + service auth) | PASS, re-run | 57 passed / 0 failed (full auth scope receipts: 105 passed, +8 vs 97 baseline) |
| Scoped lint / fmt | PASS, re-run | 0 findings, 75 files |
| quality scan (both roots) | PASS, re-run | `scan-code-quality.ts`: ok, 0 findings, 0 allowances |
| arch-relevant edges | PASS | `plugins/auth` product source gains no `@netscript/sdk` import (only the pre-existing `@netscript/plugin-auth-core/authenticator` edge in `v1-handlers.ts`); cross-root relative imports are test-only (`*_test.ts`/`tests/`, skipped by checkers, excluded from publish) |
| JSR publish dry-runs | PASS with pre-existing warnings | both packages `Success Dry run complete`; `slowTypeWarnings=1` present at **baseline too** (verified on clean `3330d6f9c` checkout), so non-regressive |
| Doc-lint disposition | PASS (scoped non-regression) | new leaves clean (`./src/adapters/mod.ts` 0, `./src/public/authenticator.ts` 0); combined totals identical to baseline (core 3 / plugin 12, same files) — inherited failures, not a package-wide PASS claim |
| Export/corpus/prose/assets/jsdoc gates | PASS (receipts) | exports-drift PASS, corpus 275 subpaths/7887 symbols, prose fresh, assets/publish-assets checks exit 0, jsdoc-examples 0 failures |
| Per-request isolation / revocation / expiry | PASS (source) | `AsyncLocalStorage` bridge read per request; no memoised principal/cache (`direct-only` + factory holds client+options only); revocation re-read proven in-test; expiry via schema-validated `expiresAt <= now` |
| Redaction | PASS (source) | synthetic-secret/body markers absent from 503 bodies and `JSON.stringify(error)` in fault tests; `error.cause === undefined` asserted |
| #1384 separation | PASS | `signout`/`me` handler code untouched; no signout behavior claimed |

## Findings

**F1 (positive) — end-state defect fixed at the seam.** The native service was request-blind over HTTP (F18) and bearer-blind (F8); both confirmed fixed by exactly the planned minimum: one context field + one `token` lookup argument. Native HTTP acceptance covers sessionId-only, bearer-only, cookie-only, both precedence orders, malformed fall-through, lowercase scheme, bogus bearer, and 12 interleaved requests with exact session identities [observed - `plugins/auth/tests/services/session-credentials-http_test.ts`, precedence/isolation].

**F2 (accepted deviation) — leaf re-exports four canonical service types.** `doc-lint` required public signature visibility, so the leaf exposes `AuthenticatorPort/AuthnRequest/AuthnResult/Principal` as `export type` re-exports through the authenticator subpath. No type restatement (single `export type { … } from` line, no copied declarations), no runtime behavior, leaf doc-lint 0 errors. This widens the planned five-symbol surface by four type-only names that name the factory's own signature. Acceptable within Archetype-5 thin-glue; not a doctrine violation.

**F3 (accepted) — claims-forwarding is exact native preservation.** The initial claim-absence assertion failed honestly (`factory-initial-claim-failure.json`: native kv-oauth claims contain `sessionId`), and the test was corrected to assert exact claim equality rather than weakening the plan. The adapter adds no credential/provider metadata; `sessionId`-as-claim originates in the native backend (`backend.ts:253`), not the adapter. Matches reviewed L6; credential exposure audit unchanged since the native wire already carries these claims to the bearer holder.

**F4 (accepted) — error discrimination without message parsing.** SDK discovery failures are untyped, so untyped failures classify as `transport`; remote errors use the public `ORPCError` class guard + `defined` property (`auth-service-authenticator.ts:108-118`). Timeout attribution via `signal.aborted` is owned by the adapter's own signal. No message parsing. Sound.

**F5 (note, non-blocking) — expiry relies on schema-validated datetime.** `z.string().datetime()` guarantees `Date.parse` is finite, so `Date.parse(...) <= Date.now()` implements plan L5 exactly on validated data. No NaN path exists post-validation. No change required.

**F6 (note, non-blocking) — `VALIDATION_ERROR` (422) surfaces as 503.** Conservative fail-closed mapping, disclosed in plan OB-3. Acceptable for a verifier.

**F7 (scope boundary, not a defect) — WorkOS/better-auth precedence paths are documented, not HTTP-proven.** L13's per-backend table is source-accurate (F22 verified at plan stage), but live HTTP acceptance runs kv-oauth only. No IdP claim is made; the PR body and receipts label the evidence accordingly. Coordinator merge gates (`scaffold.runtime`, exact-head CI) remain pending and are explicitly not claimed here.

## Verdict

`PASS`

The implementation satisfies the reviewed plan: working bearer verification end-state through the typed SDK and native service, per-request isolation, precedence, revocation, expiry, redacted 503/401 semantics, thin-leaf layering with no new dependency edge, and scoped non-regression across check/test/lint/quality/docs/carrier gates. The two deviations (type re-exports, exact-claim preservation) are assessed and accepted above. Remaining merge-readiness gates (full `scaffold.runtime`, exact-head CI) are coordinator-owned downstream work, not implementation defects.
