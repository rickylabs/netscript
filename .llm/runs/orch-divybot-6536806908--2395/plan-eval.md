# Latest plan status: PASS (authorized second cycle, round 2)

Implementation follows the coordinator-authorized PASS at the end of this record. Earlier
blocked decisions below are retained historical evidence and are superseded by that PASS.

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

## Authorized second cycle — round 1

**FAIL_PLAN.** One blocker. Everything else in the revised design holds up.

### Blocker

**N1. Requiring Lua breaks the queue in default scaffolded apps, and the plan leaves the fix out of scope.**
- **What breaks:**
  - Scaffolded projects use Garnet as their cache by default (the default is set in `packages/aspire/config.ts`).
  - Queue auto-detection picks the Redis adapter whenever a Redis or Garnet connection is present (`packages/queue/factory/create-queue.ts`). So the first-party workers, sagas and triggers consume through `RedisAdapter` on Garnet.
  - Nothing generated by the CLI or the Aspire helpers starts Garnet with Lua or its transaction mode turned on.
  - Today this works because delayed promotion falls back to a non-Lua path.
  - Under the new plan, `listen()` fails "clearly with ready work intact" on these apps. Producers keep enqueuing and nothing consumes, which is the same silent backlog the issue reports.
  - The CI scaffold-runtime job on Garnet, and the coordinator's runtime gate, would fail their workers/sagas/triggers health-readiness checks.
  - Deferring this to a later generator change would force rework, or ship a regression.
- **Fix:** lock one of these in `plan.md`:
  - **(a)** Keep a non-Lua fallback for servers without scripting, as delayed promotion already does. Use WATCH/MULTI fenced on each claim's own key, with shared lists and counters written without being watched (the round-2 R2-1 shape). Add a real Garnet test with Lua off covering pickup, expiry and the dead-letter queue.
  - **(b)** Bring the Garnet Lua and transaction-mode launch flags into scope for both the container and the standalone-executable setups. Add those generator files to the write surface and state in READY that the scaffold-runtime CI verdict is required. Upgraded projects that aren't regenerated still fail, so the README must cover that migration.
- I recommend (a). It keeps this change inside the queue adapter, which is what the assignment asks for.

### Checked, no blocker
- **Pickup:** the atomic Lua pickup that checks the ready tail is sound. Producers push at the other end, and losing a race costs only a retry, never a message.
- **Settlement and recovery:** ack, nack, extend and reclaim are fenced by receipt and Redis server time. Reclaim rechecks the fence and the grace period. Writing the destination before deleting the source keeps work if a script fails partway.
- **Crash gap:** the claim is a single script, so there is no window between pickup and lease.
- **Custom dead-letter store:** the durable outbox, its retry by timer and its depth in health are all specified.
- **Legacy entries:** observation without ownership, a full lease plus grace before adoption, and the quiesce caveat are acceptable under at-least-once delivery.
- **Effects vs. acknowledgement:** documenting at-least-once, with the delivery count exposed, is sufficient. Exactly-once is not required.
- **Streams:** dropping Redis Streams is justified, since real Garnet rejects `XAUTOCLAIM`.
- **Acceptance proof list:** it covers every owner requirement, including a negative control for each.

**FAIL_PLAN**

## Authorized second cycle — round 2

**PASS.** N1 is fixed: the CLI generator will start Garnet with Lua turned on in every arm that launches Garnet, so default scaffolded apps keep a working queue. No other blockers remain.

**Generator check (`generate-register-infrastructure.ts`):**
- Garnet is launched in only two places, `garnetExecutableSetup` and `redisGarnetContainerSetup`. Both are shared by every arm:
  - **Container:** the explicit Container arm calls `redisGarnetContainerSetup`.
  - **Executable:** the explicit Executable arm calls `garnetExecutableSetup`.
  - **Auto with Docker:** calls `redisGarnetContainerSetup`. When the engine is DenoKv, this branch starts a DenoKv container instead, so no flags apply.
  - **Auto without Docker:** calls `garnetExecutableSetup`, even when the configured engine is Redis or DenoKv.

  Adding the two flags in those two functions therefore covers every place a scaffold launches Garnet.
- The plan's regression tests match these arms: Container, Executable, both Auto branches, the DenoKv fallback, and no flags on Redis containers. Keying the container flags on `Engine === 'Garnet'` is how that exclusion happens.
- External and Local modes are run by the user, and the README now covers upgrading existing apps for those and for apps that aren't regenerated.
- Both the container image and the dotnet tool are pinned to Garnet 2.2.1, the same version tested locally with both Lua flags.
- **Gates:** the scaffold-runtime CI verdict is required through the coordinator-owned `e2e-cli-gate`, and READY will say so. The write surface, drift and worklog record the change of scope.

**Carry to IMPL-EVAL (not a plan blocker):** the Container arm currently passes no arguments to the Garnet image, so check that adding the flags doesn't drop any arguments the image runs with by default, such as port or index size. CI scaffold-runtime on Garnet will prove the runtime for whichever arm it exercises. The other arms are covered only by the generated-output tests.

**PASS**
