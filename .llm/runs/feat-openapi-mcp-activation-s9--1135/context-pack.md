# Context Pack: OMB S9 activation surfaces and migration fixture

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-activation-s9--1135` |
| Branch | `feat/openapi-mcp-activation-s9` |
| Current phase | `plan-eval waiver complete` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Current State

Research and the locked two-slice plan are complete. The current registry is 21 tools. No
implementation files have been changed. The pre-existing `deno.lock` change is user-owned.

## Completed

- Live issue and canonical rev-2 design read.
- Current MCP initialize/registry, app convention template, failure flows, and agent-init rewrite
  behavior inspected.
- Plan-Gate composed under the owner-authorized milestone waiver.

## In Progress

- Bootstrap commit, draft PR, then slice 1.

## Next Steps

1. Commit/push the run bootstrap and open the draft PR.
2. Implement activation bytes contract-first and run focused gates.
3. Obtain opposite-family slice review before sign-off.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Current instructions target 21 tools | code/tests | old 14 count is fixture provenance only |
| Exact-pin rewrite requires re-init + restart | RFC S-18 / issue #1135 | zero install only for new scaffolds |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-openapi-mcp-activation-s9--1135/` | new | harness activation and locked plan |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | WAIVED-COMPOSED | `plan-eval.md` |
| Static | NOT_RUN | implementation pending |
| Fitness | NOT_RUN | implementation pending |
| Runtime | NOT_RUN | implementation pending |
| Consumer | NOT_RUN | implementation pending |

## Open Questions

- None.

## Drift and Debt

- Drift: historical 14-tool count superseded by current 21-tool registry.
- Debt: none planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.

