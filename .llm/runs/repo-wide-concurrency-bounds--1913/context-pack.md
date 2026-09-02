# Context Pack — #1913 repo-wide concurrency bounds

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `repo-wide-concurrency-bounds--1913` |
| Branch | `ci/repo-wide-concurrency-bounds` |
| Current phase | gate complete locally; hosted acceptance next |
| Archetype | N/A |
| Scope overlays | none |

## Current State

The issue premise has been corrected with measured Pages traffic. Both workflow groups now keep
their global/entity keys and carry `queue: max`; the canary key has no generation marker. Header
comments preserve the pending-eviction mechanism and `steps: 0` diagnostic.
The parsed regression now matches all 10 blocks across all 13 workflow documents, and all planned
local gates pass.

## Completed

- Required skills and harness workflow/gate guidance read.
- Base/worktree verified clean at `77ad823dcb1874ccfc8964b4679ad92a3a145e0b`.
- All 13 workflows and 10 concurrency blocks inventoried, including nested blocks.
- Issue #1913 body corrected from dispatch-only to ordinary main-push exposure with measurements.
- PLAN-EVAL recorded N/A after all decisions were resolved.
- Added the Pages and release-canary queue bounds plus explanatory headers.
- Added the exhaustive parsed workflow sweep, including job-level mappings.
- Passed focused test, `.llm/tools` check/format, and independent YAML readback with exit 0.

## In Progress

- Commit/push the regression and evidence slice, then construct hosted acceptance if safe.

## Next Steps

1. Commit and push the regression/evidence slice.
2. Attempt the live acceptance only without publishing or foreign contention.

## Drift and Debt

- Drift: corrected issue premise; missing requested implementation-gate path; `rtk` unavailable;
  active token precedence caused the first workflow push rejection.
- Debt: none.

## Commits

- See the draft PR commit list and per-slice comments.
