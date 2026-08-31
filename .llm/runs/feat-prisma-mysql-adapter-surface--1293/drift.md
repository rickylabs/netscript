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

### Capability-probe test seam

`PrismaMySqlAdapterFactory.connect()` creates mysql2 internally, so the S1 concrete-class seam alone
cannot inject a fake client into the capability probe. S2 adds a module-only export to the existing
`getCapabilities` function and tests it with a fake client, then constructs the connected adapter
from the returned fallback capabilities. The factory calls that same function with its options.
The helper is not root re-exported, and the root-surface test asserts its absence.

## S3 cross-lane documentation drift

When this product change merges, the statement at
`docs/site/reference/prisma-adapter-mysql/index.md:23` that the connection-error hook is "not
supported by the shipped adapter and is blocked on #1293" becomes false. That file is docs-owned
and is deliberately not edited in this leaf. The draft product PR must name the stale statement so
the docs/#1112 orchestrator can update it after the implementation prerequisite lands.

#1293 acceptance box 4 also remains outside this leaf: #1112 must rewrite and verify its executable
example against the shipped surface before that box can be checked and #1293 can close.
