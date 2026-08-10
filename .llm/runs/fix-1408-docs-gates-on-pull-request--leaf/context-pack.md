# Context Pack: PR-reachable docs-site gates

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1408-docs-gates-on-pull-request--leaf` |
| Branch | `fix/1408-docs-gates-on-pull-request` |
| Current phase | implement — slice 3.4 RED proof |
| Archetype | N/A — infrastructure workflow only |
| Scope overlays | docs |

## Current State

Both D8 paths are implemented. The standalone RED fixture is present and locally produces the expected source-format failure; it must be committed/pushed and its failing Actions run captured before deletion.

## Completed

- Required skill/workflow reads, fetch/status, baseline and issue verification, Design checkpoint.
- Slice 3.1 committed, pushed, and commented on draft PR #1440.
- Slice 3.2 implementation and local focused gates completed.
- Slice 3.3 full docs-site build completed locally.
- Slice 3.4 negative control locally fails with the expected diagnostic.

## Next Steps

1. Commit/push slice 3.4 and capture/comment its failing Pages run plus error output.
2. Delete the fixture in standalone GREEN slice 3.5.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Implement both options | issue #1408 D8 | Locked owner decision. |
| Extend `pages.yml` | plan D8.2 | Avoid duplicated full-build workflow. |
| Wire checker unit test | plan D8.1 | Cheap and focused; no lock/network cost. |

## Files Changed

`ci.yml`, `pages.yml`, RED fixture, and run artifacts.

## Gates

Pre-fixture source checker/unit test/full build passed. With the fixture present, the source checker is expected RED; Actions evidence is pending.

## Open Questions

None.

## Drift and Debt

- Drift: none.
- Debt: deliberate local-only diagrams gate, documented rather than newly created.

## Commits

- See the draft PR commit list and per-slice comments.
