# Drift Log: sagas-durable-store

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-06-20 — Repo-wide architecture check baseline remains red

- **What:** `deno task arch:check` exits 1 during the final validation sweep.
- **Source:** Final sweep command output from `deno task arch:check`.
- **Expected:** The approved plan listed `deno task arch:check` in the gate set.
- **Actual:** The command reports `FAIL=58 WARN=143 INFO=1`, dominated by pre-existing repo-wide
  doctrine debt outside this slice, especially CLI/plugin abstract classes without abstract members
  and CLI tests using Jest/Vitest globals. It also reports existing warnings in many unrelated
  package/tooling paths.
- **Severity:** significant
- **Action:** defer
- **Evidence:** Representative failing paths include `packages/cli/src/**`,
  `packages/plugin/src/abstracts/**`, `packages/plugin-workers-core/src/abstracts/workers-command.ts`,
  `plugins/workers/src/cli/commands.ts`, and `plugins/triggers/src/cli/commands.ts`. Slice-owned
  package checks, tests, lint/fmt, raw publish dry-runs, and JSR audits are green.
