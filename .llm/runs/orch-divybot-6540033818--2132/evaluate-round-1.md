**IMPL-EVAL round 1 for #2132: CHANGES (one blocker)**

The core fix is correct. One regression remains in a public export: kvdex over Redis loses the document at its start key.

**Blocker: kvdex on Redis now drops the start entry**

- **Where:** `packages/kv/adapters/denokv-bridge.ts:427-438`, reached through `packages/kv/adapters/kvdex.ts`, and only for the `redis` provider.
- **Cause:** the bridge emulates the native `Deno.Kv` list API for kvdex, and native Deno KV's `start` is inclusive. The bridge passes `selector.start` straight through as `KvListOptions.start`. Before this change, Redis `list()` treated `start` as inclusive, so the bridge happened to match Deno. Now the adapter correctly treats it as exclusive, so the bridge leaves out the start key.
- **Evidence:** a read-only probe, using the bridge over an adapter that already excludes `start`, gives:
  - native Deno KV `list({prefix:['a'], start:['a','x']})` → `x,y`
  - the bridge → `y`
- **Impact:** after this PR, any kvdex selector that sets a start key (e.g. a query's start id) skips that document on Redis. It still includes it on the `deno-kv` provider, and on `memory`, which uses kvdex's own in-memory store. That breaks the "unchanged public contract" requirement for the `./kvdex` export, and no bridge test covers it.
- **Correction:**
  - Translate inclusive start inside the bridge. For example, `get(start)` and yield it before the stream when it is within the prefix and range, or after the stream in reverse; or give the bridge an inclusive-start path. Count it toward `limit`.
  - Add a `bridge_test.ts` case comparing bridge results with native Deno KV for prefix+start, both forward and reverse.
  - `denokv-bridge.ts` is outside the authorized write surface. Record the expansion in `drift.md`, or get supervisor sign-off for it.

**Checked and correct**
- **Global selection** (`adapters/redis/list-entries.ts:60-103`):
  - The heap root only ever gets better, so repeats of keys already evicted or rejected are dropped by the `>= 0` check, and repeats of retained keys by the `names` Set.
  - Empty SCAN batches are harmless.
  - The boundary moves forward to the last selected key even when its value expired or was malformed. Those entries don't count toward `limit`, and the loop stops when a window comes back short.
  - `limit` 0 does no work. Reverse uses the mirrored comparison.
  - Extra memory and MGET size stay at most 500 even for unlimited lists.
- **Literal prefix matching:** `\ * ? [ ]` are escaped before the `:*` pattern.
- **Deno translation:**
  - Only a bound inside the prefix is passed natively: end for reverse, start otherwise.
  - Native start is excluded by exact typed equality, so bigint, number and byte ordering is preserved for selectors that were valid before.
  - Other bounds are filtered with `compareKeys`, and `limit` is counted after filtering.
  - Bounds equal to the prefix give the same results as memory.
- **Memory:** the exact prefix key is now excluded.
- **Watch discovery:** both internal calls in `watchPrefix` use one unordered scan pass, and the real Redis fixture shows one scan cycle for the baseline and one per poll. Repeated SCAN keys in watch discovery behave the same as before (repeats were never removed there), so this is not a regression.

The reported gates are consistent with the run's `validation-summary.json`; I did not rerun them.

Not a blocker: the real-Redis proof counted 233 SCAN calls for one 32-key page. That is because SCAN walks the whole Redis database, not just the namespace, and a shared test database holds other keys. The README's description of the cost would be clearer if it said this.

VERDICT: CHANGES
