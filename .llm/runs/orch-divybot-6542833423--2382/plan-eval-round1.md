# Independent PLAN-EVAL — round 1

**PLAN-EVAL for #2382: VERDICT: FAIL_PLAN (round 1 of 2)**

**Checklist**
- **Research and baseline:** Pass. It is checked against current main at `462f15c`, and it correctly says #2517 already fixed the versioned JSON mapping.
- **Contract and canonical statuses:** Pass. The status column is a required `String` defaulting to `running`. Values come from the core status list (`SAGA_INSTANCE_STATUSES`), with a test that the SQL list matches. Both create and update write it. Filtering on the column also removes the old MySQL-vs-Postgres JSON-path guessing in `v1-helpers.ts:77-91`. The KV list already filters on `instance.status` (`v1-handlers.ts:118-120`), so the two backends will match.
- **Reading old rows:** Pass. The backfill order (versioned JSON status, then `is_completed`, then a valid old flat status, else `running`) matches the current read logic in `v1-helpers.ts:123-136`. Business fields in versioned rows are never read as status.
- **Decisions, slices, risks, deferred scope, publish (JSR) check:** Pass. Leaving stream changes out is acceptable, because the issue's acceptance is about list and get results.
- **Delivering the migration:** **FAIL** (blocker 1).
- **Regression tests and negative controls:** **FAIL** (blocker 2).

**Blockers**

1. **The new migration file is not declared in the plugin manifest, and doing so breaks an existing CI test.**
   - The plugin lists its migration files in `plugins/sagas/src/public/mod.ts:48` (`.withMigrations([...])`), and `tests/public/manifest_test.ts` checks that list. A new `status.migration.sql` has to be added there, but that file is outside the allowed write list in `supervisor.md`.
   - The CI job `command-postgres.yml` runs whenever `plugins/sagas/database/**`, `services/**` or `src/runtime/**` change. Its test `packages/database/tests/saga-command-postgres_test.ts` installs only the declared files (through `install-saga-command-schema.ts:10-13`) and asserts `pending.length === 1` (line 194).
   - If the file is declared, that CI job fails. If it is not, the manifest disagrees with what the package ships, and the real-database test never runs the backfill.
   - **Fix:** commit to declaring the file and updating the manifest test and that CI test. Add `plugins/sagas/src/public/mod.ts`, `plugins/sagas/tests/public/manifest_test.ts`, the needed `packages/database/tests/**` files, and `.llm/tools/command-postgres-conformance.sh` (if a new test file is added) to the allowed write list.

2. **The backfill may ship untested.**
   - The plan says to run the backfill "against isolated PostgreSQL if available, otherwise explicitly unproven". This migration rewrites every existing row, and it is the main legacy-compatibility requirement. The repo already has a real-PostgreSQL CI job that these paths trigger, so leaving it untested is not acceptable.
   - **Fix:** commit a real-PostgreSQL upgrade test to that job:
     - Deploy the old schema without the `status` column.
     - Seed rows: versioned JSON in every canonical status; versioned with `is_completed` set; old flat rows with a valid status; old completed rows whose flat status disagrees; old rows with no or a non-canonical status.
     - Create the added-column migration through the existing tooling (create-only, then append the file; ideally via `runMigrationWithArtifacts`), and deploy it.
     - Check that each row gets the right status, and that `state` JSON, `version`, `updated_at` and ids are unchanged.
     - Check that the database rejects a non-canonical status, and that a second run finds nothing pending.
   - Add a negative control: without the file (or with the backfill removed), the backfilled rows stay `running` and the test must fail.
   - Record the CI job's result as the proof. A local run is optional.

Not blocking: make the constraint step conditional (`IF NOT EXISTS`), like `command-outbox.migration.sql`. Also note in the README that adding a status later needs a new migration file to update the constraint.

VERDICT: FAIL_PLAN
