# Independent S1 slice review

**S1 slice review, IMPL-EVAL round 1 of 5 (working tree since `59ce4a0`)**

Evaluator: same session as the plan evaluation, `claude-opus-5-5`, high effort, read-only. I ran no tests and started no resources, wrote nothing, and did not read `profiles/` or run `scaffold.runtime` locally. This review covers the uncommitted working tree, including the untracked `_redis-listener.ts` and `redis-concurrency_test.ts`. It is not a frozen-head merge verdict.

### What checks out
- **Bounded admission.**
  - `RedisListener.run` claims only when `active.size < concurrency` and keeps one claim in flight at a time, so it never claims ahead of a free slot (`_redis-listener.ts:44-65`).
  - `concurrency` is checked with `leaseDuration`: a positive safe integer ≤ 2147483647, before `ensureLeases` allocates anything (`_redis-lease-state.ts:84`, `redis.adapter.ts:174`).
- **Claims committed after abort.**
  - The claim runs under the intake signal, but `whileAvailable` checks that signal only before each attempt, so a committed result is still returned and dispatched.
  - `abortable(..., settlement)` gives up waiting only when the drain expires, and the drain timer closes the lease generation in the same step.
  - `@std/async` 1.5.1 `abortable` removes its abort listener in `finally`, so polling every 10–50 ms does not pile up listeners.
- **Separate cancellation lifetimes.**
  - Settlement uses `settlement.signal`, so acks still go through during the drain.
  - When the drain expires, `settle` is refused through `whileAvailable`'s `throwIfAborted`. `extendVisibility` returns `false`, and `leases.stop()` fences later calls through the stopped connection.
  - The worker's `delivery-lease.ts:57-67` aborts the job when ownership is lost, so a sibling left behind after expiry doesn't keep running unnoticed.
- **Drain.**
  - The single `drainTimer` covers abort, stop, handler failure and a pending claim, and it is cleared in `run`'s `finally`. A guard on `intake.aborted` stops a second timer being created.
  - The `changed` promise is replaced on each wake and `active` removes each task as it finishes, so nothing grows on a long-running listener.
  - Every task has `.catch`, so there are no unhandled rejections.
- **Stop.**
  - Concurrent `stop()` calls share one completion.
  - A producer-only stop has no `listenerCompletion` and disconnects synchronously. Reading the code, that satisfies the `disconnects === 1` check made right after `stop()` in `redis-delayed-promotion-review_test.ts:219-220`.
  - A `stop()` awaited inside the handler is bounded by the drain budget, and its claim stays in place for recovery. That keeps the unchanged `'stop'` fixture's expectation of deliveryCount 2 (harness visibility 200 ms, `delivered()` waits 5 s).
- **Restart after an expired drain.** A closed generation clears `leaseRuntime`. The next `listen` reconnects the adapter's same `blocking` instance; ioredis `connect()` is allowed from the `end` status. Old contexts stay fenced because they hold the stopped `RedisLeaseConnection`.
- **Env and interval policy.**
  - Explicit values never read env.
  - Bad values in env fail with the variable's name; bad explicit values fail with the field name.
  - Denied env access (`NotCapable`) falls back to defaults, and any other error propagates.
- **Other plan items.**
  - Tracing: `TracedQueue` passes options through unchanged; there is no second wrapper.
  - File size: `redis.adapter.ts` is 466 lines, under the 500 limit.
  - Debt: the cardinality entry goes from 19 to 20 children, with the link and cost noted.
  - Docs: the README and tuning page describe the bounds as conditional, cover env permissions, say deploy `.env` doesn't inject the new variables, and describe drain and stop behaviour accurately.
  - The script, receipt, reclaim and heartbeat invariants are untouched.

### Blocker
**E1. The S1 queue test gate has no passing evidence after the fix.**
- The last full real-backend queue run was 155 passed and 3 failed: the immediate disconnect on producer-only stop.
- The current note says the corrected focused tests "should pass". That is not proof, and S1's approved gate set includes the structured full queue test.
- **Fix (evidence only; no code change unless it fails):**
  - Re-run the complete queue suite with `run-deno-test.ts` against both Redis and Garnet on the current tree.
  - Name the three tests that failed before (the delayed-promotion timer-stop and refused-port stop tests) and show them passing, with 0 failures overall.
  - Record the sanitized counts in the worklog before the S1 sign-off commit.

### Non-blocking
- A handler or settlement error raised after intake abort is nacked and dropped without any log, from `.catch` with `intake.aborted` set. This matches the old return-on-abort behaviour; a `reportPromotionError`-style log would help operators.
- `listen` throws "Queue is already listening" while a stop is in progress, even for a producer-only stop. The message is misleading but harmless.
- Running the worker Redis lease regressions now would surface drain and stop interactions early, but under the plan they belong to S2.
- Still open for READY:
  - S2 still has to deliver the real-backend multi-crash, latency and trace proofs, plus the remaining negative-control matrix rows.
  - The fresh cockpit p95 and the coordinator's `scaffold.runtime` CI stay UNPROVEN until then.

S1-REVIEW: CHANGES
