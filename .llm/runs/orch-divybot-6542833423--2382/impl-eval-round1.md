# Independent IMPL-EVAL — round 1

**IMPL-EVAL round 1 for #2382 (S1 code review): VERDICT: FAIL_FIX. One blocker.**

**What's correct**
- **Writes:** `PrismaSagaInstanceProjection` writes `status` on both create and update (`saga-instance-projection.ts:173,190`) and still writes `isCompleted`. The parity test catches a missing `status` on update, because it moves each row through `pending` first.
- **List and count filters:** `buildSagaInstanceWhere` filters on the status column only, so the old JSON-path and `DB_PROVIDER` logic is gone. The in-memory database in the test rejects any other filter key. KV and Prisma lists, totals and pagination agree for every status.
- **Reading rows:** the column value is checked against the canonical statuses and wins when present (`v1-helpers.ts:102-127`). Versioned rows keep their business `state`. Old flat rows without the column keep the old order: `isCompleted`, then a valid flat status, then `running`.
- **Backfill SQL** (`instance-status.migration.sql`):
  - It follows the agreed order and never reads business fields inside versioned rows.
  - The constraint step is conditional, and every status list matches `SAGA_INSTANCE_STATUSES` (checked by the SQLite test).
  - A raw SQL UPDATE leaves `updated_at` alone, because Prisma's `@updatedAt` is set by the client, not the database.
- **Delivery:** the file is declared in `mod.ts` and checked in `manifest_test.ts`. JSR installs and local-source installs both pick up `database/**/*.migration.sql`.
- **PostgreSQL upgrade test:**
  - It deploys the old schema without the migration file, seeds every flat and versioned combination, and upgrades through the real `runMigrationWithArtifacts` path.
  - It checks the backfilled statuses, the unchanged snapshot, the rejected invalid status, that nothing is left pending, and that re-running the file is safe.
  - The `pending.length === 1` check is still right, because the new file is held back from the first deploy.
- **Validation report:** honest. The 2 skipped PostgreSQL cases are not counted as evidence, the existing doc-lint failures are recorded as unchanged, and the native PostgreSQL CI run and the scaffold E2E run are both marked as still required.

**Blocker**

1. **A PostgreSQL test in the same CI job will now fail.**
   - **Where:** `packages/plugin-sagas-core/tests/fixtures/transition-store/postgres-conformance.ts.template:138`.
   - `provider-fixture.ts:81` builds the Prisma client from the current `plugins/sagas/database/sagas.prisma`, so that client now includes `status`.
   - But line 138 creates `saga_instances` by hand without a `status` column. The test then calls `new PrismaSagaInstanceProjection(root).upsert(...)` (lines 122, 156, 175) and `root.sagaInstance.findUniqueOrThrow(...)` (lines 157, 181).
   - The upsert now writes `status`, and the read selects it, so PostgreSQL fails with "column status does not exist".
   - This test runs in the same `command-postgres` job (`command-postgres-conformance.sh:28`), which this PR triggers. The required PostgreSQL CI run would go red. The local run can't show this, because the test is skipped without `COMMAND_POSTGRES_SOCKET`.
   - **Required fix:**
     - Add `status varchar(20) NOT NULL DEFAULT 'running'` to that `CREATE TABLE` (with the CHECK constraint too, if you want it to match).
     - Assert `row.status === 'running'` and `next.status === 'running'` next to the existing `parseSagaInstanceReadModel` checks.
     - Add this template to the allowed write list in `supervisor.md`, and record the scope change in `drift.md`.

**Not blocking, but worth doing in this slice**
- `saga-command-postgres_test.ts:71-73` builds the old schema with regexes, and nothing checks that they matched. If they stop matching, the column already exists before the upgrade. The test would still pass on a SQL-only migration and would no longer prove the column gets added. Add a check that the old schema text differs from the installed one, or that the created migration adds `status`.
- The PostgreSQL negative control (`SAGA_STATUS_NEGATIVE_CONTROL=1`) only runs if someone sets it, and nothing runs it. Keep reporting it as not executed until someone actually runs it against PostgreSQL.

This is a code-slice review only; it is not permission to merge. The native PostgreSQL CI result and the `scaffold.runtime` E2E verdict are still unproven and required before merge.

VERDICT: FAIL_FIX
