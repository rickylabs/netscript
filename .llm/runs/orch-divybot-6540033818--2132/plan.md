# Plan & Design — READY FOR REVIEW

## Locked decisions

1. Preserve KvListOptions and every export/signature. Start/end are exclusive lower/upper
   bounds in both directions. Prefix continues selecting descendants. Tests use portable,
   non-numeric ASCII string keys (e.g. k0001); do not
   redefine key encoding or the existing compareKeys ordering policy.
2. Extract Redis listing into adapters/redis/list-entries.ts, delegated from RedisKvAdapter.
   Consume a narrow Pick of ioredis scan/mget; compare decoded keys with existing compareKeys
   consistently for selection, bounds, and continuation. Escape Redis MATCH metacharacters in
   literal prefixes and retain namespace/segment boundaries.
3. No maintained index exists. Per output window, scan all matching names and retain the next
   K distinct keys in a BinaryHeap plus bounded Set. K=min(remaining limit, REDIS_MGET_BATCH_SIZE).
   The heap root is the worst retained candidate; discard larger candidates in forward order
   (smaller in reverse). Sort the retained window, MGET only selected names, and yield values.
   Continue from the last examined candidate, even if a value expired or was malformed. Do not
   count missing/malformed values toward limit. Deduplicate SCAN repeats within each window;
   an exclusive continuation boundary eliminates repeats across windows.
4. Bounded extra selection memory O(K), plus one SCAN reply and one MGET reply; SCAN COUNT is a
   server hint, not a strict bound on wire reply size. Work per scan O(N log K). Up to K valid
   entries need one full keyspace scan. Larger/unlimited iterations repeat scans by windows,
   costing O(N * ceil(examined candidates/K) * log K) in a static dataset. Bound Redis retained
   names even for unlimited lists; document latency and repeated-scan cost in README/PR.
5. Deno uses a legal native prefix selector with at most one native bound: prefer start for
   forward and end for reverse, falling back to the other bound if only it is usable. A native
   bound is usable only when keyHasPrefix(bound,prefix) and bound is longer than prefix; filter
   all other bounds in the iterator with compareKeys, without passing them natively. Both bounds
   remain exclusive. Count limit after filtering; no native limit before exclusion. Preserve
   the native streaming order and avoid collect-and-sort. Handle out-of-prefix bounds without
   native errors; test both containing and disjoint ranges in both directions.
   Memory must exclude the exact prefix key (length equal to prefix), matching Deno/Redis.
   Shared tests explicitly store a value at the exact prefix key and prove it is omitted.
6. Watch discovery is a separate, PRIVATE unordered single-pass scanEntries path in the same
   Redis listing module. Replace every watchPrefix this.list({prefix}) call with that path;
   do not let polling inherit ordered listing's repeated keyspace scans. It scans to completion
   once, fetching values in MGET batches, and retains no entire-prefix candidate array. Existing
   watch code still owns knownVersions. Regression test spies on real SCAN calls for a prefix
   larger than one output window and proves one complete scan per discovery, plus run all
   existing watch tests. No public unordered API is added.
7. Shared adapter contract test registers the same cases for memory, native Deno, real Redis:
   global order, prefix isolation, exclusive start and end separately/together, limit after
   bounds, reverse with bounds, forward cursor paging (1 and 32), reverse paging using end.
   Add deterministic Redis SCAN tests with out-of-order and duplicate batches, stale/malformed
   values, bounded MGET names, repeated windows and early consumer termination.
8. Real Redis reproduction runs in a fresh Deno subprocess from a checked-in test fixture with
   REDIS_SCAN_BATCH_SIZE=16 set in its environment BEFORE imports. Seed 97 distinct k-prefixed
   ASCII names, use RedisKvAdapter.list, and instrument the real client's sendCommand method
   via the connection manager seam to count actual SCAN calls (no fake wire replies). Assert
   a limit-32 page took at least two SCAN calls. Page the full prefix at limits 1 and 32, assert
   the exact expected sequence and no repeats/gaps. Hard cap paging attempts at keyCount+1 and
   assert strict cursor advance on every nonempty page, so negative control fails immediately.
   Larger-than-window watch discovery is tested separately with a counting real client. Negative control restores
   only baseline Redis listing temporarily, reruns the shared contract, records nonzero exit,
   and restores the fix byte-for-byte. Do not weaken assertions or change test expectation.

## Slices and gates

- S0 planning: this run directory; draft PR; selected PLAN-EVAL before implementation.
- S1 contract + implementation: packages/kv/tests/list-contract_test.ts,
  packages/kv/tests/redis-list_test.ts, packages/kv/tests/fixtures/redis-list-reproduction.ts,
  packages/kv/adapters/redis/list-entries.ts,
  packages/kv/adapters/redis.adapter.ts, packages/kv/adapters/deno-kv.adapter.ts,
  packages/kv/adapters/memory.adapter.ts,
  packages/kv/types/common.ts, packages/kv/README.md and run artifacts. Gates: structured
  package check/lint/fmt/tests with native KV and real Redis; negative control; quality:gate;
  doc lint, JSR audit, package publish dry-run; independent substantive slice/implementation review.
- S2 review corrections/evidence only as needed, with worklog/context updates and relevant gates.

## Risks and mitigations

- Unordered/duplicate SCAN: bounded heap selection, deduplication, adversarial wire tests.
- Expiry or malformed values: advance by examined candidate; refill until limit or exhaustion.
- Redis wire memory: COUNT is a hint; only retained candidate memory is strictly bounded.
- Large/unlimited scans trade CPU/round trips for fixed memory; explicitly document cost.
- Concurrent mutation: native SCAN weak consistency; no point-in-time snapshot is promised.
- Existing key codec limitations: no migration; do not claim arbitrary typed-key parity. Numeric
  native order differs from compareKeys string coercion, mixed types differ, and Redis converts
  all-digit strings to numbers. These are pre-existing limitations explicitly deferred. Shared
  fixtures must use non-numeric ASCII string parts, including k-prefixed padded identifiers.
- Watch polling cost: use private single-pass unordered discovery; ordered repeated scans are
  reserved for callers that request ordered KvStore.list behavior.
- Deno limit off by one/native selector failure: shared range and cursor tests.
- Broad repository gate failures: compare unchanged baseline and record truthfully, never suppress.

## JSR surface scan

No export-map or dependency changes; explicit helper signatures and @module/JSDoc required.
Existing tests excluded by publish config. Check all four exports through structured doc lint,
JSR audit and package dry-run; no new slow types or permission requirements intended.

## Open-decision sweep / deferred scope

No must-resolve decisions remain. Safe to defer: maintained Redis index (requires migration),
key codec redesign (existing persisted format), snapshot isolation (not guaranteed by SCAN),
and unrelated package restructuring. No new architectural debt intended. Consumer API unchanged.
No scaffold/plugin/runtime wiring changes: local full CLI E2E prohibited by owner; release gate N/A.

## Review correction (locked after IMPL-EVAL round 1)

Preserve kvdex's native inclusive start in denokv-bridge.ts: include an existing selector.start
within the prefix/range before the exclusive KvStore stream (forward), or after it (reverse),
subject to the same cursor and limit. Test against native Deno in both directions, with existing
and absent start keys and limits 1/2/unlimited. Correct only the newly exposed inclusive-start
compatibility seam; do not redesign unrelated bridge cursor/range selection. Add a fractional
limit heap-cap guard and regression. Re-run the package and publish gates, then resume the same
evaluator before readiness. See drift.md for the declared file-surface expansion.
