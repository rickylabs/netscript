# Context Pack: agent model routing and subscription expense policy revamp

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `chore-revamp-agent-model-routing--model-matrix` |
| Branch | `chore/revamp-agent-model-routing` |
| Current phase | `research` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | docs |

## Current State

The owner matrix has been read in full and supersedes prior routing rulings. Official OpenAI
documentation confirms the `gpt-6-astra` identity and reasoning range. An isolated worktree exists;
repository/provider/quota research and the design checkpoint remain in progress.

## Completed

- Matrix-first intake.
- Applicable harness, tooling, PR, and OpenAI model-migration instructions read.
- Fresh `origin/main` baseline and worktree established.

## In Progress

- Early draft PR bootstrap.
- Current router, provider adapters, expense watcher, and official quota contract inventory.

## Next Steps

1. Open the draft PR.
2. Complete source-backed provider/quota research and repository surface inventory.
3. Lock plan/design and obtain a separate cross-family PLAN-EVAL PASS.
4. Implement, verify, and obtain a separate IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Entire legacy matrix is superseded | Owner matrix | Preserve the cross-family invariant across every fallback. |
| Astra identity is `gpt-6-astra` | Official OpenAI documentation | Route remains capability checked while account access rolls out. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/chore-revamp-agent-model-routing--model-matrix/*` | new | Harness bootstrap artifacts only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | research | PLAN-EVAL required after design lock |
| Static | NOT_RUN | implementation not started |
| Fitness | NOT_RUN | implementation not started |
| Runtime | NOT_RUN | implementation not started |
| Consumer | NOT_RUN | implementation not started |

## Open Questions

- Exact subscription telemetry and model availability contracts are still being verified.

## Drift and Debt

- Drift: prior routing policy is superseded by owner instruction; recorded in `drift.md`.
- Debt: none created.

## Commits

- See the draft PR commit list and later per-slice comments.

