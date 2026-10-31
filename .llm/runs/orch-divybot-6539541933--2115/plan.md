# Plan & Design — READY FOR REVIEW

Issue #2115, milestone 0.0.9 D1. Archetype 2 integration. Baseline and research are current; no architecture migration or new debt is needed.

## Locked decisions

Skip values whose decodeURIComponent raises URIError. Preserve all valid-value decoding, duplicate last-valid-value behavior, embedded equals, empty values and existing name handling. Skip rather than retain raw malformed session credentials so invalid encodings cannot become authentication identifiers. Catch only URIError; unrelated errors propagate. Keep decoding in the existing shared parser because @std/http getCookies does not preserve its decoding or empty-name behavior.

All flow readers inherit this behavior. Verify backend.authenticate and sessions.getSession through the existing AuthnRequest.cookie interface; do not bypass that port or add a competing parser. Exercise callback cookie fallback without a txn query parameter, getSessionId, and signOut.

## Ordered slices

1. S0: commit current plan/design/run records and open draft PR. Gate: verify baseline and allowed file list.
2. S1: update src/cookies.ts, tests/cookie-policy_test.ts, tests/auth_kv_oauth_test.ts, README.md and run artifacts. Gate: new parser and backend/flow regressions, negative control with only parser reverted, whole package test suite, structured package check/lint/fmt, full quality:gate, full-export doc:lint, JSR audit, member publish:dry-run. Independent slice review before sign-off; commit/push and PR evidence comment.
3. S2: commit review evidence, context, dated lesson and any review repairs. Re-run affected gates if source changes. Preliminary independent IMPL-EVAL before ready; final same-session IMPL-EVAL must review exact pushed head after ready. Final evaluator output can live in the ignored report handoff to avoid changing the evaluated head.

## Risks and mitigations

- Catch could hide programmer errors: catch URIError only around decoding.
- Valid decoding could drift: explicit unicode, embedded equals, empty-value and duplicates cases.
- Foreign cookies could break callback/signout as well as auth: end-to-end flow regression omits txn query fallback bypass, includes malformed neighbors, verifies session deletion.
- Malformed session cookie: parser omits it and backend reports signed out; no raw credential accepted.
- Regression test could pass accidentally: revert production fix with new tests intact and record failures, then restore and rerun.
- Shared expensive runtime suite: prohibited locally by owner; no scaffold/plugin wiring changes planned. Full CLI E2E remains unproven and coordinator-owned, not a local merge-readiness claim.

## Gate set and open decisions

Structured check/test/lint/fmt wrappers scoped to packages/auth-kv-oauth; quality:gate covers broad scan and architecture fitness; doc:lint, audit-jsr-package, publish:dry-run --member packages/auth-kv-oauth. Manual review covers helper need, layering, file size, exports, inheritance, permissions, reexports, folders and test reachability. No dependency changes; existing graph verified by member publication. No open implementation decision. Publication and coordinator merge are safe to defer.

## Deferred scope

No general cookie grammar redesign, new dependencies, upstream port changes, scaffold changes, CLI E2E launch, release or merge. Independent evaluator must pass before implementation (PLAN-EVAL explicitly requested) and before ready (IMPL-EVAL). Do not merge until final evaluation and required coordinator gates complete.
