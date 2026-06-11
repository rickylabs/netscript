# Plan — Sub-wave 5b: `@netscript/sdk`

Status: **LOCKED — PLAN-EVAL PASS (OpenHands run 27343770321, PR #29 comment 2026-06-11)**.
Evidence: `research.md` + `measure-5b.json`. Carries the umbrella architecture mandate
(composability layers, transport seam) from 2026-06-11 user feedback.

## 1. Archetype + doctrine verdict

- **A3 (runtime: client/cache/discovery) primary + A4 (factory DSL) secondary.**
  Gate set = A3 ∪ A4: F-1..F-18 incl. F-13; A3 validation = real round-trip
  (client → live service) + defensive abort/cleanup tests; consumer-import gates
  (fresh, queue, cli).
- Doctrine: src/ layout mandatory (3,117 LOC); `interfaces/` folder forbidden (F-11);
  F-16 cardinality on 12 subpaths; F-15 on the `./streams` re-export + QueryClient.

## 2. Architecture design (the mandate part)

Target layer map — **the composability contract each layer must satisfy** (candidate
doctrine amendment, to generalize at umbrella close):

```
L3 preset      defineServices()             one-liner; expressible purely in L2 calls
L2 factories   createServiceClient / createQueryFactories /
               createServiceQueryUtils / createQueryCollection /
               createNetScriptQueryClient   each takes ports, returns inference-typed values
L1 primitives  CacheQuery (SWR engine), KvCacheStore, discovery, otel middleware
L0 ports       src/ports/ (renamed from interfaces/): ContractLike algebra,
               CacheStore, ServiceTransport/ClientLink, QueryClientPort, QueryKey
```

Rules: (a) every layer is implemented only in terms of the layer below; (b) ports are
structural, package-owned, upstream-type-free; (c) the one-liner has a no-cliff escape
hatch (its outputs ARE the L2 values, so dropping down never re-wires); (d) seams are
reusable cross-package (fresh/query consumes the same ports).

## 3. Decisions (proposed for lock)

**D-1 — `src/` restructure preserving all retained subpaths.** Thin root entry files
(`client.ts`, `query.ts`, …, telemetry-`orpc.ts`-style facades) → `src/<area>/mod.ts`;
root `mod.ts` barrel ≤200L with ≥30L @module. `core/` contents land in
`src/cache/` + `src/query/` (their real areas — `core` is vague, though not F-11-listed).

**D-2 — `interfaces/` → `src/ports/`; `./interfaces` entrypoint → `./ports`.**
F-11 fix + doctrine vocabulary. 1 in-tree consumer (fresh) updated in-slice. The port
files keep their excellent type algebra unchanged.

**D-3 — Subpath cardinality (F-16): 12 → 10.** Fold `./adapters` into `./cache`
(KvCacheStore is the cache adapter; root barrel already re-exports it). Fold
`./openapi` (80L helpers, 0 consumers) into root barrel. Keep with justification:
`./client`, `./cache`, `./query`, `./query-client`, `./collections` (RFC 17 mandated),
`./discovery` (queue consumer; Deno-env-touching code isolated from browser bundles),
`./telemetry` (middleware import path used by services), `./streams` (RFC 16 facade),
`./ports` (cross-package seam reuse), `.`.

**D-4 — `./streams` ptr fix happens UPSTREAM in `plugin-streams-core`.**
Export `StreamStateDefinition`, `StateSchema`, `StreamProducerPort` from
plugin-streams-core's public surface (they are package-owned there, just unexported —
same class as 5a's `Database`/`ContextFactory`). sdk's facade re-export stays (sibling
`@netscript/*` re-export, same ruling as 5a's `LoggerMiddlewareOptions`). Cross-package
slice with its own plugin-streams-core gate run.

**D-5 — `QueryClientPort` structural port for the 2 `QueryClient` ptrs.**
Package-owned port in `src/ports/query-client.ts` covering every member sdk +
fresh/query + collections actually use (audit at impl start; expect
`getQueryData`/`setQueryData`/`invalidateQueries`/`fetchQuery`/`getQueryCache`/
`mount`/`unmount` ballpark). `createNetScriptQueryClient(): QueryClientPort` (runtime
object remains a real `QueryClient` — documented escape hatch);
`QueryCollectionOptions.queryClient: QueryClientPort`. TS structural typing makes the
real instance assignable. If a consumer needs an omitted member → widen the port
(record in drift), never re-export upstream.

**D-6 — `ServiceQueryUtils<TContract>` mapped return type for
`createServiceQueryUtils`.** Package-owned mirror of `@orpc/tanstack-query` utils
built on the existing `ContractLike` algebra:
`{ [K in procedures]: { queryOptions(...), mutationOptions(...), key(...), … } }`,
generic over **TContract** (signature becomes
`createServiceQueryUtils<TContract>(client: ServiceClient<TContract>, options?)`),
killing both the slow type and the internal `any` bridges (one upstream-boundary cast
stays inside, documented). Compile-time assignability tests against a real contract
fixture AND against the actual upstream return type. Hardest slice — budgeted 2 slices.

**D-7 — `QueryCollection<TItem>` structural return port for `createQueryCollection`**
(second slow type), mirroring the used TanStack DB collection members; same audit
approach as D-5.

**D-8 — Wire the transport seam (protect, don't implement RFC 14 unified mode).**
`client/service-client.ts` stops constructing `RPCLink` inline: internal
`src/client/transports/http.ts` adapter behind an internal `ClientLinkFactory` port;
`ServiceTransport` port stays exported with the unified-mode injection point documented
in `docs/architecture.md` (seam audit note per umbrella convention). NO in-process
transport implementation, NO public option added yet.

**D-9 — Layer-3 one-liner preset: `defineServices()`.**
```ts
const sdk = defineServices({
  orders: { contract: ordersContract },
  users:  { contract: usersContract, options: { staleTime: 60_000 } },
});
// sdk.clients.orders  : ServiceClient<typeof ordersContract>
// sdk.queries.orders  : QueryFactory<typeof ordersContract>
// sdk.queryUtils.orders : ServiceQueryUtils<typeof ordersContract>
```
Thin composition of existing L2 factories (no new behavior), full inference, collapses
RFC 17 §2.2's 3×N `api-clients.ts` boilerplate to one call with a no-cliff escape
hatch (outputs are the L2 values). This is the composability deliverable from the
user mandate. PLAN-EVAL may descope to deferred if it judges surface growth premature —
then the layer map still ships in docs/architecture.md.

**D-10 — Split `discovery/service-discovery.ts` (643L > 350)** into
`src/discovery/{browser-env,service-url,kv-connection}.ts` + mod; behavior-parity
tests around env lookup ordering (full VITE key → shorthand → server env).

**D-11 — jsdoc sweep (18) + module-level state hygiene.** Document cache-provider,
query-client/types members, kv-cache-persister; move `inflightRequests` into
`CacheQuery` instance state (constructor-injected map default) unless behavior demands
process-global — decide at impl, record either way.

**D-12 — deno.json tasks block** (check/test/lint/fmt/publish:dry-run, logger/5a
pattern); description/license/publish already present.

**D-13 — README ≥150L (14 sections) + doctest runner + docs/ scaffold + tests-from-zero.**
Unit: CacheQuery SWR semantics (fresh/stale/expired/inflight-dedup/preferFreshOnStale),
query-factory action methods + keys, discovery env ordering, kv-cache-persister.
Type-level: assignability fixtures for D-5/D-6/D-7 + `ServiceClient` inference.
Integration (A3): boot a real `@netscript/service` `serve({port:0})`, point discovery
env at it, `createServiceClient` round-trip + retry/abort path, clean stop.

**D-14 — Lift `packages/sdk/` from root `deno.json` exclude** as final slice + full
sweep (clears the 37 `excluded-module`; 5a slice-15 playbook).

## 4. Open-decision sweep

| Question | Verdict |
| --- | --- |
| Exact `QueryClientPort` / `QueryCollection` member lists | must resolve at impl start (consumer audit); bounded by D-5/D-7 |
| `defineServices` naming (`defineServices` vs `createSdk` vs `defineSdk`) | must resolve at PLAN-EVAL — recommend `defineServices` (matches `defineService`/`definePage` preset vocabulary) |
| `core/` folder dissolution vs keep | safe to decide in D-1 slice (proposal: dissolve into cache/query) |
| `./testing` entrypoint (gate-matrix mention) | follow 5a precedent: ship `tests/`; add `./testing` only if PLAN-EVAL requires (5a shipped without it and passed) |
| In-process transport implementation | out of scope (RFC 14 unified mode) — seam only (D-8) |
| `inflightRequests` global vs instance | safe to defer to D-11 impl with drift note |
| plugin-streams-core export change ripple | must resolve now → scoped: additive type exports only, no signature changes; gate plugin-streams-core + plugins/streams consumers in-slice |

## 5. Commit slices (19 — under 30)

1. `chore(sdk): add tasks block to deno.json` (D-12)
2. `refactor(sdk): move sources under src/ with thin subpath entries (transient rename slice)` (D-1)
3. `refactor(sdk): rename interfaces/ to src/ports/; ./interfaces → ./ports; fix fresh consumer` (D-2)
4. `refactor(sdk): fold ./adapters into ./cache and ./openapi into root barrel` (D-3)
5. `feat(plugin-streams-core): export stream state/schema/producer port types` (D-4, cross-package)
6. `feat(sdk): add QueryClientPort; type query-client factory + collections options` (D-5)
7. `feat(sdk): ServiceQueryUtils<TContract> mapped type` (D-6a — type only + fixtures)
8. `refactor(sdk): createServiceQueryUtils typed signature, drop any-bridge` (D-6b)
9. `feat(sdk): QueryCollection<TItem> return port for createQueryCollection` (D-7)
10. `refactor(sdk): extract http client transport adapter behind internal link port` (D-8)
11. `feat(sdk): defineServices() one-liner preset (L3)` (D-9)
12. `refactor(sdk): split discovery into browser-env/service-url/kv-connection` (D-10)
13. `docs(sdk): jsdoc sweep (cache-provider, query-client types, persister); inflight state decision` (D-11)
14. `docs(sdk): root mod.ts @module ≥30L + per-subpath @module docs`
15. `docs(sdk): README (14 sections) + docs/ scaffold incl. architecture layer map + seam audit`
16. `test(sdk): readme doctest runner + unit tests (cache SWR, query factory, discovery)`
17. `test(sdk): type-level assignability fixtures (D-5/D-6/D-7, ServiceClient inference)`
18. `test(sdk): integration — live service round-trip via discovery env, abort/cleanup`
19. `chore(repo): lift packages/sdk from root exclude; full gate sweep` (D-14)

Each slice: `deno check --unstable-kv` over all entrypoints green; gate-evidence
commit pairing per 5a convention.

## 6. Gates (exit criteria)

- dry-run exit 0 (0 slow types, 0 excluded-module after slice 19)
- doc-lint COMBINED over all entrypoints + root-barrel run: 0
- check/lint/fmt green; tests green incl. doctests + type fixtures
- A3: integration round-trip vs live `@netscript/service` on ephemeral port w/ clean stop
- Consumer gates: fresh, queue, cli compile (`deno task check` wrappers per 5a drift D-4
  naming note); plugin-streams-core + plugins/streams gates after slice 5
- jsr-audit ≥7/10
- Architecture deliverables present: docs/architecture.md layer map + composability
  contract + transport seam audit (umbrella feedback traceability)

## 7. Risk register

| Risk | L×I | Mitigation |
| --- | --- | --- |
| `ServiceQueryUtils` mapped type diverges from upstream utils behavior | M×H | dual assignability fixtures (ours vs upstream return); budgeted 2 slices; fallback = narrow to the members RFC 17 actually uses (queryOptions/mutationOptions/key) |
| `QueryClientPort` too narrow for a tanstack API call site | M×M | consumer audit first; widen-port-on-drift rule (D-5) |
| plugin-streams-core change ripples to Wave-4 consumers | L×M | additive type exports only; in-slice plugin gates |
| `defineServices` scope creep | M×L | thin composition only; PLAN-EVAL may descope to deferred |
| discovery split breaks browser env lookup | L×H | parity tests on lookup ordering before refactor |
| Root-exclude lift surfaces masked errors | M×M | 5a playbook (slice 19 full sweep) |

## 8. Debt implications

- **Cleared**: 2 slow types, 9 ptr (7 via upstream export fix), 18 jsdoc, 1 over-cap,
  tests/README/docs-from-zero, tasks block, root-exclude entry, unused-seam
  (ServiceTransport now wired-adjacent), F-11 folder, F-16 12→10.
- **New/possible**: `QueryClientPort` width maintenance (widen-on-drift);
  one boundary cast inside createServiceQueryUtils (documented); if `defineServices`
  is descoped → deferred-scope entry + doctrine note still ships.

## 9. Deferred scope

RFC 14 unified-mode in-process transport (seam only); island hooks (`fresh/query`,
5d-6); TanStack DB live-query extensions beyond RFC 17 v1; cache persister tuning;
doctrine amendment text itself (proposed at umbrella close, evidence from 5a+5b).
