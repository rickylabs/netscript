**VERDICT: CHANGES.** Most of S1 holds up, but two things need fixing before sign-off. I reviewed the uncommitted diff and the untracked files. `command-postgres-conformance.sh` also changed while I was reviewing; I didn't treat that or the in-progress test debugging as findings.

**What holds up**
- **Publication and integrity.** `plugins/sagas/deno.json` now publishes `database/**/*.migration.sql`. The JSR fetch filter accepts sidecars under the same checksum check, and there is a tamper test. The manifest declares the migration through `withMigrations`.
- **Copying.** Both install sources pick up sidecars: package fragments and the local walk. Sidecars skip Prisma declaration guarding, as they should. The "schema declared but nothing resolved" error still requires at least one `.prisma` fragment.
- **Ordering.** Pending sidecars are found before creation. `migrate dev` gets `--create-only` only when something is pending, and the SQL is appended to the new migration. If Prisma creates no directory, a SQL-only migration is made, then deploy, then status. A failed deploy returns `applied: []`. Unit tests cover the call order, appending into a real Prisma migration, and the SQL-only case.
- **Immutability.** A hash marker is written in the migration history. An unchanged sidecar is skipped and a changed one fails with "publish a new migration name"; there is a test for both.
- **Idempotent adoption.** The constraint names match the fixture, including PostgreSQL's automatic `netscript_command_outbox_attempt_count_check`. The constraint comparison against the fixture proves this. Each constraint is guarded by a `pg_constraint` lookup, and re-running the sidecar is tested.
- **Model parity.** The installed model is the exact fixture model, and the deduplication check compares normalised bodies, so a copied model is accepted only if it is equivalent. The real-Postgres template compares columns, indexes and constraint definitions against the fixture's `migration.sql`, and shows that all three CHECKs reject bad rows.

**Material fixes**

1. **The real-Postgres test never generates the table from the plugin contribution.**
   - Problem: the install fixture always writes the copied fixture model into `adopted.prisma` first. Deduplication then removes `NetScriptCommandOutbox` from the installed `sagas.prisma`, so the migration is built from the copy, never from the contribution. The acceptance item "the outbox model and migration are generated from the contribution" is only proven indirectly, through the body-equality check.
   - Fix: run the same real-Postgres comparison twice. First a fresh install with no copied model, where the table must come from the contribution and the CHECKs from the appended sidecar. Then the existing adoption scenario. A small flag on `install-saga-command-schema.ts` that skips writing `adopted.prisma` is enough.

2. **Line endings can falsely trip the "changed after recording" check.**
   - Problem: `pendingPluginMigrations` hashes the sidecar bytes as-is. `.gitattributes` forces LF for `.ts`, `.md` and `.json` but not `.sql`. If a Windows checkout with autocrlf records the hash, a Linux or WSL run of the same unchanged file gets a different hash. It then fails hard with "changed after recording; publish a new migration name". This repo's contributors already work across Windows and WSL.
   - Fix: replace `\r\n` with `\n` before hashing (keep the appended SQL as it is or normalise it the same way), and add a unit test where CRLF and LF content gives the same recorded hash. Adding `*.sql text eol=lf` to `.gitattributes` is cheap extra protection for the shipped asset.

**Not blocking, but worth doing in S1 or S2**
- The real-Postgres test applies the migration with `migrate diff`, a manual append and `migrate deploy`, not through `runMigrationWithArtifacts`. Ordering is proven only with a fake Prisma process. One real `--create-only` → append → deploy → status run would close that gap; the SQL-only case matters most.
- The SQL-only migration directory gets a 17-digit timestamp (milliseconds included) where Prisma uses 14. If Prisma creates a migration in the same second, `_` sorts after digits, so Prisma's migration lands after the SQL-only one. Trim the timestamp to 14 digits.

VERDICT: CHANGES
