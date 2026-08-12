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

## S3 — mandatory logical-operation instrumentation

- `CacheQuery` now owns exactly one INTERNAL span for each logical read, write, or invalidation;
  ordered tier lookups and bounded writes, promotions, and invalidations are span events.
- Loader execution is measured at `queryFn` entry. Fresh/cache-only/provider-error/in-flight-join
  paths remain false; the loader owner, including loader-error and background-revalidation paths,
  becomes true. The losing join trace is separately marked `inflight_joined=true`.
- Stale background completion captures the active read context and uses one bounded `cache.write`
  follow-up span. Prefix invalidation collapses repeated keys to one event per tier.
- The registration wrapper recognizes the package-owned immutable marker. A registered custom
  high-level provider cannot silently bypass the span: its fallback span measures loader entry and
  reports outcome error plus `topology_complete=false` because that interface cannot prove tiers.
- Provider reports are runtime-validated for stable systems, bounded tier/outcome values, ordered
  unique lookup tiers, maximum three tiers, and completeness. Invalid evidence becomes a visible
  incomplete/error path.

### S3 focused evidence

The SDK test task passes 55 tests, including distinct cold miss, warm-fresh hit, warm-stale
background revalidation, provider error, loader error, promotion/write-through, bounded
invalidation, in-flight join, cache-only read, custom-provider boundary, privacy, and same-trace
page/defer-parent topology cases. The real context-propagation test records one cache span beneath
the active `defer.cache.read` test span and preserves trace/parent ids.

SDK scoped check has no findings. Full-export doc lint has only the two pre-existing TanStack
`QueryClient` private-type references and no new cache diagnostics. No Fresh-owned path was touched,
no dependency was added, and `deno.lock` has no Git delta.

## S4 — normalized operation identity propagation

- Generated contract queries always pass the static `${resource}.${action}` identity through read,
  prefetch, cache-only, and action-invalidation paths; a per-call `operationId` cannot override it.
- Composite queries normalize an explicit static default operation id and otherwise use the fixed
  `composite` namespace. Direct `CacheQuery` methods retain fixed fallbacks.
- Namespace normalization lowercases, collapses separators, rejects unbounded syntax by reduction,
  caps output at 80 characters, and never reads the serialized query key or props.
- Public SDK docs now describe the one-span event model, custom-provider incomplete evidence,
  namespace privacy, and the exact measured-loader semantics.

### S4 focused evidence

Query-factory tests assert `orders.list` across query/cache-only/invalidation methods even when a
caller supplies an override, and assert explicit `billing.dashboard` plus fixed `composite`
identities without exposing `private-tenant`. The SDK task passes all 55 tests and scoped check has
no findings. No Fresh-owned path or partial-request behavior changed, and `deno.lock` has no Git
delta.

## S5 — durable/Aspire proof and closeout

- A real `KvCacheStore` run forced the shared provider to `deno-kv` and executed cold then warm
  reads for `runtime.cache-proof`. The loader ran once across two navigations.
- A standalone Aspire Dashboard received the Deno-native OTLP export. Cold trace
  `f08d30e7b9b5b3244a939a6611ca13e0` contains `defer.cache.read` parent
  `41606eb1a5298ae1` and one `cache.read` child `8cdc1bf6d2be463a`; the child reports durable miss,
  `backend_executed=true`, and ordered lookup/write events. Warm trace
  `6fec150fb1a0b10de09ffa0b80afd386` contains parent `4c8d0167b3bb0775` and one cache child
  `80d5fdb806a5f0b9`; the child reports durable hit, age/TTL, one lookup event, and
  `backend_executed=false`.
- Each ordinary read added exactly one cache span. Applied to the issue's 41-span consumer evidence,
  the chosen shape is 42 spans regardless of tier count. The original consumer application was not
  available in this worktree, so its complete 41-span navigation was not replayed.
- The exact standalone dashboard session was stopped, its temporary SQLite/script artifacts were
  removed, and `agentic:leak-check` reported both probes `ok` with `survivors: []`.

### S5 final gate evidence

| Gate                            | Result                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------- |
| SDK+telemetry scoped check      | exit 0; 184 files, 2 batches, 0 findings                                        |
| SDK+telemetry scoped lint       | exit 0; 184 files, 0 findings                                                   |
| SDK+telemetry scoped format     | exit 0; 184 files, 0 findings                                                   |
| SDK package test task           | exit 0; 56 passed, 0 failed                                                     |
| telemetry package test task     | exit 0; 54 passed, 0 failed                                                     |
| `quality:gate`                  | exit 0; quality scan clean, doctrine FAIL=0; repository warning baseline remains |
| SDK publish dry-run             | exit 0                                                                          |
| telemetry publish dry-run       | exit 0; existing dynamic-import warning retained                               |
| SDK full-export doc lint        | 2 existing TanStack `QueryClient` private-type refs; no cache diagnostics       |
| telemetry full-export doc lint  | exit 0                                                                          |

### S5 reconcile

No Fresh-owned path was touched, and partial-request behavior was not conditioned or suppressed.
No dependency or module-local mutable singleton was added; `deno.lock` has no Git delta. PR #1605
remains draft. Separate-session IMPL-EVAL is pending and was not launched by this implementation
session.

## Marker review follow-up

- Kept `cacheTelemetryOwner` as `Symbol()` deliberately. The #1589 closure gate rejects split SDK
  closures; using `Symbol.for()` would make incompatible cross-version closures quietly share the
  ownership marker. In the unsupported split-closure state, duplicate spans are the visible failure
  mode rather than silent interoperability.
- Added a focused regression proving `createProviderBoundary()` delegates a package-owned
  `CacheQuery` without creating a second cache span.
- Verified the live PR body keeps `Separate-session IMPL-EVAL records PASS` unchecked. Its five
  `acceptance-evidence` entries map all five #1562 acceptance bullets by index with concrete
  evidence and contain no placeholder text.

### Marker follow-up gate evidence

| Gate                         | Result                                                        |
| ---------------------------- | ------------------------------------------------------------- |
| SDK+telemetry scoped check   | exit 0; 184 files, 2 batches, 0 findings                      |
| SDK+telemetry scoped lint    | exit 0; 184 files, 0 findings                                 |
| SDK+telemetry scoped format  | exit 0; 184 files, 0 findings                                 |
| SDK package test task        | exit 0; 57 passed, 0 failed, including the ownership test     |
| telemetry package test task  | exit 0; 54 passed, 0 failed                                   |
| `quality:gate`               | exit 0; quality scan clean, doctrine FAIL=0; baseline warnings |

`deno.lock` retained SHA-256
`73be92b116b9065372505157da4f6729176e975aa118e9944746317887e9a4c4` with no Git delta. No evaluator,
Fable, OpenHands, ready transition, merge, E2E, or canary action was launched.
