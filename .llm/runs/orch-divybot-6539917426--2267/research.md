# Research

Re-baselined 2026-10-31 against main `3d83caf1ca50695a0064529113ea00eab52426dd`.
The issue body has three acceptance clauses in prose, no literal checkbox list.
The owner comment narrows remaining work to notification ordering after #2135.
No orchid-triage comment exists. Search found merged PR #2313, whose files affect
workers contracts and do not implement this change; no duplicate fix was found.

NetScript MCP `find_guidance` with the task intent, then `search_docs` for KV
atomic watch notifications, returned general query/persistence guidance, not an
adapter-specific recipe. The existing adapters and their port are authoritative.
`deno doc --filter MemoryKvAdapter packages/kv/mod.ts` confirms the public surface.

- `MemoryKvAdapter.atomic` checks and mutates synchronously, but `writeEntry` and
  `removeEntry` call `notifyWatchers` inside that mutation loop.
- Fixed-key and prefix handlers are synchronous queue callbacks. Public async
  iterator consumers normally resume after the commit, so a public-only reader
  test would already pass. Regression tests must capture `get` promises at the
  synchronous handler boundary, then assert them outside the callback (watcher
  callback exceptions are intentionally swallowed).
- Redis `tryCommit` executes the whole transaction before `publishChanges`;
  Deno KV delegates mutations to native `atomic.commit` and watches committed data.
- Existing atomic contract already proves one winner under overlapping version
  checks and one versionstamp per commit. Existing memory TTL test is retained.
- `writeEntry` owns both `expireIn` calculation and expiration-heap insertion.
  Keep that storage path and sweep logic intact.
- Missing-key delete currently emits nothing; set/delete notifications carry
  previous values. Multiple mutations of the same key retain mutation order.

Archetype 2 Integration; provider-neutral `KvStore` / `WatchableKv` ports stay
unchanged. Doctrine verdict: Refactor, with existing KV adapter/test debt at
`.llm/harness/debt/arch-debt.md`. A focused ordering fix does not perform that
separate restructuring.

JSR planned-surface audit: all four export entrypoints remain unchanged, with
explicit public return types and module documentation. No dependency additions,
new exports, inferred public types, or publish include/exclude changes. Test file
is excluded by the existing `tests/` publish filter. Verify with package dry-run,
full-export doc-lint, and repository JSR audit.
