# Drift Log: #1227 Quickstart Aspire restore retry

## 2026-08-12 — retry support is already live on current main

- **What:** The carried brief says `retry:` is used by zero gates and may not be honored.
- **Source:** `packages/cli/e2e/src/application/gates/command-gate.ts`, runtime gates, and tests.
- **Expected:** First consumer with uncertain runner support.
- **Actual:** The runner honors the policy; `runtime.aspire-restore` already consumes it.
- **Severity:** minor.
- **Action:** accept the newer baseline and reuse the working mechanism; do not reimplement it.
- **Evidence:** `origin/main@7aa4aadfd`; `command-gate_test.ts` retry tests.

