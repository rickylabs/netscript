# Research — docs-plugin-scaffolding-invents--1857

## Re-baseline

- Carried-in source: issue #1857 assignment brief.
- Re-derived against `origin/main` at `78be0e032` on 2026-09-01.
- The three reported defects reproduce without adjustment.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | Both plugin manifests publish `./scaffold` as `./scaffold.ts`; neither publishes `./scaffolding`. | `rg -n '"\\./scaffold(ing)?"' plugins/{triggers,workers}/deno.json` |
| 2 | Neither claimed `src/scaffolding/` module path exists. | `test -e plugins/triggers/src/scaffolding; test -e plugins/workers/src/scaffolding` (both exit 1) |
| 3 | Every named symbol in the fabricated sections has zero matching export declarations under `plugins/` or `packages/`. | `rg -n "export .*<symbol>" plugins packages` (exit 1 for each symbol) |
| 4 | `deno doc --json plugins/{triggers,workers}/scaffold.ts` reports the same four named type exports: `PluginLogger`, `PluginScaffoldEntrypoint`, `ScaffolderContext`, and `ScaffoldResult`. | Inspect each JSON module's `symbols` collection; the file also has its adapter-specific default scaffold entrypoint. |

## jsr-audit surface scan

- N/A: this is a docs-only correction. It does not change a package/plugin export or publish shape.

## Open questions

- None. A concise sub-path row is proportionate; duplicating four shared contract descriptions in a detail section would add no new guidance.
