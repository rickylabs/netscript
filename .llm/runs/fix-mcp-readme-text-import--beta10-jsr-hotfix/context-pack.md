# Context Pack: registry-safe MCP README embedding

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-readme-text-import--beta10-jsr-hotfix` |
| Branch | `fix/mcp-readme-text-import` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

The branch is based cleanly on `origin/main` at `a5adb706`. Research and a four-slice design are locked. No implementation source has changed; PLAN-EVAL is the hard stop.

## Completed

- Named skills, harness routing, relevant doctrine, release gates, existing generator, publish surface, and preflight implementation were inspected.
- Research, plan, design checkpoint, supervisor identity, and drift log were created.

## In Progress

- Separate-session formal PLAN-EVAL.

## Next Steps

1. Obtain PLAN-EVAL `PASS`.
2. Commit/push the plan bootstrap and open the draft PR.
3. Implement generated assets and the publish-surface sweep.

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
| Plan | pending | formal evaluator not yet run |
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
