# IMPL-EVAL Verdict: S2 — Trigger Defer Rejection

**Verdict: PASS**

**Branch:** `fix/cap-caveat-s2-trigger-defer`
**Commit:** `b6a7de0a` — fix(triggers): dispatch (or reject) defer trigger actions instead of silent no-op

---

## Summary

S2 replaces the silent no-op for `defer` trigger actions with an explicit `TriggersError.unsupportedOperation('trigger-action.defer')` that routes the event to DLQ. The regression test proves this behavior and would catch a silent-drop regression. The reject decision is well-justified: `DeferAction` carries only `until: string` with no replay target or job payload, and no existing runtime path supports one-shot deferred dispatch. The cron scheduler handles recurring trigger definitions, and DLQ replay is a manual admin operation — neither provides one-shot action replay.

**Adversarial evaluator role: no authoring or fixing performed.**

---

## Changes (6 files, +161 / −1)

| File | Change |
|------|--------|
| `plugins/triggers/src/runtime/trigger-runtime-processor.ts` | `defer` branch now throws instead of silent `return` (+5/−1) |
| `plugins/triggers/src/runtime/trigger-runtime-processor_test.ts` | New regression test (97 LOC) |
| `.llm/harness/debt/arch-debt.md` | New debt entry for deferred trigger action scheduler |
| `.llm/tmp/run/cap-s2-defer/worklog.md` | Implementation worklog |
| `.llm/tmp/run/cap-s2-defer/drift.md` | Drift record (reject decision rationale) |
| `.llm/tmp/run/cap-s2-defer/commits.md` | Commits record (empty — minor artifact gap) |

**Diff scope:** Triggers plugin + test + harness artifacts only. No webhook/enqueue behavior change. Committed `deno.lock` diff vs `origin/main` is **empty**. (Uncommitted local deno.lock modifications exist in working tree but are not part of this branch.)

---

## Independent Contract Verification

1. **`DeferAction` shape:** Confirmed in `packages/plugin-triggers-core/src/domain/trigger-action.ts` — `DeferAction = Readonly<{ kind: 'defer'; until: string }>` — no job definition, no replay handler, no payload field.

2. **No `defer` builder:** Grep across `packages/plugin-triggers-core/src/builders/` returned no `defer` builder function. The action type is re-exported from the builders module barrel but has no construction helper.

3. **Cron scheduler is not a replay mechanism:** `CronTriggerSchedulerAdapter` schedules recurring trigger definitions using cron expressions and a `ScheduledHandler`. It is fundamentally a different primitive from one-shot deferred action dispatch for a processed event.

4. **DLQ replay is not one-shot action replay:** `TriggerDlqPort.replay(eventId)` replays entire dead-lettered trigger events by event ID — a manual admin operation, not scheduled deferred dispatch.

5. **No existing path missed:** The only place `defer` actions were handled was the silent `return` in the runtime processor, now replaced.

---

## Validation (all gates pass)

| Gate | Command | Result |
|------|---------|--------|
| Focused regression | `deno test --allow-all --unstable-kv plugins/triggers/src/runtime/trigger-runtime-processor_test.ts` | 1 passed |
| Plugin tests | `deno test --allow-all --unstable-kv plugins/triggers` | 7 passed, 12 ignored |
| Scoped check | `deno check` on `plugins/triggers` | 0 diagnostics |
| Scoped lint | `deno lint` on `plugins/triggers` | 0 diagnostics |
| Lockfile diff | `git diff origin/main...HEAD -- deno.lock` | Empty |

---

## Test Quality Assessment

The regression test is well-constructed:
- Asserts `status === 'dlq'` (not `'deferred'`, not `'completed'`) — catches silent-drop
- Asserts `actionsDispatched === 0` — confirms no partial dispatch
- Asserts DLQ entry exists with reason containing expected message string
- Asserts idempotency key is `completed` (not released) — correct for DLQ'd events
- Uses memory-backed idempotency and DLQ ports — no external dependencies
- The test would fail if someone reverted to `return` (silent no-op)

**Error semantics verified:** `UnsupportedOperationError` extends `TriggersError` with `retryable: false`. The core `TriggerProcessor`'s retry loop sees a non-retryable `TriggersError` and bypasses retries, sending directly to DLQ on the first attempt. This is correct — an unsupported operation should not be retried.

---

## Debt Entry Accuracy

The debt entry in `.llm/harness/debt/arch-debt.md` is accurate:
- **Reason:** Correctly identifies the missing scheduler/replay port
- **Target:** "Before advertising deferred trigger action dispatch as supported" — appropriate
- **Gate:** "Replace the S2 DLQ rejection test with a deferred-dispatch test after a package-owned scheduler/replay port is designed" — clear exit criterion
- **Linked plan:** References `.llm/tmp/run/cap-s2-defer/brief.md` — **file does not exist** (minor artifact gap, not a correctness issue)

---

## Responses to trigger comments

Per the evaluation criteria:

1. ✅ **`defer` raises `unsupportedOperation` and goes to DLQ:** Confirmed. `TriggersError.unsupportedOperation('trigger-action.defer', ...)` with `retryable: false`. Event DLQ'd with `status: 'dlq'`. Regression test proves this.

2. ✅ **Contract evidence verified:** `DeferAction = { kind: 'defer'; until: string }` — independently read. No replay target, no job payload, no builder. No existing one-shot replay path missed.

3. ✅ **Debt entry is accurate:** Describes the gap, the current behavior (DLQ rejection), the target, and the gate to close it.

4. ✅ **Diff is scoped:** 2 source files (processor + test), 4 artifact files. No webhook/enqueue change. `deno.lock` unchanged in committed diff.

---

## Remaining Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Missing `brief.md` | Low | Debt entry links to a file that doesn't exist. Not a merge blocker. |
| Empty `commits.md` | Low | Run artifact gap; commit is visible in git history. |
| `status: 'deferred'` unreachable from plugin | Informational | Core processor can still return `'deferred'` if a custom `dispatchAction` handles defer. Plugin path always DLQs. Honest behavior. |

**Verdict rationale:** PASS — the reject path is correct, honest, well-tested, and accurately documented. The implementation is merge-ready.
