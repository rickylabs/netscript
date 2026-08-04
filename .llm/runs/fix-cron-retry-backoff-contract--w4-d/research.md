# Research — fix-cron-retry-backoff-contract--w4-d

## Re-baseline

- Carried-in source: live issue #1104 and the W4-D owner brief.
- Re-derived against `origin/main` @ `3310f06f763381baac3eaf167794f3faafa4272e` on 2026-08-04.
- What changed vs the carried-in wording:
  - The published execution context is currently named `JobContext`, not
    `CronExecutionContext`; `attempt` remains present and exported.
  - The two concrete adapters are `MemoryCronAdapter` and native `DenoCronAdapter`
    (`Deno.cron`), not a Deno KV cron adapter. There is no Deno KV cron provider in the package.
  - `packages/cron` is explicitly assigned Archetype 2 (Integration) by doctrine, not Archetype 3.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The live issue has six unchecked acceptance boxes and was moved to milestone 0.0.5 because the contract decision and both adapters need a reviewed implementation. | GitHub issue #1104 body and 0.0.4 triage comment |
| 2 | `ScheduleOptions.backoff`, `ScheduleOptions.maxRetries`, `JobContext.attempt`, and `JobExecutionResult.attempt` are stable top-level exports. | `deno doc --filter ScheduleOptions packages/cron/mod.ts`; `packages/cron/mod.ts`; `ports/types.ts` |
| 3 | Neither adapter retains retry options; `_shared.ts` creates one context/result with `attempt: 0` and catches one handler failure. | `packages/cron/adapters/{memory,deno}.adapter.ts`; `packages/cron/adapters/_shared.ts` |
| 4 | Both concrete adapters delegate execution to `executeScheduledJob`, so one shared retry policy applier can keep provider behavior identical without adapter-specific policy branches. | both adapter call sites for `executeScheduledJob` |
| 5 | `packages/plugin-triggers-core` consumes the context attempt and copies it to scheduled `TriggerEvent.attempt`; removing the field would break a real consumer contract. | `packages/plugin-triggers-core/src/adapters/cron-trigger-scheduler-adapter.ts` |
| 6 | The manual promises fixed/exponential/linear backoff and a maximum retry count but does not lock defaults, exact formulas, or event aggregation. | `docs/site/data-persistence/kv-queues-cron.md` lines 263–281 |
| 7 | Existing listener cardinality is one terminal event per invocation: `jobRun` on success or `jobError` on failure. `ScheduledJob.runCount` increments once per invocation. | `_shared.ts`; `memory-adapter_test.ts` |
| 8 | The package doctrine verdict is Archetype 2 / Refactor. Its former AP-17 folder debt is closed; this slice must not broaden into another structural refactor. | doctrine file 10; `.llm/harness/debt/arch-debt.md` cron entry |
| 9 | Baseline JSR checks: full export-map doc-lint reports zero combined diagnostics; publish dry-run succeeds; the package audit reports one pre-existing slow-types warning. | baseline commands recorded in `worklog.md` |
| 10 | `deno.lock` had one foreign added queue dependency before this run began. | opening `git status`; `git diff -- deno.lock` |

## Contract-consumer decision

Retain and implement the published behavior. Removing or deprecating it would break the stable
surface, invalidate the manual, and erase a live `attempt` signal consumed by scheduled triggers.
Implementing in the existing shared execution boundary ends the accepted-but-ignored state while
preserving provider parity.

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: all four `packages/cron/deno.json` exports (`.`, `./adapters`, `./ports`,
  `./testing`) using `deno doc`, `doc:lint`, package JSR audit, and publish dry-run.
- Baseline: doc-lint combined diagnostics `0`; publish dry-run `PASS`; package audit warns once on
  slow-type checking but reports no broken export or missing file.
- Planned surface risk: no export is added or removed. JSDoc semantics on existing public options
  change, so full export-map doc-lint and package publish dry-run remain required.

## Open questions

- None that force rework. The issue's “Deno KV provider” wording is factually stale; the plan locks
  parity across the two providers that exist: memory and native `Deno.cron`.
