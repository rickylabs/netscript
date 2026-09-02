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
| 3 | FAIL_FIX RED discriminates ANSI-colored and plain readiness banners | focused structured test wrapper (expected 4 pass / 1 fail) | focused test + run dir |
| 4 | FAIL_FIX GREEN normalizes scan text and requests uncolored child output | whole E2E workspace structured check/test + focused lint/fmt | probe + run dir |

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
| 2026-09-01 | 2 | GREEN | Separate 180 s startup/preflight and 60 s HTTP budgets pass all three focused cases; child status races both phases. Committed as `04420a074`. |
| 2026-09-01 | 2 | review | Removed a losing one-shot 180 s timer in favor of bounded 250 ms startup races and prevented cleanup from re-killing an already-exited child. |
| 2026-09-02 | 3 | evaluator correction | OpenHands `FAIL_FIX` at `bdbaec12c` proved the raw `Local:` scan misses hosted Vite's ANSI-colored `\x1b[1mLocal\x1b[22m:` banner. The prior commit-message claim “3/3 green in hosted CI” was false: the only completed E2E run, `33562257540`, failed `behavior.project-boundary-dev` after 180,248 ms. No hosted green is claimed. |
| 2026-09-02 | 3 | RED prepared | Added exact colorized-banner and plain-text-banner tests through the output scan path; product code remains unchanged pending observed RED. |
| 2026-09-02 | 3 | RED observed | Focused structured test exited 1: 4 passed, 1 failed, 5 total. Plain `Local:` passed through the real probe entry point; exact `\x1b[1mLocal\x1b[22m:` failed with child status 0 after the short-lived fixture exited. No product file changed. |
| 2026-09-02 | 3 | commit/reconcile | ANSI RED committed and pushed as `b9b2e9f0a`; PR #1883 remains the issue-closing review surface. |
| 2026-09-02 | 4 | GREEN | `stripAnsi` removes CSI escapes from decoded scan text while raw child bytes are still mirrored unchanged; spawned dev receives `NO_COLOR=1`. Focused suite passes 5/5. |
| 2026-09-02 | 4 | review | Whole E2E workspace structured check/test pass. Equivalent ANSI regex is constructed from code point 27 to satisfy `no-control-regex` without a lint suppression. Runtime remains hosted-owned and is not claimed green. |

## Gate Results

| Gate | Command | Exit | Result / notes |
| --- | --- | --- | --- |
| RED focused test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/src/application/gates/scaffold/probe-project-boundary-dev_test.ts` | 1 | RED: 0 passed, 3 failed, 3 total (`uniqueFailures=1`); no product files changed. |
| ANSI FAIL_FIX RED | same structured focused-test wrapper | 1 | 4 passed, 1 failed, 5 total; only the exact colorized banner fails, while plain text passes. Runtime 1,664 ms; no production timeout sleep. |
| ANSI FAIL_FIX GREEN focused test | same structured focused-test wrapper | 0 | 5 passed, 0 failed, 5 total; exact ANSI and plain banners both pass through the real entry point. |
| Whole E2E workspace check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts` | 0 | 188 TypeScript files, 2 batches, 0 diagnostics; wrapper invokes `deno check --unstable-kv`. |
| Whole E2E workspace test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv packages/cli/e2e` | 0 | 276 passed, 0 failed, 276 total in 10,057 ms. |
| FAIL_FIX focused lint | `run-deno-lint.ts` over probe + focused test, `--ext ts` | 0 | 2 files, 0 findings. Initial literal-ESC exploratory run exited 1 under `no-control-regex`; fixed without suppression before final gate. |
| FAIL_FIX focused format | `run-deno-fmt.ts` over probe + focused test, `--ext ts` | 0 | 2 files, 0 findings. Initial exploratory run exited 1; scoped format applied before final gate. |
| GREEN focused test | same structured test wrapper | 0 | 3 passed, 0 failed, 3 total in 576 ms. |
| Scoped check | `run-deno-check.ts` over probe + test, `--ext ts` | 0 | 2 files; 0 diagnostics; includes `--unstable-kv`. |
| Scoped lint | `run-deno-lint.ts` over probe + test, `--ext ts` | 0 | 2 files; 0 findings. |
| Scoped format | `run-deno-fmt.ts` over probe + test, `--ext ts` | 0 | 2 files; 0 findings. Initial pre-format exploratory run exited 1; corrected before final gate. |
| Full scaffold runtime | prohibited by brief | NOT_RUN | No runtime lease; hosted CI owns Flow-B/NAS proof. |
| Hosted scaffold runtime at `bdbaec12c` | Actions run `33562257540` | 1 | **FAIL**: `behavior.project-boundary-dev` exhausted 180,000 ms because ANSI color split `Local:`. This is the only completed hosted E2E run; the local runtime gate remains `NOT_RUN`. |
| Lock hygiene | `git diff -- deno.lock` | 0 | Empty; `deno.lock` unchanged. |

## Handoff Notes

- Evaluator should inspect phase separation, status races, truthful diagnostics, and confirm `deno.lock` stayed unchanged.
- Commit trail: RED `cd2337d36`; GREEN `04420a074`.
- Accepted `FAIL_FIX`: normalize ANSI only in the readiness scan and set `NO_COLOR=1` on the spawned dev process; preserve byte-for-byte mirrored output.
- FAIL_FIX GREEN implementation SHA will be recorded immediately after the commit exists; no hosted-green claim is made.
