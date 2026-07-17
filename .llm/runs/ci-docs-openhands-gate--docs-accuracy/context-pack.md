# Context Pack: automatic OpenHands docs-accuracy gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `ci-docs-openhands-gate--docs-accuracy` |
| Branch | `ci/docs-openhands-gate` |
| Current phase | `implement` |
| Archetype | N/A |
| Scope overlays | `SCOPE-docs.md` |

## Current State

Research, Design, and PLAN-EVAL are complete against current `origin/main`. Fresh local Qwen
session `d50d8e9b-a3f5-465a-8dcb-15785de620b7` evaluated the settled D1-D8 plan and returned
`PASS`. No implementation file has been created. The owner refinement is locked: hand-testing is
conditional on executable claims; every docs PR still requires full changed-set reading, per-file
verdicts, low-hallucination prose review, and blocking hallucinated verb/flag/path findings.

## Completed

- Required skills and harness workflow references read.
- Clean branch/current-main/model/token/marker/mirror/fallback-doc facts verified.
- Plan and Design checkpoint recorded.
- PLAN-EVAL `PASS` recorded in `plan-eval.md`.

## In Progress

- Planning-slice commit/push and draft PR creation.

## Next Steps

1. Commit/push the plan bootstrap and open the draft PR.
2. Implement slice 1, validate, review, commit, push, and comment.
3. Run separate-session IMPL-EVAL without dispatching OpenHands.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Exact Minimax route with hard guard | plan D3 | Future cloud gate only. |
| Conditional executable testing | plan D6 | Pure prose emits the owner-specified one-line note. |
| PAT-only posting | plan D4 | Fail visibly if unavailable. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/ci-docs-openhands-gate--docs-accuracy/*` | new | Harness bootstrap only. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PLAN-EVAL PASS | `plan-eval.md` |
| Fitness | pending | docs overlay |
| Runtime | N/A | no eval dispatch |
| Consumer | pending | planned assertions |

## Open Questions

- none

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments after bootstrap.
