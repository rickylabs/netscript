# Worklog

## Design

- **Public surface:** no new exports; the existing `createRuntimeTriggerProcessor` behavior changes only for `TriggerActionResult` values with `kind: 'defer'`.
- **Domain vocabulary:** `DeferAction` is the existing action shape `{ kind: 'defer'; until: string }`; `TriggerProcessResult.status === 'dlq'` is the explicit rejection outcome for unsupported runtime dispatch.
- **Ports:** existing `TriggerDlqPort`, `TriggerIdempotencyPort`, and worker queue dispatch remain the only consumed runtime ports.
- **Constants:** no new finite values; the unsupported operation id is `trigger-action.defer`.
- **Commit slices:** S2 changes `plugins/triggers/src/runtime/trigger-runtime-processor.ts`, adds `plugins/triggers/src/runtime/trigger-runtime-processor_test.ts`, records debt/drift/worklog evidence, and is proved by plugin test/check/lint plus lockfile diff.
- **Deferred scope:** actual one-shot deferred action replay is deferred because the action contract carries only `until` and no replay target or job payload, and the existing cron path schedules recurring trigger definitions rather than one-shot handler action replay.
- **Contributor path:** implement future deferred dispatch by adding a package-owned scheduler/replay port to the trigger runtime contract, then wire `DeferAction.until` to that port and update this regression test from DLQ rejection to dispatch scheduling.

## Implementation

- Files changed:
  - `plugins/triggers/src/runtime/trigger-runtime-processor.ts`
  - `plugins/triggers/src/runtime/trigger-runtime-processor_test.ts`
  - `.llm/harness/debt/arch-debt.md`
  - `.llm/tmp/run/cap-s2-defer/drift.md`
  - `.llm/tmp/run/cap-s2-defer/worklog.md`
  - `.llm/tmp/run/cap-s2-defer/commits.md`
- Decision: option (b), hard reject/log-and-reject through the existing processor DLQ path.
- Contract evidence:
  - `packages/plugin-triggers-core/src/domain/trigger-action.ts` defines `DeferAction` as `{ kind: 'defer'; until: string }`.
  - `packages/plugin-triggers-core/src/builders/define-webhook.ts` exposes `enqueueJob(...)` but no public `defer(...)` builder or replay target.
  - `packages/plugin-triggers-core/src/runtime/trigger-processor.ts` already reports handler actions containing `defer` as `deferred`, but the plugin runtime had returned early before dispatching or rejecting.
  - `plugins/triggers/src/runtime/cron-trigger-scheduler-adapter.ts` schedules recurring trigger definitions, not one-shot action replay for a processed event.
- Result: `defer` actions now throw `TriggersError.unsupportedOperation('trigger-action.defer', ...)`; `TriggerProcessor` moves the event to DLQ and returns `status: 'dlq'`, so the capability is no longer silently dropped.

## Gates

| Gate | Command | Result |
| --- | --- | --- |
| Focused regression | `rtk proxy deno test --allow-all --unstable-kv plugins/triggers/src/runtime/trigger-runtime-processor_test.ts` | PASS |
| Plugin tests | `rtk proxy deno test --allow-all --unstable-kv plugins/triggers` | PASS, 7 passed / 12 ignored |
| Scoped check | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/triggers --ext ts,tsx` | PASS, 55 files / 0 diagnostics |
| Scoped lint | `rtk proxy deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/triggers --ext ts,tsx` | PASS, 55 files / 0 diagnostics |
| Lockfile diff | `rtk git diff --stat origin/main -- deno.lock` | PASS, empty |

