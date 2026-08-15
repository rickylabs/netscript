# Research — sdk cache surface and telemetry

## Re-baseline

- Carried-in source: slice brief for issues #1637, #1619, #1620, #1598, and #1623.
- Re-derived against `main@baf1cdf67a4e931af17b4772ddf6101f36152184` on 2026-08-15.
- Branch and worktree matched the brief; `git status --short --branch` showed only the pre-staged,
  untracked run directory.
- The current doctrine inventory classifies `packages/sdk` as **Archetype 2 — Integration / Keep**
  and says to preserve discovery/client/cache adapter boundaries
  (`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:53`). The slice brief deliberately
  selects **Archetype 3 — runtime behavior** for the failure-isolation work. The plan uses the
  stricter Archetype 3 runtime/consumer gate shape without claiming that the package-wide doctrine
  classification changed.

## 1. `CacheQuery.fetchAndCache()` call graph

The cold/expired/blocking-stale path is:

1. `query()` normalizes the namespace and calls `telemetry.withSpan(...)`
   (`packages/sdk/src/cache/cache-query.ts:84-90`).
2. `queryInsideSpan()` performs the in-flight check, awaits `store.get()`, records lookup evidence,
   and calls `fetchAndCacheOnce()` for misses, expired entries, or blocking-stale reads
   (`packages/sdk/src/cache/cache-query.ts:135-196`).
3. `fetchAndCacheOnce()` rechecks the in-flight map, then delegates to `fetchAndCache()`
   (`packages/sdk/src/cache/cache-query.ts:204-219`).
4. `fetchAndCache()` calls the service loader and stores that promise in the in-flight map
   (`packages/sdk/src/cache/cache-query.ts:222-232`). It awaits the already-successful service data
   at line 234, constructs the cache entry at line 235, then **awaits** `store.set()` at line 238.
5. A persistence rejection is recorded as a provider error and rethrown at lines 239-247. Only
   after a successful write and `recordCacheWrite()` does the method return the already-resolved
   `data` at line 250. The `finally` always removes the in-flight entry at lines 251-253.

Therefore #1637 is accurate: the source query has already succeeded before persistence begins, but
the current cache-write rejection replaces the payload with an application-visible failure.

The stale-while-revalidate branch is already detached: `revalidateInBackground()` records and
throws inside its write span, while the outer `.catch()` deliberately keeps the failure away from
the stale-data caller (`packages/sdk/src/cache/cache-query.ts:256-300`). Explicit
`setCachedData()` is a caller-requested write and currently remains fail-loud
(`packages/sdk/src/cache/cache-query.ts:412-441`); #1637 does not require changing that separate
contract.

## 2. Every reach into `recordIncompleteTopology`

`recordIncompleteTopology()` sets `outcome=error`, sets `topologyComplete=false`, adds the supplied
cache event, and throws a `TypeError`; its return type is `never`
(`packages/sdk/src/cache/cache-telemetry.ts:164-181`). Whole-repository search:

```text
rg -n "recordIncompleteTopology|recordCacheLookup\(|recordCacheWrite\(|recordCacheInvalidation\(" .
```

found exactly three direct reaches, all in `cache-telemetry.ts`:

| Recorder | Reach | Trigger |
| --- | --- | --- |
| `recordCacheLookup` | `cache-telemetry.ts:255-265` | `validateLookupChain()` rejects incomplete/empty/over-limit evidence, bad descriptors/outcomes, non-contiguous indices, duplicate tiers, or invalid promotions (`cache-telemetry.ts:183-200`) |
| `recordCacheWrite` | `cache-telemetry.ts:317-328` | incomplete/empty/over-limit writes or promotions, or an invalid write/promotion descriptor/outcome |
| `recordCacheInvalidation` | `cache-telemetry.ts:360-390` | incomplete/empty/over-limit evidence, invalid descriptor/outcome, or inconsistent reports for one tier |

All three can fire it. The current passing test intentionally pins fail-loud lookup behavior:
`cache-telemetry_test.ts:237-271` supplies four tiers, asserts `TypeError`, and then asserts the span
was marked `error`/incomplete without entering the loader.

## 3. `validateDescriptor` relative to `withSpan`

The issue claim is correct. `CacheQuery.query()` passes
`createCacheSpanAttributes(CacheOperations.READ, namespace, this.descriptor)` as the second
argument to `withSpan` (`packages/sdk/src/cache/cache-query.ts:84-90`). JavaScript evaluates that
argument before calling `withSpan`. `createCacheSpanAttributes()` calls `validateDescriptor()`
immediately (`packages/sdk/src/cache/cache-telemetry.ts:114-129`), and the validator throws for an
invalid system/tier (`cache-telemetry.ts:149-156`). Consequently the current failure occurs before
the telemetry collaborator can create a span.

The shipped-path statement remains behaviorally true, but the issue's type wording is stale at this
head. `KvProvider` is now `'redis' | 'deno-kv' | 'nitro' | 'auto'`
(`packages/kv/application/shared.ts:68-82`), not only the first two. However `auto` resolves to a
concrete backend and the only successful assignments to `activeProvider` are `redis` and `deno-kv`
(`packages/kv/application/shared.ts:228-250`); explicit `nitro` throws before initialization
(`packages/kv/application/shared.ts:238-241`). `KvCacheStore` copies the successful active provider
into its descriptor (`packages/sdk/src/cache/kv-cache-store.ts:68-84`). Thus no shipped successful
KV path currently produces a descriptor rejected by the validator.

## 4. Shipped `operationId` producers and pinned static behavior

Focused search over SDK/Fresh/KV/CLI TypeScript, templates, Markdown, and JSON found two shipped SDK
producers plus the public direct-call input:

| Producer | Current contract | Pinning evidence |
| --- | --- | --- |
| Generated action query factories | One closure-local `` `${resource}.${String(action)}` `` reused for query, prefetch, reads, and invalidation; per-call `options.operationId` is deliberately ignored (`packages/sdk/src/query/query-factory.ts:61-90`, `:103-139`) | `query-factory_test.ts:115-153` passes `ignored.user-input` and asserts four `orders.list` values |
| Composite query | Normalized static `defaultOptions.operationId`, falling back to fixed `composite`; per-call value defaults to that same value (`packages/sdk/src/query/composite-query.ts:36-64`, `:91-108`) | `query-factory_test.ts:156-184` asserts `billing.dashboard,composite` |
| Direct public cache calls | `QueryParams.operationId?: string` is public free text (`packages/sdk/src/ports/query-options.ts:7-23`); direct methods normalize it or use fixed method fallbacks (`cache-query.ts:84-90`, `:303-305`, `:328-329`, `:359-364`, `:384-392`) | Namespace syntax and fallbacks are covered throughout `cache-telemetry_test.ts`; README guidance is at `packages/sdk/README.md:136-140` |

The generated factory behavior is static with respect to request/tenant/user input, although the
resource/action vocabulary is discovered from the contract at factory construction.

## 5. Whole-repository surface/consumer/assertion census

Commands executed from the repository root included:

```text
rg -n --hidden --glob '!**/.git/**' --glob '!.llm/runs/**' \
  "cache-provider\.ts|cache-query\.ts|cache-telemetry\.ts|cache-store\.ts" .
rg -n --glob '*.ts' --glob '*.tsx' --glob '*.template' --glob '*.md' \
  "from ['\"]@netscript/sdk/(cache|ports|query)['\"]|import ['\"]@netscript/sdk/cache['\"]" \
  packages plugins tools .llm
rg -n "CacheStore|CacheQuery|CacheTelemetry|CacheProviderDescriptor|QueryParams" \
  packages/fresh packages/kv packages/cli
```

The exact declared-filename search returned only SDK implementation, SDK tests, and SDK internal
barrels; no sibling package reads those source files directly. The public-surface census found:

| Unit | Relationship to the declared surface | Evidence / assertion |
| --- | --- | --- |
| `packages/sdk` | Own implementation and tests. `src/cache/mod.ts` re-exports `CacheQuery`, telemetry types/helpers, and the provider API (`packages/sdk/src/cache/mod.ts:17-62`). `src/ports/mod.ts` re-exports `CacheStore`/`QueryParams` (`packages/sdk/src/ports/mod.ts:17-41`). `query-factory.ts`, `composite-query.ts`, and `query-client/kv-cache-persister.ts` consume the provider/store contracts. | SDK cache/query tests directly import the four files; `query-factory_test.ts:115-184` pins operation IDs. |
| `packages/fresh` | Public consumer. Server bootstrap side-effect imports `@netscript/sdk/cache` (`packages/fresh/src/runtime/server/define-fresh-app.ts:1-10`); the invalidation route calls `getCacheProvider()` (`query-cache-invalidation.ts:7-29`); Fresh re-exports the SDK staleness helper (`packages/fresh/src/application/cache-entries/cache-entry.ts:1-20`) and uses `CachedEntry` from `@netscript/sdk/ports` in the page catalog (`define-page/catalog.ts:1-2`). | Compile/tests assert these imports and route behavior; root `check`/`test` covers the package. |
| `packages/kv` | Inverse dependency, not a reader/re-exporter of SDK. `KvCacheStore` is the SDK adapter that dynamically imports `@netscript/kv`, calls `getKv()`, and propagates `store.set()` rejections (`packages/sdk/src/cache/kv-cache-store.ts:68-84`, `:115-133`). `packages/kv` owns the real Deno KV backend and provider selection (`packages/kv/application/shared.ts:212-250`). | The planned RED test intentionally drives this real local `Deno.openKv(':memory:')` path, not a synthetic throwing store. Exact SDK-symbol search in `packages/kv` returned no matches. |
| `packages/cli` | Generated consumer surface. Scaffold code injects the side-effect cache import (`packages/cli/src/kernel/application/scaffold/writers/write-app-files.ts:314-323`), and its test asserts the exact emitted string (`write-app-files_test.ts:6-16`). The service-query template imports `createQueryFactories`; `embedded.generated.ts:23` contains the generated mirror. | This is the source-text/output assertion that makes a repo-root test necessary even though CLI files are not edited. |
| `packages/mcp` | `publish-assets.generated.ts` embeds documentation that teaches the `@netscript/sdk/query` generated-factory surface. It does not import or re-export the four declared files. | Generated-asset freshness is covered by the repo-root tests/tooling; no matching cache-topology README text was found in the asset. |
| `.llm/tools` | Release/docs tooling asserts the published surface. `release/baselines/public-surfaces.json:18704-18746` contains exact SDK symbol hashes including `CacheQuery`, `CacheStore`, and `CacheStoreEntry`; docs snippet support imports `@netscript/sdk/query`. | Add `deno task surface:diff` and keep the repo-root test suite. |

No plugin directly reads, re-exports, or asserts on the four declared surfaces. The gate plan uses
the **repo-root** structured `test` task, so SDK, Fresh, KV, CLI, MCP/generated-asset, and tooling
assertions are not guessed from the touched-file list.

## #1623 ports JSDoc sweep

Executed:

```text
rg -n "@returns|@param|@example" packages/sdk/src/ports --glob '*.ts'
rg -n "report|topology|evidence|Cache(Read|Write|Invalidation)TopologyReport|CacheStoreEntry" \
  packages/sdk/src/ports --glob '*.ts'
```

The sweep found only the three `CacheStore` method docs affected by the mandatory-evidence
contract:

- `get` still says `{ value: null }` and omits required `report` (`cache-store.ts:59-65`).
- `set` returns `CacheWriteTopologyReport` but has no `@returns` (`cache-store.ts:67-78`).
- `delete` returns `CacheInvalidationTopologyReport` but has no `@returns`
  (`cache-store.ts:80-85`).

Other tags under `ports/**` are in `query-key.ts` and `cache-entry.ts`; their documented parameters
and return values match their signatures. No other mandatory-evidence-era shape was found.

## Published surface / JSR baseline

`deno doc` was used before source inspection. It confirms `CacheQuery`, `CacheStore`,
`CacheTelemetry`, `CacheProvider`, and `QueryParams` are reachable through the published SDK
entrypoints. `packages/sdk/deno.json:6-18` declares twelve exports, including `./cache`, `./ports`,
and `./query`; `isolatedDeclarations` is workspace-wide.

Current commands and results:

| Command | Result | Finding |
| --- | --- | --- |
| `deno publish --dry-run --allow-dirty` from `packages/sdk` | PASS | Publish simulation succeeds; no product assets or runtime file reads are needed. |
| JSR audit script for `packages/sdk` | PASS with 2 warnings | Existing `src/` cardinality warning and slow-type banner; 83 files / 9,270 LOC / 12 exports. |
| `deno task doc:lint --root packages/sdk --pretty` | FAIL | Current full-export baseline has `private-type-ref` diagnostics and no `missing-jsdoc`. The cache entrypoint alone has three in `kv-cache-store.ts:48,97`; other export paths add pre-existing refs outside this slice. |
| `deno task check:netscript-jsr-specifiers` | PASS | `scanned=2361`, `ranges=0`, `failures=0`. |

The planned implementation adds no public symbol or dependency, so `surface:diff` should classify it
as patch/non-breaking. Existing exact workspace publication pins for SDK dependencies remain
unchanged; no logger dependency is introduced. The full-export doc-lint red baseline is a scope
ruling, documented in `scope-boundary.md`, not evidence that this plan passed that gate.

## Open questions requiring the topic orchestrator

1. Authorize the README/test files listed in `scope-boundary.md`; they are outside the declared four
   product files but are explicitly required by issue acceptance and the behavioral RED contract.
2. Decide whether this slice may carry the existing `deno doc --lint` baseline as named debt/no
   regression, or whether the cache/full-export private-type references must be fixed under a
   separately widened surface.

