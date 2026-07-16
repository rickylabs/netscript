# Drift Log: issue #785 workers health-check execution

## 2026-07-16 — Parent harness identity unavailable in implementation checkout

- **What:** The owner assigned this as a Tier-D implementation slice, but the referenced parent orchestrator run and PLAN-EVAL artifact are not present on this branch, and the current session does not expose a concrete daemon thread id/steering command.
- **Source:** Direct owner brief; `.llm/runs` filesystem inspection; session environment inspection.
- **Expected:** Parent run artifacts plus daemon-managed Tier-D identity and PLAN-EVAL evidence are locally readable.
- **Actual:** Only the owner implementation brief is available as authorization. This lane can keep its own worklog but cannot substantiate parent evaluator/session metadata.
- **Severity:** significant
- **Action:** accept for this owner-authorized implementation lane; do not claim PLAN-EVAL or mobile attachment; require separate IMPL-EVAL before merge.
- **Evidence:** `supervisor.md`; initial repository/session inspection.

## 2026-07-16 — Canonical E2E port is owned outside WSL

- **What:** The full cleanup acceptance run now loads the corrected health-check module, but its users callback resolves to the fixture-fixed `http://localhost:3001`, which is owned by a Windows-side `sco-web` process and returns 404.
- **Source:** Canonical E2E run, `aspire describe`, direct RPC probes, and read-only Windows TCP/process inspection.
- **Expected:** Aspire's users proxy owns port 3001 and serves `/api/rpc/v1/users/health/check`.
- **Actual:** `sco-web` owns `0.0.0.0:3001`; the unrelated endpoint returns 404. The generated users process is healthy on Aspire's assigned target port and returns 200 for the identical RPC request.
- **Severity:** significant
- **Action:** do not stop the unrelated process without owner authority and do not weaken or commit a test-port workaround. Canonical acceptance remains blocked until port 3001 is free.
- **Evidence:** `services__users__http__0=http://localhost:3001`; Windows PID 9188 (`sco-web`); users target response 200 versus discovery URL 404.

## 2026-07-16 — Concurrent edits overlapped acceptance diagnostics

- **What:** During a temporary port-isolated diagnostic run, another workspace actor edited three Flow-B E2E source files and extended `job-execution_test.ts`.
- **Source:** Git diff observed while the E2E command was running.
- **Expected:** Acceptance runs against a stable committed source tree.
- **Actual:** The generated workspace was assembled while its source fixture changed and failed `generated.deno-check`; the edits remain uncommitted and are not owned by this lane.
- **Severity:** significant
- **Action:** preserve the edits, do not commit or revert them, and invalidate that diagnostic run as gate evidence. Re-run after their owner settles the changes.
- **Evidence:** dirty paths listed in the worklog; diagnostic summary 20 passed / 1 failed at generated type-check.
