# Worklog — #1562 cache-topology telemetry

## Design

- **Public surface:** `@netscript/telemetry/attributes` adds the canonical `netscript.cache.*`
  constants, finite operation/outcome/tier types, and attribute builder; `@netscript/sdk` adds
  evidence-bearing provider/store report contracts and normalized operation identity. Existing
  query-factory return values remain unchanged.
- **Domain vocabulary:** `CacheOperation` (`read|write|invalidate`), `CacheTier` (`l1|l2|durable`),
  `CacheOutcome` (`hit|miss|stale|error`), normalized `CacheNamespace`, provider descriptor, ordered
  lookup report, write-through/promotion report, invalidation summary, and topology completeness.
- **Ports:** `CacheStore`/`CacheProvider` return bounded operation facts; `CacheQuery` owns all
  tracer calls. A tracer/reporter is injected into the cache composition, with the existing shared
  telemetry facade as default. Providers do not receive a tracer and cannot silently omit an
  emission call.
- **Constants:** span names `cache.read|cache.write|cache.invalidate`; event names
  `cache.lookup|cache.write|cache.promote|cache.invalidate`; provider/tier/outcome constants and
  namespace normalization limits live in the owning domain modules.
- **Commit slices:** S1 telemetry contract; S2 SDK provider evidence contract; S3 mandatory
  `CacheQuery` instrumentation; S4 normalized identity propagation/privacy; S5 live trace proof and
  closeout. Each slice and gate is detailed in `plan-1562.md`.
- **Deferred scope:** key hashes, metrics, built-in multi-tier provider, strict defer-span
  parenting, pre-existing doc debt, and every Fresh defer/builder edit.
- **Contributor path:** add a cache provider by implementing the SDK evidence contract; add or
  rename telemetry vocabulary in the telemetry cache attribute module; change runtime cache
  decisions only in `CacheQuery`; verify every path through the focused topology matrix.

## Plan phase evidence

- `deno doc` inspected SDK cache and telemetry public surfaces before source reads.
- Existing Fresh defer, SDK cache, KV provider, and telemetry helper emission points mapped with
  `path:line` citations in `research-1562.md`.
- SDK and telemetry publish dry-runs exited 0.
- Doc-lint baseline recorded honestly: SDK 3 existing combined private-type refs; telemetry 6
  private-type refs plus 1 missing JSDoc.
- OpenTelemetry 1.43 official convention/registry guidance checked; no standard `cache.*` convention
  exists, so proprietary keys remain under `netscript.*`.

## Phase state

PLAN-EVAL: **PASS** at evaluated plan head `af1cb92cc` via the automatic label-driven lifecycle. The
implementation branch was resynced by the orchestrator to `fc28b397c` before source work began. This
implementation session did not launch an evaluator, sub-agent, Fable, or OpenHands and did not
perform a ready transition, merge, release, or canary action.

## S1 — published cache telemetry vocabulary

- Added `NetScriptAttributeDomains.CACHE` before registering `CacheAttributes` in the convention
  test, satisfying PLAN-EVAL advisory A1 at the first implementation seam.
- Published `CacheAttributes`, `CacheOperations`, `CacheTiers`, `CacheOutcomes`, their finite union
  types, `CacheAttributeOptions`, and `createCacheAttributes` from
  `@netscript/telemetry/attributes`.
- The builder accepts normalized operation identity but has no cache-key/value/input parameter and
  rejects negative or fractional lookup/age/TTL values.
- Documented provider ids, bounded tier/outcome vocabulary, namespace privacy, and the measured
  meaning of `backend_executed` in the telemetry README.

### S1 gate evidence

| Gate                           | Result                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------- |
| telemetry scoped check         | `filesSelected=101`, `failedBatches=0`, no findings                                   |
| telemetry scoped lint          | `filesSelected=101`, exit 0, no findings                                              |
| telemetry scoped format        | `filesSelected=101`, `failedBatches=0`, no findings                                   |
| telemetry package test task    | `54 passed`, `0 failed`                                                               |
| telemetry full-export doc lint | baseline retained: 6 combined private-type refs + 1 missing JSDoc; no new diagnostics |
| telemetry publish dry-run      | exit 0; existing `otel-sdk.ts:201` dynamic-import warning retained                    |
| `quality:gate`                 | exit 0; code scan has no findings and doctrine has no failures                        |

### S1 reconcile

PR #1605 remains draft and issue #1562 remains open. The approved public vocabulary and A1 amendment
are unchanged. Creating the explicitly required `src/attributes/cache.ts` increased that already
over-cap folder from 13 to 14 direct children; D-7 and debt `telemetry-attributes-f16-1562` record
the forced doctrine drift. `deno.lock` is unchanged.

## S2 — evidence-bearing cache provider and store contracts

- Published provider descriptors plus lookup, write, promotion, and invalidation topology report
  types from the SDK root, `./cache`, and `./ports` surfaces.
- `CacheStore.get`, `set`, and `delete` now require non-empty ordered reports and explicit
  `topologyComplete`; `KvCacheStore` reports the selected `@netscript/kv` provider at the durable
  tier, and the test store reports its memory L1 behavior.
- `CacheProvider` now requires a descriptor. `setCacheProvider()` stores a package-owned forwarding
  boundary in the existing registry slot, so `getCacheProvider()` never returns the raw custom
  provider object. No additional module-local mutable registry or singleton was introduced.
- SDK-local topology unions mirror the telemetry literals without re-exporting upstream types. The
  first doc-lint run exposed four new private-type references from direct telemetry type imports;
  replacing those public annotations with explicit SDK literals restored the exact three-diagnostic
  baseline before the slice was committed.
- Documented the pre-1.0 migration and the prohibition on raw keys, inputs, values, URLs, or user
  data in provider descriptors and reports.

### S2 gate evidence

| Gate                     | Result                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| SDK scoped check         | `filesSelected=80`, `failedBatches=0`, no findings                       |
| SDK scoped lint          | `filesSelected=80`, exit 0, no findings                                  |
| SDK scoped format        | `filesSelected=80`, `failedBatches=0`, no findings                       |
| SDK package test task    | `41 passed`, `0 failed`; includes report and registration-boundary tests |
| SDK full-export doc lint | exact baseline retained: 3 combined private-type refs, 0 missing JSDoc   |
| SDK publish dry-run      | exit 0, no warning                                                       |
| `quality:gate`           | exit 0; code scan has no findings and doctrine has no failures           |

### S2 reconcile

The contract remains within approved D3/D7 scope: factories still return raw data, while topology
evidence is internal to the store/`CacheQuery` seam. PR #1605 remains draft and issue #1562 remains
open. No Fresh path was touched, no dependency was added, and `deno.lock` is unchanged.
