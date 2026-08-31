# Research — docs-ai-exports-heading-and-skills--1809

## Re-baseline

- Carried-in source: issue #1809 and `implement.md`.
- Re-derived against `origin/main` at `5197e70b716eafb82fbb12ddb9a910c248ddb86a` on 2026-08-31.
- The issue's export-map facts remain current. The branch adds only its implementation brief above
  that baseline before this slice.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | The AI package publishes 13 entrypoints, while the page's unrecognized `## Export map` table lists 12 and omits `/skills`. | Compare `packages/ai/deno.json` with `docs/site/reference/ai/index.md`. |
| 2 | `/skills` exports 16 public symbols covering parsing, loading, tag/semantic matching, and an in-memory content source. | `deno doc --json packages/ai/src/skills/mod.ts` |
| 3 | A `deno doc --json` audit of all 13 modules finds real page-wide symbol gaps, including all dedicated `/skills` APIs plus root prompt, OpenAI vision, MCP pool/resource, vector-memory, and retrieval-testing exports. | Run the 13-entrypoint audit recorded in `worklog.md`. |
| 4 | `parseDocContent()` recognizes `## Exports` and `## Sub-path exports`, not `## Export map`. | `.llm/tools/docs/check-exports-drift.ts` |

## jsr-audit surface scan

- N/A: this is a docs/tooling adoption slice and changes no package source or published export.

## Open questions

- None. The evidence requires `entrypoints-only`; per-symbol expansion is explicitly out of scope.
