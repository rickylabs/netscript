# Context pack — Sub-wave 5b: `@netscript/sdk` (implementation)

## Current state

PLAN-EVAL is locked as PASS via OpenHands run `27343770321` / PR #29 comment
2026-06-11, materialized locally in `plan-eval-summary.md` because the evaluator made
no commits. First duties are complete and pushed at `13dca51`.

Slices 1-18/19 are complete. `packages/sdk/deno.json` now has package-local
`check`, `test`, `lint`, `fmt`, and `publish:dry-run` tasks. SDK implementation files
now live under `packages/sdk/src/`, with public subpath facades retained at their
locked paths. `core/` is dissolved into `src/cache/` and `src/query/`. The forbidden
`interfaces` vocabulary is gone from sdk and the one Fresh consumer:
`src/interfaces/` is now `src/ports/`, the public subpath is `./ports`, root `mod.ts`
exports from `./ports/mod.ts`, and `packages/fresh/builders/define-page/types.ts`
imports `@netscript/sdk/ports`. Subpaths are now reduced from 12 to 10 by folding
`./adapters` into `./cache` (`KvCacheStore`) and `./openapi` into the root barrel.
B1 is complete: `research.md` now says the streams types are "not exported from the
declaring module's public chain." Slice 5 added pure type re-exports from the
plugin-streams-core declaring modules and made `@netscript/sdk/streams` re-export the
plugin core type surface so sdk-facing doc-lint can see the full chain. Slice 6 added
`QueryClientPort` in `src/ports/query-client.ts`, documented the member list with
consumer drivers, changed `createNetScriptQueryClient()` to return the structural port,
and changed collection options to accept the port with an internal TanStack boundary
cast. Slice 7 added `ServiceQueryUtils<TContract>` in `src/ports/service-query-utils.ts`,
exported it through `./ports`, `./query-client`, and root, and added dual compile-only
fixtures proving sdk contract inference plus upstream `createTanstackQueryUtils()`
return assignability. Slice 8 typed `createServiceQueryUtils()` as
`createServiceQueryUtils<TContract>(client: ServiceClient<TContract>, options?):
ServiceQueryUtils<TContract>`, removed the public `any` bridge, added a type-only
`ServiceClientContract<TContract>` marker so clients infer their source contract, and
kept one documented upstream-boundary return assertion. Next slice: `QueryCollection<TItem>`
return port (D-7). Slice 9 added the structural `QueryCollection<TItem>` return port,
annotated `createQueryCollection()` to return it, exported the port from
`@netscript/sdk/collections`, relaxed collection items to `TItem extends object`, and
added a type fixture proving item inference and common read/write methods. Next slice:
internal `ClientLinkFactory` HTTP transport seam (D-8), seam only, no in-process transport.
Slice 10 added the internal `ClientLinkFactory`/`ClientLinkPort` seam, moved the existing
HTTP `RPCLink` construction into `src/client/http-client-link.ts`, and left
`createServiceClient()` public options unchanged. Slice 11 added the L3
`defineServices()` preset, exported it from root, and added an inference fixture proving
that the one-liner returns the composed L2 values: `clients`, `queries`, and
`queryUtils`. Slice 12 split discovery into `browser-env.ts`, `service-url.ts`,
`kv-connection.ts`, and `mod.ts`, leaving `service-discovery.ts` as a 7-line
compatibility barrel and adding three parity tests for lookup ordering
(full VITE key -> shorthand -> server env). Slice 13 completed the remaining
JSDoc member sweep reached by the current public surface, centralized SWR/cache
timing defaults in `src/cache/defaults.ts`, and moved `inflightRequests` from
module state onto `CacheQuery` instance state with an optional constructor-injected
map. Slice 14 expanded root `mod.ts` module docs to 35 lines and refreshed all
subpath module docs without changing exports. Slice 15 replaced the README with a
14-section / 329-line package guide and added `docs/architecture.md` with the
layer map, composability contract, transport seam audit, discovery split, cache
state decision, and contributor path. Slice 16 added focused unit tests for
`CacheQuery` stale-while-revalidate, `preferFreshOnStale`, in-flight dedupe,
query-factory keys, the KV query-cache persister, and README TypeScript/JSON
doctests. The cache dedupe test exposed and fixed a race by rechecking the
instance in-flight map after the async cache read and before starting a fetch.
Slice 17 added a joined assignability fixture proving `createServiceClient()`
contract inference through `ServiceClient<TContract>`, `QueryFactory<TContract>`,
`ServiceQueryUtils<TContract>`, `QueryClientPort`, and `QueryCollection<TItem>`.
Slice 18 added a live `@netscript/service` integration test that boots
`serve({ port: 0 })`, resolves the client through discovery env, proves round-trip,
bad URL connection failure, retry exhaustion callbacks, cancellation propagation, and
clean stop. The cancellation path added `ServiceClientContext.signal` and forwards it
through the internal HTTP link. Next slice: lift `packages/sdk` from the root exclude
and run the full exit gate sweep plus measure-after.

## What the plan session did

Wave 5 GENERATOR, RESEARCH + PLAN & DESIGN only. No implementation, no locked plan.
PLAN-EVAL (you, a separate session) reviews `plan.md` against
`.llm/harness/gates/plan-gate.md` and locks or bounces.

This sub-wave additionally carries the **architecture mandate** recorded in umbrella
drift (2026-06-11 user feedback): composability layers (one-liner → factory → seams),
transport/engine adapter seams, full type inference, DX-first. Plan §2 is the layer
map; D-8 (transport seam) and D-9 (`defineServices` preset) are the mandate
deliverables; docs/architecture.md must ship the layer map + seam audit.

## Where things are

- Branch `feat/package-quality-wave5-apps-5b-sdk` @ fork from `19cae06` (umbrella tip
  incl. 5a merge). Worktree `.worktrees/wave5-apps-5b-sdk`.
- This run dir: `research.md`, `plan.md` (LOCKED), `plan-eval-summary.md`,
  `worklog.md` (## Design + implementation evidence), `drift.md` (5 entries),
  `measure-5b.json`, `commits.md`.
- 5a precedents: `.llm/tmp/run/feat-package-quality-wave5-apps--5a-service/`
  (structural mirrors, interface-builder, root-exclude lift, gate-evidence pairing —
  all reusable).

## Baseline (verified locally, raw deno)

check PASS · combined doc-lint 29 (9 ptr [7 upstream in plugin-streams-core!] /
2 ret / 18 jsdoc) · dry-run 2 slow types + 37 excluded-module (root exclude) ·
0 tests · 3,117 LOC · 1 over-cap (discovery 643L) · 12 subpaths (5 zero-consumer) ·
`interfaces/` F-11 folder · deno.json missing only tasks.

## Plan in one paragraph

src/ restructure with thin subpath entries; `interfaces/`→`src/ports/` +
`./interfaces`→`./ports`; subpaths 12→10 (fold adapters→cache, openapi→root);
streams ptr fixed UPSTREAM via additive type exports in plugin-streams-core;
`QueryClientPort` + `ServiceQueryUtils<TContract>` mapped type + `QueryCollection`
port kill the tanstack leaks/slow-types; http link construction extracted behind an
internal transport port (RFC 14 seam protected, unified mode NOT implemented);
new L3 one-liner `defineServices()` (thin composition, no-cliff escape hatch);
discovery split; jsdoc sweep; README/docs/tests-from-zero incl. type-level
assignability fixtures + live-service integration round-trip; final slice lifts
`packages/sdk/` from root exclude. 19 slices, gates A3 ∪ A4.

## Review hot-spots (where to push back)

1. **D-6 `ServiceQueryUtils<TContract>`** — the typing long pole; is the 2-slice
   budget + dual-fixture mitigation enough, or should PLAN-EVAL demand a narrower
   member set (queryOptions/mutationOptions/key only)?
2. **D-9 `defineServices`** — new public surface during a quality wave; mandated by
   umbrella feedback but descopeable; also bikeshed the name.
3. **D-4 cross-package slice** in plugin-streams-core (Wave 4 package) — additive-only
   constraint acceptable?
4. **D-5 `QueryClientPort`** — widen-on-drift rule vs F-15 re-export waiver.
5. **D-3 fold choices** — `./openapi` into root vs keep; `./telemetry`/`./collections`
   kept on RFC justification with zero in-tree consumers.

## Hard rules in force

No `deno cache --reload`; never delete locks/caches; `--unstable-kv` on targeted
checks; `.llm/tools/run-deno-check.ts`; doc-lint verdict = COMBINED over all
entrypoints + root-barrel run; raw deno via `Deno.Command` for verdict sources;
no `@netscript/ui-primitives`; no RFC 14 unified mode implementation (seams only);
root task wrappers are `check`/`lint`/`fmt:check` (5a drift D-4 naming note).
