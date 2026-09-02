# Context Pack — #1913 repo-wide concurrency bounds

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `repo-wide-concurrency-bounds--1913` |
| Branch | `ci/repo-wide-concurrency-bounds` |
| Current phase | plan complete; implementation next |
| Archetype | N/A |
| Scope overlays | none |

## Current State

The issue premise has been corrected with measured Pages traffic. Per-group decisions are locked:
both groups keep their global/entity keys and add `queue: max`; the canary key gets no generation
marker. No workflow implementation file has been edited yet.

## Completed

- Required skills and harness workflow/gate guidance read.
- Base/worktree verified clean at `77ad823dcb1874ccfc8964b4679ad92a3a145e0b`.
- All 13 workflows and 10 concurrency blocks inventoried, including nested blocks.
- Issue #1913 body corrected from dispatch-only to ordinary main-push exposure with measurements.
- PLAN-EVAL recorded N/A after all decisions were resolved.

## In Progress

- Bootstrap commit and draft PR creation.

## Next Steps

1. Add the two bounds and header comments.
2. Add exhaustive parsed workflow assertions.
3. Run the required gates with captured real exits.
4. Attempt the live acceptance only without publishing or foreign contention.

## Drift and Debt

- Drift: corrected issue premise; missing requested implementation-gate path; `rtk` unavailable.
- Debt: none.

## Commits

- See the draft PR commit list and per-slice comments.

