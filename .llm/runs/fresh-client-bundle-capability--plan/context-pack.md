# Context Pack: deterministic Fresh client-bundle capability

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fresh-client-bundle-capability--plan` |
| Branch | `test/fresh-client-bundle-capability` |
| Current phase | `plan-eval` |
| Archetype | `4 — Public DSL / Builder` |
| Scope overlays | `frontend` |

## Current State

Research and design are locked against current main. #1557 is now in scope because a package-level
Playwright/Vite gate exists. No implementation has started; separate-session PLAN-EVAL is the hard
stop.

## Completed

- Read required skills, harness/doctrine references, and both issues including comments.
- Re-baselined branch exactly to current `origin/main`.
- Proved the locked/cached-only Vite command with an empty npm cache.
- Recorded design, risks, slices, and validation plan.

## In Progress

- Commit plan artifacts, open the draft PR, and run native Claude/Fable PLAN-EVAL.

## Next Steps

1. Commit/push the plan and open the required draft PR with requested labels/milestone.
2. Obtain `plan-eval.md = PASS` from a separate Fable 5 medium session.
3. Implement slice 1 only after PASS.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Package-level browser test | plan D1 | Existing capability observes client navigation; CLI E2E does not. |
| Real Playwright driver | plan design note | Hydrated effect/form submission cannot be simulated honestly by server fetch. |
| Locked/cached-only Vite | plan D2 | Exact package import and root lock already exist. |
| Existing opt-in browser lane | plan D5 | No workflow/image/dependency addition. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fresh-client-bundle-capability--plan/*` | new | Mandatory run artifacts plus owner brief/session receipt. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | research-only PASS | Baseline and locked Vite probe |
| Fitness | pending | PLAN-EVAL then scoped wrappers/quality gate |
| Runtime | blocked locally/pending CI | `playwright-cli` absent locally; existing CI provisions it |
| Consumer | N/A | No public-surface change |

## Open Questions

- None requiring a design decision before implementation.

## Drift and Debt

- Drift: #1557's original missing-capability premise is superseded; local driver is absent.
- Debt: none created or deepened.

## Commits

- See the draft PR's commit list + per-slice PR comments after the plan commit.
