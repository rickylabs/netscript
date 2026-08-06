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

## 2026-08-06 — runtime slot became available

- **What:** The earlier resource-safety blocker cleared; no AppHost was active at the new preflight.
- **Source:** `aspire ps --format json` returned `[]`; refreshed `agentic:leak-check` listed only
  foreign/unproven containers.
- **Expected:** Preserve the blocker until a safe one-AppHost proof was possible.
- **Actual:** A narrow run-owned root could start exactly one isolated AppHost, so the previously
  deferred live service→fixture call and correlated telemetry were completed.
- **Severity:** resolves prior acceptance blocker
- **Action:** replace the obsolete limitation with exact RED/GREEN and trace/span artefacts

## 2026-08-06 — fixture runtime permissions were under-declared

- **What:** The first post-install start reached the generic linking seam, but the third-party
  fixture process exited because its manifest allowed only read/write and could not read `PORT`.
- **Source:** Aspire resource log: `NotCapable: Requires env access to "PORT"`.
- **Expected:** A fixture that declares a runnable HTTP service also declares its runtime needs.
- **Actual:** The fixture manifest now declares net/env/read/sys/write. No core permission branch or
  appsettings edit was added.
- **Severity:** acceptance-relevant fixture defect
- **Action:** fixed in the third-party declaration and reinstalled through the public CLI path

## 2026-08-06 — interrupted full gate is diagnostic only

- **What:** The first mandatory `scaffold.runtime` invocation reached cleanup but its controlling
  turn was interrupted before a raw exit/final summary was captured.
- **Expected:** A complete one-pass verdict with raw exit code.
- **Actual:** The exact full command was rerun from the repository root; the rerun reported
  `passed=73 failed=0`, exit `0`.
- **Severity:** procedural
- **Action:** cite only the completed rerun as merge-readiness evidence
