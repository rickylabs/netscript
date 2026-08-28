# Drift Log: prisma-mysql-honest-example (#1112)

Drift is append-only. No other lane's artifact was edited.

## 2026-08-28 — TLS identity mode is accepted but not implemented as named

- **What:** `MySqlConnectionConfig.tls.mode` accepts `'verify_identity'`, but translation only adds
  `ssl.ca` when custom CAs are non-empty and never sets mysql2 `ssl.verifyIdentity: true`.
- **Source:** `packages/prisma-adapter-mysql/src/types.ts:23-29`;
  `packages/prisma-adapter-mysql/src/adapter.ts:725-743`; installed mysql2 3.22.5 `SslOptions`
  declaration says `verifyIdentity` defaults false for backwards compatibility.
- **Expected:** Every advertised option has observable behavior matching its name.
- **Actual:** The mode name over-promises identity verification; without a non-empty CA list it is a
  silent no-op.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** `research.md` public option audit. Coordinator must authorize product correction or
  removal/deprecation plus focused tests before implementation.

## 2026-08-28 — Frozen path ceiling excludes required focused evidence

- **What:** Acceptance row 5 requires a compiled full example and focused option-translation/
  cleanup tests. Existing test files are outside the five-path ceiling.
- **Source:** live #1112; `docs/site/reference/prisma-adapter-mysql/examples_test.ts:1-19`;
  `packages/prisma-adapter-mysql/tests/connection_errors_test.ts`;
  `adapter.ts:353-358,634-642,725-743`.
- **Expected:** Focused tests run without live MySQL where seams exist.
- **Actual:** Cleanup has constructor injection but lacks an exactly-once-close assertion.
  Translation is private/hard-wired and has no injection/export seam. The current docs test checks
  only factory construction.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** structured base check selected one docs test; package suite passed 46 tests without
  option-translation coverage. Any changed test file would be a sixth product path.

## 2026-08-28 — Explicit artifact allowlist overrides harness supervisor bootstrap

- **What:** Harness activation normally requires `supervisor.md`, but the leaf grant allows creation
  of only `research.md`, `plan.md`, `context-pack.md`, `worklog.md`, and `drift.md` in this run dir.
- **Source:** user task artifact allowlist versus `.llm/harness/workflow/activation.md` mandatory
  artifact list.
- **Expected:** Activated run includes `supervisor.md`.
- **Actual:** Creating it would violate the explicit turn contract.
- **Severity:** significant
- **Action:** accept
- **Evidence:** this run directory contains exactly the five authorized artifacts. Evaluator routing
  is stated in plan/worklog instead; this generator does not launch PLAN-EVAL.
