# Plan — S8 typed db-cli-mode resource commands

The epic research plan is ratified and explicitly says no further ordinary PLAN-EVAL is required
for its implementation slices. This run therefore records PLAN-EVAL as N/A while retaining a
separate Fable 5 IMPL-EVAL before readiness.

## Design

### Contract

Each configured database gains one generated `<db>-cli` resource with typed `migrate`, `seed`, and
`reset` commands. Commands accept `timeout`; `reset` additionally requires `confirm=true` before
the runtime edge can mutate data. Every callback resolves to `{ success, message }`.
`RESOURCE_DEFAULTS.DbCliModeExcludeFromMcp` owns the D-6 policy and causes exactly those CLI
resources to emit `.excludeFromMcp()`. User-facing resources are not excluded and no resource is
hidden.

The CLI database adapter first bounds database readiness with
`aspire wait <db> --status healthy --timeout <n>`. It detects a matching running AppHost from
`aspire ps --format Json`, routes resident operations through
`aspire resource <db>-cli <op> --<args> --non-interactive --nologo`, and retains the scoped
standalone fallback. Wait exits 17 and 18 map to messages naming the database and timeout.

### Architecture spine

- Entry points: generated AppHost `tryHandleDbCliMode` and CLI database-operation dispatch.
- Contract types: existing NetScript database configuration and `DbOperation` request types plus
  emitted Aspire `CommandOptions.arguments`.
- Orchestration: generated CLI resource registration and `DbOperationRunner`.
- Ports: existing `AspireCommandExecutor` and lifecycle lock; no new generic abstraction.
- Adapters: `DenoAspireCommandExecutor` and the emitted `run-tool.mts` runtime edge.
- Constants: command definitions, readiness timeout/exit codes, and
  `RESOURCE_DEFAULTS.DbCliModeExcludeFromMcp`.

IO remains in the emitted runtime edge or concrete adapter (A7/A11); the TypeScript generator only
renders deterministic source. The existing database and Aspire configuration axes are extended
without introducing a parallel plugin or framework mechanism.

## Slices

1. Add RED grep and MCP-ownership generator gates with a durable receipt.
2. Emit typed commands, confirmation/timeout behavior, `excludeFromMcp`, and remove the 13.4 seam;
   make generator tests green and record the SDK member table.
3. Regenerate snapshots/assets barrel and prove `check:assets-barrel`.
4. Add running-AppHost detection, typed resource routing, bounded wait, standalone fallback, and
   fake-process unit coverage for every branch.
5. Render a PostgreSQL consumer, restore Aspire 13.5.3 without starting it, type-check it, cite
   restored signatures/hashes, remove scratch, and commit the receipt. Stop after a single exit-134
   inotify failure.
6. Add the unexecuted Phase-B E2E gate path, prefer a typed command where restart is avoidable,
   retain restart fallback, run Phase-A static/scaffold/quality gates, and draft the #411 comment.

Every slice is a separate commit, is pushed with the explicit branch refspec, and receives a draft
PR trail comment. Phase-B live receipts remain unchecked until a supervisor grants a runtime lease.
