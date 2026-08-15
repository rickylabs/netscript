# Worklog: sdk cached-entry stale policy

## Run Metadata

| Field          | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| Run ID         | `fix-sdk-cached-entry-swr--0.0.7-wave5`                                       |
| Branch         | `fix/sdk-cached-entry-swr`                                                    |
| Archetype      | `3 — Runtime/Behavior` slice; package-wide SDK assignment remains Archetype 2 |
| Scope overlays | `docs`                                                                        |

## Design

### Public Surface

- **No new or changed export.** Preserve callable `ActionMethod(props, options?)` as the only
  cache-policy execution surface and `getCachedEntry(props)` as a pure metadata read.
- Preserve all 12 `packages/sdk/deno.json` entrypoints.

### Domain Vocabulary

- **Fresh entry** — cached age is below `staleTime`; return cached data, zero upstream calls.
- **Stale SWR entry** — cached data remains usable; every overlapping reader returns it while one
  background refresh owns fetch plus persistence.
- **Blocking stale entry** — `preferFreshOnStale` requires the reader to join/start the one refresh
  and wait until its persistence attempt completes.
- **Missing/expired entry** — no usable cache value; reader joins/starts the one foreground refresh.
- **In-flight operation** — one promise per canonical query key covering upstream execution and the
  cache-write attempt, not only the upstream promise.

### State, Identity, Lifecycle, and Concurrency

- State: existing `CacheEntry<TData>` (`data`, `timestamp`) plus the existing per-engine
  `inflightRequests` map.
- Identity: existing JSON-serialized `QueryKey`; no new identifier.
- Lifecycle: `absent → fetching → persistence-attempted → settled`, or
  `stale → background-refreshing → persistence-attempted → settled`.
- Concurrency: per-key single-flight. SWR readers do not join in a blocking sense; they share
  ownership by observing/starting one registered background operation and returning stale data.
- Failure: preserve PR #1665. Foreground cache-write failure returns fetched data; background
  failure is recorded under captured telemetry context and detached; map cleanup runs in `finally`.
- Clock: preserve existing `Date.now()` timestamp seam; do not add or deepen runtime clock usage in
  this focused change. Tests control seed timestamps and synchronization without sleeps.
- Cancellation: no new long-running handle or cancellable public operation is introduced.

### Ports

- Existing `CacheStore` — one shared in-memory implementation in concurrency tests.
- Existing `CacheTelemetry` — captured-parent background span and execution/write evidence remain.
- Existing typed service client through `ActionMethod` — upstream call counter in loader regression.
- No new port.

### Constants

- Existing `CACHE_PREFIX`, default stale/cache times, telemetry operations/events/outcomes only.
- No new finite-value constant group is required.

### Commit Slices

| # | Slice                                                                                                                               | Gate                                                                             | Files                                                                                                                                                                                             |
| - | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Policy-aware, persistence-complete single-flight plus overlapping SWR regression                                                    | Focused structured cache tests; targeted wrappers; `quality:gate`                | `packages/sdk/src/cache/cache-query.ts`, `packages/sdk/tests/cache/cache-query_test.ts`, run artifacts                                                                                            |
| 2 | Truthful blocking loader example, page-level tutorial action/read distinction, executable factory regression, and ordered four-file asset cascade | Focused factory test; docs format/accuracy; three cascade checks; JSR/root gates | `packages/sdk/tests/query/query-factory_test.ts`, `docs/site/services-sdk/sdk.md`, `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md`, four declared generated files, run artifacts |

### Deferred Scope

- `queryEntry()` or another published convenience — no missing acceptance capability justifies it.
- Any third docs source — the coordinator authorized exactly two site pages, and the executed sweep
  found no third false `getCachedEntry()`/revalidation claim.
- Known SDK doc-lint/cardinality debt and known repo-red gates.

### Contributor Path

To change cache policy, start at `packages/sdk/src/ports/query-options.ts`, follow the callable
action in `src/query/query-factory.ts` into `src/cache/cache-query.ts`, and add behavior to
`tests/cache/cache-query_test.ts`. Loader-level contract regressions belong in
`tests/query/query-factory_test.ts`; user guidance belongs in the source page, never `_site/`.

## Progress Log

| Time       | Slice          | Step                     | Notes                                                                                                                                                                              |
| ---------- | -------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | Plan           | Research and design      | Re-baselined at `3e8e146a4`; no product code changed. Hard stop pending topic-orchestrator PLAN-EVAL PASS.                                                                         |
| 2026-08-15 | Plan amendment | Coordinator scope ruling | Added exactly the live-dashboard chapter-3 source; swept surrounding docs; executed the ordered generation chain with no undeclared tracked path; no product/docs content changed. |
| 2026-08-15 | Plan repair    | Tier-A T-1               | Reconciled tutorial scope with S2 using explicit dispositions for every same-class line; re-ran the exact-two-page and site-wide sweeps; no product/docs content changed.          |

## Decisions

| Decision                   | Reason                                                                                                    | Source                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Remedy 1; no new export    | Existing action owns all stale policy and can block before metadata read.                                 | `research.md`, doctrine A1/A2, issue #1461              |
| Policy-aware map semantics | SWR readers must not become blocking readers merely because refresh is registered.                        | `cache-query.ts`, acceptance concurrency/policy bullets |
| Full lifecycle promise     | Joined blocking loader must observe the persisted refreshed timestamp immediately after query completion. | `research.md` finding 9                                 |

## Drift

| Drift                                                                                                    | Severity    | Logged in drift.md |
| -------------------------------------------------------------------------------------------------------- | ----------- | ------------------ |
| Two frozen contract paths do not exist; `_site` target is generated                                      | significant | yes                |
| Brief's six-diagnostic wording was the sum of two expected-red three-diagnostic invocations              | significant | yes                |
| Adjacent false tutorial prose was outside frozen surface; coordinator authorized exactly that one source | significant | yes                |
| Tier-A found line-100-only scope inconsistent with the page-level S2 acceptance commitment               | significant | yes                |

## Gate Results

### Research Baselines

| Gate                      | Command or check                                                                                | Result                        | Notes                                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public API inspection     | `deno doc --filter CacheQuery packages/sdk/mod.ts`                                              | PASS (inspection)             | Confirms callable query policy and pure cached-entry read; done before source reads.                                                               |
| Package publish dry-run   | `deno publish --dry-run --allow-dirty` in `packages/sdk`                                        | PASS (exit 0)                 | No actual slow-type diagnostic; source-only intended file list.                                                                                    |
| JSR audit                 | `audit-jsr-package.ts --root packages/sdk --text`                                               | PASS with 2 warnings (exit 0) | Known F-DOCT-5 13-child warning; F-JSR-7 banner parser warning, raw dry-run authoritative.                                                         |
| Combined SDK doc lint     | explicit 12-entrypoint `deno doc --lint`                                                        | EXPECTED RED (exit 1)         | Exactly three named diagnostics; zero new allowed; never reported green.                                                                           |
| Cache-entrypoint doc lint | `deno doc --lint ./src/cache/mod.ts` from `packages/sdk`                                        | EXPECTED RED (exit 1)         | Exactly three named `KvCacheStore` diagnostics; zero new allowed; never reported green.                                                            |
| Docs claim sweep          | exact two authorized pages, surrounding tutorial story, and site-wide source `rg`                  | PASS (inspection)             | All same-class authorized-page results have per-line dispositions; chapter 4 line 231 is checked-and-cleared `withPolicy` prose, out of scope.     |
| Generated mirror coverage | `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`; provenance `rg`; Git delta | PASS (exit 0 each)            | Both authorized pages are provenance inputs; clean synchronized content produced zero tracked deltas and no path beyond the four declared mirrors. |

### Static / Fitness / Runtime / Consumer Gates

All implementation gates are `NOT_RUN`: product implementation is prohibited until a separate
PLAN-EVAL returns `PASS`. Aspire, Docker, and `e2e:cli` are explicitly prohibited and unnecessary.

## Handoff Notes

- PLAN-EVAL should inspect the option-1 rationale, policy-aware single-flight design, overlapping
  test synchronization, exactly-two-page docs scope, the tutorial's per-line dispositions and
  page-level acceptance sentence, derived cascade evidence, and split 3+3 expected-red doc-lint
  baselines first.
- Do not infer approval from this plan or draft PR. Wait for explicit topic-orchestrator
  confirmation of PLAN-EVAL PASS.
