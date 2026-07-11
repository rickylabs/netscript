# Context Pack: token-budget history strategy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-496-token-history--codex` |
| Branch | `feat/496-token-budget-history` |
| Current phase | `evaluate` |
| Archetype | `4 - Public DSL / Builder` |
| Scope overlays | `none` |

## Current State

The additive token-budget strategy, export, and acceptance tests are implemented and all planned
automated gates pass. PLAN-EVAL was owner-waived; separate-session review remains external.

## Completed

- Issue read, baseline/branch verified, public surface and test shape re-baselined.
- Strategy/types/export implemented; 94 package tests and all static/docs/publish/fitness gates pass.

## In Progress

- Commit and push of slice 1.

## Next Steps

1. Commit all owned source/test/run artifacts and push the required branch ref.
2. Orchestrator performs separate-session slice review/IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Leading system messages always remain | plan D4 | May alone exceed tiny budget. |
| Newest history is a contiguous suffix | plan D3 | Stop when the next older message does not fit. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-496-token-history--codex/*` | new | Harness planning artifacts. |
| `packages/ai/src/agent/history.ts` | changed | Strategy and public contracts. |
| `packages/ai/agent.ts` | changed | `./agent` exports. |
| `packages/ai/tests/agent_loop_test.ts` | changed | Five acceptance-focused cases. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | Check/lint/fmt, 94 tests, doc-lint, publish dry-run. |
| Fitness | PASS | `arch:check`; `packages/ai` has zero findings. |
| Runtime | N/A | Pure strategy only. |
| Consumer | PASS | `./agent` export check/doc-lint/publish dry-run. |

## Open Questions

- None.

## Drift and Debt

- Drift: owner-waived PLAN-EVAL only.
- Debt: none expected.

## Commits

- See branch history; no PR is opened by instruction.
