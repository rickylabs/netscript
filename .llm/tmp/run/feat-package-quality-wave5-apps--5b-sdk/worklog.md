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
