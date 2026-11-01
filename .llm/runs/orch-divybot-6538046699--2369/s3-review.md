**VERDICT: PASS.** The S3 docs, READMEs, changelogs and module tags match the shipped S2 contract, and I found no material errors. I did not review the generated carriers being refreshed.

- **Signatures and defaults match S2.**
  - The return type of `createPostgresCommandOutboxRelayStore` is updated to include the retention store.
  - `pruneSettled({ now, limit, completedRetentionDays, afterId })` is documented with the seven-day default and a limit of 1–100, examining at most 100 rows per family and 200 per call in total.
  - The tables list `scanned`/`deleted` and `nextAfterId`/`nextCursor`, the five new symbols and the two constants.
- **Host example is accurate.**
  - It builds `completedRetentionDaysBySaga` from `config.sagas.groups[].sagas[].id` and `retention.completedDays ?? 7`, the same mapping as the runtime's `loadSagaRetention`.
  - It loads and saves the cursor once per background run, and says an absent `nextCursor` ends the sweep.
- **Safety wording is accurate.**
  - Settled rows exactly at the cutoff stay until a later sweep. Every lease, including an expired one, protects its row, and pending work survives.
  - Only the four terminal statuses expire, timed from `completedAt` with the terminal `updatedAt` fallback, never marker creation.
  - Missing or malformed state is kept, and locked parents wait for the next sweep. The replay delete compares the exact envelope text.
  - Outbox and replay pages commit separately and retrying is safe.
  - The shared outbox window defaults to the largest saga window, and `outboxRetentionDays` can override it.
- **Canonical state lifetime is consistent.** "Keep canonical state until replay markers are gone" fits the code: no Prisma canonical-state cleanup exists (the runtime retention loop only covers scheduled messages and delivery), so the instruction is achievable.
- **Migration delivery is accurate.**
  - The documented flags exist: `netscript db migrate --db … --name …` and `plugin install --force`, which maps to overwrite.
  - The docs correctly describe the `--create-only` → append → deploy → status order, the recording by path plus a line-ending-normalised hash, the "publish a new migration name" rule, and that no DDL runs at construction or during retention.
- **Copied-model adoption sequence is correct.** The order is: keep history, install (an equivalent copy is deduplicated, a conflicting one fails), and the constraint SQL is re-run safely. To transfer ownership, make both source edits (remove the copied declaration, reinstall with `--force`) before migrating, so Prisma never sees a table drop. A table with no migration history is baselined first.

One optional wording fix, not a blocker: "If the first install deduplicated the model … remove that copied declaration and reinstall" reads as required. An equivalent install always deduplicates, and keeping the copied declaration also works. Saying "Optionally, to transfer ownership to the plugin …" would remove the ambiguity.

VERDICT: PASS
