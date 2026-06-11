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
