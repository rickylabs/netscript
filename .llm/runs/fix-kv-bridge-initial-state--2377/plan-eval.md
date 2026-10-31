# Independent PLAN-EVAL

The plan passes. I found no blockers, and the plan meets every acceptance criterion.

**What I checked against the code:** the current `watch()` at `packages/kv/adapters/denokv-bridge.ts:574-671` and the Memory, Deno KV and Redis watch paths that mark the snapshot with `initial: true`. The bug is real. Today the bridge only fills its state from `initial` events and keys that later change. So a plain-iterable adapter that ignores `initial` produces frames where untouched stored keys show up as absent, and they stay that way. The plan fixes this at the right point: when the first batch has no `initial` event.

## Acceptance checklist

| Requirement | Plan coverage | Status |
|---|---|---|
| First non-initial batch loads full state with one `getMany` before the batch is applied | Plan §Locked 2: read all watched keys once, set state and equality stamps, then apply the batch through the existing affected-key path, always producing a first frame | ✅ |
| Fallback runs only once | A first-batch flag; the full read is never repeated; any `initial` event skips the fallback | ✅ |
| No extra read for first-party snapshots | Locked 3 and Proof 3 | ✅ |
| `getMany` stays optional | Falls back to reading keys one at a time; the interface is not widened (Proof 2) | ✅ |
| Cancellation and errors | Checks `ended` after the awaited fallback read, read failures go to `controller.error`, and `iterator.return` and the abort signal are kept | ✅ |
| Regression: initial-ignoring adapter, plain iterable, no `ready` | Proof 1: wraps Memory; first frame has the changed, untouched and missing keys; later frames keep the other keys | ✅ |
| Honest semantics in JSDoc | Says this is best-effort current storage, not a subscription-boundary guarantee, and that a silent source gives no frame | ✅ |
| Negative control | Proof 4: run against the baseline bridge and it must fail. It will, because untouched keys come back `null` | ✅ |
| Doctrine and surface | Archetype 2; no new exports, ports or signatures; JSDoc-only surface change; no new debt; JSR audit and doc-lint are gated | ✅ |
| Lanes and independence | Codex implements; a separate read-only Anthropic session evaluates; the owner override is recorded word for word in `worklog.md`; round limits are set | ✅ |
| Scope | Stays inside the allowed write surface; deferrals are explicit (#2373, B1/B2, ports, scaffold) | ✅ |

## Non-blocking notes for implementation and IMPL-EVAL

1. **Memory has no `getMany`.** The Proof 1 wrapper must define a counting `getMany` itself. Without one, the bridge reads keys one at a time and the "one getMany" assertion means nothing.
2. **Memory's own snapshot calls `this.get` once per key.** If the no-extra-read test (Proof 3) counts `get` on the Memory adapter, it must assert exactly one call per key, not just "some calls". A cleaner option is a counting wrapper whose watch honours `initial`.
3. **Extra reads inside the first batch.** After the full read, any event whose stamp differs from the loaded one (for example, an older write) gets re-read. That is harmless but redundant. The test should pin which behaviour is intended.
4. **The cancel-during-held-read test can't detect a missing `ended` check.** After cancel, `controller.enqueue` throws, the existing catch swallows it because `ended` is already true, and the reader never sees anything. The test is still useful for cleanup (abort signal fired, `iterator.return` called, no further `next()`), but IMPL-EVAL should not count it as proof of the `ended` check.
5. **The error test should check its target.** It should assert that the failing read requested all watched keys, so it is the fallback read failing and not an ordinary affected-key read.
6. **Zero watched keys.** Deno KV and Memory both send an empty `[]` first batch here, which would trigger an empty fallback read. Either skip it or note that it costs nothing.
7. **Present entries with no versionstamp.** A third-party adapter might return a stored value with a `null` versionstamp. The new loading step should use exactly the same entry-to-frame mapping as the existing change path, so the two can't drift apart.
8. **Implementer effort doesn't match the matrix.** `supervisor.md` assigns Codex at "high", but the matrix query it records says sol/xhigh. Before dispatching S1, either change the effort to match or record the override in `drift.md`.

VERDICT: PASS
