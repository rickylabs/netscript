# Drift Log — #1349 remaining S3 acceptance tripwires

## 2026-09-01 — Carried completion claims exceeded named test coverage

- **What:** The landed runtime is complete, but the previous plan claimed compile-negative coverage
  for link/plugins/interceptors and completion of the local failure taxonomy. Current `main` names
  only `link`, `fetch`, and `retry` in the compile fixture; it does not name upstream callback-array
  fields, the exact three forbidden public link identities in the absence list, or
  `SDK_CONTRIBUTION_RUNTIME` in any test assertion.
- **Source:** `.llm/runs/feat-sdk-client-contribution-seam--1349/plan.md:108-112` compared with
  `packages/sdk/tests/type-fixtures/sdk-client-contributions-rfc_type.ts`,
  `client-contribution-private-surface_test.ts`, and `client-contribution-validation_test.ts`.
- **Expected:** Every amended prohibition and local failure code is pinned by a named test.
- **Actual:** Three narrow tripwire gaps remain; production behavior already rejects the cases.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `research.md` acceptance and coverage matrices.

### Resolution

Slice 1 added the missing named tripwires. Focused tests pass 13/13, the RFC compile fixture has 0
diagnostics, and the full SDK suite passes 210/210. No production source changed.

## 2026-09-01 — Owner-selected run archetype differs from doctrine assignment

- **What:** The owner directed `packages/sdk` to use Archetype 4 for this run, while doctrine files
  06 and 10 classify it as Archetype 2 with a Keep verdict.
- **Source:** User brief; `docs/architecture/doctrine/06-archetypes.md`; `10-codebase-verdict-and-handoff.md`.
- **Expected:** Harness profile and doctrine assignment match.
- **Actual:** The run uses the explicit owner-selected Archetype-4 gate envelope without changing
  package architecture or doctrine.
- **Severity:** significant
- **Action:** accept for this run; defer classification reconciliation to the doctrine owner
- **Evidence:** `supervisor.md`, `plan.md`.
