**S3 docs review: PASS.** I found no factual, public-surface or missing-proof blockers. I checked all three changed files against the S1/S2 code, read-only, and did not run the snippet compiler or the docs format and link gates.

**Every item you listed is covered and matches the code.**
- **Retry declarations:** handler-declared `retry` via `Object.assign(handler, { id, retry })` and the builder `.retry(...)` example are both documented.
- **Retry counts:** `maxRetries` is described as retries after the first attempt, and `0` still runs once.
- **Limits and defaults:** 0 to 100 retries, a 3-retry default, `delayMs` falling back to `retryDelay` then 1,000 ms, and `maxDelayMs` defaulting to 300,000 ms but never below `delayMs`.
- **Backoff:** the fixed, linear and exponential formulas match `jobRetryDelay`. The example's waits of 1,000 ms then 2,000 ms are correct.
- **Precedence:** handler `retry` comes first, then `metadata.retry`, then `maxRetries`/`retryDelay`, then defaults. The handler also wins over explicit group fields.
- **Dead letters:**
  - **Default store and namespace:** the default is `KvDeadLetterStore` under `workers:job-dlq:<queue>`, and it can be replaced with `WorkerOptions.deadLetters`.
  - **Port:** the four methods are `append`, `list`, `reprocess` and `depth`.
  - **Recorded data:** `deliveryCount` holds the real attempt count, and missing or disabled jobs are recorded as `unroutable` with 0 attempts.
  - **Retention:** records stay until reprocessed; the KV store sets no expiry.
- **Ordering:** the dead-letter write happens before the message is acknowledged, and a failed write puts the message back on the queue with the claim released.
- **Timeout, cancel and shutdown:** these are described as implemented.
- **Health:**
  - Depth is read from storage on every request.
  - A nonzero depth doesn't make a ready worker unavailable.
  - If storage can't be read, health shows `available: false` with depth null and returns HTTP 503 (`child-health-response.ts:19`).
- **Time budget:** the formula and the numbers are right: a 30-second KV polling visibility timeout and a 15-minute claim lifetime, set by `NETSCRIPT_WORKERS_IDEMPOTENCY_ACTIVE_TTL_MS`. The warning's "about 20 minutes when failures occur near each deadline" is also right, since a timeout itself is not retried.
- **Public imports:** the examples only use exports that exist. `@netscript/plugin-workers/worker` provides `Worker` and `JobMessage`. The core package root provides `defineJob` and `defineJobHandler`. `Worker.deadLetters` and `readHealthStatus()` are public.
- **READMEs:** both link to the recipe. The core README says `InProcessJobRunner.dispatch()` runs only one attempt and that the plugin owns delivery retries, dead letters and acknowledgment.

**Advisories (not blocking).**
1. "Both registry generators validate the declaration" is slightly overstated. Generation doesn't validate; `jobRetryRegistration` validates when the generated registry module is loaded. The effect is the same, since an invalid policy fails loudly at registry load. Wording like "the generated registry validates it on load" would be more exact.
2. The rewritten timeout-and-retries warning sits under "Step 3 — Set task runtime, timeout and retries" but now talks about jobs. The earlier guidance about task wall time is gone. Moving the job budget warning into the new job section, or keeping a line for tasks, would read more clearly.

VERDICT: PASS
