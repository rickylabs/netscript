# Worklog: cron retry/backoff contract

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-cron-retry-backoff-contract--w4-d` |
| Branch | `fix/cron-retry-backoff-contract` |
| Archetype | `2 — Integration` |
| Scope overlays | `docs` |

## Design

### Public Surface

- Existing `ScheduleOptions.backoff` and `ScheduleOptions.maxRetries` — retained, clarified, honored.
- Existing `JobContext.attempt` — zero-based handler-attempt index.
- Existing `JobExecutionResult.attempt` — terminal handler-attempt index on the aggregate event.
- No new export or entry point.

### Domain Vocabulary

- `maxRetries` — nonnegative count of retries after the initial attempt.
- `retryNumber` — one-based wait number between handler attempts.
- `attempt` — zero-based handler invocation index.
- aggregate invocation — one scheduled/manual trigger, possibly containing multiple handler attempts.

### Ports

- `CronScheduler` — unchanged package-owned scheduler port.
- `AbortSignal` on `JobContext` — existing cancellation seam reused by abortable backoff waits.
- No new port: fake time is provided by `@std/testing` and production waits use `@std/async`.

### Constants

- Backoff variants remain the finite union `fixed | exponential | linear`.
- Default exponential multiplier is locked to `2`; default retry count is `0`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| S0 | Harness bootstrap and locked decision | composed PLAN-EVAL waiver | run artifacts |
| S1 | RED provider retry contract | expected focused-test failure | cron retry tests + run artifacts |
| S2 | Shared retry/cancellation behavior | focused cron suite green | shared helper, both adapters, types/tests, run artifacts |
| S3 | Docs and consumer contract | docs/doc-lint/consumer gates | manual/JSDoc/consumer evidence + run artifacts |
| S4 | Full A2 gate column | all merge-readiness gates green | run artifacts/PR evidence |

### Deferred Scope

- Queue/task retries — separate contracts.
- Deno KV cron provider — no such adapter exists; new-provider design is not #1104.
- Per-attempt listener events — aggregate compatibility is intentionally retained.

### Contributor Path

Retry semantics live in `packages/cron/adapters/_shared.ts`; adapters retain schedule policy and
delegate every invocation there. Extend policy math beside its table-driven fake-time tests, then
run the same test matrix against both provider factories.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-04 14:12 +02:00 | S0 | research/design | Live issue, consumers, doctrine A2, baseline JSR surface, and contract decision re-derived. |
| 2026-08-04 14:12 +02:00 | S0 | plan gate | Composed per `milestone-run.md` (orchestrator waiver); plan locked for same-run implementation. |
| 2026-08-04 14:23 +02:00 | S1 | RED provider contract | Added one fake-time retry contract applied to memory and captured native Deno callbacks; both providers expose only attempt `0`. |
| 2026-08-04 14:34 +02:00 | S2 | shared retry runtime | Retained adapter policy snapshots, added the shared abortable retry loop, and turned the dual-provider fake-time matrix green. |
| 2026-08-04 14:38 +02:00 | S2 | supervisor review | Centralized policy snapshots, added explicit stop-during-backoff coverage for both providers, and independently reran the slice gates. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Implement published behavior | Stable surface + docs + scheduled-trigger consumer | plan D1 / live code |
| Aggregate terminal events | Preserve existing event cardinality | plan D4 / `_shared.ts` |
| Existing provider parity | Package has memory and native Deno adapters, not Deno KV | plan D6 / package tree |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Live issue says Deno KV provider; package has native Deno.cron provider | significant | yes |
| Local formal PLAN-EVAL waived by milestone D6 | minor/process | yes |
| Attached thread resumed at low rather than requested high effort | minor/process | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline doc-lint | `deno task doc:lint --root packages/cron --pretty` | PASS | combined diagnostics 0 across four exports |
| Baseline publish dry-run | `deno task --cwd packages/cron publish:dry-run` | PASS | 11 publish files; no failure |
| S1 test formatting | `run-deno-fmt.ts --file packages/cron/tests/retry-backoff_test.ts --ext ts --pretty` | PASS | 1 file selected; 0 findings |
| S2 scoped check | `deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cron --ext ts --deno-arg --no-lock --deno-arg --unstable-cron --pretty` | PASS (exit 0) | 14 files selected; 0 diagnostics; wrapper supplied `--unstable-kv` |
| S2 scoped lint | `deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cron --ext ts --pretty` | PASS (exit 0) | 14 files selected; 0 occurrences |
| S2 scoped format | `deno run --no-lock --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cron --ext ts --pretty` | PASS (exit 0) | 14 files selected; 0 findings |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Baseline JSR audit | PASS with warning | `audit-jsr-package.ts --root packages/cron --text` | one pre-existing slow-types warning; no broken surface |
| PLAN-EVAL | COMPOSED | `plan-eval.md` | composed per milestone-run.md (orchestrator waiver) |
| S2 code-quality scan | PASS (exit 0) | `deno run --no-lock --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/cron` | no findings or allowances |
| S2 doctrine readiness | PASS (exit 0) | `deno run --no-lock --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/cron` | no failures; one pre-existing README example warning and one architecture-doc info item |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| RED retry behavior | EXPECTED FAIL (exit 1) | `rtk proxy deno test --unstable-cron packages/cron/tests/retry-backoff_test.ts` | `0 passed | 2 failed`; both `MemoryCronAdapter` and `DenoCronAdapter` produced actual attempts `[0]` where `[0, 1]` was expected after advancing fake time by 25 ms. Native coverage used a captured `Deno.cron` callback and registered no real work. |
| S2 retry matrix | PASS (exit 0) | `rtk proxy deno test --no-lock --unstable-cron packages/cron/tests/retry-backoff_test.ts` | Supervisor rerun: `12 passed | 0 failed (235ms)`; both providers cover success, exhaustion, fixed/exponential/linear sequences, max cap, registration abort, shutdown, and aggregate accounting. |
| S2 cron suite | PASS (exit 0) | `rtk proxy deno test --no-lock --unstable-cron packages/cron/tests/` | Supervisor rerun: `22 passed | 0 failed (702ms)` |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `plugin-triggers-core` attempt mapping | NOT_RUN | S3 pending | Consumer confirmed by source trace. |

## Handoff Notes

- S2 was supervisor-reviewed from local agent commit `75941c216`; the sign-off commit is recorded in
  the PR slice comment.
- Both adapters snapshot their schedule policy and delegate retry execution, backoff math, abortable
  `@std/async` waits, and aggregate terminal bookkeeping to the internal shared executor.
- The first check-wrapper attempt exited `1` before checking source because `--unstable-kv` was
  supplied twice; the corrected canonical invocation above exited `0` with zero diagnostics.
- No public export or documentation changed in S2; consumer/docs work remains S3.
- The agent commit and supervisor staged diff contain no `deno.lock` change. The supervisor's
  pre-existing unstaged lock edit remains excluded and must not be staged.
