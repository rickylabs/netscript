# Research — fix-scaffold-build-catalog-zod--0.0.7

## Re-baseline

- Carried-in source: issue #1971 and `implement-brief.md`.
- Re-derived against `origin/main` at `574e9ce57b24698aa430b796b036cb5551d9f247` on 2026-09-03.
- Branch ancestry is correct: the pre-existing brief commit `12c566672` is a direct child of the
  requested baseline. The local `main` worktree has independently advanced and is not the baseline
  for this leaf.
- The issue's reproduction still fails at both checkpoints on the requested baseline.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `netscript-dev init` exits 0 and emits one app-level catalog mapping: `"zod": "catalog:"`. | Exact #1971 shell block; generated app and root `deno.json`. |
| 2 | The immediate app build exits 1 before reaching Zod resolution because the declared `@database/zod` entrypoint, `schema/.generated/zod/crud.ts`, does not exist until codegen. | First `deno task build` raw error in `worklog.md`. |
| 3 | Standalone SQLite `db:generate` exits 0 and creates the missing Zod graph. | Exact #1971 codegen command and raw exit in `worklog.md`. |
| 4 | The post-codegen SSR build exits 1 after 456 modules with `[vite:load-fallback] Could not load catalog:` from `routes/examples/users/(_lib)/route-contract.ts`. | Second `deno task build` raw error in `worklog.md`. |
| 5 | `zod` is the only `catalog:` value in the generated Fresh app import map, and the named route imports it directly. No other app-level catalog entry is reachable because no other app-level catalog entry exists. | Parse generated app imports; `rg` the materialized route. |
| 6 | Native Deno and Fresh production resolution disagree in the same app: `import.meta.resolve("zod")` returns the installed `node_modules/.deno/zod@4.5.4/.../index.js`, while `@deno/loader@0.4.0` returns literal `catalog:`. | Resolver differential command recorded in `worklog.md`. |
| 7 | Fresh's upstream Vite plugin owns the Deno loader. NetScript's `createNetScriptVitePlugin` only resolves app aliases and canonicalizes Preact/Signals; it has no catalog resolver. | Cached `@fresh/plugin-vite@1.1.2/src/plugins/deno.ts`; `packages/fresh/src/application/vite/vite.ts`. |
| 8 | The generated workspace root already derives `catalog.zod` from `SCAFFOLD_APP_CATALOG.ZOD`; that same authority can materialize an explicit app `npm:zod@<range>` target without a second version source. | `scaffold-app-catalog.ts` and workspace `deno-json.ts`. |
| 9 | The database scaffolder already seeds a pre-codegen Prisma client placeholder, providing the local pattern for a disposable pre-codegen Zod contract placeholder. | `packages/cli/src/kernel/adapters/database/scaffolder.ts`. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/cli/deno.json`, `mod.ts`, `maintainer.ts`, and both binary entrypoints.
- Planned change does not alter exports, public symbols, JSDoc, package metadata, or dependency
  declarations. It changes generated consumer content behind the existing init command.
- Existing unrelated CLI doc-completeness and maintainer isolated-declaration debts remain recorded
  in `.llm/harness/debt/arch-debt.md`; this slice neither deepens nor closes them.
- Slow-type / surface risk: none introduced. `quality:gate`, scoped package gates, and
  `publish:dry-run`/doc checks remain evaluator evidence as selected below.

## Open questions

- None that force rework. The failing resolver is upstream, the sole affected mapping is known, and
  both generated-build checkpoints have deterministic local reproducers.

