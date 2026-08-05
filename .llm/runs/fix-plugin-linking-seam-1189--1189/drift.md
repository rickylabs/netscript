# Drift Log: declared plugin linking seam

## 2026-08-05 — carried brief absent from train base

- **What:** The requested brief path is absent from `canary/0.0.5-canary.13`.
- **Source:** `find`/`git ls-tree`; historical commit `dd627fe3b` contains `implement.md`.
- **Expected:** Brief present at the named orchestration path.
- **Actual:** Recovered it read-only from history; live issue remains authority.
- **Severity:** minor
- **Action:** accept

## 2026-08-05 — predecessor fixture unavailable

- **What:** Historical brief expected reuse of a #1093 third-party fixture.
- **Source:** #1093 is open; no corresponding fixture exists on the canary.13 base.
- **Expected:** Reuse/extend predecessor fixture.
- **Actual:** #1189 must carry one fixture third-party plugin of its own.
- **Severity:** minor
- **Action:** accept

## 2026-08-05 — reusable generic dispatch fixture found

- **What:** Source research found an existing `@acme/plugin-fixture` unrelated to #1093.
- **Source:** `packages/cli/tests/fixtures/plugin-scaffolder/` and dispatch tests.
- **Expected:** Carry one new #1189 fixture because #1093 had not landed.
- **Actual:** Extend the existing ACME third-party fixture with linking and runnable entrypoints.
- **Severity:** minor
- **Action:** fix plan implementation shape; no parallel fixture created

## 2026-08-05 — live runtime proof blocked by foreign AppHosts

- **What:** The brief requires exactly one AppHost at a time for runtime and OTEL evidence.
- **Source:** `agentic:leak-check` found two foreign planning-board AppHosts and one foreign CLI E2E AppHost.
- **Expected:** Start the fresh ACME fixture scaffold, call catalog→fixture, and capture telemetry.
- **Actual:** Starting another AppHost would violate resource safety; foreign resources were not touched.
- **Severity:** blocking for acceptance box 5 only
- **Action:** keep box 5 unticked and state the precise missing live evidence
