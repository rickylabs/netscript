# Context Pack: release-cut permission diagnosis

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-993-release-cut-allow-net--release-permission` |
| Branch | `fix/993-release-cut-allow-net` |
| Current phase | `implement` |
| Archetype | `6 - CLI / Tooling` analogue |
| Scope overlays | none |

## Current State

The clean branch began exactly at the supplied baseline. Reproduction confirms the stated cause. The independent PLAN-EVAL failed the original network/subprocess test design; D1/D3 are now revised to narrow net classification and hermetically test pure helpers plus the rendered operator line.

## Completed

- Skill/harness bootstrap and required reference reads.
- Worktree/baseline verification.
- Task, endpoint, error-shape, consumer, and live-token reproduction research.
- Locked two-slice plan and Design checkpoint, then corrected D1/D3 from the independent PLAN-EVAL findings.

## In Progress

- Implementation slice after owner-authorized PLAN-EVAL correction.

## Next Steps

1. Implement the scoped task permission and pure error classification/rendering seam.
2. Run the exact requested validation and acceptance probe.
3. Complete substantive slice review, commit/push/comment.
4. Run separate-session IMPL-EVAL and finalize PR evidence/labels.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Rethrow only `Deno.errors.NotCapable` with the missing flag named. | `plan.md` D1 | Keeps genuine HTTP auth failures on the existing null/401 path. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-993-release-cut-allow-net--release-permission/*` | new | harness bootstrap, research, plan, design, resumable state |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | pending | implementation not started |
| Fitness | pending | proportional focused review planned |
| Runtime | research reproduced | `worklog.md` runtime research evidence |
| Consumer | pending | scoped check planned |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments after the bootstrap commit is pushed.
