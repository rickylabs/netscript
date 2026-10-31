# Independent S1 evidence review

**S1 slice review, IMPL-EVAL round 2 of 5 (evidence correction only, current working tree)**

Evaluator: same session as the plan evaluation, `claude-opus-5-5`, high effort, read-only. I ran no tests and changed nothing. This is still not the frozen-head merge evaluation.

### E1: resolved
- **Fresh full run.** `validation-summary.json` → `S1.fullQueueFinal` records the complete real Redis + Garnet queue suite run through `run-deno-test.ts`: exit 0, 158 passed, 0 failed, 3 ignored, 161 results, 0 unique failures. The worklog records the same counts.
- **The counts add up.**
  - 158 = the 144 baseline passes + 14 new tests. That is 6 backend-gated tests × 2 backends in `redis-concurrency_test.ts`, plus its 2 tests that need no backend.
  - The 3 ignored match the baseline's 3 tests that are skipped outside CI. So nothing new was ignored and no existing test dropped out.
- **The named tests.**
  - The three timer-stop cases are `redis-delayed-promotion-review_test.ts:171-173`: successful, failing and expected-stop.
  - The refused-port stop tests are `redis-delayed-outage-contention_test.ts:8-9`: connecting, reconnecting, and reconnecting with a queued command.
  - None of them has an `ignore` condition, so they are among the 158 passed and outside the 3 ignored.
  - The worklog says all three timer-stop outcomes and the refused-endpoint/outage stop tests pass.
- **Code is substantively unchanged.**
  - The only change in `close()` is the new private JSDoc at `redis.adapter.ts:224`.
  - The 100 ms disconnect grace is still there (`:247`).
  - `RedisListener.stop` and the drain path are identical to what I reviewed in round 1.
  - A producer-only stop still disconnects synchronously before any await, which matches the `disconnects === 1` check.
- **Other S1 gates.** check, lint, fmt and `quality:gate` are PASS. The baseline negative control is 0 passed and 14 failed, with distinguishing failures recorded.

### Still open (not S1 blockers)
- S2:
  - real-backend multi-crash, latency and trace-correlation proofs;
  - the remaining negative-control matrix rows;
  - worker Redis lease regressions;
  - doc lint, JSR audit, and generator freshness.
- READY must disclose that the fresh cockpit p95 and the coordinator's `scaffold.runtime` CI are UNPROVEN, and ask for that CI run.

S1-REVIEW: PASS
