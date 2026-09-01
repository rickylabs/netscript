# Context Pack: Fresh export-table adoption

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-fresh-exports-table--1817` |
| Branch | `docs/fresh-exports-table` |
| Current phase | `evaluate` |
| Archetype | `4 — Public DSL/Builder` (described package only) |
| Scope overlays | `docs` |

## Current State

The reference, checker mapping, and three derived corpus layers are implemented. The generator
chain completed in the required order with exit 0 for each command, and every required gate passed
at implementation commit `e4dcf7200`. This evidence update is followed by one final exact-head gate
replay before push and PR creation.

## Completed

- Loaded the requested harness, doctrine, tools, and PR contracts.
- Copied issue #1817's four exact acceptance lines from GitHub.
- Ran `deno doc --json` on all sixteen modules and compared them with the reference sections.
- Recorded `PLAN-EVAL: N/A` before implementation.
- Added the recognized sixteen-row export table and evidence-backed mapping.
- Regenerated agent prose, the CLI asset barrel, and MCP publish assets in the prescribed order.
- Passed the full docs/corpus gate set, generated typecheck, whitespace check, lock comparison, and
  provenance ancestry check.

## In Progress

- Publish the implementation and hand it to the supervisor's separate IMPL-EVAL session.

## Next Steps

1. Commit this evidence update and replay every required gate at that exact head.
2. Push with an explicit refspec and open the requested PR at `status:impl`.
3. Hand off to the supervisor for separate IMPL-EVAL and lifecycle progression.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Use `entrypoints-only` | Sixteen-module `deno doc` comparison | Four absent symbol sections; seven other sections are incomplete. |
| No excluded exports | `packages/fresh/deno.json`; issue #1817 | All sixteen belong in the table. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `docs/site/reference/fresh/index.md` | changed | Recognized sixteen-entrypoint export summary. |
| `.llm/tools/docs/check-exports-drift.ts` | changed | Fresh authoritative mapping and symbol policy. |
| `.llm/assets/agent-docs/*` | changed | Regenerated canonical prose bundle and provenance. |
| `packages/cli/src/kernel/assets/agent-docs.generated.ts` | changed | Regenerated CLI embedded bundle. |
| `packages/mcp/src/publish-assets.generated.ts` | changed | Regenerated MCP publish asset. |
| `.llm/runs/docs-fresh-exports-table--1817/*` | changed/new | Harness identity, evidence, decisions, and handoff. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Docs/site | PASS | Export drift, source format, site build, links, caveats, accuracy, and snippets exit 0. |
| Corpus | PASS | All four freshness checks exit 0. |
| Static | PASS | Generated-file typecheck and `git diff --check` exit 0. |
| Hygiene | PASS | Empty status at implementation head; lock unchanged; provenance source is an ancestor. |

## Drift and Debt

- Drift: none from the staged contract; one expected pre-commit HEAD-sensitive freshness failure is
  documented in `worklog.md` and excluded from acceptance evidence.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list and per-slice comments after publication.
