# Plan: make the cached-entry loader honor its stale policy

## Run Metadata

| Field          | Value                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Run ID         | `fix-sdk-cached-entry-swr--0.0.7-wave5`                                                                           |
| Branch         | `fix/sdk-cached-entry-swr`                                                                                        |
| Phase          | `plan` — hard stop pending external PLAN-EVAL PASS                                                                |
| Target         | `packages/sdk` runtime behavior plus published SDK site guidance                                                  |
| Archetype      | `3 — Runtime/Behavior` for this cache lifecycle slice; package-wide doctrine assignment remains `2 — Integration` |
| Scope overlays | `docs`                                                                                                            |

## Archetype

The owner selected Archetype 3 because the defect is runtime behavior: cache state, freshness time,
concurrent execution ownership, and background refresh lifecycle. The current doctrine table assigns
`packages/sdk` as a whole to Archetype 2 (Integration). This plan does not reorganize the package or
override that package-wide verdict; it applies the stricter Archetype-3 behavioral gates to the
cache slice while preserving the SDK's adapter boundaries.

## Current Doctrine Verdict

`packages/sdk` is **Keep**: “Preserve discovery/client/cache adapter boundaries.” This change stays
inside the existing cache engine, its tests, and the two authorized docs sources. It adds no port,
adapter, entrypoint, or export.

## Axioms in Play

| Axiom | Why it matters                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------- |
| A1    | The contract decision is locked before implementation: compose existing published methods; add no new export.             |
| A2    | One cache policy remains authoritative instead of adding a parallel revalidating-entry abstraction.                       |
| A8    | The runtime change remains in `cache-query.ts`; engine and factory regressions stay in their existing focused test files. |
| A9    | Archetype-3 runtime rigor is applied to this lifecycle slice without reshaping the Archetype-2 package.                   |
| A13   | PR #1665's fail-safe write/telemetry boundaries remain intact while shared refresh ownership is fixed.                    |
| A14   | Concurrent behavior, published guidance, JSR dry-run, docs accuracy, and derived-asset freshness are executable gates.    |

## Goal

Make the published loader guidance truthful without adding API surface, and make stale SWR refresh
ownership exact: fresh cache hits make no upstream call, misses fetch once, stale reads follow their
chosen blocking/SWR policy, overlapping stale readers schedule exactly one refresh, and refreshed
metadata carries the persisted refresh timestamp.

## Scope

- Make the in-flight lifecycle policy-aware in `CacheQuery`: background SWR refreshes participate in
  dedupe without forcing other SWR readers to block, while missing/expired/blocking readers join the
  same persistence-complete operation.
- Correct the pre-existing `preferFreshOnStale` predicate in `CacheQuery` so the option applies only
  to stale entries: expired entries retain fetch precedence, non-expired stale entries block only
  when the option is true, and fresh non-expired entries retain their zero-fetch hit path.
- Preserve every PR #1665 request-local admission, telemetry, cache-write fail-safe, and telemetry
  evidence fail-safe behavior.
- Add deterministic concurrent engine and factory-loader regressions mapped to all six acceptance
  bullets.
- Replace the false `services-sdk/sdk.md` loader example with the existing callable action in
  `preferFreshOnStale` mode followed by `getCachedEntry()` metadata retrieval.
- Correct the authorized tutorial as a page-level contract, not as a line-100 substitution: retain
  its accurate factory-level SWR claims, explicitly scope those claims to the callable procedure
  action, describe `getCachedEntry()` as a KV-only metadata read, and make the demonstrated loader
  compose the policy action before the metadata read.
- Regenerate and commit the four declared derived assets in the mandated order.

### S2-A baseline predicate correction

The S2 factory regression exposed an unavoidable baseline defect in the runtime used by the
published composition. At `main@3e8e146a4:170`, `if (isExpired || preferFreshOnStale)` runs before
the fresh-hit branch, so a fresh non-expired entry fetches whenever `preferFreshOnStale: true`.
That contradicts the option's stale-only contract and would make the corrected loader example fail
the acceptance requirement that fresh entries cause zero upstream calls. This condition is
identical at the S1 head (`e100ea205:165`), so the defect predates S1 and was exposed by S2; it is
not an S1 regression.

The exact authorized correction is:

```ts
if (isExpired || (!isFresh && preferFreshOnStale)) {
  // existing blocking fetch path
}
if (isFresh) return cached.value.data;
```

Expired precedence is unchanged. Otherwise, only a stale entry with `preferFreshOnStale` enters the
blocking fetch path; a fresh non-expired entry falls through to the existing fresh return. This is a
condition correction, not a redesign: S1's policy-aware, persistence-complete in-flight ownership,
synchronous background registration, and non-fatal write behavior for owners/joiners must remain
unchanged. The documented 497-line source and `quality:gate` result with no F-1 finding must also
survive; no comment/spacing removal or unrelated file-size work is authorized.

Proof stays entirely in the already-authorized
`packages/sdk/tests/query/query-factory_test.ts`: the published loader composition seeds a fresh
entry and asserts the preserved value/timestamp with upstream calls exactly `0`; its empty-store
phase asserts one fetch and a current `cachedAt`; and two overlapping stale blocking loaders share a
manually blocked fetch, assert exactly one refresh, and observe the same refreshed timestamp. No
change to `packages/sdk/tests/cache/cache-query_test.ts` is authorized by S2-A.

### Published-claim dispositions

The source lines below are the base-head locations; implementation may move them while applying the
specified disposition. “Nearby text” is part of the required edit, not optional explanatory prose.

| Source line | Disposition | Planned wording and reader-visible scoping |
| ----------- | ----------- | ------------------------------------------ |
| Tutorial 13 | Retained | “wraps every procedure in a KV-backed stale-while-revalidate cache” accurately describes the factory's callable policy path. Immediately after the line-15 paragraph, add: “That SWR behavior belongs to the callable procedure action (for example, `await ordersQueries.list(input)`); `getCachedEntry(input)` is a separate KV-only metadata read and never schedules a refresh.” |
| Tutorial 15 | Retained | “refreshes in the background” accurately describes what a stale callable action can do. The new sentence immediately following this paragraph names that action and expressly excludes `getCachedEntry()` from the refresh mechanism. |
| Tutorial 32 | Corrected | Replace “the cache-first `getCachedEntry()`” with “the KV-only `getCachedEntry()` metadata read” so the chapter overview does not frame the later pure-read loader as the factory's SWR policy path. |
| Tutorial 75 | Retained | “last-known answer instantly, then revalidate in the background” accurately states the desired factory policy. Immediately after the factory code block, add: “The callable procedure action owns that stale policy. `getCachedEntry(input)` only inspects the KV value and timestamp; it does not execute the policy.” |
| Tutorial 76 | Retained | “a KV-backed stale-while-revalidate layer” accurately describes `createQueryFactories`. The same post-code sentence separates the callable action from the metadata helper before the helper table and loader guidance. |
| Tutorial 80 | Corrected | Replace the comment with `// Server-side query factories — callable actions use KV-backed stale-while-revalidate.` so it names the policy-bearing path. |
| Tutorial 94 | Corrected | Replace the description with: “Server-side KV metadata read: resolves to `{ data, cachedAt }` from KV, or `null` on a cold cache. It does not evaluate staleness or fetch.” |
| Tutorial 100 | Corrected | Replace the false clause with: “`getCachedEntry` is a pure KV read: on a warm cache it returns `{ data, cachedAt }`; on a cold cache it returns `null`. It does not evaluate staleness or start revalidation; the callable action or page/client policy must do that explicitly.” |
| Tutorial 107 | Corrected | Replace the pure-read-only loader guidance with a policy-aware composition: first `await ordersQueries.list(input, { preferFreshOnStale: true })`, then `await ordersQueries.list.getCachedEntry(input)` for `{ data, cachedAt }`; state that the metadata read alone never fetches or revalidates. |
| Services SDK 138 | Retained | “the SWR primitive a layer loader uses to decide stale-reload” accurately says the loader uses the returned timestamp to decide; it does not assign refresh to the method. The corrected line-188 example provides the nearby action-then-metadata mechanism. |
| Services SDK 188 | Corrected | Replace the pure-read/fallback snippet with the existing callable action in `preferFreshOnStale` mode followed by `getCachedEntry()` metadata retrieval, preserving the planned fail-safe data fallback if persistence leaves no entry. |

**S2 page-level acceptance:** Taken as a whole, chapter 3 identifies the callable procedure action
as the SWR policy path, identifies `getCachedEntry()` as a KV-only metadata read, and demonstrates
the loader composing the action before the metadata read, so it no longer implies that the
demonstrated `getCachedEntry()` loader revalidates.

## Non-Scope

- No `queryEntry()` or other published method; no changes to `CacheProvider`, `ActionMethod`,
  `CompositeQuery`, export maps, or package entrypoints.
- No edit under `docs/site/_site/` and no invented `docs/sdk` replacement.
- No third docs source. The authorized docs set is exactly `docs/site/services-sdk/sdk.md` and
  `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md`; any further same-class claim is
  reported for a ruling rather than silently edited.
- No S2-A edit to `packages/sdk/tests/cache/cache-query_test.ts` or any runtime path other than the
  exact predicate correction in `packages/sdk/src/cache/cache-query.ts`.
- No repair of `check:mcp-export-corpus` (#1668), `surface:diff`, JSR `F-DOCT-5`, or queue flake
  #1667.
- No Aspire, Docker, or `e2e:cli`; they are prohibited leased singletons and are not needed to prove
  an in-memory cache lifecycle plus docs/asset generation.
- No evaluator launch, OpenHands trigger, ready-for-review transition, merge, canary, or release.

## Hidden Scope

- A map entry must represent the full fetch-plus-persist lifecycle. Otherwise a joined blocking
  loader can resolve and read metadata before the winning caller has written the refreshed entry.
- The early unconditional in-flight join must become policy-aware. A second SWR reader should return
  stale data while sharing the one background refresh, not unexpectedly block for fresh data.
- The blocking preference is stale-only. Applying it before the fresh-hit branch without an
  `!isFresh` guard silently converts a fresh hit into an upstream fetch and falsifies the published
  loader regression.
- Both authorized site sources feed the same four checked-in generated files and require all three
  freshness gates on the same content head. The plan-amendment generation run found both pages in
  agent-docs provenance and produced no tracked path outside that declared set.
- `packages/fresh` and `packages/cli` consume the runtime behavior, so root `check` and `test`
  remain merge-readiness gates even though no consumer source is planned.

## Locked Decisions

| ID | Decision                                                                                     | Rationale                                                                                                                                                               |
| -- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1 | Choose issue remedy 1: cache-aware callable action, then metadata read.                      | Existing `ActionMethod` already expresses every accepted stale policy. Blocking mode guarantees refresh before metadata without duplicating execution policy.           |
| D2 | Add no published surface.                                                                    | Acceptance requires behavior, not a new spelling. A new method would duplicate contracts across four public layers and require a scope-boundary ruling.                 |
| D3 | Keep `getCachedEntry()` a pure store read.                                                   | Its name, signature, `deno doc`, and accurate query-bridge docs all promise a read, not hidden fetching.                                                                |
| D4 | Make in-flight ownership cover fetch and persistence, with policy-aware join behavior.       | This simultaneously proves exactly-one execution and ensures a caller that waits for fresh data can immediately observe the matching persisted timestamp.               |
| D5 | Prove concurrency with two overlapping readers and a manually blocked fetcher.               | A sequential or single-reader test cannot establish exactly one refresh.                                                                                                |
| D6 | Preserve PR #1665 fail-safe behavior.                                                        | Cache persistence and telemetry evidence failures must remain non-fatal for data reads, and background failures must remain detached after telemetry records them.      |
| D7 | Touch exactly the two authorized site pages and accept the same four-file generated cascade. | The exact snippet and the independently repeated tutorial clause must agree; generation provenance includes both pages, and generated mirrors are checked-in consumers. |

## Open-Decision Sweep

| Decision                                                          | Status                   | Notes                                                                                                                                                        |
| ----------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Whether to correct the adjacent tutorial's false prose in this PR | Resolved now: authorized | The coordinator widened scope by exactly `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md`; no third docs source is authorized.               |
| Exact commands behind the supplied six-diagnostic doc-lint pin    | Resolved by orchestrator | “Six” is the sum of two separate expected-red invocations, each with exactly three named diagnostics and zero new allowed; validation rows 14a–14b pin both. |
| API remedy (`queryEntry`)                                         | Resolved now: rejected   | Existing callable action plus metadata read satisfies every acceptance item without a parallel public policy surface.                                        |

## Risk Register

| Risk                                                                    | Mitigation                                                                                                                                                                                                                                                        |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registering background work in the map makes a second SWR caller block. | Move join decisions behind cache-state/policy evaluation; stale SWR callers return cached data while reusing the registered refresh. Test both overlapping returns before releasing the refresh.                                                                  |
| A joined foreground caller reads metadata before persistence finishes.  | Store the full fetch-plus-write operation in the map and resolve joiners only after write completion (or the existing fail-safe write handling completes).                                                                                                        |
| Dedupe refactor drops telemetry or PR #1665 fail-safe behavior.         | Keep request-local admission and read-span prologue unchanged; keep captured-parent background write span, error recording, detached failure handling, and non-fatal foreground cache-write behavior. Run focused telemetry/cache tests plus full SDK/root tests. |
| Timing-based tests flake.                                               | Seed explicit old/current timestamps and use controlled promises; no sleep-based concurrency approximation. Bound only the missing-entry timestamp with before/after values.                                                                                      |
| Either docs edit leaves generated mirrors inconsistent.                 | Generate prose → CLI barrel → publish assets, then run all three freshness checks on one unchanged head. Plan-phase execution confirmed both pages are provenance inputs and no undeclared tracked path changed.                                                  |
| New export or slow type slips in.                                       | No public type files planned; compare `deno doc`, run package/root publish dry-run, and hold doc-lint to the observed red no-regression set.                                                                                                                      |
| Root queue flake appears.                                               | Report `expected 1, got 2` as #1667 exactly and do not rerun solely for green.                                                                                                                                                                                    |
| The S2-A predicate correction disturbs accepted S1 lifecycle behavior or reopens F-1. | Change only the condition to `isExpired || (!isFresh && preferFreshOnStale)`; retain expired precedence, all A2/A3 machinery and documentation, and re-run focused/full SDK plus `quality:gate` with the file remaining below the F-1 threshold. |

## Anti-Patterns to Resolve or Avoid

| AP                               | Status                          | Plan                                                                                                                                                                                      |
| -------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AP-9 premature abstraction       | Risk                            | Reuse the current map/policy methods; do not create a second revalidating-entry API or speculative coordinator class.                                                                     |
| AP-10 swallowed runtime failures | Existing intentional boundary   | Preserve PR #1665's explicit fail-safe write policy and telemetry recording; do not broaden catches beyond that owned boundary.                                                           |
| AP-11 hidden globals             | Avoid                           | Tests use one explicitly constructed `CacheQuery`, store, map, and provider lifecycle.                                                                                                    |
| AP-12 direct time                | Existing behavior, no deepening | Do not add runtime clock reads beyond the existing timestamp points; tests inject raw timestamps and bracket observed writes. A clock-port refactor is not required for this focused fix. |
| AP-25 side effects outside edges | Avoid                           | No new external side effect or timer; controlled test promises provide concurrency.                                                                                                       |

## Fitness Gates

| Gate                    | Required                      | Expected evidence                                                                                                            |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| F-1 through F-5         | Yes                           | `quality:gate`, targeted review, no new/exported surface; existing file remains below hard failure threshold.                |
| F-6 JSR publishability  | Yes                           | Package raw dry-run and root `publish:dry-run`; no actual slow-type warning.                                                 |
| F-7 doc score/doc lint  | Yes, pinned red no-regression | Raw full-export `deno doc --lint` remains exit 1 with the reconciled named baseline; never reported green.                   |
| F-8 through F-12        | Yes                           | `quality:gate`, scoped check/lint/fmt, no config/folder/name change.                                                         |
| F-13 runtime invariants | Yes                           | Focused fresh/missing/stale/overlap tests; no long-running handle or cancellation surface is added.                          |
| F-14 through F-19       | Yes                           | `quality:gate`, scoped wrappers, no console/re-export/folder/barrel change.                                                  |
| JSR package audit       | Yes                           | Audit helper output recorded; known `F-DOCT-5` remains unchanged and raw dry-run adjudicates false slow-type banner warning. |

## Arch-Debt Implications

| Entry                           | Action        | Notes                                                                                            |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `packages/sdk` doctrine verdict | None          | Keep verdict and adapter boundaries preserved.                                                   |
| JSR `F-DOCT-5` 13-child finding | None          | Known red, explicitly out of scope and not deepened.                                             |
| New debt                        | None expected | Any new/deepened violation is a PLAN-EVAL/IMPL-EVAL blocker rather than an automatic debt entry. |

## Commit Slices

| #  | Slice                                                              | What it proves                                                                                                                                                                                                                                                                                             | Gates                                                                                                                                                                           | Files                                                                                                                                                                                                                                                                                                                                                                               |
| -- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1 | Make refresh ownership policy-aware and persistence-complete       | Fresh/missing/blocking/SWR behavior is preserved; two overlapping stale SWR readers return stale and issue exactly one refresh; refreshed cache data/timestamp eventually land; PR #1665 fail-safe/telemetry behavior remains.                                                                             | Focused structured SDK cache tests; targeted check/lint/fmt; `quality:gate`                                                                                                     | `packages/sdk/src/cache/cache-query.ts`; `packages/sdk/tests/cache/cache-query_test.ts`; run `worklog.md`/`context-pack.md`                                                                                                                                                                                                                                                         |
| S2 | Publish the truthful loader contract and its executable regression | Corrected action-then-metadata loader makes zero/fetch-once/blocking-stale decisions correctly, overlapping blocking loaders share one refresh and see the refreshed timestamp, both docs pages distinguish policy execution from the pure KV read, the tutorial satisfies the page-level acceptance sentence above, and all four generated mirrors share one content head. | Focused query-factory test; `docs-source-format`; `docs-accuracy`; `check:agent-docs-prose`; `check:assets-barrel`; `check:publish-assets`; scoped/root/publish/JSR merge gates | `packages/sdk/src/cache/cache-query.ts` (S2-A exact predicate correction); `packages/sdk/tests/query/query-factory_test.ts`; `docs/site/services-sdk/sdk.md`; `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md`; `.llm/assets/agent-docs/prose.json.gz`; `.llm/assets/agent-docs/provenance.json`; `packages/cli/src/kernel/assets/agent-docs.generated.ts`; `packages/mcp/src/publish-assets.generated.ts`; run `worklog.md`/`context-pack.md` |

PLAN-EVAL passed before S1. The S2-A semantic correction may not begin until the coordinator's
fresh fixes Tier-A passes this amendment head.

## Validation Plan

| Order | Gate                             | Command or check                                                                                                                                                                                                                                                                             | Expected result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Focused cache behavior           | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/sdk/tests/cache/cache-query_test.ts packages/sdk/tests/query/query-factory_test.ts`                                                                                                     | PASS; deterministic overlapping-reader assertions include call count exactly `1`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 2     | Targeted SDK check               | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/sdk --ext ts,tsx --pretty`                                                                                                                                                                                   | PASS; wrapper supplies `--unstable-kv`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 3     | Targeted SDK lint                | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/sdk --ext ts,tsx --pretty`                                                                                                                                                                                    | PASS.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 4     | Targeted SDK format              | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/sdk --ext ts,tsx --pretty`                                                                                                                                                                                     | PASS without mutating root format.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 5     | Framework quality/doctrine       | `rtk proxy deno task quality:gate`                                                                                                                                                                                                                                                           | PASS or only explicitly named unchanged baseline; no new scanner allowance/cast/ignore.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 6     | Docs source format               | Durable gate runner with `--gate docs-source-format --cwd docs/site`                                                                                                                                                                                                                         | PASS receipt.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 7     | Docs accuracy                    | Durable gate runner with `--gate docs-accuracy`                                                                                                                                                                                                                                              | PASS receipt; source matches callable-action and pure-read contracts, every published-claim disposition is implemented, and chapter 3 satisfies the one-sentence S2 page-level acceptance criterion.                                                                                                                                                                                                                                                                                                                                                              |
| 8     | Generate derived assets          | `deno task gen:agent-docs-prose`; `deno task gen:assets-barrel`; `deno task gen:publish-assets`                                                                                                                                                                                              | Both authorized docs pages are provenance inputs; only the four declared cascade files may change. Any additional path is drift requiring a stop and ruling.                                                                                                                                                                                                                                                                                                                                                                                                    |
| 9     | Agent-docs freshness             | Durable gate runner with `--gate agent-docs-prose`                                                                                                                                                                                                                                           | PASS on the same content head.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 10    | CLI asset barrel freshness       | Durable gate runner with `--gate assets-barrel`                                                                                                                                                                                                                                              | PASS on the same content head.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 11    | MCP publish-assets freshness     | Durable gate runner with `--gate publish-assets`                                                                                                                                                                                                                                             | PASS on the same content head.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 12    | Package JSR audit                | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/sdk --text`                                                                                                                                                                           | Exit 0; known 13-child warning unchanged; raw dry-run adjudicates banner-only slow-type warning.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 13    | Package raw publish dry-run      | `(cd packages/sdk && deno publish --dry-run --allow-dirty)`                                                                                                                                                                                                                                  | PASS, no actual slow-type diagnostics, intended source-only file list.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 14a   | Combined SDK-entrypoint doc lint | From `packages/sdk`: `deno doc --lint ./mod.ts ./src/auto-update/mod.ts ./src/cache/mod.ts ./src/client/mod.ts ./src/collections/mod.ts ./src/desktop/mod.ts ./src/discovery/mod.ts ./src/ports/mod.ts ./src/query-client/mod.ts ./src/query/mod.ts ./src/streams.ts ./src/telemetry/mod.ts` | Expected exit 1 with exactly three diagnostics and no others: `QueryClientPort` → private `QueryClient` (`src/ports/query-client.ts:41:1`); `createNetScriptQueryClient` → private `QueryClient` (`src/query-client/query-client-factory.ts:44:1`); `DurableStreamProducerOptions["instrumentation"]` → private `StreamsInstrumentation` (`packages/plugin-streams-core/src/application/create-durable-stream.ts:41:3`). The third diagnostic is external to the SDK and is not this leaf's regression or repair scope. Never report this invocation as a pass. |
| 14b   | Cache-entrypoint doc lint        | From `packages/sdk`: `deno doc --lint ./src/cache/mod.ts`                                                                                                                                                                                                                                    | Expected exit 1 with exactly three diagnostics and no others, all in `src/cache/kv-cache-store.ts`: `KvCacheStore` → private `CacheStore` (`:48:1`); `KvCacheStore.prototype.get` → private `CacheKey` (`:97:3`); `KvCacheStore.prototype.get` → private `CacheStoreEntry` (`:97:3`). Never report this invocation as a pass.                                                                                                                                                                                                                                   |
| 15    | Root publish dry-run             | Durable gate runner with `--gate publish-dry-run`                                                                                                                                                                                                                                            | PASS except no known-red gate may be silently reclassified.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 16    | Root tests                       | `rtk proxy deno task test`                                                                                                                                                                                                                                                                   | PASS, or report queue #1667 once with exact `expected 1, got 2` and no green-seeking rerun.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 17    | Root check                       | `rtk proxy deno task check`                                                                                                                                                                                                                                                                  | PASS.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 18    | Raw Git/diff review              | Direct Git status/diff against `3e8e146a4...`                                                                                                                                                                                                                                                | Only declared source/test/docs/generated/run paths; no lock/cache churn.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

The plan intentionally does **not** run `check:mcp-export-corpus`, `surface:diff`, Aspire, Docker,
or `e2e:cli`, and will not describe any of them as green.

## Dependencies

- Existing `CacheStore`, `CacheTelemetry`, `ActionMethod`, `QueryParams`, and `MemoryCacheStore`
  contracts only.
- Root docs generation tasks and their checked-in outputs.
- Topic-orchestrator confirmation that a separate PLAN-EVAL session returned `PASS`.

## Deferred Scope

- Any same-class docs claim outside the two authorized source pages. The plan-phase sweep found no
  third false `getCachedEntry()`/revalidation claim; a later discovery is reported, not edited.
- Any one-call `queryEntry()` convenience. Reconsider only with a separate published-surface
  acceptance need and scope ruling.
- Existing SDK folder-cardinality and doc-lint debt.

## Drift Watch

- Any implementation need to touch a provider/port/factory/export file is a published-surface
  expansion and must stop for a ruling.
- S2-A authorizes only the exact fresh-hit predicate correction in `cache-query.ts`; any further
  runtime change, any `cache-query_test.ts` change, or any loss of S1 A2/A3/F-1 evidence must stop
  for a ruling.
- Any docs source outside `docs/site/services-sdk/sdk.md` and
  `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md` is a scope expansion and must be
  reported before edit.
- Any generated path beyond the four declared files must be inspected and recorded before commit.
- Any change to PR #1665 admission, telemetry, or fail-safe semantics is significant drift.
- Any lockfile/cache change is unowned and must not be committed.
