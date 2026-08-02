# Research — fix-1016-scaffold-tsconfig--project-boundary

## Re-baseline

- Carried-in source: issue #1016 and the owner-provided defect brief.
- Re-derived against `main` at `3ab64720f` on 2026-08-01.
- The described writer locations and missing files match the baseline. The Vite failure occurs on the first SSR request, not merely by starting the dev process.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `scaffoldRoot()` writes the workspace config and other root files, but no root `tsconfig.json`. | `packages/cli/src/kernel/application/scaffold/plan-init.ts`; inspect generated `repro-before`. |
| 2 | `writeNormalizedAppFiles()` writes app `deno.json` and `vite.config.ts`, but no app `tsconfig.json`. | `packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts`. |
| 3 | `tsconfig.apphost.json` is confined to `aspire/` and cannot terminate lookup for the root or `apps/dashboard`. | `packages/cli/src/kernel/application/scaffold/render-ts-apphost.ts`. |
| 4 | With `{ "extends": "astro/tsconfigs/strict" }` immediately above the project, baseline `db generate` exits 1 with `File 'astro/tsconfigs/strict' not found.` | `.llm/tmp/issue-1016-before-parent`; raw command captured in the 2026-08-01 research session. |
| 5 | Baseline Vite reports ready, but the first `/` request fails SSR resolution against the parent config. | `deno task dev`, then `curl http://127.0.0.1:5173/`; Vite logs name `SidebarToggle.tsx` and the unresolved parent `extends`. |
| 6 | A root config containing only `{ "files": [] }` terminates Prisma lookup without asking TypeScript editors to include the Deno workspace. | Prototype in `.llm/tmp/issue-1016-before-parent/repro-before`; `db generate` exits 0. |
| 7 | An app config with bundler/Preact compiler options and an empty file set terminates Vite lookup while preserving Fresh SSR. | Prototype returns HTTP 200 for `/` under Vite. |
| 8 | Deno behavior is unchanged: `deno task check` exits 0 both without and with the proposed configs. | Same prototype; both runs use `deno check apps/**/*.ts services/**/*.ts contracts/**/*.ts`. |
| 9 | The scaffold `.gitignore` does not match `tsconfig*.json`. | `packages/cli/src/kernel/assets/workspace/gitignore.template`. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/cli/deno.json` exports and existing entrypoints.
- The change adds internal Tier-1 generators only; it does not change package exports, dependency metadata, public symbol types, or JSDoc entrypoints.
- Slow-type / surface risks: none introduced. Package doc-lint/publishability remain gate evidence, not implementation scope.

## Open questions

- None. The content decision was resolved empirically before Plan-Gate: empty file sets prevent editor overreach; the app config supplies only Vite/Fresh-relevant compiler options.
