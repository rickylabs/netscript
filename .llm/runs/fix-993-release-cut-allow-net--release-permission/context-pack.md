# Context Pack: release-cut permission diagnosis

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-993-release-cut-allow-net--release-permission` |
| Branch | `fix/993-release-cut-allow-net` |
| Current phase | `plan-eval` |
| Archetype | `6 - CLI / Tooling` analogue |
| Scope overlays | none |

## Current State

The clean branch is exactly at the supplied baseline. Reproduction confirms the stated cause: the real token validates only when `api.github.com` net permission is present, while the current bare catch converts `NotCapable` to `null` and later `(401)` diagnostics.

## Completed

- Skill/harness bootstrap and required reference reads.
- Worktree/baseline verification.
- Task, endpoint, error-shape, consumer, and live-token reproduction research.
- Locked two-slice plan and Design checkpoint.

## In Progress

- Separate-session PLAN-EVAL.

## Next Steps

1. Obtain PLAN-EVAL `PASS`.
2. Commit/push the bootstrap artifacts and open the required draft PR.
3. Implement the one code slice, validate, review, commit/push/comment.
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

