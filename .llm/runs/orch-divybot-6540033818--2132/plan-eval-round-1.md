**PLAN-EVAL for #2132: FAIL_PLAN, first of two rounds**

The plan's core is sound. It keeps the public contract, avoids an index migration, and uses a bounded heap per window, so extra memory is O(K). It dedups SCAN repeats within a window, continues from the last candidate it examined so expired or malformed values don't use up the limit, documents the cost, and sets up a negative control. Five concrete blockers remain.

**B1. The plan misses internal callers of `list()`, so watch polling gets much slower.**
- `watchPrefix` calls `this.list({ prefix })` with no limit. It does this at startup and then on every poll, and the default poll interval is 1000 ms (`packages/kv/adapters/redis.adapter.ts:739`, `:761`, `:816`).
- Decisions 3 and 4 turn an unlimited list into `ceil(N/500)` full keyspace scans. Today it is one streaming pass. At 50k keys that is about 100 full SCANs per poll per watcher.
- These callers don't need ordering, and they already hold an O(N) `knownVersions` map, so bounded memory gains them nothing.
- **Fix:** add this as a locked decision. Either keep a private single-pass unordered scan for watch discovery, or explicitly accept and measure the cost.

**B2. The shared prefix contract would hide a real difference between adapters.**
- Memory's `keyHasPrefix` returns true when the key equals the prefix (`application/keys.ts:89-101`, used at `memory.adapter.ts:153`). So memory returns the prefix key itself.
- Deno excludes it; the probe shows `list({prefix:["a"]})` without `["a"]`. Redis excludes it too, because its pattern is `prefix:*` (`redis.adapter.ts:273`).
- Decision 1 says prefix selects descendants only. But the S1 file list leaves out `memory.adapter.ts`, and decision 6 has no case where the exact prefix key is stored. That is the "memory hides the difference" problem the issue complains about.
- **Fix:** add an exact-prefix-key case to the shared contract and list the memory adapter fix in S1.

**B3. The planned fixture keys can't produce one shared expected order.**
- Decision 1 includes numeric keys. `compareKeys` compares `String(part)` (`application/keys.ts:126-141`), so `["a",10]` sorts before `["a",9]` and there is no ordering by type.
- Native Deno sorts strings before numbers and numbers by value (probe: `x, y, 9, 10`).
- Redis turns any all-digit segment back into a number (`adapters/redis/serialization.ts:90-91`), so zero-padded string keys don't round-trip either.
- The same expectations can't pass on all three adapters without changing the ordering rules, which the plan forbids.
- **Fix:** limit the shared fixtures to non-numeric ASCII string parts (for example `k0001`). Record the existing typed-order difference as a known, deferred limitation.

**B4. The Deno selector rules are incomplete.**
- Deno only accepts a bound inside the prefix. Otherwise it throws `Start key is not in the keyspace defined by prefix` (probe). Memory accepts any bound.
- Decision 5 doesn't say how a bound outside the prefix is handled. It needs to: pass a bound natively only when it lies inside the prefix, and otherwise trim it or return an empty result early.
- Also, "end preferred" means forward cursor paging with prefix, start and end restarts from the beginning of the prefix on every page. **Fix:** pick the native bound by direction: start for forward, end for reverse.
- Inclusive start and the illegal prefix+start+end combination are otherwise handled correctly.

**B5. The real Redis multi-batch proof has no way to take effect in CI.**
- `REDIS_SCAN_COUNT` is read once, when the module loads, and defaults to 5000 (`adapters/redis/types.ts:44-55`). Deno runs test files in a shared module graph, so setting the variable inside one test depends on import order.
- The raw SCAN check in decision 7 proves the data spans several batches. It doesn't prove the adapter actually made several SCAN calls.
- **Fix:** state the mechanism. Either pass the scan count into the extracted `list-entries` helper and use a counting wrapper around the real client to show at least two adapter SCAN calls, or run the test in a subprocess with the variable set.
- Also cap the number of pages in the limit-1 paging loop, so the negative control fails with a nonzero exit instead of hanging on the old inclusive start.

**Outside the plan gate:** `drift.md` plans to end the PR body with `Closes`. The owner's public assignment comment on the issue says "never Fixes or Closes". The supervisor should settle this before opening the PR.

VERDICT: FAIL_PLAN
