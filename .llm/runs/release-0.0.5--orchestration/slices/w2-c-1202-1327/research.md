# W2-C research — live endpoint and migration artifact semantics

## Baseline

- Branch `fix/cli-db-live-endpoint-and-migrate-artifact` is clean at
  `c383b2e84c254d90bab8c4f9ffcbf43a7beb8652`, exactly matching `origin/main` at dispatch.
- #1202 and #1327 were re-read live on 2026-08-08. Both are open in milestone `0.0.5`.
- The requested `_shared-brief-contract.md` does not exist in this checkout or `origin/main`.
  The complete contract in the supervisor prompt is therefore the authority for this slice.

## Findings

### Endpoint authority (#1202 partial)

1. PR #1211 already removed the pristine scaffold's fixed service/app host ports. A pristine
   `appsettings.json` has neither `HostPort` nor legacy `Port`; generated resources use
   `.withHttpEndpoint({ env: 'PORT' })`, leaving allocation to Aspire.
2. Generated users-service DB wiring is resource-based, not a literal URL: `register-services.mts`
   passes `infrastructure.primaryDatabase` into `withEnvironment('DATABASE_URL', ...)`, adds
   `withReference(...)`, then `waitFor(...)`.
3. Existing tests assert generated source text, but do not prove the value injected into the users
   process is the live Postgres allocation on two consecutive AppHost allocations. Existing runtime
   gates can pass one allocation without comparing process env, resource endpoint, health JSON,
   structured logs, and trace identity.
4. The remaining code-owned boundary for #1202 is therefore evidence and stale-write prevention:
   prove no allocated endpoint is written back to scaffold config/run state, and prove each start
   resolves the resource reference afresh. The owner-only Windows collision identity and three-run
   observation remain explicitly outside this PR.

### Migration semantics (#1327)

1. `netscript db migrate` and `netscript db deploy` are already separate public verbs.
2. Generated `db:migrate` invokes `scripts/migrate.ts`; generated `db:migrate:deploy` invokes
   `prisma migrate deploy` directly.
3. `packages/database/scripts/migrate.ts::runMigration` currently classifies the presence of
   `DATABASE_URL` or any `*_URI` as non-interactive and silently runs `migrate deploy` when no
   migration name is supplied. Aspire necessarily supplies such a URI, so headless `db migrate`
   can return zero while creating nothing.
4. A supplied name currently invokes `migrate dev`, but success is only the child exit code. No
   before/after migration-directory inventory or database applied-state inspection verifies what
   was created and applied.
5. The generated DB workspace owns the Prisma config, schema, migrations, and command execution;
   artifact verification belongs at this boundary. The public CLI runner must preserve distinct
   `migrate` and `deploy` operations and surface a non-zero actionable failure when creation is not
   possible.

## Doctrine and JSR surface

- Effective profile: Archetype 6 CLI/tooling. This slice extends existing DB vertical features and
  generator/E2E seams; it does not restructure the accepted CLI debt.
- Accepted debt retained: `packages/cli` maintainer/public mixing and missing per-command permission
  documentation. No new cross-surface import or permission requirement is planned.
- `packages/database/scripts` is an existing exported script surface. Any result contract added
  there must be explicit, documented, ESM-only, and pass the full export-map doc/publish gates.
- No dependency or version changes are planned.

## Open questions resolved by RED tests

- Exact Prisma output/state format: capture through injectable spawns and a real generated Postgres
  fixture before locking parser details.
- TTY fixture mechanics: exercise a PTY-backed command for the interactive arm and an ordinary
  piped process for headless behavior; both must mutate schema and inspect files plus `_prisma_migrations`.
- Endpoint observation format: extend the runtime suite with a checked JSON receipt containing the
  live Postgres endpoint, users `DATABASE_URL` identity, health payload, structured-log correlation,
  and trace id for each allocation.

