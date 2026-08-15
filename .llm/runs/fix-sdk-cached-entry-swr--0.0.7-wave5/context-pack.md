# Context Pack: sdk cached-entry stale policy

## Run Metadata

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Run ID         | `fix-sdk-cached-entry-swr--0.0.7-wave5`                       |
| Branch         | `fix/sdk-cached-entry-swr`                                    |
| Current phase  | `implement` — S1 complete, awaiting fresh Tier-A              |
| Archetype      | `3 — Runtime/Behavior` slice; SDK package remains Archetype 2 |
| Scope overlays | `docs`                                                        |

## Current State

PLAN-EVAL is terminal `PASS` at plan head `23db20f30` with artifact head `d555cc971`. S1 is complete:
`CacheQuery` now uses policy-aware, persistence-complete single-flight ownership, and deterministic
regressions cover overlapping stale SWR readers plus a blocking joiner after a background-owned
write failure. No published API changed. S2 has not started and remains outside the current slice.

## Completed

- Loaded harness, doctrine, Deno/JSR, tooling, PR, and RTK contracts.
- Located the exact false snippet at `docs/site/services-sdk/sdk.md:188`.
- Applied the coordinator's exact one-source expansion for the identical false clause at
  `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md:100`; no third docs source is
  authorized.
- Repaired Tier-A T-1 with per-line dispositions for the tutorial's accurate factory-level SWR
  claims, pure-read helper descriptions, false line-100 clause, and line-107 loader. The page-level
  acceptance now requires an explicit callable-action/metadata-read distinction and demonstrates
  action-then-metadata composition.
- Verified `docs/sdk` and `docs/site/_site/capabilities/sdk/index.md` are missing; `_site` is
  generated.
- Inspected `CacheQuery` with `deno doc` before source reads and traced action/provider behavior.
- Designed deterministic overlapping SWR and blocking-loader tests.
- Declared the four-file generated cascade and generation/check order.
- Re-executed the exact-two-page and site-wide claim sweeps after drafting dispositions: every
  same-class claim on the authorized pages is accounted for; chapter 4 line 231 is checked and
  cleared as a distinct `withPolicy('balanced')` claim, with no third source added.
- Executed `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`; all exited 0, both
  pages are in provenance, and the synchronized content head produced no tracked delta or undeclared
  path.
- Ran JSR research baselines: package publish dry-run green; audit helper exit 0 with known
  warnings; doc-lint remains red.
- Implemented synchronous background refresh registration before fetch/write awaits. A second stale
  SWR reader returns stale immediately and observes the one registered operation.
- Made the registered operation cover fetch and persistence handling. Fetch success plus write
  failure resolves fetched data for any owner/joiner; only fetch failure rejects, preserving PR
  #1665's fail-safe behavior and detached background telemetry.
- Added a sleep-free two-reader SWR regression with a manually blocked fetcher and exact call count
  1, plus the background-write-failure/blocking-joiner regression required by PLAN-EVAL A2.
- Coordinator pre-review rejected the first F-1 response as metric gaming because it removed useful
  JSDoc and blank-line structure. Restored the full module block, all five named private-method
  summaries, and normal method separation. The honest implementation is 497 lines after collapsing
  duplicated pure-cache-read telemetry and removing mode flags from fetch/persist execution.
- Re-ran all six authorized S1 gates on that honest shape. `quality:gate` exits 0 with no SDK F-1;
  the known SDK F-16 13-child warning remains unchanged.

## In Progress

- S1 implementation is ready for fresh Tier-A review. The PR remains draft with sole
  `status:plan`; S2 files are untouched.

## Next Steps

1. Coordinator runs fresh Tier-A over the pushed S1 head.
2. Only after the next authorization, implement S2 and regenerate the cascade in fixed order.
3. Run final merge-readiness gates in the authorized final slice.
4. Separate-session IMPL-EVAL remains mandatory before ready/merge.

## Key Decisions

| Decision                              | Source                            | Notes                                                                                                                        |
| ------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Remedy 1, no public export            | `research.md`, `plan.md`          | Existing callable action satisfies acceptance; `getCachedEntry` remains pure read.                                           |
| Policy-aware per-key single-flight    | `plan.md` D4                      | SWR overlap returns stale for both while one refresh runs; blocking/missing joins persistence-complete promise.              |
| Exactly two docs sources plus cascade | Coordinator ruling; `research.md` | Edit only `services-sdk/sdk.md` and live-dashboard chapter 3 after PLAN-EVAL; never `_site`; generate the same four mirrors. |
| Write-failure join semantics          | PLAN-EVAL A2                      | Fetch success resolves data even if persistence fails; background records the error and stays detached; only fetch failure rejects. |
| Synchronous background registration   | PLAN-EVAL A3                      | The scheduling reader installs the operation before any fetch/write await; tests use manually controlled promises, not sleeps. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `packages/sdk/src/cache/cache-query.ts` | changed | Policy-aware, persistence-complete single-flight; no export change. |
| `packages/sdk/tests/cache/cache-query_test.ts` | changed | Deterministic overlapping-SWR and write-failure joiner regressions. |
| `.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/worklog.md` | amended | S1 implementation, gate, and advisory evidence. |
| `.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/context-pack.md` | amended | Current slice handoff; coordinator-created artifacts preserved. |
| `.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/drift.md` | appended | Records and resolves the initial F-1 metric-gaming response. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Structured SDK check/lint/fmt: 84 files, 0 failed batches/occurrences/findings. |
| Fitness | PASS for S1 | Re-run on 497-line documented source: `quality:gate` exit 0; repository scan 0 findings; SDK `FAIL=0`, no F-1, known F-16 `WARN=1`, `INFO=1`. |
| Runtime | PASS | Focused cache tests 5/5; full SDK tests 68/68; 0 failed/ignored/unique failures. |
| Consumer/docs | NOT_RUN for S2 | Authorized pages, query-factory regression, and generated cascade are outside S1 and untouched. |
| Final/root | NOT_RUN | Root `test`/`check`, publish/JSR, and final docs gates belong to later slices. Aspire, Docker, and `e2e:cli` were not run. |

## PLAN-EVAL Advisories for S2

- A1: the page-level sentence is manual evidence for Tier-A and IMPL-EVAL against the rendered page
  and disposition table. The docs-accuracy receipt cannot prove it; do not edit `.llm/tools/**`.
- A4: the line-107 explanation must say that the default call without `preferFreshOnStale` is the
  non-blocking SWR path and the flag is chosen here so `cachedAt` reflects the refreshed value.

## Open Questions

- None within S1. Further implementation is blocked pending the coordinator's post-Tier-A direction.

## Drift and Debt

- Drift: missing frozen paths, the now-authorized one-page scope expansion, the Tier-A page-level
  tutorial repair, and the resolved doc-lint brief ambiguity are recorded in `drift.md`.
- Debt: no new debt planned; known SDK F-DOCT-5 remains out of scope.

## Commits

- Plan head `23db20f30`; terminal PLAN-EVAL artifact head `d555cc971`.
- Initial S1 implementation `e05a54145` was pushed before the coordinator pre-review message
  arrived; its F-1 treatment is superseded by the documented structural-reduction repair recorded
  in the PR amendment receipt.
