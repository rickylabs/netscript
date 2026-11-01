# Independent PLAN-EVAL round2

**PASS** (round 2 of 2, feature tier, read-only). Implementation may begin.

This verdict covers the repaired run artifacts as they sit uncommitted in the working tree on top of `32893ad`. There is still no source diff against baseline `a410a815`. I wrote nothing, so the supervisor needs to commit these artifacts and record this verdict in `plan-eval.md`.

## Round-1 blockers

**B1 is resolved.** The plan's locked decisions now keep the published `listener.restartCount` and `childHealth.restartCount` cumulative, and keep the existing log wording. The resettable burst count goes in a new `restartBudgetUsed` field, documented on both `WorkerHealthStatus` and `WorkerListenerSnapshot`. The aggregate still sums the cumulative counts, and the research's JSR scan now lists the change as additive.

**B2 is resolved.** Slice 1 now names its files: eight under `plugins/workers/worker/`, plus `docs/site/background-processing/how-to/tune-worker-runtime.md`. I checked that the docs file and the `.llm/tools/run-deno-test.ts` wrapper both exist. The required assertions are all in the plan:
- **Every family:** jobs, tasks and triggers each put the fixed cause text into `worker.healthStatus.childHealth.lastFatalError.message`, which is the surface `onStarted` reads. Serialized health must hold no secrets, URLs or stacks.
- **Lifetime count:** the aggregate lifetime count stays put after `restartBudgetUsed` resets.
- **Redis:** the test drives a real `RedisAdapter` `queue.listen` with BRPOPLPUSH denied and restored through ACL. It needs more refusals than `maxRestarts`, spaced beyond the healthy window, with a real message delivered after recovery. It coordinates on promises, not wall-clock timing.
- **Local KV:** a closed handle refuses writes, then a fresh attempt reopens and recovers.
- **Negative control:** restoring the old never-reset logic must make both the Redis and KV tests fail.
- **Command:** the exact command is named, gated on `NETSCRIPT_TEST_REDIS_URL`, and must run the Redis case for real rather than skip it.

## Round-1 advisories

All three are now handled:
- **Validation:** only the new window is validated. A `RangeError` is thrown early in the `Worker` constructor and also in the supervisor, both through one policy resolver. `listenerMaxRestarts` behaves exactly as before.
- **CLI reader:** keeping the cause through the CLI/Aspire child-health reader is deferred. The claim is limited to the HTTP route and Worker snapshots.
- **Redis abort callbacks:** the existing per-restart callback build-up in `RedisAdapter.listen` is recorded as a pre-existing queue-adapter risk and left out of scope.

## Checklist

Every box passes:
- Research is current.
- Decisions are locked.
- The open-decision sweep is clean.
- Slices are ordered, fewer than 30 files, with named gates.
- The risk register is complete.
- The gate set is chosen.
- Deferred scope is explicit.
- jsr-audit is applied to the planned surface.

Scope constraints still hold: no #2144 dispatcher or execution edits, no dependency, lock or version changes, and the coordinator keeps labels, E2E and merge.

## Notes for IMPL-EVAL (not blockers)

- `Worker` has no `now` option. `worker-listener-health_test.ts` must say how it fakes the default monotonic clock, for example by confirming that the chosen fake-time tool actually patches `performance.now`.
- Validation must reject a `listenerHealthyResetMs` of `0`, `NaN` or `Infinity` before any listener starts.
