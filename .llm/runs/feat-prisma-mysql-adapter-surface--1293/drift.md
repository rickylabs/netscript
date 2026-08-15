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
alias creates an additional surface signature row.

The initial S1 commit preserved the old shape with internal overloads, but Tier-A review rejected
that workaround because the widened input admitted values `mapArg` cannot honor and the
`as SqlQuery` assertion hid the incompatibility. The fix-up therefore makes the package-owned type
structurally exact, removes the overloads/assertion, and adds bidirectional compile-time guards.
This entry records the discovery and superseded approach; the fix-up is authoritative.
