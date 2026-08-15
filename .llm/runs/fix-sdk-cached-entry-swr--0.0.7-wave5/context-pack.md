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
- Applied the coordinator's exact one-source expansion for the identical false clause at
  `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md:100`; no third docs source is
  authorized.
- Verified `docs/sdk` and `docs/site/_site/capabilities/sdk/index.md` are missing; `_site` is
  generated.
- Inspected `CacheQuery` with `deno doc` before source reads and traced action/provider behavior.
- Designed deterministic overlapping SWR and blocking-loader tests.
- Declared the four-file generated cascade and generation/check order.
- Executed the two-page and surrounding-tutorial claim sweep: no third page falsely assigns
  revalidation to `getCachedEntry()`.
- Executed `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`; all exited 0, both
  pages are in provenance, and the synchronized content head produced no tracked delta or undeclared
  path.
- Ran JSR research baselines: package publish dry-run green; audit helper exit 0 with known
  warnings; doc-lint remains red.

## In Progress

- Plan-only scope amendment is ready for a fresh Tier-A pass and separate PLAN-EVAL. Product, tests,
  and docs content remain untouched.

## Next Steps

1. Topic orchestrator arranges separate PLAN-EVAL and confirms `PASS`.
2. Only after that confirmation, implement S1 exactly as planned and record gate/reconcile evidence.
3. Implement S2, regenerate the cascade in fixed order, then run merge-readiness gates.
4. Separate-session IMPL-EVAL remains mandatory before ready/merge.

## Key Decisions

| Decision                              | Source                            | Notes                                                                                                                        |
| ------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Remedy 1, no public export            | `research.md`, `plan.md`          | Existing callable action satisfies acceptance; `getCachedEntry` remains pure read.                                           |
| Policy-aware per-key single-flight    | `plan.md` D4                      | SWR overlap returns stale for both while one refresh runs; blocking/missing joins persistence-complete promise.              |
| Exactly two docs sources plus cascade | Coordinator ruling; `research.md` | Edit only `services-sdk/sdk.md` and live-dashboard chapter 3 after PLAN-EVAL; never `_site`; generate the same four mirrors. |

## Files Changed

| Path                                                | Status  | Notes                                                                           |
| --------------------------------------------------- | ------- | ------------------------------------------------------------------------------- |
| `.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/*` | amended | Plan-phase artifacts only; coordinator-created `codex-thread-ids.md` preserved. |

## Gates

| Gate family   | Current status             | Evidence                                                                                                                                      |
| ------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Static        | NOT_RUN for implementation | Prohibited before PLAN-EVAL; research inspection only.                                                                                        |
| Fitness / JSR | Baseline captured          | Publish dry-run exit 0; audit exit 0 with known warnings; two doc-lint commands remain expected red at exactly 3+3 named diagnostics.         |
| Runtime       | NOT_RUN                    | Planned deterministic overlapping-reader tests.                                                                                               |
| Consumer/docs | Plan evidence only         | Claim sweep found no third false page; ordered generation exited 0, both pages are provenance inputs, and no undeclared tracked path changed. |

## Open Questions

- None that can force rework before PLAN-EVAL. Implementation remains blocked on its separate
  verdict.

## Drift and Debt

- Drift: missing frozen paths, the now-authorized one-page scope expansion, and the resolved
  doc-lint brief ambiguity are recorded in `drift.md`.
- Debt: no new debt planned; known SDK F-DOCT-5 remains out of scope.

## Commits

- See the draft PR's commit list + per-slice PR comments. No implementation commit exists yet.
