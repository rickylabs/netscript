# Context Pack: PR-reachable docs-site gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1408-docs-gates-on-pull-request--leaf` |
| Branch | `fix/1408-docs-gates-on-pull-request` |
| Current phase | implement — slice 3.1 |
| Archetype | N/A — infrastructure workflow only |
| Scope overlays | docs |

## Current State

Baseline and live issue verified. Harness artifacts are scaffolded with D8 locked and PLAN-EVAL N/A. No implementation workflow is changed yet.

## Completed

- Required skill/workflow reads, fetch/status, baseline and issue verification, Design checkpoint.

## Next Steps

1. Commit/push slice 3.1, open and label the draft PR, then post slice evidence.
2. Add option 1 to `ci.yml`.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Implement both options | issue #1408 D8 | Locked owner decision. |
| Extend `pages.yml` | plan D8.2 | Avoid duplicated full-build workflow. |
| Wire checker unit test | plan D8.1 | Cheap and focused; no lock/network cost. |

## Files Changed

Run artifacts only.

## Gates

Pending.

## Open Questions

None.

## Drift and Debt

- Drift: none.
- Debt: deliberate local-only diagrams gate, documented rather than newly created.

## Commits

- See the draft PR commit list and per-slice comments.
