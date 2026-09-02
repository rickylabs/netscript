# Context Pack — #1913 repo-wide concurrency bounds

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `repo-wide-concurrency-bounds--1913` |
| Branch | `ci/repo-wide-concurrency-bounds` |
| Current phase | implementation handoff complete; IMPL-EVAL owned by supervisor |
| Archetype | N/A |
| Scope overlays | none |

## Current State

The issue premise has been corrected with measured Pages traffic. Both workflow groups now keep
their global/entity keys and carry `queue: max`; the canary key has no generation marker. Header
comments preserve the pending-eviction mechanism and `steps: 0` diagnostic.
The parsed regression now matches all 10 blocks across all 13 workflow documents, all planned
local gates pass, and the hosted pending-main-victim exercise succeeded without publication.

## Completed

- Required skills and harness workflow/gate guidance read.
- Base/worktree verified clean at `77ad823dcb1874ccfc8964b4679ad92a3a145e0b`.
- All 13 workflows and 10 concurrency blocks inventoried, including nested blocks.
- Issue #1913 body corrected from dispatch-only to ordinary main-push exposure with measurements.
- PLAN-EVAL recorded N/A after all decisions were resolved.
- Added the Pages and release-canary queue bounds plus explanatory headers.
- Added the exhaustive parsed workflow sweep, including job-level mappings.
- Passed focused test, `.llm/tools` check/format, and independent YAML readback with exit 0.
- Proved a fixed-branch third arrival did not evict a pending `main` Pages run using runs
  `33624345836`, `33624383095`, and `33624408650` plus per-job/step receipts.

## In Progress

- Commit/push hosted evidence and hand off draft PR #1923 to the topic supervisor.

## Next Steps

1. Run the final-head cheap gates and commit/push the hosted evidence.
2. Supervisor performs separate-session IMPL-EVAL and owns GitHub acceptance/lifecycle updates.

## Drift and Debt

- Drift: corrected issue premise; missing requested implementation-gate path; `rtk` unavailable;
  active token precedence caused the first workflow push rejection.
- Debt: none.

## Commits

- See the draft PR commit list and per-slice comments.
