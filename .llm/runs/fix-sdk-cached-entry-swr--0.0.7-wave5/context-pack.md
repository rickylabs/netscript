# Context Pack: sdk cached-entry stale policy

## Run Metadata

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Run ID         | `fix-sdk-cached-entry-swr--0.0.7-wave5`                       |
| Branch         | `fix/sdk-cached-entry-swr`                                    |
| Current phase  | `plan` — awaiting external PLAN-EVAL                          |
| Archetype      | `3 — Runtime/Behavior` slice; SDK package remains Archetype 2 |
| Scope overlays | `docs`                                                        |

## Current State

Research and a concrete two-slice design are complete at
`main@3e8e146a4aedf8ee0afec15c83ddaefc171c71f9`. Remedy 1 is locked: use the existing cache-aware
callable action in blocking mode before `getCachedEntry()`, add no published API, and separately fix
background single-flight ownership. No product code has been changed. Implementation is blocked
until the topic orchestrator confirms a separate PLAN-EVAL `PASS`.

## Completed

- Loaded harness, doctrine, Deno/JSR, tooling, PR, and RTK contracts.
- Located the exact false snippet at `docs/site/services-sdk/sdk.md:188`.
- Verified `docs/sdk` and `docs/site/_site/capabilities/sdk/index.md` are missing; `_site` is
  generated.
- Inspected `CacheQuery` with `deno doc` before source reads and traced action/provider behavior.
- Designed deterministic overlapping SWR and blocking-loader tests.
- Declared the four-file generated cascade and generation/check order.
- Ran JSR research baselines: package publish dry-run green; audit helper exit 0 with known
  warnings; doc-lint remains red.

## In Progress

- Commit/push plan artifacts, open one draft PR, set plan-phase labels/milestone, and post the plan
  phase summary.

## Next Steps

1. Topic orchestrator arranges separate PLAN-EVAL and confirms `PASS`.
2. Only after that confirmation, implement S1 exactly as planned and record gate/reconcile evidence.
3. Implement S2, regenerate the cascade in fixed order, then run merge-readiness gates.
4. Separate-session IMPL-EVAL remains mandatory before ready/merge.

## Key Decisions

| Decision                            | Source                          | Notes                                                                                                           |
| ----------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Remedy 1, no public export          | `research.md`, `plan.md`        | Existing callable action satisfies acceptance; `getCachedEntry` remains pure read.                              |
| Policy-aware per-key single-flight  | `plan.md` D4                    | SWR overlap returns stale for both while one refresh runs; blocking/missing joins persistence-complete promise. |
| Contracted docs source plus cascade | `research.md` corrected surface | Never edit `_site`; generate four checked-in mirrors.                                                           |

## Files Changed

| Path                                                | Status | Notes                                                                           |
| --------------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| `.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/*` | new    | Plan-phase artifacts only; coordinator-created `codex-thread-ids.md` preserved. |

## Gates

| Gate family   | Current status             | Evidence                                                                                                       |
| ------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Static        | NOT_RUN for implementation | Prohibited before PLAN-EVAL; research inspection only.                                                         |
| Fitness / JSR | Baseline captured          | Publish dry-run exit 0; audit exit 0 with known warnings; doc-lint expected red with count discrepancy logged. |
| Runtime       | NOT_RUN                    | Planned deterministic overlapping-reader tests.                                                                |
| Consumer/docs | NOT_RUN                    | Planned docs accuracy and three cascade freshness checks.                                                      |

## Open Questions

- Coordinator ruling may later expand scope to the adjacent tutorial prose; it is safe to defer.
- Coordinator/PLAN-EVAL must reconcile the supplied six-diagnostic doc-lint pin with the three
  unique diagnostics reproduced by the explicit all-export raw command.

## Drift and Debt

- Drift: missing frozen paths, adjacent out-of-contract false prose, and doc-lint count discrepancy
  are recorded in `drift.md`.
- Debt: no new debt planned; known SDK F-DOCT-5 remains out of scope.

## Commits

- See the draft PR's commit list + per-slice PR comments. No implementation commit exists yet.
