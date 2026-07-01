# Research — db-init reliability

## Re-baseline

- Branch: `fix/db-init-reliability`.
- Pre-existing worktree dirt: only `.llm/tmp/run/openhands/**/request.md` line-ending drift. This run will not stage those files.
- Target surfaces:
  - `packages/database` (`@netscript/database`, Archetype 2 integration): Prisma migration script exported via `./scripts`.
  - `packages/cli` (`@netscript/cli`, Archetype 6 CLI/tooling): `db init` command, generated database tasks, Aspire DB CLI mode.
- Current doctrine verdicts:
  - `@netscript/database`: Refactor debt remains for `interfaces` -> `ports`/composition-root confirmation, but the package already exposes `ports/`; this slice must not broaden into that debt.
  - `@netscript/cli`: Restructure debt exists for large CLI files; this slice must not deepen it or refactor unrelated CLI architecture.
- Relevant open debt: `cli e2e — DEBT-2 db-init e2e flake (pre-existing)` in `.llm/harness/debt/arch-debt.md`. This run aims to close it with deterministic local and CI-ready evidence.

## Findings

1. `packages/database/scripts/migrate.ts` contains the prior PR #98 bounded retry. It retries non-interactive Prisma invocations only when stderr matches `/ERR_STREAM_PREMATURE_CLOSE|Premature close|Schema engine exited/i`, with `maxAttempts=4` and linear `750ms * attempt` backoff.
2. The retry currently captures only stderr. It mirrors stderr to the parent process for non-interactive runs, but stdout is inherited and therefore unavailable for transient classification.
3. `db init` passes a migration name by default:
   - `packages/cli/src/public/features/db/init/init-db-command.ts` maps `--name` default to `init`.
   - `packages/cli/e2e/src/application/gates/scaffold/database-gates.ts` calls `db init --name init`.
   - Generated database workspaces map `db:init` to `deno run -A --minimum-dependency-age=0 scripts/migrate.ts --name=init`.
4. Because `PRISMA_MIGRATION_NAME` is present, `runMigration()` chooses `prisma migrate dev --name init` even when `DATABASE_URL` is present. It does not use `migrate deploy` for `db init`.
5. Generated AppHost DB CLI mode already wires `.withReference(target.resource).waitFor(target.resource)` before starting the Prisma executable. That proves an Aspire ordering gate exists, but not that Prisma's own connection preflight will always survive the schema-engine subprocess lifecycle.
6. Prior run artifacts captured the known Windows signature after Aspire/Postgres readiness:
   - `schema-engine-windows.exe`
   - `ERR_STREAM_PREMATURE_CLOSE`
   - `cli can-connect-to-database`
   - classified as happening after Postgres + Aspire resources reached healthy/ready state.
7. Existing tests cover premature-close retry, max-attempt behavior, non-retry of schema/P1001 errors, and interactive no-retry behavior in `packages/database/tests/migrate-retry_test.ts`.
8. A full local Linux/WSL `scaffold.runtime` run on 2026-06-26 reached and passed `database.init` in 31.3s. The raw gate evidence shows Aspire waited for both `postgres` and `plugin-smoke-20260626-223817-db` to enter `Running`, become healthy, and become ready to execute before starting Prisma. This run failed later at `runtime.aspire-start` with Aspire exit 2, which is outside this db-init slice.
9. The generated project's `database/postgres/scripts/migrate.ts` is a thin wrapper that imports `runMigrationCli` from `@netscript/database/scripts`. Therefore changing `packages/database/scripts/migrate.ts` is sufficient for local-source scaffolded db-init behavior; no generated wrapper change is needed unless reproduction later contradicts this.
10. Planned public surface scan:
    - `deno doc packages/database/scripts/mod.ts` shows the affected exported script surface: `MigrationOptions`, `PrismaSpawnResult`, `PrismaSpawn`, `RunPrismaWithRetryOptions`, `isRetriableMigrationFailure`, `runPrismaWithRetry`, `runMigration`, and `runMigrationCli`.
    - `packages/database/deno.json` exports `./scripts`, includes `scripts/**/*.ts` in publish, and package check already includes `./scripts/mod.ts`.
    - `deno doc packages/cli/mod.ts` shows no direct db-init API export; the CLI user surface is the binary command tree, not a typed db-init function export.
11. Residual local reproduction added a second db-init symptom: the E2E runner reported
    `Error: Timed out waiting for Aspire resource prisma-init-postgres to complete.` after
    309069ms. The AppHost logs from the same proof period also showed concurrent generated
    AppHosts fighting over Aspire's fixed dashboard port `18891`, so this timeout evidence is
    environmental/proof-run contaminated. The durable mitigation in the database script is still
    valid: bound each non-interactive Prisma child attempt so a hung schema-engine/Deno child cannot
    keep Aspire's executable resource non-terminal until the outer suite timeout.
12. JSR planned-surface risk scan:
    - Metadata/exports: no `deno.json` or export-map change planned.
    - File list: `packages/database/scripts/**/*.ts` is already published; no new publish include/exclude is planned.
    - Slow types: changed exports must keep explicit return/type annotations. Existing affected functions/types are explicitly annotated.
    - Module docs: `scripts/mod.ts` and `scripts/migrate.ts` already have `@module` docs.
    - Symbol docs: new or changed exported symbols need JSDoc; preferred fix avoids adding new exported symbols.

## Reproduction Plan

1. Run the current `scaffold.runtime` database path repeatedly with `rtk proxy deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
2. If full suite runtime is too expensive, generate one local scaffold once and loop the smaller `db init` path against that project.
3. Record every raw failure signature and run result in `worklog.md`.

## Resolved Plan Decisions

- Residual signature set for this slice:
  - `schema-engine-windows.exe` process teardown during `cli can-connect-to-database`, expressed as
    `ERR_STREAM_PREMATURE_CLOSE`, `Premature close`, or `Schema engine exited`.
  - The script's own per-attempt timeout diagnostic, `Timed out waiting for Prisma schema engine`,
    emitted only after killing a non-interactive Prisma child so the outer Aspire executable can
    retry instead of hanging until the suite timeout.
- Stdout/stderr capture decision: capture stderr remains sufficient for the approved signature set because the prior raw signature is an error line and existing tests classify stderr. To make future diagnostics clearer without reworking the process model, final failure logs must include the attempt count and classifier decision.
- Readiness decision: do not add a separate Postgres readiness gate in this slice. Current local evidence and prior artifacts both show Aspire/Postgres readiness completed before Prisma ran.
- Idempotency decision: retry remains safe only for schema-engine preflight/teardown before migration SQL application. Do not retry `P1001`, SQL, schema validation, migration conflict, or partially-applied migration errors.
