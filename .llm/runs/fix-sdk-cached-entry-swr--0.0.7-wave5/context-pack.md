# Context Pack: sdk cached-entry stale policy

## Run Metadata

| Field          | Value                                                         |
| -------------- | ------------------------------------------------------------- |
| Run ID         | `fix-sdk-cached-entry-swr--0.0.7-wave5`                       |
| Branch         | `fix/sdk-cached-entry-swr`                                    |
| Current phase  | `implement` — S2 content complete; freshness head pending     |
| Archetype      | `3 — Runtime/Behavior` slice; SDK package remains Archetype 2 |
| Scope overlays | `docs`                                                        |

## Current State

PLAN-EVAL and both S1/S2-A Tier-A reviews passed. S2 implementation is complete: the baseline
fresh-hit predicate is corrected without changing exports or accepted S1 behavior, the factory
regression proves fresh/stale/expired branches, exactly two docs pages carry the truthful
action-then-metadata contract, and exactly four generated mirrors changed. All pre-commit gates are
terminal; the content must now be committed so the Git-diff-based freshness gates can judge it.

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
- Fresh Tier-A accepted S1 at `e100ea205` with its A2/A3 semantics and 497-line/no-F-1 result.
- Confirmed the baseline predicate at `main@3e8e146a4:170` and the identical S1-head predicate at
  `e100ea205:165`; the defect is baseline behavior exposed by S2, not an S1 regression.
- Fresh fixes Tier-A passed S2-A at `ef3e43f06`.
- Changed only the approved predicate in `cache-query.ts`; it remains 497 lines with S1 A2/A3 and
  restored documentation/blank-line structure intact.
- Added the authorized factory proof: fresh+flag is a zero-call hit; expired fetches with the flag
  false; overlapping stale+flag loaders issue exactly one blocking refresh and share its timestamp.
- Applied every docs disposition. A4 is explicit at tutorial lines 117-118. A1 is recorded as
  manual Tier-A/IMPL-EVAL evidence and is not attributed to the docs-accuracy receipt.
- Generated prose → CLI barrel → MCP publish assets in order; Git reported only the four declared
  generated mirrors beyond the four authored S2 paths.
- Completed scoped/root/runtime/docs/quality/publish/JSR gates. Root check is 2,925/25 batches with
  zero findings; root tests are 4,206 passed, 0 failed, 19 ignored. The two doc-lint invocations
  remain exactly-three-diagnostic expected reds; surface diff remains the known 524-major baseline
  red; JSR F-DOCT-5 remains the known 13-child warning.

## In Progress

- The S2 content and preliminary evidence are ready to commit. The PR remains draft with sole
  `status:plan`.
- The first assets-barrel receipt is honestly red because it compares the authorized, regenerated
  dirty mirror to pre-S2 `HEAD`. Commit this content, then run all three freshness gates sequentially
  on that unchanged committed content head.

## Next Steps

1. Commit the complete authorized S2 content plus this preliminary harness record.
2. Run agent-docs, assets-barrel, and publish-assets freshness sequentially on that unchanged head.
3. Record final receipts in an artifact-only commit, push explicitly, update/comment PR #1669, and
   stop for fresh Tier-A.
4. Separate-session IMPL-EVAL remains mandatory later; do not launch it in this session.

## Key Decisions

| Decision                              | Source                            | Notes                                                                                                                        |
| ------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Remedy 1, no public export            | `research.md`, `plan.md`          | Existing callable action satisfies acceptance; `getCachedEntry` remains pure read.                                           |
| Policy-aware per-key single-flight    | `plan.md` D4                      | SWR overlap returns stale for both while one refresh runs; blocking/missing joins persistence-complete promise.              |
| Exactly two docs sources plus cascade | Coordinator ruling; `research.md` | Edit only `services-sdk/sdk.md` and live-dashboard chapter 3 after PLAN-EVAL; never `_site`; generate the same four mirrors. |
| Write-failure join semantics          | PLAN-EVAL A2                      | Fetch success resolves data even if persistence fails; background records the error and stays detached; only fetch failure rejects. |
| Synchronous background registration   | PLAN-EVAL A3                      | The scheduling reader installs the operation before any fetch/write await; tests use manually controlled promises, not sleeps. |
| Stale-only blocking predicate          | S2-A coordinator ruling          | Use `isExpired || (!isFresh && preferFreshOnStale)` so expired fetches retain precedence and fresh non-expired entries make zero upstream calls. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `packages/sdk/src/cache/cache-query.ts` | changed | Policy-aware, persistence-complete single-flight; no export change. |
| `packages/sdk/tests/cache/cache-query_test.ts` | changed | Deterministic overlapping-SWR and write-failure joiner regressions. |
| `.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/worklog.md` | amended | S1 implementation, gate, and advisory evidence. |
| `.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/context-pack.md` | amended | Current slice handoff; coordinator-created artifacts preserved. |
| `.llm/runs/fix-sdk-cached-entry-swr--0.0.7-wave5/drift.md` | appended | Records and resolves the initial F-1 metric-gaming response. |
| `packages/sdk/src/cache/cache-query.ts` | changed in S2 | Exact one-line stale-only predicate correction; still 497 lines. |
| `packages/sdk/tests/query/query-factory_test.ts` | changed in S2 | Published loader regression with fresh/stale/expired and overlap proofs. |
| Two authorized docs sources | changed in S2 | Complete disposition table and A4 action/read posture. |
| Four declared generated mirrors | changed in S2 | Ordered prose → barrel → publish-assets cascade; no additional tracked path. |
| Run artifacts | amended | Implementation, A1/A4, gate, and handoff evidence. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Structured SDK check/lint/fmt: 84 files, 0 failed batches/occurrences/findings. |
| Fitness | PASS for S1 | Re-run on 497-line documented source: `quality:gate` exit 0; repository scan 0 findings; SDK `FAIL=0`, no F-1, known F-16 `WARN=1`, `INFO=1`. |
| Runtime | PASS | Focused cache tests 5/5; full SDK tests 68/68; 0 failed/ignored/unique failures. |
| Consumer/docs | PASS except pre-commit Git-diff freshness | Factory 6/6; docs format/accuracy and agent-docs prose receipts PASS. First assets-barrel receipt RED only because the declared changed mirror is not committed yet; final three-head check pending. |
| Final/root | PASS with named baseline reds | Check 2,925 files/25 batches; tests 4,206 pass/0 fail/19 ignored; quality/arch/publish/specifiers PASS. Doc lint 3+3 and surface diff 524 majors remain pinned baseline red. |

## PLAN-EVAL Advisories for S2

- A1 implemented: the page-level sentence is explicitly reserved for Tier-A/IMPL-EVAL manual review
  against the rendered page and disposition table; docs-accuracy is not cited as its proof.
- A4 implemented: tutorial lines 117-118 name default non-blocking SWR and explain that this loader
  sets the flag so `cachedAt` reflects the refreshed value.

## S2-A Proof and Boundary

- Corrected condition: expired fetches first; otherwise only
  `!isFresh && preferFreshOnStale` blocks; a fresh non-expired entry falls through to the existing
  cached-data return.
- Authorized proof file only: `packages/sdk/tests/query/query-factory_test.ts`. Its fresh phase
  asserts seeded data/timestamp and zero upstream calls; its missing phase asserts one call and a
  current timestamp; its two overlapping stale blocking loaders use a manually blocked fetch and
  assert exactly one call plus one refreshed timestamp.
- No S2-A edit to `cache-query_test.ts` or any other path is authorized. Any further need stops for
  a new ruling.

## Open Questions

- None. Only the post-commit freshness receipts and PR handoff remain.

## Drift and Debt

- Drift: missing frozen paths, the now-authorized one-page scope expansion, the Tier-A page-level
  tutorial repair, the resolved doc-lint brief ambiguity, and the S2-exposed baseline fresh-hit
  predicate defect are recorded in `drift.md`.
- Debt: no new debt planned; known SDK F-DOCT-5 remains out of scope.

## Commits

- Plan head `23db20f30`; terminal PLAN-EVAL artifact head `d555cc971`.
- Initial S1 implementation `e05a54145` was pushed before the coordinator pre-review message
  arrived; its F-1 treatment is superseded by the documented structural-reduction repair recorded
  in the PR amendment receipt.
