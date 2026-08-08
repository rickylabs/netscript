# W2-C worklog

## Design

### Public surface

- CLI verbs: `netscript db migrate` (create + apply) and existing `netscript db deploy` (apply only).
- Database script result: explicit created/applied migration names and verified state.
- E2E receipt: per-start redacted endpoint identity, health result, structured-log correlation, and
  trace id.

### Domain vocabulary

- `MigrationArtifact`: migration directory/name created by this invocation.
- `AppliedMigration`: migration recorded by the target database.
- `MigrationExecutionResult`: exit classification plus separate created/applied sets.
- `EndpointIdentity`: redacted resource name, host, port, and database name.
- `EndpointAllocationReceipt`: one AppHost allocation's Postgres/users/health/telemetry proof.

### Ports

- Prisma process runner (existing injectable spawn seam).
- Filesystem migration inventory.
- Applied-migration state query/inspection at generated DB workspace boundary.
- Aspire resource/telemetry inspection through existing CLI E2E command executor.

### Constants

- Operation verbs remain the existing `DbOperation` finite union.
- Migration state table: `_prisma_migrations`.
- Receipt version and two allocation labels are named constants in the E2E fixture.

### Commit slices

See `plan.md`; five ordered slices are locked.

### Deferred scope

Owner-machine collision identity and three-pass observation for #1202; broad doctrine debt.

### Contributor path

Start at `packages/cli/src/public/features/db/db-group.ts`, follow `migrate` or `deploy` into the
shared operation runner, then inspect the generated database task under
`packages/cli/src/kernel/templates/database/`. Runtime evidence lives with scaffold database gates.

## Plan gate

`PLAN-EVAL: inherited PASS` — the separately evaluated milestone orchestration plan locks this
cluster, issue boundary, route, and gates. The slice brief resolves the remaining semantic choices;
the supervisor must not launch its own evaluator session.

## Evidence

| Phase | Command / artifact | Exit | Result |
| --- | --- | ---: | --- |
| Baseline | direct git status/revision | 0 | clean; HEAD equals `origin/main` at `c383b2e84` |
| Issues | live `gh issue view` for #1202/#1327 | 0 | acceptance and partial-close boundary reverified |
| RED | `deno test --no-lock --allow-all packages/database/tests/migrate-artifacts_test.ts packages/cli/src/kernel/templates/aspire/pristine-scaffold-ports_test.ts` | 1 | expected TS2305: `runMigrationWithArtifacts` contract is not implemented |
| S2 focused | `deno test --no-lock --allow-all packages/database/tests/migrate-artifacts_test.ts packages/database/tests/migrate-retry_test.ts packages/cli/src/kernel/templates/aspire/pristine-scaffold-ports_test.ts` | 0 | 6 tests / 14 steps passed |
| S3/S4 check | targeted `deno check --no-lock --unstable-kv` over new migration/endpoint fixtures and gate builders | 0 | all modules checked |
| S3/S4 tests | focused CLI operation runner + runtime gate/registry suites | 0 | 31 tests then 29 tests passed |

## Slice 1 reconcile

- #1327 remains open with all acceptance rows unchecked; draft PR #1393 carries `Closes #1327`.
- #1202 remains open and is referenced only. Its owner-observational rows are not claimed.
- No new review/evaluator comments were present at slice start.

## Slice 2 reconcile

- `db migrate` no longer selects deploy from URI/CI state; a distinct existing `db deploy` remains.
- Success now requires a new `migration.sql` directory plus green `prisma migrate status`; output
  prints created/applied sets independently.
- A headless failure or zero-with-no-artifact names the interactive `netscript db migrate --name`
  command and returns non-zero.
- No issue scope or taxonomy adjustment is required; external CI comments are pending.

## Slice 3/4 reconcile

- Found and fixed the existing `--name` forwarding mismatch (`NETSCRIPT_PRISMA_NAME` writer versus
  `PRISMA_MIGRATION_NAME` reader); TTY identity now crosses the resident AppHost request explicitly.
- The runtime suite now creates headless and PTY-backed schema-change migrations, asserts files and
  created/applied output, runs deploy-only/no-change controls, and inspects applied state via status.
- The existing two-start sequence now captures both topologies and requires changed Postgres
  allocation, matching users `DATABASE_URL`, healthy JSON, and a shared structured-log/trace id.
- #1202 remains partial: this is code-owned two-start evidence, not the owner Windows observation or
  three full clean passes.
