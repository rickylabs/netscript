# Context Pack: registry-safe MCP README embedding

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-readme-text-import--beta10-jsr-hotfix` |
| Branch | `fix/mcp-readme-text-import` |
| Current phase | `implement` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

The branch is based on `origin/main` at `a5adb706`. Research and a four-slice design are locked. Separate-session PLAN-EVAL passed; implementation may begin.

## Completed

- Named skills, harness routing, relevant doctrine, release gates, existing generator, publish surface, and preflight implementation were inspected.
- Research, plan, design checkpoint, supervisor identity, and drift log were created.
- PLAN-EVAL passed in local Qwen session `f03ae1dd-da69-406a-b725-f3bf391255a8`.

## In Progress

- Slice 2 generated publish assets and publish-surface sweep.

## Next Steps

1. Implement generated assets and the publish-surface sweep.
2. Run freshness green/red and focused package gates.
3. Commit, push, and comment slice 2.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Generated constants are the only sanctioned bundled assets. | user + plan D1 | No import attributes in publishable source. |
| Scan actual publish rules. | existing preflight + plan D3 | Avoid test-only false failures. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-mcp-readme-text-import--beta10-jsr-hotfix/` | new | Harness planning artifacts only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS | `plan-eval.md`; session `f03ae1dd-da69-406a-b725-f3bf391255a8` |
| Static | not run | blocked by Plan-Gate |
| Fitness | not run | blocked by Plan-Gate |
| Runtime | N/A | no runtime protocol change planned |
| Consumer | not run | blocked by Plan-Gate |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments after the bootstrap commit.
