# Worklog: dev probe startup budget

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-dev-probe-startup-budget--1868` |
| Branch | `fix/dev-probe-startup-budget` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- Internal E2E script entry point remains the same.
- `waitForFreshDevServer` is exported only as a focused-test seam inside the nested E2E workspace.

### Domain Vocabulary

- Startup/preflight phase — dependency closure and verification through the Vite readiness banner.
- HTTP readiness phase — bounded root fetch attempts after Vite starts.
- Child exit — terminal process status that preempts either budget.

### Ports

- Injected startup signal, child-status promise, fetch function, clock, and sleep function are the exercised testability seam.

### Constants

- `DEV_STARTUP_BUDGET_MS` — 180,000 ms host-tolerant preflight/startup tier.
- `FRESH_HTTP_READINESS_BUDGET_MS` — 60,000 ms reserved HTTP readiness budget.
- `HTTP_POLL_INTERVAL_MS` — 250 ms polling interval.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | RED regression proves current probe lacks phase/budget seam | focused structured test wrapper (expected RED) | focused test + run dir |
| 2 | GREEN phase-aware probe preserves child exit and truthful reporting | focused structured wrappers | probe + run dir |

### Deferred Scope

- Verifier optimization/memoization and dependency-closure implementation are explicitly out of scope.
- Canonical scaffold runtime Flow-B remains hosted-CI-owned because this leaf has no runtime lease.

### Contributor Path

Start with the colocated test, add a deterministic dependency through the options seam, then wire only the script entry point after preserving byte-for-byte output mirroring.

## PLAN-EVAL

N/A before implementation: issue #1868 fully specifies the measured defect, exact ceiling, minimum budget, behavior, messages, and gate constraints; the plan leaves no rework-forcing decision open.

## Progress Log

| Time (UTC) | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-09-01 | 1 | design | Exact probe/test/run-dir ceiling confirmed; no product file edited before this checkpoint. |
| 2026-09-01 | 1 | RED | Structured focused test exited 1: 0 passed, 3 failed, 3 total; every case reached the current top-level argument guard. |

## Gate Results

| Gate | Command | Exit | Result / notes |
| --- | --- | --- | --- |
| RED focused test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev_test.ts` | 1 | RED: 0 passed, 3 failed, 3 total (`uniqueFailures=1`); no product files changed. |

## Handoff Notes

- Evaluator should inspect phase separation, status races, truthful diagnostics, and confirm `deno.lock` stayed unchanged.
