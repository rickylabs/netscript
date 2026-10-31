**VERDICT: FAIL_PLAN.** The plan isn't ready: the main design (relay/saga retention split, locking the parent row and rechecking at delete time, no engine edits) holds up, but six gate boxes are unchecked.

**What holds up**
- **Outbox race safety.** Settlement always clears the claim, and every settlement update requires `published_at IS NULL AND terminal_at IS NULL`, so settled rows can't change afterwards. Deleting only the selected IDs, with the eligibility predicates repeated, is safe.
- **Replay-marker race safety.** The transition store's state write is a version-checked UPDATE, so locking the parent row with `FOR UPDATE SKIP LOCKED` and rechecking version/status at delete time does block a saga from being revived mid-prune. New markers are never in the selected set.
- **Completion timestamp.** `completedAt` with fallback to the terminal `updatedAt` matches the existing `sagaRetentionRemaining` policy.

**Blockers**

1. **The installed migration constraints never reach consumers.**
   - Problem: `withMigrations` only records a declaration. Nothing in the CLI reads it: plugin install copies only `.prisma` fragments, and package-sourced fragments carry only `.prisma` content. Prisma can't express the three CHECK constraints, so an honest install produces a migration without them. The acceptance item "the generated schema matches the fixture's constraints and indexes" then can't be proven truthfully, and "document application migration assembly" falls back to consumers copying SQL.
   - Repair (choose now): either (a) add a scoped CLI step that writes the plugin's migration SQL into the consumer's migrations, ordered after the generated CREATE TABLE and shipped in the published assets. That is a scope expansion: record drift and get supervisor authorization for `packages/cli`. Or (b) record an owner decision that the CHECKs ship as a published SQL asset the consumer applies themselves, and mark that acceptance sub-item as not fully met in READY.

2. **The work per run isn't actually bounded.**
   - Problem: `LIMIT` caps the rows returned and deleted, not the rows examined. The outbox has no index on `published_at`/`terminal_at`, and saga eligibility sits in unindexed fields inside the JSON state envelope, so each run scans the whole table. Also, if the SQL page filters only by status, the page can fill with terminal sagas that haven't expired yet and stall progress.
   - Repair: put the deadline predicate in SQL, ordered so successive pages make progress. Then either use a keyset cursor that caps rows examined per call and returns the next cursor (the KV retention module already works this way), or add explicit indexes beyond the fixture and record them as drift. Also cap markers deleted per saga instance.

3. **Invalid timestamps would abort the whole batch.**
   - Problem: `completedAt`/`updatedAt` are JSON strings, and a plain `::timestamptz` cast on a bad value fails the entire statement. That contradicts "missing/invalid terminal evidence preserves markers".
   - Repair: specify a guarded parse that leaves out invalid or missing rows (`pg_input_is_valid`, or a strict ISO check inside `CASE`). Read the envelope metadata, not the `updated_at` column. Add a real-Postgres test where an invalid timestamp row survives and valid rows are still pruned.

4. **Mixed group policies aren't handled safely.**
   - Problem: retention is per saga definition (group `completedDays`, default 7 for sagas in no group). A single `sagaId` filter plus one number means an unfiltered sweep removes a 30-day group's markers after 7 days. And running the composed outbox prune once per group means the shortest window applies to every outbox row.
   - Repair: accept a map from saga id to days plus a default, bound as arrays and joined in SQL in one statement. Give the outbox one explicit window and prune it once per call, not per group. Add a two-group real-Postgres test.

5. **No mechanism for the "state changed between selection and delete" proof.**
   - Problem: with selection and deletion inside one call, a test has no deterministic point to revive the saga in between. The required "goes red when its guard is removed" controls depend on that point existing.
   - Repair: name an internal, non-exported seam between the two phases. Map one negative control to each guard: version recheck, status/deadline recheck, lease predicate, pending predicate, and the limit.

6. **The real-Postgres proof doesn't run in CI.**
   - Problem: `command-postgres` runs a fixed test list from `.llm/tools/command-postgres-conformance.sh` and applies the fixture `migration.sql` with psql. The new retention tests and the install proof (a Prisma-generated migration against a real database) aren't in that script, and the script isn't in the authorized write surface. The proof would be local-only.
   - Repair: add the script to the slice plan through recorded drift, include the install-generated migration and the retention tests in it, and state the pre-existing red saga-provider baseline to compare against.

7. **No upgrade path for consumers who already copied the outbox model** (the motivating cockpit interim does exactly this). Adding the model to `sagas.prisma` can collide with their copied model, or produce a CREATE TABLE against a table that already exists.
   - Repair: put the collision/adoption path in the open-decision sweep, with a resolution and a documented migration step.

**Gate boxes unchecked**
- Open-decision sweep: blockers 1, 4, 5 and 7 each force rework if deferred.
- Commit slices: S1 and S2 omit the CI script and any CLI files.
- Risk register: blockers 2 and 3 are missing.

VERDICT: FAIL_PLAN
