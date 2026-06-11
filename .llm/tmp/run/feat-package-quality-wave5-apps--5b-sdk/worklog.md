# Worklog — Sub-wave 5b: `@netscript/sdk`

## Bootstrap

- Forked `feat/package-quality-wave5-apps-5b-sdk` from umbrella tip `19cae06`
  (includes 5a merge, PR #25, + umbrella drift commit with the architecture mandate).
- Worktree `.worktrees/wave5-apps-5b-sdk`; run dir created.

## Measure-first

- `.llm/temp/measure-5b-sdk.ts` (raw deno, per-entrypoint + combined + barrel doc-lint,
  dry-run, LOC inventory) → `measure-5b.json`. check PASS; combined doc-lint 29
  (9 ptr / 2 ret / 18 jsdoc; barrel-only 20 confirms combined rule); dry-run 2 slow
  types + 37 excluded-module (root exclude, predicted by 5a drift D-2); 0 tests;
  3,117 LOC; 1 over-cap (discovery 643L).

## Research

See `research.md`. Highlights: 7/9 ptr live in `plugin-streams-core` (unexported
package-owned types surfaced via sdk `./streams` facade); 2 ptr = tanstack
`QueryClient`; the 2 slow types are the TanStack bridges (`createServiceQueryUtils`
any-bridged, `createQueryCollection`). The `interfaces/` layer is the in-house gold
standard for inference-only typing (ContractLike algebra) but the folder name is
F-11-forbidden and the declared `ServiceTransport` seam is unused by the client impl.
RFC 14 §3: transport is injected wiring, call sites identical — protect seam only.
RFC 17 §2: sdk = single entry point; query-client/collections subpaths mandated.
Consumer census: 5 of 12 subpaths have zero in-tree consumers.

## Design

**Layer map (architecture mandate):** L0 `src/ports/` (ContractLike algebra,
CacheStore, ServiceTransport/ClientLinkFactory, QueryClientPort, QueryKey) →
L1 primitives (CacheQuery SWR engine, KvCacheStore, discovery, otel) → L2 factories
(createServiceClient, createQueryFactory/ies, createServiceQueryUtils,
createQueryCollection, createNetScriptQueryClient) → L3 preset (`defineServices()`).
Composability contract: each layer implemented only via the layer below; ports
structural + upstream-free; one-liner outputs ARE the L2 values (no-cliff escape
hatch); seams reusable cross-package.

**Public surface (after 5b):** subpaths 12→10 (`./adapters`→`./cache`,
`./openapi`→root; `./interfaces`→`./ports`). New public types: `ServiceQueryUtils<T>`,
`QueryClientPort`, `QueryCollection<TItem>`; new preset `defineServices`. Everything
else keeps names; `ServiceClient`/`QueryFactory` typing unchanged.

**Domain vocabulary:** contract, service client, query factory, action method,
query utils (TanStack bridge), collection, cache store / cached entry / SWR policy
(staleTime/cacheTime/revalidateOnStale/preferFreshOnStale), discovery, transport,
ports, preset.

**Ports/seams:** ClientLinkFactory (internal; http adapter today, in-process adapter
reserved for RFC 14); ServiceTransport exported + documented; CacheStore (KV adapter
today); QueryClientPort (tanstack boundary); ContractLike (cross-package — fresh
consumes it via `./ports`).

**Constants:** SWR defaults (30s/300s) currently duplicated in query-factory and
query-client-factory and CacheQuery — centralize as named constants in one place
during D-1/D-11.

**Commit slices:** 19 (plan §5); slice 2 transient rename; slice 5 cross-package
(plugin-streams-core); slices 7–8 the typing long pole; slice 19 root-exclude lift.

**Deferred scope:** plan §9. **Contributor path:** README quickstart
(`defineServices`) → per-subpath recipes → docs/architecture layer map → type
fixtures as living examples.

## Hand-off

Artifacts ready for PLAN-EVAL (separate session): research.md, plan.md (PROPOSED),
drift.md, context-pack.md, measure-5b.json. No implementation performed.

## Implementation

### First duties — PLAN-EVAL lock materialized

| Field | Evidence |
| --- | --- |
| Commit | `13dca51` — `Lock sdk plan after PLAN-EVAL pass` |
| Changed | `plan.md` status now records LOCKED / PLAN-EVAL PASS; `plan-eval-summary.md` materializes the PASS verdict, locked `defineServices` naming decision, and advisories B1-B4; `drift.md` records the one-time exception that the PR comment is the verdict source because the evaluator committed no `plan-eval.md`. |
| Gate | Raw git verification: local `HEAD` and `git ls-remote origin refs/heads/feat/package-quality-wave5-apps-5b-sdk` both resolved to `13dca519586c67d6a26235395577cba3dc27830f` after push. |
| Drift | D-5 |

### Slice 1/19 — D-12 package task block

| Field | Evidence |
| --- | --- |
| Commit | `ef6a6bd` — `Add sdk package tasks for quality gates` |
| Changed | `packages/sdk/deno.json` now declares package-local `check`, `test`, `lint`, `fmt`, and `publish:dry-run` tasks while preserving the locked exports/imports/publish map for later slices. |
| Gate | Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with the known pre-slice-19 root-exclude warning `No matching files found`. Raw `Deno.Command`: `deno fmt --check --no-config --ext json packages/sdk/deno.json` PASS exit 0 after scoped formatting of that one metadata file. |
| Concept of done | Metadata-only slice; no source files created. The package now exposes the local quality commands later slices and final validation will use. |
| Drift | none |

### Slice 2/19 — D-1 move implementation under `src/`

| Field | Evidence |
| --- | --- |
| Commit | `0cbd962` — `Move sdk implementation under src facades` |
| Changed | Moved implementation files under `packages/sdk/src/` while keeping existing public subpath entry files as thin facades. `core/` was dissolved into real areas: cache engine/provider/KV adapter under `src/cache/`, and client proxy/composite/query factory under `src/query/`. Client, collections, discovery, interfaces, openapi, query-client, and telemetry internals moved to matching `src/<area>/` folders. |
| Gate | Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with the known pre-slice-19 root-exclude warning `No matching files found`. Stale-path scan over sdk TypeScript found no references to removed implementation locations such as `../core`, `../adapters/kv-cache-store`, old query-client sibling files, or old discovery/openapi/telemetry implementation files. A no-config probe reached the moved files and reported only expected import-map/workspace strictness failures, not missing moved paths. |
| Concept of done | Every moved implementation file remains reachable from an existing public subpath facade or the root barrel. No speculative folders were added; each `src/` folder corresponds to a locked area, and the F-11 `interfaces` rename is intentionally deferred to slice 3. |
| Drift | none |

### Slice 3/19 — D-2 rename `interfaces` to `ports`

| Field | Evidence |
| --- | --- |
| Commit | `998c4d6` — `Rename sdk interface surface to ports` |
| Changed | Renamed `packages/sdk/src/interfaces/` to `src/ports/`; renamed public subpath facade `packages/sdk/interfaces/mod.ts` to `packages/sdk/ports/mod.ts`; updated `packages/sdk/deno.json` export/task entry from `./interfaces` to `./ports`; updated root `mod.ts`, sdk facades, and internal imports to use `ports`; fixed the Fresh consumer at `packages/fresh/builders/define-page/types.ts` to import `@netscript/sdk/ports`. |
| Gate | Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. Raw `Deno.Command`: `deno task check` from `packages/fresh` PASS exit 0 with known root-exclude warning. Rename scan over packages/plugins/services found no remaining `@netscript/sdk/interfaces`, `src/interfaces`, `./interfaces`, or `../interfaces` references. |
| Concept of done | The package-owned structural port algebra is preserved unchanged; only its doctrine vocabulary and public subpath changed. The single known Fresh consumer was updated in-slice, and no compatibility shim for the alpha `./interfaces` path was left behind. |
| Drift | none |

### Slice 4/19 — D-3 fold `./adapters` and `./openapi`

| Field | Evidence |
| --- | --- |
| Commit | `8759d99` — `Fold sdk adapters and openapi subpaths` |
| Changed | Removed `packages/sdk/adapters/mod.ts` and `packages/sdk/openapi/mod.ts`; removed `./adapters` and `./openapi` from `packages/sdk/deno.json` exports and package check task; exported `KvCacheStore` from `@netscript/sdk/cache`; exported OpenAPI helpers from the root barrel; updated sdk README/example references from removed subpaths to `@netscript/sdk/cache` or root. |
| Gate | Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. SDK-only removed-subpath scan found no remaining `@netscript/sdk/adapters`, `@netscript/sdk/openapi`, `sdk/adapters`, `sdk/openapi`, `./adapters/mod.ts`, or `./openapi/mod.ts` references. |
| Advisory | B1 completed: `research.md` now says the plugin-streams-core types are "not exported from the declaring module's public chain" instead of "unexported." |
| Concept of done | The folded symbols remain reachable from public surfaces (`KvCacheStore` via `./cache`; OpenAPI helpers via root). The removed facade files no longer exist only to preserve folder shape, and subpath cardinality is now 10. |
| Drift | none |

### Slice 5/19 — D-4 stream type export chain

| Field | Evidence |
| --- | --- |
| Commit | `549326c` — `Export stream producer types for sdk docs` |
| Changed | Added pure type re-exports for `StateSchema`/`StreamStateDefinition` from `packages/plugin-streams-core/src/application/create-durable-stream.ts` and `src/builders/define-stream-schema.ts`, plus `StreamProducerPort` from the producer declaring module. Updated `packages/sdk/streams.ts` to `export type * from '@netscript/plugin-streams-core'` while preserving the existing selected value exports and `createStreamProducer` alias. |
| Gate | Raw `Deno.Command`: `deno task check` from `packages/plugin-streams-core` PASS exit 0. Raw `Deno.Command`: `deno task check` from `plugins/streams` PASS exit 0. Raw `Deno.Command`: `deno doc --lint packages/plugin-streams-core/mod.ts` PASS, checked 1 file. Raw `Deno.Command`: `deno doc --lint packages/sdk/streams.ts` PASS, checked 1 file. |
| Concept of done | Wave-4 package behavior and signatures are unchanged; only type exports were added. The sdk stream facade now exposes the full referenced type chain, clearing the private-type-ref path without re-exporting third-party upstream packages. |
| Drift | none |

### Slice 6/19 — D-5 `QueryClientPort`

| Field | Evidence |
| --- | --- |
| Commit | `9585851` — `Add sdk query client structural port` |
| Changed | Added `packages/sdk/src/ports/query-client.ts` with `QueryClientPort`, filters, fetch options, set options, and predicate types. Exported the port through `./ports`, `./query-client`, and root. Changed `createNetScriptQueryClient()` to return `QueryClientPort`. Changed `QueryCollectionOptions.queryClient` to `QueryClientPort` and kept the upstream `QueryClient` cast internal at the TanStack DB boundary with a why-comment. |
| Gate | Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. Focused query-client/collections doc-lint probe no longer reports the `QueryClient` private-type-ref; it still reports known later-slice missing-jsdoc and missing-return-type findings already tracked for slices 9 and 13. Static scan shows upstream `QueryClient` only in internal imports/casts, not public signatures. |
| Advisory | B4 completed for current width: each `QueryClientPort` member has a JSDoc line naming the sdk/Fresh/TanStack DB consumer that drives it. |
| Concept of done | The public sdk surface no longer exposes TanStack's `QueryClient` type. The port is package-owned, structural, upstream-type-free, and narrow enough to document the maintenance width. |
| Drift | none |

### Slice 7/19 — D-6a `ServiceQueryUtils<TContract>` mapped type

| Field | Evidence |
| --- | --- |
| Commit | `82abaa6` — `Add sdk service query utils type mirror` |
| Changed | Added `packages/sdk/src/ports/service-query-utils.ts`, a package-owned structural mirror for oRPC/TanStack query utilities derived from the existing `ContractLike` algebra. Exported `ServiceQueryUtils<TContract>` and named option/result aliases through `./ports`, `./query-client`, and root. Added compile-only fixtures for sdk contract inference and upstream `createTanstackQueryUtils()` return assignability. Runtime `createServiceQueryUtils()` is unchanged until slice 8. |
| Gate | Raw `Deno.Command`: `deno check --no-config --unstable-kv ./packages/sdk/tests/type-fixtures/service-query-utils-contract_type.ts ./packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` PASS exit 0. Raw `Deno.Command`: `deno lint --no-config ./packages/sdk/src/ports/service-query-utils.ts ./packages/sdk/tests/type-fixtures/service-query-utils-contract_type.ts ./packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` PASS exit 0. Raw `Deno.Command`: `deno fmt --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-format-sdk.json --check <slice-7 files>` PASS exit 0. Raw `Deno.Command`: `deno doc --lint ./packages/sdk/src/ports/service-client.ts ./packages/sdk/src/ports/service-query-utils.ts` PASS, checked 2 files. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. |
| Gate notes | Direct `ports` / `query-client` barrel doc-lint still reports known pre-existing later-slice findings in `src/query-client/types.ts`, `kv-cache-persister.ts`, and the slice-8 return annotation on `createServiceQueryUtils()`; the new port passes with its contract-algebra source. |
| Concept of done | The type layer is reachable from public surfaces and fixtures. The mirror is structural and upstream-type-free, and the dual fixture proves that the current upstream utility result is assignable to the sdk type while preserving contract-derived input/output inference. |
| Drift | none |

### Slice 8/19 — D-6b typed `createServiceQueryUtils()`

| Field | Evidence |
| --- | --- |
| Commit | `b0eca88` — `Type sdk service query utils factory` |
| Changed | Changed `createServiceQueryUtils()` to accept `ServiceClient<TContract>` and return `ServiceQueryUtils<TContract>`. Removed the public `any` bridge and kept one documented upstream-boundary return assertion via an `unknown` intermediate. Added a compile-time `ServiceClientContract<TContract>` marker and `ServiceClientShape<TContract>` so `TContract` infers from `createServiceClient()` output without user annotations. Added `service-query-utils-factory_type.ts` to prove factory inference. |
| Gate | Raw `Deno.Command`: `deno check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --unstable-kv ./packages/sdk/src/query-client/create-service-query-utils.ts ./packages/sdk/tests/type-fixtures/service-query-utils-factory_type.ts ./packages/sdk/tests/type-fixtures/service-query-utils-contract_type.ts ./packages/sdk/tests/type-fixtures/service-query-utils-upstream_type.ts` PASS exit 0. Raw `Deno.Command`: `deno lint --no-config ./packages/sdk/src/query-client/create-service-query-utils.ts ./packages/sdk/src/ports/service-client.ts ./packages/sdk/tests/type-fixtures/service-query-utils-factory_type.ts` PASS exit 0. Raw `Deno.Command`: `deno fmt --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-format-sdk.json --check <slice-8 files>` PASS exit 0. Raw `Deno.Command`: `deno doc --lint ./packages/sdk/src/ports/service-client.ts ./packages/sdk/src/ports/service-query-utils.ts ./packages/sdk/src/query-client/create-service-query-utils.ts` PASS, checked 3 files. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. |
| Lock hygiene | The run-local check config created `.llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno.lock` containing only the npm resolution for `@orpc/tanstack-query`/`@orpc/client` used by the slice gate. It is kept with run evidence rather than deleted. |
| Concept of done | The public factory now composes from the lower L0 client port and returns the L0 query-utils mirror with full contract inference. The only assertion is an internal upstream-boundary cast with a why-comment; no user-facing `any` remains. |
| Drift | none |

### Slice 9/19 — D-7 `QueryCollection<TItem>` return port

| Field | Evidence |
| --- | --- |
| Commit | `830affb` — `Expose sdk query collection port` |
| Changed | Added package-owned structural `QueryCollection<TItem>` plus named transaction/update/status aliases in `src/collections/create-query-collection.ts`. Annotated `createQueryCollection()` to return that port and exported the port through `@netscript/sdk/collections` and root barrel transitively. Relaxed item constraint from `Record<string, unknown>` to `object` to match normal interface-shaped items. Added `query-collection_type.ts` fixture proving item inference and common read/write methods. |
| Gate | Raw `Deno.Command`: `deno check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --unstable-kv ./packages/sdk/src/collections/create-query-collection.ts ./packages/sdk/tests/type-fixtures/query-collection_type.ts` PASS exit 0. Raw `Deno.Command`: `deno lint --no-config ./packages/sdk/src/collections/create-query-collection.ts ./packages/sdk/tests/type-fixtures/query-collection_type.ts` PASS exit 0. Raw `Deno.Command`: `deno fmt --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-format-sdk.json --check <slice-9 files>` PASS exit 0. Raw `Deno.Command`: `deno doc --lint ./packages/sdk/src/ports/query-client.ts ./packages/sdk/src/collections/create-query-collection.ts` PASS, checked 2 files. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. |
| Lock hygiene | The run-local check config and lock were expanded for TanStack DB/query-db-collection resolution used by the focused slice gate; the repository root lock was not touched. |
| Concept of done | The collection factory no longer exposes an inferred upstream TanStack DB `Collection` type. The return port is structural, package-owned, and includes common read/preload/mutation operations without leaking upstream transaction or virtual-prop helper types. |
| Drift | none |

### Slice 10/19 — D-8 internal `ClientLinkFactory` transport seam

| Field | Evidence |
| --- | --- |
| Commit | `112e4a2` — `Extract sdk HTTP client link seam` |
| Changed | Added internal `ClientLinkFactory`/`ClientLinkPort` structural seam in `src/ports/client-link-factory.ts`. Moved the existing HTTP `RPCLink` construction, discovery URL resolution, trace header propagation, retry plugin, dedupe plugin, and fetch bridge into `src/client/http-client-link.ts`. `createServiceClient()` now composes the HTTP link via `createHttpClientLink()` and keeps the public options unchanged. No in-process transport or public transport option was added. |
| Gate | Raw `Deno.Command`: `deno check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --unstable-kv ./packages/sdk/src/ports/client-link-factory.ts ./packages/sdk/src/client/http-client-link.ts ./packages/sdk/src/client/service-client.ts` PASS exit 0. Raw `Deno.Command`: `deno lint --no-config ./packages/sdk/src/ports/client-link-factory.ts ./packages/sdk/src/client/http-client-link.ts ./packages/sdk/src/client/service-client.ts .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/telemetry-context-stub.ts` PASS exit 0. Raw `Deno.Command`: `deno fmt --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-format-sdk.json --check <slice-10 files>` PASS exit 0. Raw `Deno.Command`: `deno doc --lint ./packages/sdk/src/ports/client-link-factory.ts ./packages/sdk/src/client/http-client-link.ts ./packages/sdk/src/client/service-client.ts ./packages/sdk/src/ports/service-client.ts` PASS, checked 4 files. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. |
| Lock hygiene | The run-local check config/lock were expanded for oRPC client/fetch/plugins/standard/contract resolution and a local telemetry-context stub used only by the focused gate. Root `deno.lock` was not touched. |
| Concept of done | Transport construction is now behind an internal package-owned seam and `createServiceClient()` composes only that lower-level factory. The HTTP behavior remains the only implementation; RFC 14 unified/in-process mode remains unimplemented as required. |
| Drift | none |

### Slice 11/19 — D-9 `defineServices()` composition preset

| Field | Evidence |
| --- | --- |
| Commit | `a18ee60` — `Add sdk defineServices composition preset` |
| Changed | Added `src/presets/define-services.ts` and exported `defineServices()` plus named result/config types from the root barrel. The preset composes only existing L2 factories: `createServiceClient()`, `createQueryFactory()`, and `createServiceQueryUtils()`. Added `define-services_type.ts` proving inference from the service-map contracts to `ServiceClient<TContract>`, `QueryFactory<TContract>`, and `ServiceQueryUtils<TContract>`. Pulled forward member JSDoc on `src/query-client/types.ts` that the new public result chain reaches during doc-lint. |
| Gate | Raw `Deno.Command`: `deno check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --unstable-kv packages/sdk/src/presets/define-services.ts packages/sdk/tests/type-fixtures/define-services_type.ts` PASS exit 0. Raw `Deno.Command`: `deno lint --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json packages/sdk/src/presets/define-services.ts packages/sdk/tests/type-fixtures/define-services_type.ts packages/sdk/src/query-client/types.ts` PASS exit 0. Raw `Deno.Command`: `deno fmt --check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-format-sdk.json packages/sdk/src/presets/define-services.ts packages/sdk/tests/type-fixtures/define-services_type.ts packages/sdk/src/query-client/types.ts packages/sdk/mod.ts .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-doc-import-map.json` PASS exit 0. Raw `Deno.Command`: `deno doc --lint --import-map .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-doc-import-map.json packages/sdk/src/presets/define-services.ts packages/sdk/src/ports/service-client.ts packages/sdk/src/ports/query-factory.ts packages/sdk/src/ports/query-options.ts packages/sdk/src/ports/service-query-utils.ts packages/sdk/src/ports/cache-entry.ts packages/sdk/src/query-client/types.ts` PASS, checked 7 files. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. |
| Lock hygiene | Added run-local `deno-doc-import-map.json` because `deno doc` accepts an import map but not the focused check config containing compiler options. Root `deno.lock` was not touched. |
| Concept of done | The L3 one-liner has no separate runtime path: every value it returns is a lower-layer value, so dropping to L2 does not require rewiring. The function has one internal mapped-result assertion because `Object.entries()` loses literal key/contract correlation; the assertion is documented at the cast site. |
| Drift | none |

### Slice 12/19 — D-10 split discovery lookup modules

| Field | Evidence |
| --- | --- |
| Commit | `4fccdd8` — `Split sdk discovery lookup modules` |
| Changed | Split the former 643-line `src/discovery/service-discovery.ts` into `browser-env.ts` (browser/VITE key construction and lookup), `service-url.ts` (server env resolver, service info/list/availability), `kv-connection.ts` (KV/Postgres/MSSQL/MySQL connection helpers), and `mod.ts`. `service-discovery.ts` remains a 7-line compatibility barrel and public `discovery/mod.ts` now exports from the new implementation barrel. Added `tests/discovery/env-ordering_test.ts` with three parity tests for full browser key -> shorthand -> server env fallback. |
| Gate | Raw `Deno.Command`: `deno check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --unstable-kv packages/sdk/src/discovery/mod.ts packages/sdk/discovery/mod.ts packages/sdk/tests/discovery/env-ordering_test.ts` PASS exit 0. Raw `Deno.Command`: `deno test --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --allow-env packages/sdk/tests/discovery/env-ordering_test.ts` PASS exit 0, 3 passed / 0 failed. Raw `Deno.Command`: `deno lint --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json <slice-12 files>` PASS exit 0. Raw `Deno.Command`: `deno fmt --check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-format-sdk.json <slice-12 files>` PASS exit 0. Raw `Deno.Command`: `deno doc --lint --import-map .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-doc-import-map.json <slice-12 discovery files>` PASS, checked 6 files. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. |
| Size check | `browser-env.ts` 70L; `service-url.ts` 196L; `kv-connection.ts` 285L; `mod.ts` 37L; `service-discovery.ts` 7L. The prior 643L over-cap file is gone. |
| Concept of done | Discovery behavior remains reachable from `@netscript/sdk/discovery`; each new file has one extension pattern and the browser/server env ordering risk is covered by tests before the final root-exclude lift. |
| Drift | none |

### Slice 13/19 — D-11 JSDoc sweep and cache state decision

| Field | Evidence |
| --- | --- |
| Commit | `4443e5f` — `Document sdk cache state boundaries` |
| Changed | Added member JSDoc for `CacheProvider` and `KvCachePersisterStorage`, completing the remaining doc-lint JSDoc chain after slice 11's pulled-forward query-client type comments. Added `src/cache/defaults.ts` as the single named constants home for SDK query stale/cache timing and rewired `CacheQuery`, query factories, composite queries, query-client defaults, and KV persister TTL to consume it. Moved `inflightRequests` from module-global state into `CacheQuery` instance state with an optional constructor-injected map default. |
| Gate | Raw `Deno.Command`: `deno check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --unstable-kv packages/sdk/src/cache/defaults.ts packages/sdk/src/cache/cache-query.ts packages/sdk/src/cache/cache-provider.ts packages/sdk/src/query/query-factory.ts packages/sdk/src/query/composite-query.ts packages/sdk/src/query-client/query-client-factory.ts packages/sdk/src/query-client/kv-cache-persister.ts` PASS exit 0. Raw `Deno.Command`: `deno lint --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json <slice-13 files>` PASS exit 0. Raw `Deno.Command`: `deno fmt --check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-format-sdk.json <slice-13 files>` PASS exit 0. Raw `Deno.Command`: `deno doc --lint --import-map .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-doc-import-map.json <slice-13 files + referenced ports>` PASS, checked 15 files. Wrapper read: `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/sdk --pretty` exit 0; combined missingJSDoc 0, combined privateTypeRef 0, combinedOther 0 for the current entrypoint set. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. |
| Decision | `inflightRequests` is instance state, not process-global. Default construction still gives the shared exported `cacheQuery` one dedupe map, while tests and alternate engines can inject an isolated map without cross-instance leakage. |
| Advisory | B3 complete: runtime SWR/cache timing defaults now resolve through `src/cache/defaults.ts`; remaining `30_000`/`300_000` matches are docs or the constants home. |
| Concept of done | The touched public interfaces have one-line member docs, cache state is explicit at the `CacheQuery` boundary, and a contributor can extend timing defaults by editing one constants file. |
| Drift | none |

### Slice 14/19 — root and subpath module docs

| Field | Evidence |
| --- | --- |
| Commit | `4938c64` — `Document sdk module entrypoints` |
| Changed | Expanded root `packages/sdk/mod.ts` module docs to describe the root barrel, L3 `defineServices()` path, focused subpaths, server-only cache warning, discovery isolation, and port ownership. Refreshed module docs for `cache`, `client`, `collections`, `discovery`, `ports`, `query`, `query-client`, `streams`, and `telemetry` facades. No export surface changed. |
| Gate | Raw `Deno.Command`: `deno check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --unstable-kv packages/sdk/mod.ts packages/sdk/cache/mod.ts packages/sdk/client/mod.ts packages/sdk/collections/mod.ts packages/sdk/discovery/mod.ts packages/sdk/ports/mod.ts packages/sdk/query/mod.ts packages/sdk/query-client/mod.ts packages/sdk/telemetry/mod.ts packages/sdk/streams.ts` PASS exit 0 with an npm peer warning only. Raw `Deno.Command`: `deno doc --lint --import-map .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-doc-import-map.json <all current sdk entrypoints>` PASS, checked 10 files. Raw `Deno.Command`: `deno lint --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json <all current sdk entrypoints>` PASS exit 0. Raw `Deno.Command`: `deno fmt --check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-format-sdk.json <all current sdk entrypoints + run configs>` PASS exit 0. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. |
| Size check | Root `mod.ts` module doc block is 35 lines, satisfying the >=30L requirement. |
| Lock hygiene | Run-local check/doc import maps and run-local `deno.lock` were expanded for the root entrypoint graph (`@orpc/openapi`, `@orpc/zod`, `@netscript/plugin-streams-core`, `@durable-streams/client`, `@durable-streams/state`). Root `deno.lock` was not touched. |
| Concept of done | Each public entrypoint now explains when to import that layer and how it composes with the adjacent SDK layers; no docs-only facade exists solely for folder shape. |
| Drift | none |

### Slice 15/19 — README and architecture docs

| Field | Evidence |
| --- | --- |
| Commit | `6e50265` — `Document sdk package architecture` |
| Changed | Replaced `packages/sdk/README.md` with a 14-section package guide covering install, entrypoints, `defineServices()`, direct clients, query factories, query-client, cache, discovery, collections, OpenAPI/telemetry, ports, architecture notes, and validation. Added `packages/sdk/docs/architecture.md` with layer map, composability contract, type inference contract, transport seam audit, discovery split, cache state, public surface boundaries, and contributor path. |
| Gate | Raw `Deno.Command`: `deno fmt --check --no-config packages/sdk/README.md packages/sdk/docs/architecture.md` PASS exit 0. Wrapper read: `deno run --allow-read --allow-run .llm/tools/run-deno-doc-lint.ts --root packages/sdk --pretty` exit 0; combined missingJSDoc 0, combined privateTypeRef 0, combinedOther 0 for the current entrypoint set. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. Architecture probe confirmed `Layer Map`, `Composability Contract`, `Transport Seam Audit`, `ClientLinkFactory`, `defineServices`, and `CacheQuery` references in `docs/architecture.md`. |
| Size check | README: 329 lines, 14 `##` sections. Architecture doc: 116 lines. |
| Concept of done | A contributor can start from README quickstart, drop down through focused subpaths, then use `docs/architecture.md` to extend the right layer without inventing new seams. |
| Drift | none |

### Slice 16/19 — doctest runner and unit tests

| Field | Evidence |
| --- | --- |
| Commit | `117fd2e` — `Add sdk cache and doctest coverage` |
| Changed | Added `tests/test-helpers.ts`, focused cache/query/persister unit tests, and a README doctest runner that extracts TypeScript and JSON fences. Fixed a `CacheQuery` in-flight dedupe race by rechecking the instance in-flight map after the async cache read and before creating a new fetch promise. |
| Gate | Raw `Deno.Command`: `deno test --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --allow-read --allow-write --allow-run --allow-env packages/sdk/tests/cache/cache-query_test.ts packages/sdk/tests/query/query-factory_test.ts packages/sdk/tests/query-client/kv-cache-persister_test.ts packages/sdk/tests/discovery/env-ordering_test.ts packages/sdk/tests/readme-doctest_test.ts` PASS exit 0, 10 passed / 0 failed. Raw `Deno.Command`: `deno fmt --check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-format-sdk.json <slice-16 files>` PASS exit 0. Raw `Deno.Command`: `deno check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --unstable-kv <slice-16 files>` PASS exit 0. Raw `Deno.Command`: `deno lint --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json <slice-16 files>` PASS exit 0. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. |
| Concept of done | The cache behavior, query-factory key shape, discovery ordering, persister storage path, and README examples are reachable through tests. The cache race fix stays inside the existing `CacheQuery` abstraction and preserves the instance-state decision from slice 13. |
| Drift | none |

### Slice 17/19 — type-level assignability fixtures

| Field | Evidence |
| --- | --- |
| Commit | `c250f7d` — `Prove sdk type assignability chain` |
| Changed | Added `tests/type-fixtures/sdk-assignability_type.ts`, a joined compile-only fixture proving contract inference from `createServiceClient()` through `ServiceClient<TContract>`, `QueryFactory<TContract>`, `ServiceQueryUtils<TContract>`, `QueryClientPort`, and `QueryCollection<TItem>`. The fixture includes a `@ts-expect-error` guard for invalid service-client input. |
| Gate | Raw `Deno.Command`: `deno fmt --check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-format-sdk.json <all sdk type fixtures>` PASS exit 0. Raw `Deno.Command`: `deno check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --unstable-kv <all sdk type fixtures>` PASS exit 0. Raw `Deno.Command`: `deno lint --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json <slice-17 fixture + non-inline-import type fixtures>` PASS exit 0. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. |
| Gate notes | The upstream assignability fixture remains included in typecheck and format. It is excluded from the lint command because it intentionally uses inline `npm:` specifiers to test the upstream return type directly, matching the slice-7 evidence pattern. |
| Concept of done | The fixture is reachable from the typecheck gate and proves the composability chain without adding runtime-only files or public annotations. |
| Drift | none |

### Slice 18/19 — live service-client integration

| Field | Evidence |
| --- | --- |
| Commit | `f430fd0` — `Prove sdk live service client runtime` |
| Changed | Added `tests/integration/service-client-runtime_test.ts` booting real `@netscript/service` via `createService(...).withRPC({ rpcPath: \"/api/rpc/v1/sdk-live\" }).serve({ port: 0 })`, resolving it through `services__sdk-live__http__0`, and calling `createServiceClient()`. Added `ServiceClientContext.signal` and forwarded it through the internal HTTP link so cancellation reaches `fetch`. Expanded the run-local check config/lock for service/logger/telemetry/oRPC server dependencies; root `deno.lock` was not touched. |
| Gate | Raw `Deno.Command`: `deno test --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run packages/sdk/tests/integration/service-client-runtime_test.ts` PASS exit 0, 4 passed / 0 failed. Tests cover live discovery round-trip, bad URL connection failure with timeout signal, retry exhaustion with two retry callbacks, cancellation propagation through `AbortController`, and clean listener stop in `finally`. Raw `Deno.Command`: `deno fmt --check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-format-sdk.json <slice-18 files + run check config>` PASS exit 0. Raw `Deno.Command`: `deno check --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json --unstable-kv <slice-18 files>` PASS exit 0 with known oRPC peer warning. Raw `Deno.Command`: `deno lint --config .llm/tmp/run/feat-package-quality-wave5-apps--5b-sdk/deno-check-sdk.json <slice-18 files>` PASS exit 0. Raw `Deno.Command`: `deno task check` from `packages/sdk` PASS exit 0 with known pre-slice-19 root-exclude warning. |
| Advisory | B2 complete: live integration now covers connection failure, retry exhaustion, and cancellation propagation in addition to round-trip and clean stop. |
| Concept of done | The runtime path is reachable from a real service listener and the cancellation extension is documented at the public request context while transport implementation remains behind the internal HTTP link seam. |
| Drift | none |
