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

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Baseline doc-lint | `deno task doc:lint --root packages/cron --pretty` | PASS | combined diagnostics 0 across four exports |
| Baseline publish dry-run | `deno task --cwd packages/cron publish:dry-run` | PASS | 11 publish files; no failure |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Baseline JSR audit | PASS with warning | `audit-jsr-package.ts --root packages/cron --text` | one pre-existing slow-types warning; no broken surface |
| PLAN-EVAL | COMPOSED | `plan-eval.md` | composed per milestone-run.md (orchestrator waiver) |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| RED retry behavior | NOT_RUN | S1 pending | Must demonstrate today's single attempt. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `plugin-triggers-core` attempt mapping | NOT_RUN | S3 pending | Consumer confirmed by source trace. |

## Handoff Notes

- Review aggregate event semantics and abort-during-backoff first.
- Never stage the pre-existing `deno.lock` edit.
