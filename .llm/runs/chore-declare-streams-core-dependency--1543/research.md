# Research — chore-declare-streams-core-dependency--1543

## Re-baseline

- Carried-in source: issue #1543 and the owner-provided base assessment.
- Re-derived against `main` @ `38f2ce7358f80e4075c481b450b52e1a01c5984c` on 2026-09-01.
- The carried-in facts matched. One additional import exists at
  `plugins/triggers/src/public/mod.ts:23`, as the owner noted.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `packages/plugin-workers-core/deno.json` omitted `@netscript/plugin-streams-core` despite imports in `src/streams/{producer,schema}.ts`. | `rg -n 'plugin-streams-core' packages/plugin-workers-core` |
| 2 | `plugins/triggers/deno.json` omitted the same dependency despite imports in `streams/{producer,factory,schema}.ts` and `src/public/mod.ts`. | `rg -n 'plugin-streams-core' plugins/triggers` |
| 3 | `plugins/workers/deno.json` declares the established exact specifier `jsr:@netscript/plugin-streams-core@0.0.6`. | `plugins/workers/deno.json:26` |
| 4 | The base publish dry-run succeeds and emits no rejection or undeclared-import warning. | `deno task publish:dry-run` → `REAL_EXIT=0` |

## jsr-audit surface scan

- Surface scanned: both manifest import maps and all six source import sites.
- Slow-type / surface risks: none; no export or TypeScript surface changes.
- The repository publish dry-run is the applicable publishability evidence for this manifest-only
  slice. A broader JSR surface audit is N/A because no published API or file set changes.

## Open questions

- None. The owner locked the consistency outcome and exact specifier pattern.
