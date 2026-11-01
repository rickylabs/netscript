# Independent S2 implementation review

**S2-REVIEW: PASS.** I found no blockers in the S2 working-tree repair on top of `f3778f524fbec0853cd7d08830dcf554feb371ba`. This was read-only; the only things written were the temporary directories the tests create and remove.

**1. Generated docs carrier**
- `agent-docs-prose.generated.ts` changes exactly one row, `pages/durable-workflows/triggers/index.md`. No entries were added or removed, and nothing else in the file changed.
- I reran the checks myself:
  - `check:agent-docs-prose` passes and reports `fresh:true` with no stale paths. That is the gate that failed in CI.
  - `check:publish-assets` exits 0.
  - The assets barrel generator in `--check` mode exits 0.
- None of these runs modified other files.
- The full `check:assets-barrel` ends with a `git diff --exit-code`, so it can only pass once this row is committed. Deferring it to after the commit is correct.

**2. Shutdown race (Augment review 4429496686)**
- **The fix:** the private `drainTriggerRuntime` helper waits for both source stops to settle (scheduler and file watcher), then stops the processor, then rethrows the first source stop failure.
- **Why it closes the race:** the adapter's `stop()` aborts its watchers and then waits for each in-flight dispatch to finish, including the pending hash and the handler. Because the processor is still accepting events during that time, the event in flight is processed instead of being dropped through `onError`.
- **Error ordering:** one failing source stop no longer cuts short the other source's drain or the processor's stop. As before, a stop error still masks an earlier startup error and skips `health.stopped()`. Moving the throw into a helper satisfies the no-unsafe-finally lint rule without changing that behaviour, so it is not a regression.
- **Timeouts:** the file-watcher stop was unbounded before this change too. The scheduler and processor drains now run one after the other rather than in parallel. Neither is a blocker.
- **Scope:** no change to the public API, `packages/plugin-triggers-core`, the key logic, #2165 behaviour or the S1 acceptance code.

**Regression test (`trigger-processor-stop_test.ts`)**
- It uses the real file-watch adapter, the real core processor and disk KV, and blocks `crypto.subtle.digest` with a std stub.
- It aborts while the hash is blocked, waits for the source to stop, releases the hash, and then asserts:
  - exactly one handler call
  - no adapter errors
  - an empty dead-letter queue
  - the exact failure when the scheduler stop is made to reject
- The test is deterministic against the original code. The old `Promise.all` called `processor.stop()` synchronously, right after the watcher's synchronous stop, so the processor was already stopping before the hash released. `process()` would then throw and the handler count would stay 0. That matches your reported 0 pass / 2 fail. I confirmed this by reading the code; I did not rerun the reverted version.

**What I reran**
- **Tests:** all of `plugins/triggers/src/runtime/` plus the two S1 test files gave 31 passed, 0 failed, 3 ignored. The ignored ones are the Redis-only tests. Both shutdown cases and the child-health test pass.
- **Static checks:** `deno check --unstable-kv --frozen`, lint and `fmt --check` are clean on both changed plugin files. The scoped quality scan of `plugins/triggers/src/runtime` has 0 findings and 0 allowances.
- **Privacy:** the new run-record lines contain no private paths, hosts or ids.
- **Scope:** both files are in the extended surface the owner authorized in `supervisor.md`, and `drift.md` records the reason.

**For the final-head review**
- The full `check:assets-barrel` must pass on the pushed head.
- The CI quality lane must go green; the failure on the prior head is not accepted as a baseline.
- The coordinator still owns the e2e-cli label and verdict, which this lifecycle change requests.

S2-REVIEW: PASS

Final repaired-head attestation will be posted as a PR phase comment after push and fresh CI, preserving the reviewed commit identity.
