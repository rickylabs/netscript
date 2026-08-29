# Drift Log: Fresh query hydration readonly/mutable type correction

Drift is append-only.

## 2026-08-30 — Fresh doc-lint baseline differs from historical resolved note

- **What:** The current structured Fresh doc-lint reports 45 diagnostics.
- **Source:** `deno task doc:lint --root packages/fresh --pretty` at base `21d516224`.
- **Expected:** The historical Fresh F-7 debt entry says the package returned zero diagnostics in 2026-06.
- **Actual:** 28 private-type-ref and 17 missing-jsdoc diagnostics across current exported entrypoints.
- **Severity:** minor
- **Action:** accept as inherited baseline; do not expand #1734.
- **Evidence:** `worklog.md` baseline table; no source change was present when measured.

## 2026-08-30 — Review/evaluation occur after leaf push

- **What:** Tier-A slice review and independent exact-head IMPL-EVAL are not performed by this session.
- **Source:** Owner delivery instruction.
- **Expected:** The generic harness loop places supervisor review before the sign-off commit.
- **Actual:** The owner explicitly scheduled both independent passes after this leaf's push.
- **Severity:** minor
- **Action:** accept owner-authorized lane ordering; leave the PR draft and do not self-certify.
- **Evidence:** `supervisor.md` routes and owner brief.

## 2026-08-30 — Colocated test crossed Fresh query folder cardinality

- **What:** The first S2 test location made `src/application/query` the thirteenth immediate child.
- **Source:** `deno task arch:check` during the S2 loop.
- **Expected:** No new/deepened doctrine finding.
- **Actual:** Fresh temporarily moved from 3 to 4 warnings with a new F-16 query-folder warning.
- **Severity:** minor
- **Action:** fix; moved the cross-cutting hydration behavior test to `packages/fresh/tests/`.
- **Evidence:** Re-run returns Fresh `FAIL=0 WARN=3 INFO=1` with no query-folder finding.
