# Drift Log: S9 agent tooling polish

## 2026-07-12 — Scoped wrapper fixture exclusion

- **What:** Excluded `packages/mcp/tests/fixtures/doctor/` from explicit-file wrappers.
- **Source:** Its synthetic legacy workspace configuration is rejected by Deno when fixture
  TypeScript files are passed explicitly.
- **Expected:** Scoped wrappers inspect package source and tests.
- **Actual:** The wrapper entered an intentionally invalid diagnostic fixture.
- **Severity:** minor
- **Action:** accept; fixture behavior remains covered by tests.
- **Evidence:** Final wrappers select 55 files with zero findings; the test suite has 44 passes.

## 2026-07-12 — Workspace publish timer portability

- **What:** Changed the command-executor timer handle from `number` to
  `ReturnType<typeof setTimeout>`.
- **Source:** First workspace publish dry-run reported TS2322 under the combined graph.
- **Expected:** Package-only checks and workspace publish both pass.
- **Actual:** The workspace graph resolved the handle as `Timeout`.
- **Severity:** minor
- **Action:** fix.
- **Evidence:** Command tests, stdio smoke, scoped check, MCP dry-run, and workspace dry-run pass.
