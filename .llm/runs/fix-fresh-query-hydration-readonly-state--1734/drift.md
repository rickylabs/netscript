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
