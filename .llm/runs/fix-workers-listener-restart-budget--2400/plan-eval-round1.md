# Independent PLAN-EVAL round1

**FAIL_PLAN** (round 1 of 2, feature tier, read-only)

Evaluated head: `32893ad` (run artifacts only, no source diff against baseline `a410a815`). I did not write `plan-eval.md` because this pass is read-only, so the supervisor needs to record this verdict.

## Plan-gate checklist

| Box | Result |
|---|---|
| Research present and current | ✅ Re-baselined on `a410a815`. The facts I spot-checked hold: `restartCount` counts for the whole process life (`listener-supervisor.ts:116`); there are separate supervisor constructions for jobs (`worker.ts:204`) and for tasks/triggers (`queue-consumer.ts:80`); crash-loop health recovers after a clean 60s (`child-health-monitor.ts:105`); `onStarted` exposes only the aggregate `childHealth` (`bin/runtime.ts:175`) |
| Decisions locked | ⚠️ See B1 |
| Open-decision sweep | ✅ apart from the advisory notes below |
| Commit slices | ❌ See B2 |
| Risk register | ✅ |
| Gate set selected | ✅ manual (no F-ids cited, acceptable) |
| Deferred scope explicit | ✅ |
| jsr-audit | ❌ See B1 |

## Blockers

**B1: The plan quietly changes what a published field means.** `WorkerHealthStatus.listeners[].restartCount` is exported through `./worker` (`mod.ts:55`) and documented as "Number of restart attempts" (`worker.ts:61`). The plan redefines it as "budget used since last healthy interval". That leaves two fields with the same name and different meanings in one listener object (`listener.restartCount` and `listener.childHealth.restartCount`). It also changes the existing log line "after N restart(s)" (`worker.ts:415`). The research's JSR scan names only additive changes.
*Required:* choose one and record it in Locked decisions with a reason:
- (a) keep `restartCount` cumulative and add a new field for the budget, e.g. `restartBudgetUsed`; or
- (b) treat the redefinition as an explicit semantic change, update the JSDoc on `WorkerHealthStatus` and `WorkerListenerSnapshot`, fix the log wording, and list it in the jsr-audit surface notes.

**B2: Slice 1 doesn't name the tests that prove the issue's acceptance points, or the files it touches.** It says "under 20 files" without listing them, and gives categories of tests rather than the assertions. I checked that the cause can reach the health route: listener `childHealth.lastFatalError` → the latest-incident pick in `worker.ts:154` → `onStarted` → the terminal merge in `run-child-health-process.ts:55`. That only works if the supervisor overwrites the fixed message that `ChildHealthMonitor.#recordIncident` always writes. Nothing in the plan currently tests that path.
*Required:* name the test files (supervisor, Worker wiring, real KV, Redis ACL), the docs file path, and these assertions:
1. For each listener family (jobs, tasks, triggers), `worker.healthStatus.childHealth.lastFatalError.message` (the `onStarted` surface) equals the fixed category text after a categorized failure. Serialized health must contain no raw error text, URLs or stacks.
2. Aggregate `childHealth.restartCount` stays cumulative after the budget resets, even though the listener's budget dropped back.
3. The Redis ACL denial/restore test runs through the real listener path (a `Worker` with a supplied `RedisAdapter` queue, or at least `queue.listen`). Its failures must be spaced beyond `listenerHealthyResetMs`, with total failures greater than `listenerMaxRestarts`. After ACL restore, a message must actually be processed. The negative control must fail when the old never-reset logic is put back.
4. The exact env-gated command, using `NETSCRIPT_TEST_REDIS_URL`, that the local evidence will run.

## Advisory (not blocking; record as deferred or handle inline)

- **CLI reader drops the cause.** `packages/cli/src/kernel/adapters/aspire/child-health-reader.ts:49` replaces every `lastFatalError.message` with the generic redacted text. The cause will show on the HTTP route but not in CLI/Aspire readers. Add this to deferred scope so the claim that health now names the cause is limited to the route.
- **New validation is unspecified.** The plan doesn't say what happens to `listenerMaxRestarts` and `listenerHealthyResetMs` values that are accepted today but would become invalid (negative, NaN, fractional): which error type is thrown, and where.
- **Abort listeners pile up.** Each restart calls `listen(signal)` again on the same supervisor signal, and `RedisAdapter.listen` adds an abort listener it never removes (`redis.adapter.ts:171`). With budgets that refill, restarts over a process's life become unbounded. Record this as a risk deferred to the queue-adapter scope.

## Confirmed OK

- No edits to `job-dispatcher.ts` or `job-execution.ts` (#2144) are in scope.
- The healthy-window timing is sound: time spent in backoff is excluded, the budget is checked at failure time, and the 60s crash-loop recovery stays separate.
- The monotonic and epoch clocks are kept apart.
- The jobs, tasks and triggers wiring is fully listed, and there are no other `WorkerListenerSupervisor` constructions in source.
- Coordinator ownership of labels, expensive E2E and merge is respected.
