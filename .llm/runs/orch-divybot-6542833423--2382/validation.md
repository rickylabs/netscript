# Validation — S1 candidate

## Scope and commands

- Structured test wrapper via `deno task test --unstable-kv --frozen`: instance-read, instance-query, prisma-retention, instance-status (service and database), manifest, atomic projection/retention, plugin migration-tool and saga-command-postgres tests. **34 passed, 0 failed, 2 ignored**, exit 0. The two native PostgreSQL cases are ignored without COMMAND_POSTGRES_SOCKET; they are NOT PostgreSQL evidence.
- Structured check wrapper: `--root plugins/sagas --file packages/database/tests/saga-status-upgrade.ts --file packages/database/tests/saga-command-postgres_test.ts --ext ts,tsx --deno-arg --frozen`; passes --unstable-kv by default; **0 occurrences**, exit 0.
- Structured lint/fmt wrappers: 10 changed TS source/test files; no suppressions added. Results in validation-summary.json.
- `quality:gate` via allowlisted run-gate.ts: **PASS**, raw exit 0; includes quality:scan + deps:check + arch:check. Baseline gate also PASS. Existing doctrine warnings remain.
- Scoped JSR audit: **exit 0**, publish dry-run succeeds; existing cardinality warnings and generic slow-type scan warning. No new exports/dependencies/permissions; SQL publish glob already includes sidecar.
- Scoped `doc:lint --root plugins/sagas`: **exit 1**, 30 private-type-ref findings, zero missing JSDoc/other errors. Restoring all four modified production TS modules to baseline yields exactly the same 30 findings; no increase introduced. This gate is recorded baseline-red, not passed.

## Negative controls

1. Retain tests and restore the production writer + shared mapper/filter to baseline 462f15c. Structured service status tests: **0 passed, 2 failed, exit 1**. Parity test rejects missing persisted scalar status; pre-fix-row list test rejects old JSON-path filter. Both required regression tests go red.
2. Restore fix. Remove only the UPDATE backfill statement from the new sidecar, retaining the PostgreSQL constraint. Structured legacy data test: **0 passed, 1 failed, exit 1**; compensating/compensated/failed and other legacy rows incorrectly retain the running default.
3. Restore original sidecar/fix in finally blocks; re-run status tests and record green result in validation-summary.json. No baseline production code or omitted migration is retained.

## Required external proof

The existing command-postgres CI job now deploys the old installed schema, seeds all flat/v2 lifecycle combinations, then runs actual Prisma create-only → append immutable sidecar → deploy through runMigrationWithArtifacts. It asserts canonical backfill, unchanged business JSON/ids/version/timestamps, CHECK rejection, idempotent constraint installation and no pending sidecars. An opt-in SAGA_STATUS_NEGATIVE_CONTROL=1 run empties only the installed new sidecar and must fail canonical-row assertions.

Local SQLite executes the exact portable UPDATE and validates old rows/canonical SQL vocabulary. It does not prove PostgreSQL DDL/DO/CHECK. Native PostgreSQL CI result remains required.

Per owner, no local scaffold.runtime run. **Coordinator must arm e2e-cli-gate and supply scaffold.runtime verdict at final head**. Unit/source checks do not substitute for it.

## S1 review repair

Independent reviewer found the separate transition-store PostgreSQL conformance template manually creates its projection table. Added canonical column/default there and scalar create/update assertions; no other real hand-written projection table found. Upgrade helper now asserts the column is absent before and present after migration. Expanded local wrapper test invocation includes prisma-transition-postgres_test.ts: **34 passed, 0 failed, 3 ignored, exit 0**. All three ignored cases require native PostgreSQL and remain CI prerequisites.

Baseline/candidate doc-lint package and entrypoint finding objects compare exactly equal, beyond matching counts.

Repair scoped check/lint/fmt all **exit 0**, no findings. Final test invocation is 34 passed, 0 failed, 3 ignored (all native PostgreSQL). Independent IMPL-EVAL round 2 / substantive slice review: PASS; all repair gate conditions satisfied before commit.
