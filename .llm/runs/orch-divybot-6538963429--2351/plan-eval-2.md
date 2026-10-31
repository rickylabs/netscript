# Independent PLAN-EVAL round 2

**PLAN-EVAL report: issue #2351, cycle 2 of 2 (feature tier)**

Evaluator: same session as cycle 1, `claude-opus-5-5`, high effort, read-only. I made no edits, did not follow the generic instruction to edit the plan on cycle two (per owner), and did not read `profiles/`. Code is unchanged: the working tree since `59ce4a0` (S0) only touches files under the run directory.

### Blocker check
| Blocker | Status | Evidence |
|---|---|---|
| **B1** Claims that commit after abort | ✅ Resolved | Plan Decision 3: every committed claim is dispatched and drained, including one returned after intake abort. It says "Never nack a claim whose handler has not run", which closes the dead-letter path in `_redis-lease.ts:88-91`. The matrix row "Claim commits at final delivery during abort and handler still runs" has a baseline `throwIfAborted` control. |
| **B2** Concurrency and env validation | ✅ Resolved | Decision 1 locks these rules: concurrency is a positive safe integer ≤ 2147483647, otherwise `QueueConfigurationError` before any socket is allocated. Bad env values fail with an error naming the variable. `NotCapable` falls back to defaults. Explicit options never read env, and any other error propagates. A matrix row covers invalid values and denied env, and records that the denied-env case may also pass on baseline. |
| **B3** File size and folder cardinality | ✅ Resolved | New Placement section: `_redis-listener.ts` is the single Redis-specific owner of admission and drain. Policy and env resolution move into `_redis-lease-state.ts` (121 lines). `redis.adapter.ts` must stay under 500 lines. I counted 19 direct children in `adapters/`, so 19 → 20 in the existing `redis-lease-cardinality` debt entry is correct. `supervisor.md` adds that single debt entry to the write surface, and `drift.md` records the change. |
| **B4** Stop proof and negative controls | ✅ Resolved | Stop invariants are stated: a delivery that finishes during drain is acked once; one that runs past the budget leaves a claim that can be reclaimed. A `stop()` awaited inside the handler is bounded by the drain budget and never counts as an ack. The old fixture still works: the harness default visibility is 200 ms and `delivered()` waits up to 5 s (`redis-lease-harness.ts:23,136`), so the stopped-process test (`redis-lease_test.ts:15-39`) still expects deliveryCount 2. Each row of the negative-control matrix names the test, the production code reverted and the failure required. Controls run in an isolated copy with `--no-check`, are never committed, and only sanitized output is published. Compatibility controls are kept separate from regression proofs. |

My cycle-1 non-blocking note is also covered: the drain budget now applies to the sibling drain after a handler error, and the docs will say the tuning variables come only from the ambient or deploy environment.

### Gate walk
All plan-gate boxes pass:
- Research is current.
- Decisions are locked and the open-decision sweep is clean.
- Commit slices S0–S2 are ordered and well under 30 files.
- The risk register is present.
- The gate set is right: queue check/test/lint/fmt wrappers, `quality:gate` (which runs `arch:check`, covering F-1 and F-16), doc lint, JSR audit and generator freshness. Runtime/Aspire validation is deferred to coordinator CI.
- Deferred scope is explicit.
- The jsr-audit box passes: two optional typed fields, no new exports or dependencies.
- The existing TracedQueue seam is enough for tracing, as confirmed in cycle 1.

### Non-blocking
- `worklog.md` Design item 7 still says `redis.adapter.ts` owns admission and drain. Update it to `_redis-listener.ts` in S1 so the contributor path matches the plan.
- READY must keep two items marked UNPROVEN: the fresh cockpit native-refresh/feed-compose p95, and the e2e-cli `scaffold.runtime` verdict. It must ask the coordinator for a `scaffold.runtime` CI run. Neither blocks this plan, and neither does the lack of local `scaffold.runtime` or label changes.

PLAN-EVAL: PASS
