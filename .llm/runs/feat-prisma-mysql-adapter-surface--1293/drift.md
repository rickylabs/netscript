# Drift — feat-prisma-mysql-adapter-surface--1293

## S1 observations

### Root-wide `surface:diff` baseline drift

The repository-wide `deno task surface:diff -- --json` run reported a pre-existing large set of
signature changes across unrelated packages (including Aspire, contracts, database, Fresh,
plugin-workers-core, SDK, and others), so its overall `major` verdict cannot isolate this leaf.
The package-only snapshot was recomputed without modifying the baseline and is recorded in
`worklog.md`.

R2.3 is intact: `PrismaMySqlAdapter` does not appear in the package root symbols or package-isolated
rows. No baseline or major-declaration file was edited to conceal the repository-wide drift.

### Existing query alias compatibility

`PrismaMySqlQuery` was already public but is not identical to Prisma 7.8.0's `SqlQuery`: its
`scalarType` is broader, `dbType` is required, and `arity` is optional. Tightening that shipped
alias would have created an unruled breaking delta. S1 preserves it and adds internal overloads so
the concrete adapter satisfies both Prisma's driver contract and the package-owned connected
interface. No runtime behavior changes.
