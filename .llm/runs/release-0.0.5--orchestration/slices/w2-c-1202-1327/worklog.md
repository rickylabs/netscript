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

## Slice 1 reconcile

- #1327 remains open with all acceptance rows unchecked; draft PR #1393 carries `Closes #1327`.
- #1202 remains open and is referenced only. Its owner-observational rows are not claimed.
- No new review/evaluator comments were present at slice start.
