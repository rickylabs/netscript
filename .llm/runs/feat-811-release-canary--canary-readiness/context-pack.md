# Context Pack: canary publish channel and publish readiness

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-811-release-canary--canary-readiness` |
| Branch | `feat/811-release-canary` |
| Current phase | `plan-eval` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Current State

The branch is cleanly based on current `origin/main` at `a5adb706`. Issue/PR/release-tool research and a six-slice design are locked. No implementation file has been changed; PLAN-EVAL is the hard stop.

## Completed

- Read all user-named skills in full and the harness activation/run-loop/lane/gate/evaluator authorities.
- Read issue #811, PR #810 plus its owner correction, the full current PR #810 branch artifacts, the specified release scripts, workflows, tests, README/tagline standards, token resolver, workspace/version helpers, and relevant debt.
- Verified baseline release tests: 29 passed, 0 failed.
- Confirmed official JSR version metadata, prerelease/latest, yanking, GitHub workflow-dispatch, `GITHUB_TOKEN`, and commit-status semantics.

## In Progress

- Separate-session PLAN-EVAL.

## Next Steps

1. Commit/push this bootstrap and open the draft PR.
2. Run local Qwen PLAN-EVAL and obtain `PASS` before implementation.
3. Implement slice 2 only after the pass.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Stable target only; `<target>-canary.N` | plan D1 | Keeps canary below target. |
| Full publish-set JSR max + tag guard | plan D2 | Safe after partial publish/failure. |
| SHA-bound status pair | plan D8/D9 | Stable release fails closed without evidence. |
| #810 task boundary | plan D6 | No scanner duplication. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-811-release-canary--canary-readiness/` | new | Harness planning artifacts only |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | pending | separate Qwen evaluator |
| Static | baseline PASS | release suite 29/29 |
| Fitness | not run | blocked by Plan-Gate |
| Runtime | N/A in PR | no live publish authorized |
| Consumer | not run | blocked by Plan-Gate |

## Open Questions

- None.

## Drift and Debt

- Drift: none.
- Debt: one stale OIDC entry planned for closure; no new debt.

## Commits

- See the draft PR's commit list + per-slice PR comments.
