# Independent PLAN-EVAL

Requested Claude Opus 5.5, high effort; separate Anthropic session, read-only, stdin closed.

I found no blockers.

The plan is faithful to the original issue text and to the coordinator's acceptance comment:

- **Supported `initialEpoch` seam.** The issue explicitly offers "a supported producer-session claim/initial epoch seam or persisted sequence seam." The plan adds `initialEpoch` as an optional option that the caller persists. Each recreated session gets a strictly higher epoch, so the first changed document lands in a new epoch with no wire change. That matches the protocol's restart model, where the client increments the epoch, and it matches Cockpit's stated approach of allocating epochs through atomic TTL KV. Leaving the option out keeps today's auto-claim behaviour. The issue asks for a supported seam, not a change to the default, so this is acceptable as long as the docs correct the old "stable ID alone" advice. The plan commits to that.
- **Exact retry tuple.** In `packages/plugin-streams-core/src/application/durable-stream-producer-supervisor.ts`, a stale-epoch response is the only thing that changes the identity of an append or close in flight. The plan makes that response terminal when the epoch was set explicitly, on every retry path. That closes the identity-mutation hole. The serialized bytes stay on the queue entry, and a lost-ack retry test with byte and tuple equality is planned.
- **Stop vs. close.** I checked that `stop()` aborts locally and does not send `Stream-Closed`. A stopped-then-recreated producer can therefore still append, so the restart-offsets acceptance is reachable.
- **"Unchanged documents append nothing."** Treating this as equality filtering the caller owns is the only reading that works without a protocol change or a content store. Every explicit upsert still appends, which is honest. The plan proves that opening and stopping an idle session appends nothing, and it says it will not claim built-in deduplication across restarts. That is faithful, given that the consumer wire contract does not change and Cockpit owns its feed state.
- **Plan-gate checklist.** Every item has a basis:
  - research is re-baselined on `main`
  - decisions are locked with rationale
  - there are no open decisions that would force rework
  - three ordered slices, each with its gates
  - a risk register
  - the gate set follows Archetype 3 and the docs overlay
  - deferred scope is explicit
  - the JSR rubric is applied to the new numeric option

Two non-blocking notes for the implementation pass:

1. The unchanged/idle-session test will probably not fail when the fix is reverted, because the old code also appends nothing in that case. The run record should say so honestly rather than claim a red result for it. The restart-offset and stale-fencing tests are the ones that must fail on revert.
2. The "unchanged" proof should show a caller checkpoint actually skipping the upsert, not only an idle session, so the evidence matches the documented contract.

VERDICT: PASS
