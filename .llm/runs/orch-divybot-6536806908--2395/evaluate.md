# Independent implementation evaluation

## Round 1 — working-tree slice review

**FAIL_FIX.** Three blockers. The first is a regression I reproduced against real Redis; the other two come from reading the code.

### Blockers

**I1. A Redis outage of a few seconds permanently stops the consumer.**
- **Cause:** the lease connection in `redis.adapter.ts` (`ensureClients`) never reconnects on its own (`retryStrategy: () => null`, `maxRetriesPerRequest: 1`, offline queue off). `RedisLeaseConnection.call` gives up after 3 attempts, about 3 seconds in total. The claim error then escapes the `listen()` loop.
- **Effect:** `listen()` ends, and nothing else consumes the queue until the process restarts. When the last error is "Connection is closed", `isExpectedStopError` makes `listen()` resolve quietly, so callers such as saga delivery see a normal completion. The old adapter rode out outages because its blocking client retried forever.
- **Reproduction:** a listener behind a TCP proxy to the real Redis, with the proxy dropped for 4 seconds. `listen()` rejected with "Stream isn't writeable and enableOfflineQueue options is false". A message enqueued after recovery was never consumed (1 seen, expected 2).
- **Fix:**
  - In the `listen()` loop, treat transport failures from `claim()` as retryable. Back off with a cap, cancellable by the abort signal, and keep going until the listener is stopped. Keep the 3-attempt limit only for settlements whose outcome is unknown.
  - Never let a transport error resolve `listen()` while it hasn't been aborted.
  - Add a real-backend test (TCP proxy dropped for longer than the retry budget) that asserts the listener is still running and consumes a message enqueued after recovery.

**I2. An outage of a custom dead-letter store stops the consumer, even though the record is already saved.**
- **Cause:** `RedisLeases.settle` calls `flushOutbox()` after the terminal transition has committed. If the external `append` fails, that error escapes `nack()`.
- **Effect:** `handleEncodedMessage` then retries the nack, which is stale and bumps `staleSettlements` falsely. The error is re-thrown and the listener ends. The test "custom DLQ outage retains a durable outbox…" asserts this death (`assertRejects(done, 'DLQ unavailable')`).
- **Why it matters:** the plan says the outbox is durable and the recovery timer retries it, so a store outage should never halt consumption.
- **Fix:**
  - Make the flush that runs after settling best-effort: catch the error and report it through the background-error path.
  - Leave retries to the recovery timer.
  - Change the test to assert the listener keeps running, the next message is consumed, `staleSettlements` is unchanged, and the outbox drains once the store is back.

**I3. An explicit terminal nack loses its reason on the final delivery.**
- **Cause:** `RedisLeases.deadLetter` checks for the final delivery (`deliveryCount >= maxDeliveries`) before it reads `options.reason`.
- **Effect:** `nack({ requeue: false, reason: 'validation_failed' })` on delivery N is stored as `max_attempts_exceeded`. That breaks the locked plan's rule that an explicit terminal nack keeps its reason and error metadata.
- **Fix:** use `max_attempts_exceeded` only for a requeuing nack or an expiry at the limit, and use `options.reason ?? 'nack_without_requeue'` whenever `requeue === false`. Add an assertion on the final delivery.

### Checked, no blocker
- **Lua transitions:** pickup checks the ready tail and installs a receipt in one atomic step. Retries reuse the same receipt, so a resend can't settle a different delivery. Ack, nack, extend and reclaim are all fenced by that receipt.
- **Write order and type checks:** destinations are written before the source is removed, and key types and counters are checked before any write.
- **Reclaim and legacy entries:** reclaim waits out the grace period. A per-raw-bytes owner count covers identical payloads, and legacy entries get the +1 delivery-count normalization.
- **Inputs and timers:** malformed bytes are quarantined and large-number precision is kept. Recovery pages are bounded, and timers are cleared on every exit path.
- **Compatibility:** the new port fields are optional, so other adapters are unaffected.
- **CLI generator:** both Garnet launch functions add `--lua --lua-transaction-mode`, and Redis containers are excluded.
- **Acceptance tests:** they cover killed and stopped workers redelivering with count 2, N deliveries reaching the dead-letter queue, heartbeat, a replacement process, metrics, contention, wrong key types, Garnet without Lua, and a lost ack reply.

I wrote nothing to the repository; the outage probe ran from a temporary directory that I deleted afterwards.

**FAIL_FIX**

## Round 2 — working-tree slice review

**FAIL_FIX.** One blocker remains: I1 is fixed only while the listener is idle. I2 and I3 are fixed.

### Blocker

**I1b. An outage that begins while a handler is running still stops the consumer permanently.**
- **Cause:** settlement still gives up after three attempts. When the handler finishes during an outage, `context.ack()` fails. The fallback `nack({ requeue: true })` in `handleEncodedMessage` fails the same way. The error is re-thrown, and the `listen()` catch turns it into a `QueueError`.
- **Why it matters:** a busy consumer spends most of its time inside a handler, so this is the normal way an outage hits it. The baseline adapter survived because its ack waited out the reconnect.
- **Reproduction:** on both real Redis and real Garnet, I dropped a TCP proxy partway through the first handler and kept it down past the retry budget. `listen()` rejected with "Queue listener failed: Connection is closed." A message enqueued after recovery was never consumed.
- **Gap in the tests:** the new outage test drops the proxy only after the first message has been acknowledged, so it never covers this path.
- **Fix:**
  - Retry the automatic ack and the fallback nack in `handleEncodedMessage` the same way pickup now does (`whileAvailable` with the listener signal). Receipt fencing makes this safe: a retry after the lease has expired is just a counted stale no-op, and recovery redelivers the message.
  - Alternatively, catch transport-only settlement failures, report them, and continue the loop, leaving the durable claim to expire.
  - Either way, a handler's own error should still propagate exactly as it does today.
  - Add a proxy-outage test on both backends where the outage starts inside the handler and lasts past the bounded budget. It should assert that `listen()` hasn't finished and that a message enqueued after recovery is consumed.

### Checked, no blocker
- **I1 (idle path):** startup and pickup retry indefinitely with capped backoff that the abort signal can cancel. A transport failure that isn't an abort never resolves `listen()` normally. The broken-connection replacement via `duplicate()` checks for stop before swapping, and `stop()` disconnects the current connection. The startup-abort test covers the guard and the timer cleanup.
- **I2:** the outbox flush runs single-flight in the background, is never awaited by settlement or recovery, and reports errors through the adapter.
- **I3:** an explicit `requeue: false` reason now takes precedence on the final attempt.
- **Prune:** the new operation atomically removes a deadline entry only when its receipt record is missing, which stops dangling entries from starving recovery.

I made no repository changes; the probe ran from a temporary directory that I deleted afterwards.

**FAIL_FIX**

## Round 3 — working-tree slice review: PASS

**PASS.** I1b is fixed. I found no other blockers.

**I1b check:**
- **Code:** the listener's abort signal now reaches both the automatic ack and the fallback nack, and `RedisLeases.settle` retries the fenced transition through `whileAvailable`. Cancellation and errors that aren't transport failures still propagate. A handler's own error is still re-thrown after the fallback settlement.
- **Probe:** I re-ran my own test on both real Redis and real Garnet, starting the outage partway through the first handler and keeping it down past the retry budget. In both cases the listener kept running and consumed a message sent after recovery. The first message, whose lease had expired, came back with delivery count 2. Its late ack was refused as stale and counted once. Aborting the listener then ended it cleanly.
- **Tests:** I ran the outage file and the core lease file on both backends: 16 passed, 0 failed. The only skip is the CI-only check for a Redis URL, which runs only under CI.

The findings from earlier rounds that I recorded as no blocker all still hold, and I2 and I3 are unchanged. I made no repository changes. The two temporary probe directories are deleted.

This round reviewed the uncommitted working tree. The final review still has to run against the exact pushed commit after the sign-off commit.

**PASS**

## Round 4 — exact implementation head

Independent evaluator verified local/remote/PR head equality and clean working tree.
It reran 43 Redis/Garnet lease/outage/safety/compatibility tests, zero failures, one CI-only
sentinel skipped. No implementation blockers. Live CI was still running; scaffold gate absent.
Confirmed close-gate cause is unchecked final-evaluation/runtime-CI boxes, not issue linkage.

VERDICT: MERGE bd31d2d494091be987d9756320542b1a9cdcc7d0

A subsequent CI-required generated MCP API corpus refresh moves the head. Final round5
must inspect that exact new head; round4 is retained historical evidence.
