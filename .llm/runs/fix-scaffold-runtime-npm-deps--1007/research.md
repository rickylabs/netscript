# Research — fix-scaffold-runtime-npm-deps--1007

## Re-baseline

- Carried-in source: `/home/codex/scaffold-deps-brief.md` and issue #1007
- Re-derived against `main` @ `6a7d2af993610a7f6292d6782c8c972aab7d864f` on 2026-08-01
- The reported Vite error is confirmed in production artifact run 30677734061. Local reproduction exposed prerequisite and cache-dependent behavior recorded in `drift.md`.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Canary.5 uses `init`, not `new`. | Published CLI `--help` |
| 2 | Production `behavior.app-home` failed in Vite `fetchModule` for `npm:@tanstack/preact-query@^5.101.0`. | `.llm/tmp/canary5-prod-artifact/cli-e2e-prod-report.json` |
| 3 | `SCAFFOLD_APP_IMPORTS` omits the Fresh runtime subset already named by the Fresh manifest regression test. | `scaffold-app-catalog.ts`; `package-manifest_test.ts` |
| 4 | The canonical versions live in root `deno.json` `catalog`; `catalog:` cannot be emitted as an import target. | root `deno.json`; Deno toolchain skill |
| 5 | A warm local generated `node_modules` can mask the missing direct app dependency. | `/tmp/netscript-canary5-before-service-WP2bAB/.../node_modules/.deno` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: CLI scaffold constants are internal and do not alter `packages/cli/mod.ts` exports.
- Slow-type / surface risks: none; output contract changes only in generated `deno.json` imports.

## Open questions

- None blocking: the runtime subset is the existing `runtimeCatalogDependencies` contract.

