# Context Pack: PR-reachable docs-site gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1408-docs-gates-on-pull-request--leaf` |
| Branch | `fix/1408-docs-gates-on-pull-request` |
| Current phase | implementation correction — slice 3.7 |
| Archetype | N/A — infrastructure workflow only |
| Scope overlays | docs |

## Current State

The accepted Tier-A review found one least-privilege issue: PR builds inherited deploy-scoped workflow permissions. Slice 3.7 moves `pages: write` and `id-token: write` to the guarded deploy job while workflow/build retain only `contents: read`. All triggers, guards, concurrency, and docs gates are unchanged. The PR remains draft.

## Completed

- Required skill/workflow reads, fetch/status, baseline and issue verification, Design checkpoint.
- Slice 3.1 committed, pushed, and commented on draft PR #1440.
- Slice 3.2 implementation and local focused gates completed.
- Slice 3.3 full docs-site build completed locally.
- Slice 3.4 negative control locally fails with the expected diagnostic.
- Slice 3.4 pushed and proven RED: https://github.com/rickylabs/netscript/actions/runs/31365789097.
- Slice 3.5 fixture deletion and local GREEN gates completed.
- Slice 3.5 pushed and proven GREEN: https://github.com/rickylabs/netscript/actions/runs/31365881454.
- Slice 3.6 exact lock equality and current PR-check PASS recorded.
- Slice 3.7 least-privilege workflow correction implemented and locally parsed.

## Next Steps

1. Commit and explicitly push slice 3.7; wait for the PR `build` check and comment its result.
2. Supervisor re-reviews slice 3.7, dispatches separate-session IMPL-EVAL, transitions `status:impl` → `status:impl-eval`, and later marks ready so draft-suppressed required contexts materialize.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Implement both options | issue #1408 D8 | Locked owner decision. |
| Extend `pages.yml` | plan D8.2 | Avoid duplicated full-build workflow. |
| Wire checker unit test | plan D8.1 | Cheap and focused; no lock/network cost. |

## Files Changed

`ci.yml`, `pages.yml`, and run artifacts. Slice 3.7 changes only Pages permission placement plus these two run artifacts. The RED fixture exists only in commit `d0e1925a0` and is deleted at branch head.

## Gates

RED/GREEN Actions proof, local tasks, lock equality, and pre-3.7 current PR checks pass. YAML parse passes; the post-push PR build is pending. Draft-suppressed core contexts remain pending the supervisor's readiness transition.

## Open Questions

- None for implementation. Supervisor-owned IMPL-EVAL and non-draft full required-context run remain.

## Drift and Debt

- Drift: none.
- Debt: deliberate local-only diagrams gate, documented rather than newly created.

## Commits

- See the draft PR commit list and per-slice comments.
