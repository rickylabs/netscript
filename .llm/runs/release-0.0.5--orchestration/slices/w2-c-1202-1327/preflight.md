# W2-C preflight — live DB endpoint and migration artifact semantics

Observed on 2026-08-06 before dispatch:

- #1202 has three clean-machine reproductions where a fixed-port users instance was unhealthy while
  dynamically allocated siblings were healthy; owner diagnosis points to a Windows service colliding
  with low port 3001, still requiring direct observation on that machine.
- The amended contract forbids fixed low/common generated service ports, requires discovery through
  the live endpoint directory, and requires three consecutive clean `scaffold.runtime` passes with
  artifact and OTEL evidence.
- #1327 proves `db migrate` can return success headlessly after deploying existing migrations while
  creating no artifact for the schema change implied by the command.

## Required supervisor mission

1. Trace every generated service/database endpoint authority and remove fixed low/common default
   binding where discovery makes it unnecessary. Add RED tests for stale/persisted endpoint writes
   across consecutive AppHost allocations.
2. Prove the users service's Prisma connection matches the live Postgres allocation on first and
   second starts using health JSON, resource endpoints, structured logs, and correlated OTEL—not
   process exit alone.
3. Define artifact semantics for `db migrate` consistent with `db init`/`db generate`. Successful
   schema-change migration must name and verify created files and applied database state.
4. Make headless inability to create a migration fail non-zero with an actionable command. Give
   deploy-only behavior a distinct unambiguous verb and output created/applied sets separately.
5. Add TTY and non-TTY E2E fixtures that mutate schema, assert migration files, inspect database
   state, and include deploy-only and no-change negative controls.
6. Run focused DB/CLI/generator tests, scoped wrappers, package/doctrine gates, clean
   resource-health checks, and exact one-pass `scaffold.runtime` with owned cleanup.
7. Open a draft PR that `Closes #1327` and `Refs #1202`; leave it at `status:impl-eval` for separate
   Qwen evaluation. Never tick or close #1202's observational row from code evidence.
8. The orchestrator, on the owner machine, must later identify the colliding service/port with it
   present and capture three consecutive clean full runtime passes before #1202 can close.

One green start or a migration command's exit zero is insufficient. Files, database state, live
endpoint identity, health payload, and telemetry are the decisive artifacts.
