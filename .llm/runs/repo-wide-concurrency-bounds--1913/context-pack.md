# Context Pack — #1913 repo-wide concurrency bounds

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `repo-wide-concurrency-bounds--1913` |
| Branch | `ci/repo-wide-concurrency-bounds` |
| Current phase | implement — workflow bounds landed locally |
| Archetype | N/A |
| Scope overlays | none |

## Current State

The issue premise has been corrected with measured Pages traffic. Both workflow groups now keep
their global/entity keys and carry `queue: max`; the canary key has no generation marker. Header
comments preserve the pending-eviction mechanism and `steps: 0` diagnostic.

## Completed

- Required skills and harness workflow/gate guidance read.
- Base/worktree verified clean at `77ad823dcb1874ccfc8964b4679ad92a3a145e0b`.
- All 13 workflows and 10 concurrency blocks inventoried, including nested blocks.
- Issue #1913 body corrected from dispatch-only to ordinary main-push exposure with measurements.
- PLAN-EVAL recorded N/A after all decisions were resolved.
- Added the Pages and release-canary queue bounds plus explanatory headers.

## In Progress

- Parsed sweep test implementation.

## Next Steps

1. Add exhaustive parsed workflow assertions.
2. Run the required gates with captured real exits.
3. Attempt the live acceptance only without publishing or foreign contention.

## Drift and Debt

- Drift: corrected issue premise; missing requested implementation-gate path; `rtk` unavailable.
- Debt: none.

## Commits

- See the draft PR commit list and per-slice comments.
