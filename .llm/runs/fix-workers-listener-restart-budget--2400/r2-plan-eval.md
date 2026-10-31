**PLAN-EVAL (R2 merge-compatibility): PASS.** The integration plan appended to `plan.md` can go ahead. This was a read-only review, so nothing was written; the supervisor needs to record this verdict in the run directory.

## What main changed since our last merge
Our branch is at `6597b6452`, which merged main `f89260ac9`. Current main is `592a446af`.
- **No worker runtime source changed.** `plugins/workers/worker/*` is untouched between those two main commits, including `worker-options.ts`, `worker.ts`, `queue-consumer.ts`, `job-dispatcher.ts` and `job-execution.ts`. So the healthy-window option, the restart budget and the cause wiring don't need to be reconciled again.
- **The load-bearing change is in the queue package.** `RedisAdapter.listen` now hands claims to a new `RedisListener` with a set number of concurrent handlers. `ListenOptions` gains `pollIntervalMs` and `delayedPollIntervalMs`. Concurrency still defaults to 1, and the drain timeout equals `visibilityTimeout` (default 30s).
- **Listener failures still reach the supervisor in a form it can classify.** A failed claim is still wrapped as a `QueueError` (`DEQUEUE_FAILED`) with the original error as its cause, and the adapter can be listened to again after a failure. At concurrency 1, our real-Redis test's sequence still forces the next claim to hit NOPERM:
  1. acknowledge the held delivery;
  2. deny EVAL/EVALSHA;
  3. queue the next message;
  4. release the handler.

## The merge conflicts
A trial merge (`git merge-tree`, no refs or working tree touched) conflicts in exactly three files:
- **`tune-worker-runtime.md`:** our listener-recovery section and main's new Redis pickup-latency section land in the same place. They don't contradict each other, so keep both. This sits inside the plan's "authored conflicts only".
- **The two generated files (prose bundle and MCP export corpus):** the plan regenerates them with the native tasks, which is correct. Main's `ListenOptions` additions have to come through the regenerated export corpus.

## Checklist
Every box passes:
- **Re-baselined:** against `592a446af`, and I spot-checked the queue and worker files above.
- **Decisions locked:** no new design or API.
- **Single slice, files named:** the slice and its write scope are listed in `supervisor.md` and `plan.md`. The Redis adapter, dispatcher and execution stay main's.
- **Gates chosen:**
  - focused supervisor tests, the real-store recovery tests and the all-family health tests;
  - worker runtime/public tests and main's Redis concurrency regressions;
  - check, lint and fmt, plus quality/architecture;
  - freshness and regression tests for the generated files.
- **Negative controls:** they are rerun only if the assertions change.
- **jsr-audit:** the public surface is unchanged from the approved additive contract.
- **Out of scope:** no dependency or lock changes, and no local scaffold.runtime. The coordinator owns the runtime-tier CI and labels.

## Advisory (not blocking; record in drift)
- **Draining after a Redis failure counts as healthy time.** After a listener failure, `RedisListener` waits for in-flight handlers to finish (up to `visibilityTimeout`) before `listen` rejects. The supervisor still sees the attempt as running during that wait. So if someone sets `listenerHealthyResetMs` below `visibilityTimeout` and concurrency is above 1 with work in flight, the budget can refill during that wait, and the listener retries instead of failing. Health still turns red through the shared crash-loop rule. The defaults (60s window, 30s drain) are not affected. Record this as a known interaction; don't change the design in this slice.
- **The deferred Redis abort-callback issue is fixed upstream.** Main now registers the abort handler once and removes it in `finally`. The plan's risk note calling this a pre-existing, deferred issue is now out of date, so mark it superseded by main in drift and don't claim it as this PR's fix.
