# Context Pack: PR-reachable docs-site gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1408-docs-gates-on-pull-request--leaf` |
| Branch | `fix/1408-docs-gates-on-pull-request` |
| Current phase | implement — slice 3.2 |
| Archetype | N/A — infrastructure workflow only |
| Scope overlays | docs |

## Current State

The docs-aware `quality` lane now runs both `check:source-format` and `test:source-format` before workspace installation. Both are conditioned on the existing required job's `RUN` value.

## Completed

- Required skill/workflow reads, fetch/status, baseline and issue verification, Design checkpoint.
- Slice 3.1 committed, pushed, and commented on draft PR #1440.
- Slice 3.2 implementation and local focused gates completed.

## Next Steps

1. Commit/push/comment slice 3.2.
2. Add path-scoped PR full build and deploy guards to `pages.yml`.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Implement both options | issue #1408 D8 | Locked owner decision. |
| Extend `pages.yml` | plan D8.2 | Avoid duplicated full-build workflow. |
| Wire checker unit test | plan D8.1 | Cheap and focused; no lock/network cost. |

## Files Changed

`ci.yml` and run artifacts.

## Gates

Source checker and focused unit test pass locally; full site build and CI are pending.

## Open Questions

None.

## Drift and Debt

- Drift: none.
- Debt: deliberate local-only diagrams gate, documented rather than newly created.

## Commits

- See the draft PR commit list and per-slice comments.
