# Independent source slice review

Separate Claude Opus 5.5 session, high effort, read-only; same evaluator resumed from PLAN-EVAL.

I found no blockers. The slice is correct for #2338, both test files pass, and the negative controls are documented honestly.

**What I checked in the code:**
- **Validation before IO:** `initialEpoch` is checked in `producerFingerprint`, which runs before the supervisor is constructed and before it connects. A unit test covers −1, 0.5, NaN, Infinity and MAX_SAFE+1, and asserts that no connect happens.
- **Singleton reuse:** the fingerprint records whether an epoch was given. An explicit epoch 0 is treated as a different configuration from an omitted epoch. A stopped producer is still replaced, because `stop()` marks it closed straight away and then removes it.
- **Fencing:** when the epoch is explicit, a stale-epoch response on append or close stops the producer through `#canRetry`. The append's receipt reports `transport-refused` and `close()` rejects, so nothing silently takes over another session. When the option is omitted, behaviour is the same as before: start at epoch 0 and auto-claim on a stale epoch. The transport, the ports and the default transport are unchanged.
- **Exact retry tuple and bytes:** the only change that could alter a retry's identity was the stale-epoch path, and explicit epochs now block it. Serialized bytes stay on the queue entry. The lost-ack real-server test checks both requests: the same epoch and sequence (1, 0), identical bodies, statuses 200 then 204, and exactly one event appended even though the caller changed the document after enqueueing it.
- **Restart offsets:** three producers with epochs 0, 1 and 2 are each stopped (no `Stream-Closed`) and recreated. The test gets three distinct offsets and the revisions replay as `[0,1,2]`.
- **Unchanged documents:** an app-side checkpoint skips the upsert on the server. A session that goes through `waitUntilReady`, `flush` and `stop` leaves the stream and the read from its tail offset unchanged. This is the caller-owned equality we agreed at the plan stage. The docs say plainly that every explicit upsert appends, and they describe the window where a write in flight before a crash can be sent again under the new epoch.

**About the hang:** before the `Connection: close` fix, I reproduced it and isolated it in a private instrumented copy of the test. It happened inside `DurableStreamTestServer.stop()` after every receipt, stop and read had finished. That method calls `server.close()` without closing idle keep-alive sockets, and it only hung when the existing interop test ran first in the same process. So it is a problem in the reference server's test shutdown, not a race introduced by this change. Adding `Connection: close` to test requests only is the right fix: the production transport is untouched and server shutdown is still exercised. I found no orphaned probe processes from my earlier turn.

**Validation I ran:** one bounded run of `packages/plugin-streams-core/tests/application/producer-session_test.ts` and `plugins/streams/tests/service/durable-stream-producer-idempotency_test.ts` on the current tree passed 9 of 9, with no `deno.lock` change.

**Taken from the worklog, not re-run by me:** 20 repeated suites, the 9-pass versus 8-fail revert control, the full 87-test run, `quality:gate`, the JSR audit, doc-lint and the docs link checks.

**Outside this slice:** the generated MCP and docs bundle refresh is the planned next slice. The e2e-cli CI verdict is still owned by the coordinator.

**Non-blocking:**
- The docs say epochs are allocated "per session, never per retry". The tests don't exercise misuse of the singleton with a changed epoch on a live path; they only assert that it throws `Incompatible`. That is enough.
- The new restart-safety paragraph in `docs/site/durable-workflows/streams.md` has one line longer than its neighbours. That's cosmetic, and fmt may reflow it.

VERDICT: PASS
