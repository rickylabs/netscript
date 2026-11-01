**VERDICT: PASS.** S2 meets every core requirement and I found no material production race. Before commit, the guard-removal negative controls still need to run red and be recorded, as you planned. I didn't review the unrelated outer-harness import-map assembly beyond confirming it only reads files.

**Outbox retention (`pruneSettled`)**
- **Validation.** Days, limit (1–100), clock and cursor are all checked before any database work, and that is tested.
- **Bounded pages.** Each call reads at most `limit` primary-key rows, then deletes only those IDs. The DELETE repeats the age check (`published_at` or `terminal_at` older than the window) and requires both lease columns to be empty.
- **Race safety.** The claim and settlement statements both require `published_at IS NULL AND terminal_at IS NULL`, so a settled row can't be claimed again. PostgreSQL re-evaluates the DELETE predicates on the current row, so a row that changes after selection is protected. Pending rows and every leased row, including expired leases, survive. The relay's existing transaction helper adds a finite timeout, ReadCommitted and refusal of the root client.
- **Contract.** It is a separate `CommandOutboxRetentionStore` returned as an intersection type, so existing relay fakes keep compiling. Named exports were added to both commands entry files.

**Replay-marker retention (`createPrismaSagaCommandRetention`)**
- **Bounds.** Each call reads at most `limit` markers by composite primary key. Each marker is joined to its single parent state row, which locks at most `limit` parents and deletes at most `limit` markers. The cursor advances even when every row in the page is kept, and multiple markers on one saga count against the same budget.
- **Expiry.** Metadata is parsed with Zod. A status outside the terminal set, a bad timestamp or a missing parent is kept without affecting other rows. The clock starts from `completedAt`, falling back to the terminal `updatedAt`, and never from marker creation (the tests set creation to epoch and to "now" to prove this). The window comes from the per-saga map with a seven-day default.
- **Race safety.** Candidate parents are locked in `instance_id` order with `FOR UPDATE SKIP LOCKED`. The fresh rows are re-validated, the version must match the selected candidate, and the DELETE also requires the parent's version and envelope to be unchanged.
  - Against the transition store: it inserts a marker and then runs a version-checked UPDATE on the state row. If it already holds the parent row, retention skips it. If it committed first, the new version fails the check. If retention locks first, the transition's UPDATE waits, and a marker it inserted later isn't in the selected set.
  - Lock order can't form a cycle, because retention never waits on a parent lock and transitions never lock markers before inserting.
  - The cancellation checkpoints roll the transaction back.
- **Group windows.** The outbox window defaults to the largest configured saga window, or an explicit value, and the outbox is pruned once per call.

**Tests**
- Every requirement has a real PostgreSQL case: settled versus pending, leased and boundary rows; all active statuses kept; the terminal set deleted; recent completion kept despite an old marker; the `updatedAt` fallback; invalid timestamps; orphans; per-group windows; and the shared or explicit outbox window.
- The races are covered by a test-only client wrapper around real queries, not a production hook: the outbox recheck, the replay status/completion/version recheck, the DELETE envelope comparison, and a concurrent lock held by another transaction (skipped, with the saga later revived).
- Also covered: per-family page caps with cursor progress past retained pages, and validation that touches no database.

**Not blocking, worth noting**
- **Rows that can't be pruned.** The DELETE compares the envelope after a JavaScript JSON round-trip. If a saga's state holds integers above 2^53, the comparison never matches, so that saga's markers are never pruned. That is safe but means they stay forever. Comparing a hash of the envelope computed in SQL (for example `md5(envelope::text)` in both the lock read and the DELETE) would avoid it.
- **Boundary.** A row exactly at the window edge is kept here (`<`), while the existing KV retention deletes at `remaining <= 0`. The difference is one millisecond and harmless, but the S3 docs should state it.
- **S3 docs.** They must say the host builds `completedRetentionDaysBySaga` from the saga groups' `retention.completedDays` and persists `nextCursor` between runs.

VERDICT: PASS
