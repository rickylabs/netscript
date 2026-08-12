# Drift Log: #1227 Quickstart Aspire restore retry

## 2026-08-12 — retry support is already live on current main

- **What:** The carried brief says `retry:` is used by zero gates and may not be honored.
- **Source:** `packages/cli/e2e/src/application/gates/command-gate.ts`, runtime gates, and tests.
- **Expected:** First consumer with uncertain runner support.
- **Actual:** The runner honors the policy; `runtime.aspire-restore` already consumes it.
- **Severity:** minor.
- **Action:** accept the newer baseline and reuse the working mechanism; do not reimplement it.
- **Evidence:** `origin/main@7aa4aadfd`; `command-gate_test.ts` retry tests.

## 2026-08-12 — package test task is cwd-sensitive

- **What:** The required `deno task --cwd packages/cli test` command fails three tests that use
  repo-root-relative docs/script paths.
- **Source:** Exact package task output.
- **Expected:** Package task green.
- **Actual:** 791 passed / 3 failed; root-cwd `deno test --allow-all --quiet packages/cli` passes
  794/794, including every changed test.
- **Severity:** minor.
- **Action:** report; do not expand this P0 retry slice into unrelated test-path cleanup.
- **Evidence:** failures in `run-documented-stream-example_test.ts`,
  `service-env-gates_test.ts`, and `quickstart-command-drift_test.ts`.
