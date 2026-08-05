# Research — resident database connection (#1310)

## Verified mechanism

- Live #1310 is the specification. Published 0.0.4 reconstructed a second graph from the resident
  `appsettings.json`; both Postgres resources bind the same persistent `DataPath`.
- Main includes #1196 teardown, but `DbOperationRunner.executeOne()` still starts
  `aspire/db-operation/apphost.mts` for every non-Studio operation.
- The operation AppHost renders from the same settings and `generate-register-infrastructure`
  applies the same `withDataBindMount`.
- Aspire 13.4 exposes `withExplicitStart()` for executable resources and
  `aspire resource <resource> start --apphost <resident>` for starting one registered resource.
- The published quickstart walk deliberately starts Aspire before `db init/generate/seed`, but its
  database gate checks exit codes only; it never proves Postgres/data-directory exclusivity.

## Architectural cause

DB commands are modelled as AppHost startup mode rather than commands owned by a running resource
graph. Lifecycle cleanup can retire the second graph but cannot make concurrent PGDATA writers safe.

## Required boundary

The resident graph owns database resources and DB-operation executables. The CLI only addresses the
resident graph and must not reconstruct infrastructure. Stateful commands fail fast if it is absent.
