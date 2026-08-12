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

PLAN-EVAL: **required, pending, orchestrator-owned**. No implementation, evaluator dispatch,
sub-agent, OpenHands trigger, ready transition, merge, or release action was performed.
