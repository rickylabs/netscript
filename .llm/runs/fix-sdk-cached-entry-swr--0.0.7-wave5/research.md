# Research — fix-sdk-cached-entry-swr--0.0.7-wave5

## Re-baseline

- Carried-in source: issue #1461 and the coordinator slice brief.
- Re-derived against `main@3e8e146a4aedf8ee0afec15c83ddaefc171c71f9` on 2026-08-15.
- The checkout is shallow, but the named baseline is the checked-out `HEAD`; no ancestry claim is
  needed for this plan.
- PR #1665 is present at the baseline. Its request-local namespace admission, fail-safe cache-write
  persistence, fail-safe telemetry evidence validation, and background telemetry context must be
  preserved.

## Findings

| #  | Finding                                                                                                                                                                                                                                                                                                                                                                                                          | How to verify                                                                                                                                     |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | The exact offending published loader snippet lives in `docs/site/services-sdk/sdk.md`, line 188. It calls `getCachedEntry()`, returns any hit immediately, and falsely claims the SDK reloads stale data in the background.                                                                                                                                                                                      | `rg -n -F 'serve cached; SDK reloads stale in the background' docs/site`; `docs/site/services-sdk/sdk.md:184-200`                                 |
| 2  | Contract path `docs/sdk` does not exist.                                                                                                                                                                                                                                                                                                                                                                         | `test -e docs/sdk` exits non-zero.                                                                                                                |
| 3  | Contract path `docs/site/_site/capabilities/sdk/index.md` does not exist, and `_site/` is excluded as generated Lume output rather than source. It must never be hand-edited.                                                                                                                                                                                                                                    | `test -e docs/site/_site/capabilities/sdk/index.md` exits non-zero; `.llm/tools/docs/snippet-policy.ts:45-48` excludes `_site`.                   |
| 4  | The other two frozen surfaces exist: `docs/site/services-sdk/sdk.md` and `packages/sdk/src/cache/cache-query.ts`. The corrected frozen surface list is those two paths only.                                                                                                                                                                                                                                     | Direct path checks.                                                                                                                               |
| 5  | `getCachedEntry()` is a published pure read: it reads the store and converts `timestamp` to `cachedAt`; it receives no stale policy or fetcher.                                                                                                                                                                                                                                                                  | `deno doc --filter CacheQuery packages/sdk/mod.ts`; `packages/sdk/src/cache/cache-query.ts:414-442`.                                              |
| 6  | The callable `ActionMethod` already owns the complete declared cache policy (`staleTime`, `cacheTime`, `revalidateOnStale`, `preferFreshOnStale`) and the service fetcher. A blocking stale read is already expressible by calling it with `preferFreshOnStale: true` before reading metadata.                                                                                                                   | `packages/sdk/src/ports/query-factory.ts:35-80`; `packages/sdk/src/query/query-factory.ts:65-87`; `packages/sdk/src/ports/query-options.ts:9-35`. |
| 7  | `CacheQuery.query()` implements fresh, missing, expired, blocking-stale, and SWR branches. The existing test suite covers single-reader SWR, blocking stale, and cold-cache foreground dedupe, but not two overlapping stale SWR readers.                                                                                                                                                                        | `packages/sdk/src/cache/cache-query.ts:98-202`; `packages/sdk/tests/cache/cache-query_test.ts:5-72`.                                              |
| 8  | Background revalidation bypasses `inflightRequests`: `revalidateInBackground()` calls `queryFn()` and `store.set()` directly. Two stale readers that both pass the initial map check can therefore schedule duplicate refreshes.                                                                                                                                                                                 | `packages/sdk/src/cache/cache-query.ts:261-313`.                                                                                                  |
| 9  | Simply registering the background refresh in the current map is insufficient: the unconditional pre-store map join at lines 140-143 would make a later SWR reader block for fresh data rather than return stale data, and the current foreground map stores only the loader promise rather than the full loader-plus-persistence lifecycle. Policy-aware joining and persistence-complete promises are required. | `packages/sdk/src/cache/cache-query.ts:140-143, 227-258`.                                                                                         |
| 10 | `docs/site/web-layer/query-bridge.md` is already accurate: it calls `getCachedEntry()` a read, not a fetch, and identifies the callable action as the SWR/blocking path. This is the source-alignment anchor for the corrected example.                                                                                                                                                                          | `docs/site/web-layer/query-bridge.md:157-191`.                                                                                                    |
| 11 | `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md:100` contains a second false prose claim that a stale `getCachedEntry()` hit refreshes in the background. It is outside the frozen contract and is not the exact issue-cited snippet. Adding it would be a scope expansion; it is reported, not silently edited.                                                                                 | `rg -n 'getCachedEntry.*stale entry refreshes' docs/site`; page lines 99-108.                                                                     |
| 12 | Editing the owned site source has the proven generated cascade: agent-docs prose/provenance, CLI agent-docs barrel, then MCP publish assets. All four generated files exist at this baseline.                                                                                                                                                                                                                    | Root tasks `gen:agent-docs-prose`, `gen:assets-barrel`, `gen:publish-assets`; direct file checks.                                                 |
| 13 | `services-sdk/sdk.md` is a Tier-1 snippet-policy page. The published example also needs a runtime regression because its `comp.tabbedCode` string is not by itself sufficient proof of concurrent behavior.                                                                                                                                                                                                      | `.llm/tools/docs/snippet-policy.ts:4-17`; `packages/sdk/tests/query/query-factory_test.ts`.                                                       |

## Contract decision

Choose issue remedy **1: correct the guidance to call the existing cache-aware action before reading
metadata**. The loader example will use the callable action with `preferFreshOnStale: true`, then
read `getCachedEntry()` so it returns the store's refreshed `cachedAt`. A fail-safe fallback may
return the fetched data if PR #1665's deliberately non-fatal persistence path leaves no entry.

This choice is driven by the acceptance contract, not size:

- the existing callable action already distinguishes fresh, missing, SWR, and blocking stale reads;
- blocking stale mode gives the loader a refreshed value before it reads the cache timestamp;
- adding `queryEntry()` would duplicate policy across `CacheQuery`, `CacheProvider`, `ActionMethod`,
  and `CompositeQuery`, creating a second cache execution contract without an acceptance behavior
  unavailable from the current surface;
- the one missing runtime guarantee is shared execution for background refresh, which must be fixed
  whichever published remedy is selected.

The choice **does not add published surface**. No `queryEntry()` export, provider method, action
method, or composite-query method is planned, so no published-surface scope ruling is required.

## Concurrency proof design

The regression will use two genuinely overlapping readers against one `MemoryCacheStore` and one
`CacheQuery` instance:

1. seed one stale entry with a known old timestamp;
2. make `queryFn` increment a call counter and wait on a manually controlled promise;
3. start two `cache.query()` calls with the same key before releasing that promise;
4. assert both SWR callers receive the stale value without waiting;
5. assert the counter is exactly one while the refresh is still blocked;
6. release the refresh, wait for the cache write, and assert the stored value is fresh with a
   `cachedAt` greater than the seeded timestamp.

A second query-factory regression will run two overlapping copies of the corrected published loader
pattern in blocking mode. Both must receive the refreshed entry, both timestamps must identify the
same persisted refresh, and the service client counter must equal one. This guards the immediate
`query()` → `getCachedEntry()` metadata handoff as well as raw engine SWR.

## Acceptance-to-test map

| Acceptance                                                                      | Planned executable evidence                                                                                                                                              |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fresh entries cause zero upstream calls.                                        | Factory loader regression seeds a fresh store entry, invokes the corrected loader, and asserts client calls remain `0`.                                                  |
| Missing entries fetch once and return a current timestamp.                      | Factory loader regression starts empty, brackets the call with timestamps, asserts one client call and `cachedAt` within the bracket.                                    |
| Stale entries follow the documented blocking or SWR policy.                     | Existing single-reader tests remain; new factory test proves blocking `preferFreshOnStale`, and new engine test asserts two SWR callers both return stale immediately.   |
| Concurrent stale readers issue exactly one refresh.                             | Two overlapping SWR readers share a blocked `queryFn`; assert call count exactly `1` before release. Blocking loader overlap also asserts `1`.                           |
| `cachedAt` reflects the refreshed value.                                        | Seed an old timestamp and assert the post-refresh entry contains fresh data and a strictly newer timestamp; overlapping blocking loaders observe the same new timestamp. |
| Published loader example has an executable regression proving eventual refresh. | `packages/sdk/tests/query/query-factory_test.ts` mirrors the page's cache-aware-call-then-metadata-read sequence; `cache-query_test.ts` proves eventual SWR persistence. |

## Corrected and derived surface list

### Frozen contract correction

- `docs/site/services-sdk/sdk.md`
- `packages/sdk/src/cache/cache-query.ts`

Removed from the contract because they do not exist:

- `docs/sdk`
- `docs/site/_site/capabilities/sdk/index.md` (generated `_site/` target; never hand-edit)

### Implementation/test surfaces required to prove the corrected contract

- `packages/sdk/tests/cache/cache-query_test.ts`
- `packages/sdk/tests/query/query-factory_test.ts`

### Derived asset cascade required by the site-source edit

- `.llm/assets/agent-docs/prose.json.gz`
- `.llm/assets/agent-docs/provenance.json`
- `packages/cli/src/kernel/assets/agent-docs.generated.ts`
- `packages/mcp/src/publish-assets.generated.ts`

Generation order is fixed: `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`. The
three freshness checks must pass together on one content head.

## jsr-audit surface scan

- Surface scanned: all 12 exports declared by `packages/sdk/deno.json`, learned with `deno doc`
  before source inspection.
- Metadata: scoped name, version, 80-character description, explicit exports, README, and publish
  include/exclude configuration are present.
- `deno publish --dry-run --allow-dirty` from `packages/sdk` exits `0`; its raw output contains no
  actual slow-type diagnostic and publishes only README/config/source files (tests excluded).
- The repo audit helper exits `0` with two warnings: known out-of-scope `F-DOCT-5` (`src` has 13
  immediate children vs cap 12), and `F-JSR-7` from matching the informational “Checking for slow
  types” banner. The raw dry-run is authoritative for actual slow types.
- No published export is planned. The JSR risk is therefore regression-only: preserve export maps,
  keep raw publish dry-run green, and do not deepen the known folder-cardinality finding.
- Raw doc-lint baseline discrepancy: the explicit all-export invocation exits `1` with three unique
  `private-type-ref` diagnostics — `QueryClientPort` → `QueryClient`, `createNetScriptQueryClient` →
  `QueryClient`, and `DurableStreamProducerOptions["instrumentation"]` → `StreamsInstrumentation`.
  The brief's pinned count of six could not be reproduced at the exact checked-out SHA.
  `deno doc --lint
  packages/sdk/mod.ts` yields the first two; the structured full-export runner
  also reports the same three unique files. This run must never report doc-lint as green and must
  preserve the observed names/count while the topic orchestrator reconciles the supplied
  six-diagnostic command.

## Known-red boundaries

- `check:mcp-export-corpus` is stale on `main` (#1668): do not repair or report green.
- `surface:diff` is stale because `baselines/public-surfaces.json` is stale: do not repair or report
  green.
- JSR `F-DOCT-5` (13 immediate `packages/sdk/src` children vs cap 12) is pre-existing and out of
  scope.
- If root tests hit `packages/queue/tests/typed-queue_test.ts` with DLQ expected `1`, got `2`,
  report exact counts as known flake #1667 and do not rerun merely to obtain green.

## Open questions

- **Safe to defer:** should the coordinator separately expand the frozen surface to correct the
  adjacent tutorial claim at `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md:100`?
  It is not the exact issue-cited example, and the planned generated cascade already covers any
  later site-source addition, so deferral does not force code rework.
- **Safe to defer to PLAN-EVAL/coordinator:** which exact raw full-surface doc-lint invocation
  produced the brief's six diagnostics? The checked-out baseline produces three unique diagnostics;
  this affects evidence wording, not the selected implementation design.
