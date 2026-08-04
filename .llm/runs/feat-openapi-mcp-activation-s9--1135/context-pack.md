# Context Pack: OMB S9 activation surfaces and migration fixture

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-activation-s9--1135` |
| Branch | `feat/openapi-mcp-activation-s9` |
| Current phase | `implement` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Current State

Both planned implementation slices are present in the worktree and focused tests pass 29/29. The
configured Claude review identities were unavailable pre-inference, so this is a WIP implementation
state, not supervisor sign-off. The pre-existing `deno.lock` change remains user-owned.

## Completed

- Live issue and canonical rev-2 design read.
- Current MCP initialize/registry, app convention template, failure flows, and agent-init rewrite
  behavior inspected.
- Plan-Gate composed under the owner-authorized milestone waiver.
- Activation byte fixtures and S-18 migration fixture implemented and focused-green.
- Draft PR #1232 opened with required labels/milestone/closing keyword.

## In Progress

- WIP implementation commit/push, then full gates and milestone IMPL-EVAL.

## Next Steps

1. Commit/push the WIP implementation without claiming sign-off.
2. Run scoped static, quality, JSR, and scaffold consumer gates.
3. Trigger the milestone open-model IMPL-EVAL; fix findings before readiness.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Current instructions target 21 tools | code/tests | old 14 count is fixture provenance only |
| Exact-pin rewrite requires re-init + restart | RFC S-18 / issue #1135 | zero install only for new scaffolds |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-openapi-mcp-activation-s9--1135/` | new | harness activation and locked plan |
| `packages/mcp/**` | changed | activation guidance contracts, values, and fixtures |
| `packages/cli/**` | changed | app behavior line and S-18 agent-init fixture |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | WAIVED-COMPOSED | `plan-eval.md` |
| Focused | PASS | 29 passed, 0 failed |
| Static | NOT_RUN | full wrappers pending |
| Fitness | NOT_RUN | quality/JSR pending |
| Runtime | NOT_RUN | implementation pending |
| Consumer | NOT_RUN | implementation pending |

## Open Questions

- Canonical Claude review transport is unavailable; milestone IMPL-EVAL must supply independent
  review before readiness.

## Drift and Debt

- Drift: historical 14-tool count superseded by current 21-tool registry; configured Claude review
  identities unavailable pre-inference.
- Debt: none planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
