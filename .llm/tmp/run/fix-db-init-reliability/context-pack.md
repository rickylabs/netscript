# Context Pack — db-init reliability

- Branch: `fix/db-init-reliability`.
- Objective: eliminate residual `scaffold.runtime` `database.init` flake.
- Current status: implementation and local validation complete; commit/PR steps remain.
- Known pre-existing dirt: `.llm/tmp/run/openhands/**/request.md` line-ending drift; do not stage.
- Key findings:
  - Prior retry lives in `packages/database/scripts/migrate.ts`.
  - `db init` uses `migrate dev --name init` because the CLI/gate/generated task pass a migration name.
  - AppHost DB CLI mode already uses `.waitFor(target.resource)`.
  - Prior raw failure signature includes `schema-engine-windows.exe`, `ERR_STREAM_PREMATURE_CLOSE`, and `cli can-connect-to-database`.
  - Local residual reproduction also showed Aspire waiting 309069ms for `prisma-init-postgres`; fixed by bounding each non-interactive Prisma child attempt so the retry policy can recover instead of waiting for the outer operation timeout.
  - One post-fix full `scaffold.runtime` run passed completely (`passed=47 failed=0`).
  - A later post-fix full-suite proof loop was blocked after db-init/generate/seed passed by unrelated Aspire runtime startup/dashboard-port drift.
  - Five focused generated-project `db init` runs passed.
- Next: stage explicit paths, commit, push explicit refspec, open PR, post phase comment.
