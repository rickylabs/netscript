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
- Failure: preserve PR #1665. If fetch succeeds and persistence fails, the registered operation
  resolves to fetched data for every owner and joiner; a background owner records the provider
  error under captured telemetry context and remains detached. Only fetch failure rejects. Map
  cleanup runs after the persistence attempt or its fail-safe handling completes.
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
| 2026-08-15 | Plan eval      | Terminal PASS             | PLAN-EVAL passed at plan head `23db20f30` (`plan-eval.md` artifact head `d555cc971`); implementation authorization received for S1 only.                                      |
| 2026-08-15 | S1             | Single-flight runtime     | Made in-flight ownership policy-aware and persistence-complete without changing exports or PR #1665 fail-safe/telemetry behavior.                                            |
| 2026-08-15 | S1             | Deterministic regressions | Added overlapping stale SWR and background-write-failure/blocking-joiner tests; both use manually controlled promises and no timing sleeps.                                  |
| 2026-08-15 | S1             | Pre-review correction     | Coordinator rejected the initial comment/spacing deletion as F-1 metric gaming. Restored all useful documentation and structure, then reduced real duplication; honest file is 497 lines. |

## Decisions

| Decision                   | Reason                                                                                                    | Source                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Remedy 1; no new export    | Existing action owns all stale policy and can block before metadata read.                                 | `research.md`, doctrine A1/A2, issue #1461              |
| Policy-aware map semantics | SWR readers must not become blocking readers merely because refresh is registered.                        | `cache-query.ts`, acceptance concurrency/policy bullets |
| Full lifecycle promise     | Joined blocking loader must observe the persisted refreshed timestamp immediately after query completion. | `research.md` finding 9                                 |
| Synchronous registration   | The scheduling SWR reader registers the shared operation before any fetch/write await, so later readers deterministically observe it. | PLAN-EVAL A3; overlapping-reader regression |
| Non-fatal write join       | Fetch success plus write failure resolves fetched data for foreground/background owners and joiners; only fetch failure rejects. | PLAN-EVAL A2; write-failure regression |
| Honest F-1 closure         | Preserve documentation and normal layout; reduce responsibility/branch duplication rather than squeezing physical lines. | Coordinator pre-review; doctrine A8/AP-1/F-1 |

## PLAN-EVAL Advisories Carried Forward

- **A1 — S2 manual evidence:** the page-level acceptance sentence is not asserted by
  `.llm/tools/docs/check-accuracy-and-discoverability.ts`. In S2 it must be proved manually by the
  Tier-A slice review and IMPL-EVAL reading the disposition table against the rendered page. A
  `docs-accuracy` receipt may support its own checks but must not be cited as proof of that sentence;
  no `.llm/tools/**` change is authorized.
- **A4 — S2 tutorial posture:** near the corrected line-107 loader, state that the default call
  without `preferFreshOnStale` is the non-blocking SWR path, while the example deliberately sets
  `preferFreshOnStale: true` so `cachedAt` reflects the refreshed value.
- **A2 — implemented in S1:** the map-registered fetch-and-persist operation returns fetched data
  after a handled write failure for any owner/joiner. Background telemetry records the provider
  error and detached ownership remains intact; fetch failure is the only rejection path.
- **A3 — implemented in S1:** `startInflight` installs the shared promise synchronously and defers
  its callback to the next microtask. The overlapping-reader test fully awaits reader 1, starts
  reader 2, then releases a manually blocked fetcher; it is sleep-free and pins calls to exactly 1.

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

| Gate | Structured verdict | Evidence |
| ---- | ------------------ | -------- |
| Focused cache tests | **PASS** (exit 0) | `run-deno-test.ts -- --allow-all packages/sdk/tests/cache/cache-query_test.ts`: passed 5, failed 0, ignored 0, total 5, unique failures 0. |
| SDK tests | **PASS** (exit 0) | `run-deno-test.ts -- --allow-all packages/sdk/`: passed 68, failed 0, ignored 0, total 68, unique failures 0. |
| SDK check | **PASS** (exit 0) | `run-deno-check.ts --root packages/sdk --ext ts,tsx`: 84 files, 1 batch, 0 failed batches, 0 occurrences; wrapper used `--unstable-kv`. |
| SDK lint | **PASS** (exit 0) | `run-deno-lint.ts --root packages/sdk --ext ts,tsx`: 84 files, 1 batch, 0 occurrences and 0 rules. |
| SDK format | **PASS** (exit 0) | `run-deno-fmt.ts --root packages/sdk --ext ts,tsx`: 84 files, 1 batch, 0 failed batches, 0 findings. |
| Repository quality | **PASS** (exit 0) | Re-run on the restored 497-line source with `rtk proxy deno task quality:gate`: repository scan `ok: true`, 0 findings; SDK doctrine `FAIL=0`, `WARN=1`, `INFO=1`; no F-1 finding. The one SDK warning is the known F-16 13-child finding. |

Root `test`/`check`, S2 consumer/docs gates, and final publish/JSR gates remain `NOT_RUN` by slice
boundary. Aspire, Docker, and `e2e:cli` were not run and no runtime lease was acquired.

## Handoff Notes

- S1 is complete on exactly `cache-query.ts`, `cache-query_test.ts`, and run artifacts. S2 has not
  started; the two docs pages, query-factory regression, and four generated mirrors are untouched.
- Fresh Tier-A should review policy-aware joining, persistence-complete cleanup, A2 write-failure
  join semantics, A3 synchronous registration, the two deterministic regressions, and the honest
  F-1 correction. Restored items are the full module JSDoc; summaries for `queryInsideSpan`,
  `getInflight`, `fetchAndCacheOnce`, `fetchAndCache`, and `revalidateInBackground`; and ordinary
  blank-line separation. `startInflight` also has a lifecycle summary.
- Stop after the S1 receipt. Do not begin S2 until the coordinator provides the next authorization;
  separate-session IMPL-EVAL remains mandatory after implementation is complete.
