# Research — fix-scaffold-sqlite-allow-ffi--1191

## Re-baseline

- Carried-in source: issue #1191 and wave-0 proof evidence under
  `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/evidence/`.
- Re-derived against `origin/main` at `2c8865e8c4ec60ef080276d327fc75ab32c0cb85` on 2026-08-04.
- The worktree is exactly at that baseline and was clean before bootstrap.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The real failure is an exit-1 SQLite/libsql service caused by missing `--allow-ffi`. | Issue #1191; `P1-runtime.json`; `P2-db-failure.json`. |
| 2 | `generateRegisterServices()` is the command-emission seam and emits the complete `deno run` argv. | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts`. |
| 3 | The selected SQLite engine is available at generated-AppHost runtime through `config.PrimaryDatabase` and `config.Databases[...]`. | The SQLite environment branch in the same generator. |
| 4 | Default service permissions are currently database-agnostic: net, env, read, and sys. | `render-ts-apphost.ts`; `_aspire-compat.ts.template`; generated service output. |
| 5 | Postgres, MySQL, and MSSQL use container adapters and do not require libsql FFI. | `generate-appsettings.ts` database blocks and generated infrastructure registration. |
| 6 | The serialized AppHost slot was free before live RED work. | `aspire ps --format Json` returned `[]` on 2026-08-04. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/cli/deno.json`, `mod.ts`, and the planned generator/test paths.
- The change does not alter exports, entrypoints, package metadata, dependencies, or public symbol
  types. No new slow-type or JSR surface risk is introduced. Package dry-run/doc-lint remain final
  static gates because `packages/cli` is a publishable Archetype-6 package.

## Open questions

- Resolved now: add FFI only to service argv when the selected primary database has engine
  `Sqlite`; do not broaden the global Deno default permission set for apps/plugins/background jobs.
- Resolved now: other database templates are audited with generated-output assertions proving the
  permission remains absent for Postgres, MySQL, MSSQL, and no-database output.

