# PLAN-EVAL decision record

Two permitted rounds completed in the same separate Claude Opus 5.5 high evaluator
session, read-only with stdin closed. Both verdicts are FAIL_PLAN. No implementation
has started. The supplied leaf profile requires stopping and surfacing the decision
to the coordinator; no third round or self-certification is authorized.


## Round 1

**FAIL_PLAN.** Four design decisions are still open, and leaving any of them until implementation would force rework.

Most of the plan's checklist is satisfied:
- The research matches the current code; I checked the Redis adapter, the existing delayed-promotion transaction and the dead-letter stores against what research.md says about them.
- Slices are ordered and well under the size limit.
- The risk list, the gate set, the deferred scope and the public-surface audit are all present.

The checklist item that fails is the open-decision sweep: it says nothing needs resolving, but the four items below do.

### Blockers

**B1. The claim path watches the queue that producers write to, and it drops blocking pickup.**
- Every enqueue writes to that queue, which cancels any claim transaction in flight. Under steady enqueue load, a fixed number of retries can starve consumers.
- Replacing the current blocking pop also turns idle workers into pollers, and the plan doesn't say how often they poll.
- **Fix:** pick one of these and write it into Locked decisions:
  - **(a)** Keep an atomic blocking move from the queue into the processing area. Then stamp the claim token, delivery count and deadline in a second guarded transaction that touches only keys producers never write. A crash between the two steps leaves an entry with no lease; the adoption path in B3 recovers it, and a killed-child test pins that exact gap.
  - **(b)** Use Lua where the server has it, with the guarded transaction as a fallback. Add a contention test that shows consumers keep making progress while enqueues continue, and state the idle poll interval.

**B2. Malformed or old-format entries can wedge the queue or loop forever.**
- Claiming now has to read the entry to raise its delivery count. A message that isn't valid JSON would fail every claim, and today that also kills the listener. Under B1(a), adoption would put it back in the queue over and over.
- An entry that is valid JSON but not in the standard message format gets a new random ID on every delivery, so its count never builds up and it never reaches the retry limit.
- **Fix:** claim converts any non-standard JSON message into the standard format once, giving it a fixed ID and a stored count. Unreadable bytes move atomically to the dead-letter queue with reason `validation_failed`, keeping the raw string. Add a regression test where the malformed message is next in line.

**B3. The rules for adopting claims left by pre-upgrade workers are not defined.**
- "Bounded adoption" doesn't say which entries qualify or when. Old workers keep writing lease-less claims during a rolling deploy. If adoption puts them straight back in the queue, every job those workers are still running gets delivered twice.
- **Fix:**
  - Adopting an entry gives it a fresh full lease (deadline = Redis time + visibility timeout, count unchanged) rather than putting it back in the queue at once.
  - Adoption is safe when several workers attempt it at once.
  - State whether new claims share the processing key with old ones. If they do, note that an old worker's acknowledgement can't remove a re-stamped entry, so that job runs again after its lease ends; the README must say so.
  - Add a test with a mix of old and new entries and a still-running old worker.

**B4. What acknowledge and reject do when the claim is gone, or when the result is unknown, is not defined.**
- The plan turns off automatic resend for lease commands. A brief connection drop during acknowledge then throws, the existing error handling tries a reject, and the error ends the listener. Today the same blip would just wait for the reconnect, so this would be a regression.
- **Fix:**
  - When the claim token is no longer live, acknowledge and reject do nothing, bump a metric, and never end the listener.
  - When the outcome is unknown, retry within a fixed budget until the token is confirmed gone or the call succeeds.
  - On attempt N, a requeuing reject, whether called directly or triggered by a handler error, goes to the dead-letter queue with reason `max_attempts_exceeded`, matching the KV adapter.
  - Add tests for acknowledging after the lease expired and for losing the connection during acknowledge.

### Checked, no blocker
- **Custom dead-letter store durability:** the durable outbox plus write-before-delete is sound, because the KV and Postgres stores ignore repeat writes of the same message ID. Two things to fix in passing: say which periodic task retries the outbox, and include outbox depth in health. Also note that the built-in Redis store does not ignore repeats, so passing it as an explicit store can produce duplicates.
- **Garnet:** CI runs only Redis 7. Since the plan uses the same transaction protocol on every server, testing against real Redis is acceptable, provided the final report says plainly that Garnet itself was not tested.
- **Scope and write surface:** concurrency stays out of scope as required. The write surface lists `ports/message-context.ts`, which doesn't exist; the context interface is in `ports/message-queue.ts`. Correct the list.

As instructed, I didn't write `plan-eval.md` or change any files.

**FAIL_PLAN**


## Round 2

**FAIL_PLAN.** The round-1 blockers are resolved, but the revised plan introduces one new blocker and leaves one gap open from the B1 fix. This is round 2 of 2. Both fixes are wording changes to `plan.md` with no owner decision needed. I'm read-only here, so the supervisor has to apply them.

**Resolved from round 1:**
- **B1:** blocking pickup is kept, and stamping uses only processing and lease keys.
- **B2:** non-standard and malformed messages are handled.
- **B3:** adoption gives a full fresh lease and comes with a mixed old/new worker test.
- **B4:** stale settlements do nothing and increment a counter, and the retry budget for unknown outcomes is defined.
- Outbox retry and depth are documented. The write surface is corrected. Testing Garnet locally alongside Redis closes the backend-proof concern.

### Blockers

**R2-1. "WATCH all touched keys" makes every worker conflict with every other worker, and brings the producer conflict back.**
- The stamp, ack, nack, heartbeat, reclaim and adoption transactions all write the shared processing list. Under this rule they all WATCH it.
- Every other worker's pickup, and every ack, then cancels each in-flight stamp. At normal multi-worker throughput, most stamps would use up their retries and fall back to adoption, which adds a full visibility-timeout delay.
- Requeue-on-nack and expiry reclaim write the ready list. Under the same rule they would WATCH it, so producers can cancel them. That is the B1 problem again.
- The plan's own contention tests would expose this during implementation and force a redesign.
- **Fix:** replace the rule in Locked decisions:
  - Each operation WATCHes only a fence key for that one claim, such as a lease record keyed by the receipt or by a hash of the claimed bytes.
  - Ownership and liveness are checked against that fence.
  - Shared keys are written inside MULTI without being watched: the ready, processing and deadline sets, the dead-letter list, and the counter hash.
  - Key types are still validated before the transaction. Inspecting every EXEC result stays.
  - Add a real-backend test with several workers plus a steady producer. It must assert that every message is processed exactly within the at-least-once rules, with no stamp falling back to adoption and no ack or heartbeat running out of retries.

**R2-2. The plan doesn't say what happens when a worker's stamp loses the race with adoption.**
- The plan doesn't say whether the handler runs when the stamp finds its entry already adopted or runs out of retries. If it does run, the job runs twice: once now, and again when the adopted lease expires.
- Adoption has no minimum age, so a recovery scan can take over entries just picked up by healthy workers, delaying each by a full lease.
- **Fix:**
  - Lock that the handler runs only after this worker's receipt is committed. On loss or retry exhaustion, the worker skips the handler, increments a counter, and leaves the entry to adoption.
  - Adopt only entries seen without a lease on two scans at least a grace interval apart (for example, one recovery period).
  - Add a test that runs a stamp and an adoption on the same entry at once and asserts the handler runs once.

**FAIL_PLAN**
