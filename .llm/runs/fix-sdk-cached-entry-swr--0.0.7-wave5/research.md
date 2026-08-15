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

| #  | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                               | How to verify                                                                                                                                                      |
| -- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1  | The exact offending published loader snippet lives in `docs/site/services-sdk/sdk.md`, line 188. It calls `getCachedEntry()`, returns any hit immediately, and falsely claims the SDK reloads stale data in the background.                                                                                                                                                                                                                           | `rg -n -F 'serve cached; SDK reloads stale in the background' docs/site`; `docs/site/services-sdk/sdk.md:184-200`                                                  |
| 2  | Contract path `docs/sdk` does not exist.                                                                                                                                                                                                                                                                                                                                                                                                              | `test -e docs/sdk` exits non-zero.                                                                                                                                 |
| 3  | Contract path `docs/site/_site/capabilities/sdk/index.md` does not exist, and `_site/` is excluded as generated Lume output rather than source. It must never be hand-edited.                                                                                                                                                                                                                                                                         | `test -e docs/site/_site/capabilities/sdk/index.md` exits non-zero; `.llm/tools/docs/snippet-policy.ts:45-48` excludes `_site`.                                    |
| 4  | The other two frozen surfaces exist: `docs/site/services-sdk/sdk.md` and `packages/sdk/src/cache/cache-query.ts`. Those remain the corrected original contract paths; the coordinator subsequently authorized exactly one additional docs source, recorded in finding 11.                                                                                                                                                                             | Direct path checks; coordinator scope ruling for PR #1669.                                                                                                         |
| 5  | `getCachedEntry()` is a published pure read: it reads the store and converts `timestamp` to `cachedAt`; it receives no stale policy or fetcher.                                                                                                                                                                                                                                                                                                       | `deno doc --filter CacheQuery packages/sdk/mod.ts`; `packages/sdk/src/cache/cache-query.ts:414-442`.                                                               |
| 6  | The callable `ActionMethod` already owns the complete declared cache policy (`staleTime`, `cacheTime`, `revalidateOnStale`, `preferFreshOnStale`) and the service fetcher. A blocking stale read is already expressible by calling it with `preferFreshOnStale: true` before reading metadata.                                                                                                                                                        | `packages/sdk/src/ports/query-factory.ts:35-80`; `packages/sdk/src/query/query-factory.ts:65-87`; `packages/sdk/src/ports/query-options.ts:9-35`.                  |
| 7  | `CacheQuery.query()` implements fresh, missing, expired, blocking-stale, and SWR branches. The existing test suite covers single-reader SWR, blocking stale, and cold-cache foreground dedupe, but not two overlapping stale SWR readers.                                                                                                                                                                                                             | `packages/sdk/src/cache/cache-query.ts:98-202`; `packages/sdk/tests/cache/cache-query_test.ts:5-72`.                                                               |
| 8  | Background revalidation bypasses `inflightRequests`: `revalidateInBackground()` calls `queryFn()` and `store.set()` directly. Two stale readers that both pass the initial map check can therefore schedule duplicate refreshes.                                                                                                                                                                                                                      | `packages/sdk/src/cache/cache-query.ts:261-313`.                                                                                                                   |
| 9  | Simply registering the background refresh in the current map is insufficient: the unconditional pre-store map join at lines 140-143 would make a later SWR reader block for fresh data rather than return stale data, and the current foreground map stores only the loader promise rather than the full loader-plus-persistence lifecycle. Policy-aware joining and persistence-complete promises are required.                                      | `packages/sdk/src/cache/cache-query.ts:140-143, 227-258`.                                                                                                          |
| 10 | `docs/site/web-layer/query-bridge.md` is already accurate: it calls `getCachedEntry()` a read, not a fetch, and identifies the callable action as the SWR/blocking path. This is the source-alignment anchor for the corrected example.                                                                                                                                                                                                               | `docs/site/web-layer/query-bridge.md:157-191`.                                                                                                                     |
| 11 | `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md:100` contains a false direct clause, but correcting that clause alone would leave the page-level implication intact: accurate factory-level SWR claims at lines 13, 15, 75, 76, and 80 are paired with the pure-read-only loader at line 107. The coordinator authorized this one page and no third docs source. The repair must preserve the true callable-action SWR story while making the action/metadata boundary and loader composition explicit. | Executed docs claim sweep below; page lines 13-15, 28-32, 72-107; Tier-A T-1.                                                                                       |
| 12 | Editing either authorized site source has the same generated cascade: agent-docs prose/provenance, CLI agent-docs barrel, then MCP publish assets. The ordered plan-phase generation run exited 0 for all three tasks and produced no tracked delta or undeclared path because the current content head was already synchronized.                                                                                                                     | `deno task gen:agent-docs-prose`; `deno task gen:assets-barrel`; `deno task gen:publish-assets`; then `git status --short` and `git diff --name-only`, both empty. |
| 13 | `services-sdk/sdk.md` is a Tier-1 snippet-policy page. The published example also needs a runtime regression because its `comp.tabbedCode` string is not by itself sufficient proof of concurrent behavior.                                                                                                                                                                                                                                           | `.llm/tools/docs/snippet-policy.ts:4-17`; `packages/sdk/tests/query/query-factory_test.ts`.                                                                        |
| 14 | The repaired two-page sweep accounts for every same-class claim: the plan retains tutorial lines 13, 15, 75, and 76 with explicit nearby callable-action scoping; corrects tutorial lines 32, 80, 94, 100, and 107; retains the accurate services-SDK timestamp-decision description at line 138; and corrects its false loader at line 188. Chapter 4 line 231 is a checked-and-cleared third-page claim about `withPolicy('balanced')`, plausibly true of that policy rather than a claim that `getCachedEntry()` refreshes; it remains out of scope and unedited. | Executed docs claim sweep below; `plan.md` published-claim disposition table; chapter 4 lines 231-242. |
| 15 | Both authorized pages are inputs to the existing agent-docs bundle, so the second source does not authorize a fifth generated mirror.                                                                                                                                                                                                                                                                                                                 | `.llm/assets/agent-docs/provenance.json:127,145` lists `pages/services-sdk/sdk/index.md` and `pages/tutorials/live-dashboard/03-sdk-cache-first-query/index.md`.   |
| 16 | The S2 factory regression exposed a pre-existing fresh-hit defect: `CacheQuery` evaluates `if (isExpired || preferFreshOnStale)` before `if (isFresh)`, so a fresh non-expired cache entry fetches when the stale-only preference is true. The identical condition exists at `main@3e8e146a4:170` and at the accepted S1 head `e100ea205:165`; this is baseline behavior exposed by S2, not an S1 regression. The coordinator authorized exactly `packages/sdk/src/cache/cache-query.ts` as an added S2 correction surface. | `git show 3e8e146a4:packages/sdk/src/cache/cache-query.ts \| nl -ba \| sed -n '160,178p'`; `git show e100ea205:packages/sdk/src/cache/cache-query.ts \| nl -ba \| sed -n '155,175p'`; focused query-factory regression currently fails its fresh phase with `Expected seeded-fresh, got fetched`. |

## Executed docs claim sweep

```text
rtk rg -n -C 4 -i "getCachedEntry|stale.{0,100}(refresh|revalidat)|(?:refresh|revalidat).{0,100}stale|background" docs/site/services-sdk/sdk.md docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md
rtk rg -n -C 2 -i "getCachedEntry|stale.{0,100}(refresh|revalidat)|(?:refresh|revalidat).{0,100}stale|background" docs/site/tutorials/live-dashboard --glob '*.md'
rtk rg -n -i "getCachedEntry|stale.{0,100}(refresh|revalidat)|(?:refresh|revalidat).{0,100}stale" docs/site --glob '*.md' --glob '!_site/**'
```

The first command swept exactly the two authorized pages after the disposition table was drafted;
the second checked the surrounding live-dashboard tutorial story; the third checked all site source
for another same-class claim. On the authorized pages, the relevant results are fully accounted for
by `plan.md`: tutorial lines 13, 15, 75, and 76 remain accurate only with the specified nearby
callable-action scoping; tutorial lines 32, 80, 94, 100, and 107 are corrected; services-SDK line
138 is accurately scoped to a loader decision; and services-SDK line 188 is corrected. Matches at
services-SDK lines 35 and 140 are an API inventory and an explicit `prefetch()` mechanism,
respectively, not same-class claims. No same-class claim on either authorized page remains without
a disposition. The surrounding-story sweep also surfaced chapter 4 line 231; its
`withPolicy('balanced')` mechanism is plausibly true and does not assign refresh to
`getCachedEntry()`, so it is checked-and-cleared, out of scope, and unedited. No third docs source is
added.

## Executed generated-mirror verification

```text
rtk proxy deno task gen:agent-docs-prose
rtk proxy deno task gen:assets-barrel
rtk proxy deno task gen:publish-assets
rtk rg -n 'services-sdk/sdk|tutorials/live-dashboard/03-sdk-cache-first-query' .llm/assets/agent-docs/provenance.json
git status --short
git diff --name-only
```

All three generators exited 0 in the required order. Provenance names both authorized rendered
pages. With no docs content edit permitted in this amendment, the already-synchronized content head
produced an empty tracked delta; therefore execution found no generated path outside the four
declared mirrors. The implementation slice must repeat the comparison after the two docs edits and
stop if a fifth path appears.

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

For the coordinator-authorized tutorial page, the repair preserves the truthful factory-level SWR
story while removing its misleading association with the demonstrated pure-read loader. The exact
per-line dispositions are locked in `plan.md`; the direct line-100 replacement is:

> `getCachedEntry` is a pure KV read: on a warm cache it returns `{ data, cachedAt }`; on a cold
> cache it returns `null`. It does not evaluate staleness or start revalidation; the callable action
> or page/client policy must do that explicitly.

Nearby text will identify the callable procedure action as the SWR policy path, and the demonstrated
loader will call that action before reading metadata. This preserves the truthful factory-level and
page/client refresh mechanisms without inventing one inside the fast path.

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

### Corrected and authorized contract

- `docs/site/services-sdk/sdk.md`
- `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md` (the coordinator's exact
  one-source expansion)
- `packages/sdk/src/cache/cache-query.ts`

S2-A authorizes only one additional correction within that existing runtime path: replace the
baseline condition with `isExpired || (!isFresh && preferFreshOnStale)`. Expired entries continue
to fetch first; otherwise only stale entries with the preference block; fresh non-expired entries
fall through to the existing hit return. This adds no public surface and must preserve S1's A2/A3
single-flight/write-failure behavior and the honest 497-line, no-F-1 result.

The authorized docs sources are exactly the first two paths. No third docs source is in scope.

Removed from the contract because they do not exist:

- `docs/sdk`
- `docs/site/_site/capabilities/sdk/index.md` (generated `_site/` target; never hand-edit)

### Implementation/test surfaces required to prove the corrected contract

- `packages/sdk/tests/cache/cache-query_test.ts`
- `packages/sdk/tests/query/query-factory_test.ts`

The S2-A behavior proof is confined to the already-authorized query-factory test: fresh plus
`preferFreshOnStale` keeps the seeded data/timestamp and makes exactly zero calls; missing fetches
once with a current timestamp; and two overlapping stale blocking loaders make exactly one refresh
and observe one refreshed timestamp. `cache-query_test.ts` is not an S2-A edit surface.

### Derived asset cascade required by either site-source edit

- `.llm/assets/agent-docs/prose.json.gz`
- `.llm/assets/agent-docs/provenance.json`
- `packages/cli/src/kernel/assets/agent-docs.generated.ts`
- `packages/mcp/src/publish-assets.generated.ts`

Generation order is fixed: `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`. The
three freshness checks must pass together on one content head. The ordered plan-phase execution
completed with no tracked delta or undeclared path, and provenance names both authorized pages.

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
- Raw doc-lint no-regression has two expected-red invocations. The combined 12-entrypoint command
  exits `1` with exactly three diagnostics: `QueryClientPort` → private `QueryClient`,
  `createNetScriptQueryClient` → private `QueryClient`, and
  `DurableStreamProducerOptions["instrumentation"]` → private `StreamsInstrumentation` (the last is
  in `plugin-streams-core` and outside this leaf). The cache-only command separately exits `1` with
  exactly three `KvCacheStore` diagnostics named in `plan.md` row 14b. “Six” was the sum across the
  two commands. Both must preserve their exact named sets with zero new diagnostics; neither is a
  pass.

## Known-red boundaries

- `check:mcp-export-corpus` is stale on `main` (#1668): do not repair or report green.
- `surface:diff` is stale because `baselines/public-surfaces.json` is stale: do not repair or report
  green.
- JSR `F-DOCT-5` (13 immediate `packages/sdk/src` children vs cap 12) is pre-existing and out of
  scope.
- If root tests hit `packages/queue/tests/typed-queue_test.ts` with DLQ expected `1`, got `2`,
  report exact counts as known flake #1667 and do not rerun merely to obtain green.

## Open questions

- None that can force implementation rework. PLAN-EVAL remains the required external decision gate.
