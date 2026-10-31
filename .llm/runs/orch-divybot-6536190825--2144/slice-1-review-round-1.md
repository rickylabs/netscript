**S1 supervisor review: CHANGES.** The core of S1 is sound, but I found two concrete blockers. I worked read-only and didn't run the suite; the numbers you quoted (47 passing, 4 Redis tests skipped) are taken as given.

### Blocker 1: Polyglot timeouts are retried and recorded as `failed`
This breaks the locked outcome table ("Per-attempt timeout: timeout, terminal, no restart") and the one-policy requirement.
- For polyglot jobs, the subprocess runner (`packages/plugin-workers-core/src/executor/adapters/dax-process-runner.ts:87`) reports a timeout as a returned result with `status: 'timeout'`. It does not throw.
- `executePolyglotTask` (`plugins/workers/worker/job-execution.ts`) drops that `status`, so the retry loop sees an ordinary `success: false` and retries it.
- In-process jobs time out by throwing `TimeoutError`, which `isJobAbort` treats as terminal. So the two job types now behave differently under the same retry policy.
- **Impact:** with the defaults (300 s timeout, 3 retries), a hanging polyglot job runs four times, about 20 minutes. That passes the 15-minute idempotency claim lifetime, and the job ends as `failed` instead of `timeout`.
- **Fix:** in `executePolyglotTask`, turn `result.status === 'timeout'` into a thrown `DOMException(..., 'TimeoutError')`, or another terminal signal the retry loop recognises. Add a polyglot test where the job times out once: it should run once, end as `timeout`, and record no retry wait.

### Blocker 2: The production listener's rethrow has no test
Shutdown replay depends on the new `throw error;` in `Worker.listenForJobs` (`plugins/workers/worker/worker.ts:312`). Without it, the main job listener still swallows the shutdown rejection, the queue acknowledges the message, and the message is lost. The real-KV replay test calls `processWorkerJob` directly with its own rethrowing callback, so it never runs the worker's callback. Undoing that line would not turn any test red, and the owner requires every part of the fix to have a test that fails when it's reverted.
- **Fix:** run the shutdown-during-backoff replay through the `Worker` job listener, for example a `Worker` on a KV polling queue with an injected retry clock that is stopped during the wait. Then record a negative control showing that removing the rethrow makes the test fail.

### Checked and fine
- **Retry policy:** the order is handler `retry` first, then builder `metadata.retry`, then the old `maxRetries`/`retryDelay` fields, then defaults. The schema allows 0 to 100 retries, safe-integer delays and `maxDelayMs` ≥ `delayMs`, and the exponential step is capped at 2^53 before the maximum delay applies. `maxRetries: 0` runs exactly once.
- **Retry loop:** user cancel, shutdown and in-process timeout all stop without another attempt. The wait between retries cancels its timer on abort, and the polyglot executor is given `maxRetries: 0` so retries aren't doubled.
- **Registry generators:** both now save handler retry into `maxRetries`, `retryDelay` and `metadata.retry`. The KV registry keeps `metadata`, so a handler's retry settings survive even though the handler function is stripped at registration. The generator test covers a configured group that omits retry fields.
- **Validation:** the builder's `.retry()` and KV registration both run the same validator.
- **Shutdown in the dispatcher:** the claim is released before the rethrow, so the redelivered message is not skipped as a duplicate. A user cancel is still acknowledged, which matches the table. The trigger-queue path (`queue-consumer.ts`) already passes the rejection through.

VERDICT: CHANGES
