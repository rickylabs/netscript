# Context Pack: PR-reachable docs-site gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1408-docs-gates-on-pull-request--leaf` |
| Branch | `fix/1408-docs-gates-on-pull-request` |
| Current phase | implementation correction — slice 3.8 |
| Archetype | N/A — infrastructure workflow only |
| Scope overlays | docs |

## Current State

Formal IMPL-EVAL returned PASS with two requested follow-ups. Slice 3.8 restores one shared group for all deploy-capable events while PRs remain ref-isolated, and corrects acceptance box 1 to separate RED execution/failure evidence from blocking evidence in the ruleset-required `quality` context. The PR remains draft.

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
- Slice 3.7 pushed and PR build passed: https://github.com/rickylabs/netscript/actions/runs/31366417850.
- Slice 3.8 concurrency and acceptance-evidence corrections implemented.

## Next Steps

1. Commit and explicitly push slice 3.8; update the PR body's box 1 evidence and comment the slice.
2. Wait for the PR `build` check and report it. Supervisor then marks ready and requires non-draft `quality` with both docs source steps executed successfully before merge.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Implement both options | issue #1408 D8 | Locked owner decision. |
| Extend `pages.yml` | plan D8.2 | Avoid duplicated full-build workflow. |
| Wire checker unit test | plan D8.1 | Cheap and focused; no lock/network cost. |

## Files Changed

`ci.yml`, `pages.yml`, and run artifacts. Slice 3.8 changes only the Pages concurrency expression plus these two run artifacts; its evidence correction is PR metadata. The RED fixture exists only in commit `d0e1925a0` and is deleted at branch head.

## Gates

RED/GREEN Actions proof, local tasks, lock equality, slice 3.7 build, and YAML parsing pass. Slice 3.8 post-push build is pending. Draft-suppressed required `quality` remains pending the supervisor's readiness transition.

## Open Questions

- None for implementation. IMPL-EVAL passed; the supervisor-owned non-draft required-context run remains.

## Drift and Debt

- Drift: none.
- Debt: deliberate local-only diagrams gate, documented rather than newly created.

## Commits

- See the draft PR commit list and per-slice comments.
