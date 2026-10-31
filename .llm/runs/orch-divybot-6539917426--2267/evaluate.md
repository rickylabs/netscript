# IMPL-EVAL — round 1, pre-sign-off slice review

Independent native Claude Opus 5.5/high; read-only, closed stdin.
No blocking findings. Reviewer independently repeated full KV tests and all
original-production-file negative controls.

I found no blockers. I didn't edit, commit or post anything during the review.

**What I checked myself**
- **Original-file control:** I unpacked main `3d83caf` into a temporary folder, added the new test file, and ran the structured test wrapper there. Exit 1, and all 12 new tests failed on assertions. Ten failed on a stale sibling read ("sibling must exist before the first notification", got `20n` instead of `200n`). Two, the repeated-key cases, failed on an intermediate head value (`11n` instead of `null`). This matches `regression-evidence.json`, and the hashes of both changed files match the ones recorded there.
- **Current tree:** the full `packages/kv` run with `--allow-all --unstable-kv --frozen` exits 0: 160 passed, 0 failed, 41 Redis tests skipped because Redis isn't configured locally.
- **Static checks:** `deno check --unstable-kv`, `deno lint` and `deno fmt --check` pass on both changed files. `deno doc --lint packages/kv/mod.ts` is clean.
- **Scope:** against main, the only source change is `packages/kv/adapters/memory.adapter.ts` plus the new untracked test. There are no lock, `deno.json`, dependency or export changes. Only private method signatures changed; `MemoryKvAdapter`, `WatchableKv` and `KvStore.atomic` are unchanged.
- **Privacy:** I found no host, path, port or session-id patterns in the run records.

**Issue acceptance**
- **Exactly one winner for same-version commits:** `atomic()` still checks versions and applies mutations in one synchronous block. The existing contract test "concurrent atomic commits are serializable" (`packages/kv/src/testing/atomic-contract.ts:78-103`) runs against the memory adapter and passes. The fix also tightens one case: a watcher that writes back during dispatch now sees the complete commit, so it can no longer slip in between sibling mutations.
- **Callbacks and readers see all siblings:**
  - `memory.adapter.ts:211-216` applies every mutation first, then notifies in mutation order.
  - The new tests hook into the real synchronous key and prefix handler sets and capture `get` reads at the moment of notification. They check the results outside the callback, so the adapter swallowing callback errors can't hide a failure.
  - This covers set with TTL, delete, sum, min, max and repeated-key commits, in both fixed-key and prefix mode.
- **TTL unchanged:** `writeEntry` still computes the expiry and adds it to the expiry heap. The expiry sweep (`:599-600`) now goes through `removeEntry(entry.key, …)`, which is equivalent because `keyToString(entry.key)` is the heap's key string. Lazy expiry in `get` is untouched. The TTL scenario drives the real sweep with `FakeTime` and gets a `delete` event whose `previousValue` is `11n`.
- **Things that had to stay the same:**
  - Each event still carries its own `previousValue`; a repeated key gives the chain 10n → 11n → 13n.
  - Repeated-key events keep their mutation order.
  - Deleting a missing key, alone or inside a commit, still sends nothing.
  - A standalone `set` or `delete` still notifies straight away with the right previous value.
  - Every event in a commit carries the commit's versionstamp.

**Archetype 2 and gates:** the change is a bounded fix behind unchanged ports, with no new abstraction. The existing Refactor verdict and KV debt are kept and not widened. The new test file sits under `tests/`, which the package already leaves out of the published files, so the JSR surface doesn't change. The publish dry-run, JSR audit and `quality:gate` results you reported are consistent with that.

**Non-blocking notes**
1. The deferred failed-mutation rollback has a wider effect now. If `combineAtomicValue` throws partway through a commit (for example, a plain-JS caller passing a `number` operand), mutations already applied are not notified at all; before, they were. This is recorded as deferred in `worklog.md:47-48`, as PLAN-EVAL suggested.
2. Because the test uses `FakeTime`, the `deadline()` timeouts never fire. A future regression that stops delivery would hang the test rather than fail it within 2 s. It doesn't affect the current results.
3. If a watcher writes synchronously during dispatch, events from that nested write can arrive before the rest of the outer commit's events. That was already true before this change, so it isn't a regression.

VERDICT: PASS

## Follow-up

The nonblocking timeout note is addressed with FakeTime.restoreFor around standard deadlines and
prefix-poll cleanup. Production code is unchanged since this review. Final
exact-head evaluation will review the test refinement too. Deferred invalid-input
rollback and existing reentrant event interleaving remain outside this issue.

## Round 2 — timeout refinement sign-off

Same independent evaluator session, native Claude Opus 5.5/high.

I found no blockers. The timeout refinement resolves my round-1 note (that a broken delivery would hang the test), and it doesn't change production code or the acceptance assertions. I didn't edit, commit or post anything.

**Checked this round**
- **Production unchanged:** `packages/kv/adapters/memory.adapter.ts` has the same hash I reviewed in round 1. The test file's new hash matches `regression-evidence.json`. Against main, the only changes outside the run directory are still the adapter and the new test.
- **The diff is only the timeouts:**
  - Every `deadline` wait is now wrapped in `FakeTime.restoreFor`: the first `pending` delivery, each later prefix `next()`, and the TTL expiry wait.
  - `finally` now advances fake time by 1 s after the abort.
  - The assertions on values, previous values, versionstamps, notification-time reads, TTL sweep events and standalone set/delete are unchanged. TTL expiry still runs on fake time because `time.tick(1_000)` happens outside the real-time window.
- **Missing-delivery control:** I repeated this myself across all 12 cases, not just the prefix TTL case, in a temporary export with the commit's notification dispatch suppressed. Exit 1, and all 12 failed with `TimeoutError` after about 2 s each (26 s total). There was no hang and no other kind of failure, so no leaked-resource errors were reported. A broken delivery now fails within the 2 s limit instead of hanging, and the cleanup tick still lets the watchers shut down.
- **Original-file control on the refined test:** exit 1, with all 12 failing on assertions: 10 stale sibling reads and 2 intermediate repeated-key reads.
- **Current tree:**
  - Focused test: 12 of 12 pass in under 1 s.
  - Full `packages/kv` run with `--allow-all --unstable-kv --frozen`: 160 passed, 0 failed, 41 Redis tests skipped.
  - `deno check --unstable-kv`, `deno lint` and `deno fmt --check` pass on both changed files.
- **Records:** `evaluate.md`, `worklog.md` and `regression-evidence.json` match these results. The new `missingDeliveryNegativeControl` entry records 1 of 1 failing, which fits running only the prefix TTL case; my run covered all 12. I found no paths, hosts or ids in these three files.

The deferred rollback scope and the existing nested-write event ordering are unchanged and still recorded as out of scope.

VERDICT: PASS
