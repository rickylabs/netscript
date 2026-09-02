# Research — fix-mcp-export-corpus-refresh--1859

## Re-baseline

- Carried-in source: issue #1859 coordinator brief and supplied bisection.
- Re-derived against `main` @ `78be0e032624f12bcb30535d40e3a948b08b9784` on 2026-09-01.
- The defect and culprit were owner-bisected and are not re-derived in this slice.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The requested branch is at the exact base and has no product changes. | `git rev-parse HEAD`; `git status --short --branch` |
| 2 | The MCP export corpus is stale at the base. | `deno task check:mcp-export-corpus` captured `REAL_EXIT=1` with `MCP export-surface corpus is stale` |
| 3 | The generator task owns one product output path. | `deno.json` task plus `.llm/tools/docs/generate-export-surface-corpus.ts` |
| 4 | Doctrine classifies `packages/mcp` as Archetype 2 / Keep. | `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md` |

## jsr-audit surface scan

- Surface scanned: `packages/mcp/deno.json` exports `.`, `./cli`, and `./openapi-projection`.
- Slow-type / surface risks: none introduced; the slice changes no entrypoint, symbol, dependency,
  metadata, or declared export. The generated embedded corpus remains publish-included TypeScript,
  which follows the repo's JSR-safe generated-asset rule.

## Open questions

- None. The coordinator locked the generator, sole product output, expected diff scale, and gates.
