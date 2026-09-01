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
| 2026-09-01 | 1 | commit/reconcile | RED committed as `cd2337d36`; pushed by explicit refspec; draft PR #1883 opened with `Closes #1868`, required taxonomy/milestone, and unticked acceptance. Issue remains open at `status:impl`. |
| 2026-09-01 | 2 | GREEN | Separate 180 s startup/preflight and 60 s HTTP budgets pass all three focused cases; child status races both phases. |
| 2026-09-01 | 2 | review | Removed a losing one-shot 180 s timer in favor of bounded 250 ms startup races and prevented cleanup from re-killing an already-exited child. |

## Gate Results

| Gate | Command | Exit | Result / notes |
| --- | --- | --- | --- |
| RED focused test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev_test.ts` | 1 | RED: 0 passed, 3 failed, 3 total (`uniqueFailures=1`); no product files changed. |
| GREEN focused test | same structured test wrapper | 0 | 3 passed, 0 failed, 3 total in 576 ms. |
| Scoped check | `run-deno-check.ts` over probe + test, `--ext ts` | 0 | 2 files; 0 diagnostics; includes `--unstable-kv`. |
| Scoped lint | `run-deno-lint.ts` over probe + test, `--ext ts` | 0 | 2 files; 0 findings. |
| Scoped format | `run-deno-fmt.ts` over probe + test, `--ext ts` | 0 | 2 files; 0 findings. Initial pre-format exploratory run exited 1; corrected before final gate. |
| Full scaffold runtime | prohibited by brief | NOT_RUN | No runtime lease; hosted CI owns Flow-B/NAS proof. |
| Lock hygiene | `git diff -- deno.lock` | 0 | Empty; `deno.lock` unchanged. |

## Handoff Notes

- Evaluator should inspect phase separation, status races, truthful diagnostics, and confirm `deno.lock` stayed unchanged.
- Commit trail: RED `cd2337d36`; GREEN SHA will be recorded immediately after the GREEN commit exists.
