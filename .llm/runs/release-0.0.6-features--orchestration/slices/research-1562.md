# Research — #1562 cache-topology telemetry beneath deferred page layers

Date: 2026-08-12. Generator: Codex · GPT-5.6 Sol · medium. Branch:
`feat/1562-cache-topology-telemetry`. Baseline: `origin/main@f542f31cb` / working-tree HEAD
`f542f31cbea383f28dd2ea8ebc7ac99697c147a2`. This is a plan-first slice; no source implementation
exists on this branch.

## Re-baseline and published surfaces

The issue evidence is a marked navigation with **41 spans** and a 68 ms trace. The issue is the
source of that observed count; this run did not receive the trace export and did not replay the
consumer application. All code findings below were re-derived from the requested baseline.

`deno doc` was read before implementation source. It establishes two published surfaces:

- `@netscript/sdk/cache` publishes `CacheQuery`, `cacheQuery`, `KvCacheStore`, cache key/entry
  contracts, `CacheProvider`, and registration functions (`packages/sdk/src/cache/mod.ts:17-39`).
  `CacheStore` is also exported from the SDK root (`packages/sdk/mod.ts:60-66`).
- `@netscript/telemetry/attributes` publishes the attribute constants/builders, while
  `@netscript/telemetry/tracer` publishes `Span`, `Tracer`, `withSpan`, `createSpan`, and tracer
  accessors (`packages/telemetry/attributes.ts:1-4`, `packages/telemetry/tracer.ts:1-4`). Any new
  attribute map, finite value set, or tracer name exported there is a stable public contract by
  default under doctrine.

Doctrine classifies both SDK and telemetry as Archetype 2 / **Keep** and explicitly says to preserve
the SDK cache adapter boundary and telemetry adapter subpaths
(`docs/architecture/doctrine/10-codebase-verdict-and-handoff.md:53-55`). The earlier telemetry
port/adapter debt is closed with its public subpaths and doc/publish evidence preserved
(`.llm/harness/debt/arch-debt.md:352-376`). The active large instrumentation-file debt concerns
saga/worker/scheduler compatibility, not cache telemetry (`.llm/harness/debt/arch-debt.md:907-920`).

## Existing emission map

### Fresh deferred UI seam

| Emission point                                                     | What it emits today                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/fresh/src/application/defer/telemetry.ts:29-74`          | `defer.prewarm.dispatch` INTERNAL span, `netscript.operation=defer.prewarm`, HTTP/result attributes, completion event, and normalized error event.                                                                                                                            |
| `packages/fresh/src/application/defer/telemetry.ts:77-112`         | `defer.cache.read` INTERNAL span with `netscript.operation=defer.cache.read`; state is attached to the span and a `defer.cache.read.complete` event.                                                                                                                          |
| `packages/fresh/src/application/defer/DeferPage.tsx:217-254`       | The server page assembles region/action/partial, cached-data and freshness presence, cached time, age, stale threshold/decision, fallback visibility, server revalidation, prewarm policy/scheduling, and partial/prewarm request flags, then queues the defer span emission. |
| `packages/fresh/src/internal/package-telemetry/telemetry.ts:39-62` | `withFreshSpan` obtains a scoped shared tracer, injects `netscript.operation`, and delegates span lifecycle to `@netscript/telemetry/tracer`.                                                                                                                                 |
| `packages/telemetry/src/application/span.ts:32-61`                 | `withSpan` parents from the active context, records OK/ERROR and exceptions, and ends the span.                                                                                                                                                                               |

One request trace therefore contains the request/page/layer/prewarm topology plus the UI defer cache
decision recorded by Fresh. In the issue's evidence it has 41 spans and the listed `defer.*`
attributes. It does **not** contain SDK cache lookup/write/invalidation telemetry: a focused search
found no cache emission in `packages/sdk/src/cache/**` or `packages/sdk/src/query/**`. The existing
`netscript.kv.*` constants are vocabulary only (`packages/telemetry/src/attributes/kv.ts:1-22`);
there is no SDK cache instrumentation consuming them.

The defer span is queued after render-state calculation (`DeferPage.tsx:217-254`). The backing SDK
query can therefore execute before that defer span exists. Without a Fresh-side sequencing change,
an SDK cache span can share the active request/page trace but cannot honestly be promised as a child
of `defer.cache.read`. The slice boundary forbids changing that subtree; strict defer-parentage must
be a sequenced Fresh dependency.

### SDK cache and provider seam

| Existing point                                          | Current behavior and observability gap                                                                                                                                                         |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/sdk/src/query/query-factory.ts:41-85`         | A contract resource/action becomes a query key; `queryFn` invokes the typed service client. The operation identity is known here, but the third key segment serializes input.                  |
| `packages/sdk/src/ports/query-key.ts:18-40`             | The canonical key is `[resource, action, JSON.stringify(input)]`. Emitting it would leak user data and create unbounded cardinality.                                                           |
| `packages/sdk/src/cache/cache-provider.ts:20-35,37-84`  | `CacheProvider` is the public query-layer port; a module-scoped registry accepts any implementation. Its methods return values only, with no topology report.                                  |
| `packages/sdk/src/cache/cache-query.ts:54-101`          | `CacheQuery.query` owns the decisive orchestration: in-flight join, store lookup, fresh/stale/expired decision, background revalidation, or loader fallback. None is emitted.                  |
| `packages/sdk/src/cache/cache-query.ts:127-173`         | The loader invocation is explicit at `:133` (blocking) and `:161` (background); writes occur at `:143` and `:167`. This is the only seam that can determine loader execution without guessing. |
| `packages/sdk/src/cache/cache-query.ts:175-198,213-253` | Single/prefix invalidation, cache-only reads, and direct writes are separate public paths, all uninstrumented.                                                                                 |
| `packages/sdk/src/cache/kv-cache-store.ts:42-118`       | The production store lazily resolves one shared `WatchableKv` and delegates get/set/delete/list. It erases provider identity and outcome metadata when returning to `CacheQuery`.              |
| `packages/kv/application/shared.ts:117-164,212-250`     | `@netscript/kv` selects exactly one active provider (`redis` or `deno-kv`) and exposes its identity. It is provider selection, not an L1→L2 lookup chain.                                      |

The built-in production topology today is consequently a **single durable lookup** through the
selected KV provider. There is no built-in L1/L2 composite cache, write-through, or promotion path
to discover. A future/custom store may implement tiers internally, but the current `CacheStore`
result contains only `{ value }` (`packages/sdk/src/ports/cache-store.ts:25-34,46-80`), so
`CacheQuery` cannot observe that internal chain.

## Contract evaluation

### Standard versus proprietary names

OpenTelemetry semantic conventions 1.43 list database and object-store domains but no cache semantic
convention, and the official attribute registry has no `cache.*` entry. The proposal's bare
`cache.*` names are therefore proprietary, not standard. Existing NetScript TC-6 requires
proprietary keys below `netscript.*`, TC-4 prefers lifecycle events over extra local spans, and TC-8
requires redaction/hashing (`packages/telemetry/src/domain/telemetry-convention.ts:58-90`). The
coherent extension is `netscript.cache.*`, alongside existing `netscript.kv.*`, while retaining
`netscript.operation` as the cross-domain operation selector.

Primary references consulted:

- OpenTelemetry semantic conventions 1.43: <https://opentelemetry.io/docs/specs/semconv/>
- OpenTelemetry attribute registry:
  <https://opentelemetry.io/docs/specs/semconv/registry/attributes/>
- OpenTelemetry convention authoring guidance (reuse registered keys and avoid unbounded values):
  <https://opentelemetry.io/docs/specs/semconv/how-to-write-conventions/>

### Span cardinality

A span per tier would turn the observed 41-span navigation into 43 spans for a two-tier lookup and
44 for three tiers, before counting writes/promotions. That multiplication occurs on every
cache-aware query. One logical operation span plus ordered per-tier events makes a one-query normal
navigation **42 spans**, regardless of one, two, or three lookup tiers. A stale background refresh
may require one bounded follow-up write/revalidation span when completion outlives the read, making
that path 43; it must not create one span per tier.

### Cardinality and privacy

- Namespace must come from framework-known contract metadata (`resource.action`) or an explicit
  normalized composite operation id, never from the raw `QueryKey`.
- Normalization is lowercase ASCII `[a-z0-9._-]`, repeated separators collapsed, and a documented
  maximum length. Missing direct-query identity uses a fixed `direct` namespace.
- Raw keys, serialized input, values, URLs, and user data are forbidden from attributes and events.
- A key hash is **not** in the initial contract. An unkeyed hash is dictionary-attackable and still
  has per-entry cardinality; a keyed/HMAC correlation feature would require secret lifecycle,
  rotation, opt-in, and an explicit telemetry-budget review. It is safe to defer.

### Honest backend execution

`netscript.cache.backend_executed` can be established only by wrapping the `queryFn` that
`CacheQuery` actually calls at `cache-query.ts:133,161`. It starts `false` and becomes `true` on
entry to that wrapper, before awaiting the backing service/DB promise. Thus loader success and
loader error both report `true`; a provider/store error before loader invocation reports `false`. An
in-flight join reports `false` for the joining trace plus a separate bounded
`netscript.cache.inflight_joined=true`, because that request did not start the backing call.

The store seam alone cannot infer this value. Provider result, hit/miss, or elapsed time are not
proxies and must never be used to guess it.

## Existing tests and available test seam

- Cache behavior tests already cover stale background revalidation, blocking stale refresh, and
  in-flight dedupe (`packages/sdk/tests/cache/cache-query_test.ts:5-70`).
- `MemoryCacheStore` is the injected `CacheStore` test seam
  (`packages/sdk/tests/test-helpers.ts:7-47`).
- `@netscript/telemetry/testing` records span attributes, ordered events, errors, links, and ended
  state without a live exporter
  (`packages/telemetry/src/testing/in-memory-span-recorder.ts:27-59,170-273`).
- The telemetry convention test rejects exported proprietary keys outside a registered `netscript.*`
  domain (`packages/telemetry/tests/attributes/helpers_test.ts:179-205`).

## JSR/publishability baseline

Commands were run read-only against the baseline:

| Check                                                   | Result                                                                                             |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `deno task --cwd packages/sdk publish:dry-run`          | exit 0; clean dry run.                                                                             |
| `deno task --cwd packages/telemetry publish:dry-run`    | exit 0; existing unanalyzable dynamic-import warning at `src/adapters/otel/otel-sdk.ts:201`.       |
| `deno task doc:lint --root packages/sdk --pretty`       | wrapper exit 0 but reports 3 existing combined `private-type-ref` diagnostics; 0 missing JSDoc.    |
| `deno task doc:lint --root packages/telemetry --pretty` | wrapper exit 0 but reports 6 existing combined `private-type-ref` diagnostics and 1 missing JSDoc. |

The implementation must introduce no new doc diagnostics, must explicitly type every new public
declaration for isolated declarations, and must compare diagnostics to this baseline rather than
claiming either full export map is currently clean.

## Explicitly unverified

- The consumer's 41-span trace export, its parent ids, and its exact backend calls were not
  available locally; the issue evidence was not independently replayed.
- No production L1/L2 provider exists on this baseline. Multi-tier/write-through/promotion support
  can be contract- and fake-provider-tested, but an Aspire example can demonstrate only the actual
  selected durable provider unless a separate provider is supplied.
- Whether an async background refresh retains the desired OpenTelemetry parent after the caller has
  returned needs an implementation test with a context-propagating provider; the in-memory recorder
  deliberately does not propagate parent context.
- Strict parentage under `defer.cache.read` is not achievable from SDK-only code because Fresh emits
  that span after the cache work. This is a dependency, not permission to modify the owned Fresh
  subtree.
