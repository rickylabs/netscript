# Independent PLAN-EVAL

Requested and observed route: claude-opus-5-5, high effort, Anthropic family; separate read-only session, stdin closed through repository launcher.

**PLAN-EVAL report: issue #2351, cycle 1 of 2 (feature tier)**

Evaluator: `claude-opus-5-5`, high effort, separate read-only session. Baseline is `b0b8f3f`. No edits, writes, commits, messages or subagents. I did not read `profiles/`, as instructed.

### Research spot-checks (all confirmed against the current tree)
- `listen` ignores `concurrency`, awaits each handler, and hardcodes the 50 ms and 1000 ms polls: `packages/queue/adapters/redis.adapter.ts:48-49,190-198`.
- The aborted intake signal is passed into settlement, so `whileAvailable` makes ack/nack throw after an abort: `redis.adapter.ts:198,330-334` and `_redis-lease.ts:59-62`.
- `stop()` disconnects immediately (`redis.adapter.ts:223-245`). Also, `onAbort` already disconnects the lease connection (`:177-180`). The plan's "keep lease connection through drain" covers this, but research doesn't name it.
- The tracing seam is sufficient. `TracedQueue.listen` passes options through unchanged (`packages/telemetry/src/instrumentation/queue.ts:269`). Each delivery runs inside `otelContext.with` (`:251`). A concurrent parenting test using AsyncLocalStorage already exists (`packages/telemetry/tests/instrumentation/queue-parenting_test.ts:21`). No second wrapper is needed.
- Generated worker route is plausible. Background workers get unscoped `--allow-env` (`plugins/workers/src/aspire/workers-contribution.ts:24-33`), and options flow `createQueue` → `TracedQueue` → `RedisAdapter` unchanged.

### Gate walk
| Box | Status |
|---|---|
| Research present/current | ✅ re-baselined; obsolete #2395 notes dropped |
| Decisions locked | ❌ see B1, B2 |
| Open-decision sweep | ❌ B1–B4 are unflagged and would force rework |
| Commit slices | ✅ S0–S2 ordered, each well under 30 files, files and gates named |
| Risk register | ✅ |
| Gate set | ⚠️ `quality:gate` → `arch:check` will catch F-1/F-16, but the plan's placement claim contradicts it (B3). Runtime/Aspire is deferred to coordinator CI, as the owner allows |
| Deferred scope | ✅ fresh cockpit p95 and scaffold.runtime are honestly marked UNPROVEN, and READY must ask the coordinator for CI |
| jsr-audit | ✅ two optional typed fields, no new exports or dependencies |

### Blockers

**B1. What happens to a claim that commits after abort is undecided, and one option loses data.**
- Decision 3 says such work is "either dispatched and drained **or** explicitly requeued".
- With the lease script left unchanged, requeue means `nack` with requeue. Nack puts back the envelope whose delivery count was already raised (`_redis-lease-script.ts:118-127`). At `deliveryCount >= maxDeliveries`, `settle` dead-letters instead (`_redis-lease.ts:88-91`).
- So the requeue option sends a message that no handler ever saw to the DLQ.
- **Fix:** pick dispatch-and-drain for committed post-abort claims, or name an alternative with no such loss. Add a real Redis/Garnet test: a claim at its last allowed delivery commits during abort and must not be dead-lettered without a handler running. Add a reverted-production control for it.

**B2. `concurrency` itself has no validation, so the dispatch isn't actually bounded.**
- Only the two poll intervals get bounds.
- With `size >= concurrency`: `NaN` never reaches capacity (unbounded claims), `Infinity` is unbounded, and `0` or a negative number stalls forever. Fractions behave unclearly. Nothing upstream validates it: `QueueTriggerConfig.concurrency` (`plugins/workers/worker/worker-options.ts:128`) goes straight to `listen`.
- **Fix:** lock the rule (for example a positive safe integer, otherwise `QueueConfigurationError`), checked before sockets are allocated. Test the invalid values.
- In the same decision, also lock:
  - malformed or out-of-range env values throw an error naming the variable (not silently use the default);
  - what `Deno.env.get` does when env access is denied (`NotCapable`) for consumers with scoped `--allow-env`. Previously, direct `RedisAdapter.listen` read no env.

**B3. The F-1/F-16 placement claim doesn't hold.**
- `redis.adapter.ts` is 462 lines, and `check-doctrine.ts:367-376` (run by `quality:gate`) fails files over 500.
- Bounded dispatch, failure retention, two controllers, a drain budget, shared stop completion and env resolution will almost certainly push it past 500. Yet the plan says "no new folder/module needed".
- Any new `_redis-*.ts` module makes the open F-16 `adapters` debt worse (already 19 entries against a limit of 12; `arch-debt.md` entry "redis-lease-cardinality"). `.llm/harness/debt/arch-debt.md` is outside the declared write surface.
- **Fix:** decide placement now. For example, put interval/env resolution next to `leasePolicy` in `_redis-lease-state.ts` (121 lines) and keep the adapter under 500 lines. Or plan a new private module together with a recorded drift, a write-surface extension and an update to the debt entry.

**B4. Proof design: an existing regression guard would be inverted, and the negative controls are unspecified.**
- The `'stop'` fixture role (`tests/_fixtures/redis-lease-worker.ts:20-22`) supports `redis-lease_test.ts:15-39`, which asserts that a stopped process's claim is reclaimed with deliveryCount 2.
- If stop is moved outside the handler as planned, the new drain acks the message, so the assertion's premise breaks. Either the test is weakened or its intent changes, and neither is recorded.
- **Fix:**
  - State the invariants that replace it. Example: (a) handler still running past the drain budget → stop resolves within the budget and a replacement reclaims with count 2; (b) handler finishes within the budget → exactly one ack and nothing to reclaim.
  - Define what `stop()` does when called from inside the handler: a bounded wait equal to the drain budget, or detecting the re-entry and rejecting it. Document it.
  - Record the test-intent drift.
  - Spell out the reverted-production negative controls: for each one, the test, the production element reverted (serial await, aborted settlement signal, hardcoded intervals, immediate disconnect), the assertion expected to fail, and how it runs (baseline adapter swapped in an isolated scratch copy, never committed, with only the sanitized result recorded).

### Non-blocking notes
- The handler-error path waits for siblings while intake is stopped. Long, heartbeated sibling jobs can stall the listener for minutes, which matters now that generated Aspire workers default to `WORKERS_CONCURRENCY=2`. State whether the drain budget applies on this path.
- The tuning doc should say the new env vars reach generated workers only through the ambient or deploy environment. Nothing injects a default, and deploy `.env` won't contain them.
- Fresh cockpit p95 and the e2e-cli scaffold.runtime verdict stay UNPROVEN. READY must disclose both and ask the coordinator for scaffold.runtime CI. Neither blocks this plan, and neither do labels.

Resume this same session for cycle 2. On that cycle the evaluator edits a fixable plan directly.

PLAN-EVAL: FAIL_PLAN
