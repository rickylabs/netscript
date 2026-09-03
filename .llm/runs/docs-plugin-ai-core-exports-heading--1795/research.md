# Research — docs-plugin-ai-core-exports-heading--1795

## Re-baseline

- Carried-in source: issue #1795 and `implement.md`.
- Re-derived against `origin/main` @ `5197e70b7` on 2026-08-31.
- The heading mismatch remains present; no package source change is required.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The correct two-row export table is under unrecognized `## Entrypoints`. | Read `docs/site/reference/plugin-ai-core/index.md`. |
| 2 | `deno doc` reports 23 root exports and 69 `contracts/v1` exports. | Run both assignment-specified `deno doc --json` commands and inspect `nodes[*].symbols[].name`. |
| 3 | Every root export is documented in the root section. | Set-diff the root names against backtick identifiers in `## Root surface`. |
| 4 | The contract section omits five real exports: `AiContractSchema`, `AiContractSchemaResult`, `JsonSchema`, `ReasoningChunk`, and `ToolParameters`. | Set-diff the subpath names against the page's dedicated surface sections; `rg` confirms none appears on the page. |

## jsr-audit surface scan

- N/A: this docs/tooling slice does not change package source or its published surface.

## Open questions

- None. The evidence requires `symbolCoverage.mode: 'entrypoints-only'` with the exact five-symbol gap.
