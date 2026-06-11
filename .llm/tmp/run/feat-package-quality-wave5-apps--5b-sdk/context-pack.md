# Context pack — Sub-wave 5b: `@netscript/sdk` (implementation)

## Current state

PLAN-EVAL is locked as PASS via OpenHands run `27343770321` / PR #29 comment
2026-06-11, materialized locally in `plan-eval-summary.md` because the evaluator made
no commits. First duties are complete and pushed at `13dca51`.

Slices 1-8/19 are complete. `packages/sdk/deno.json` now has package-local
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
return port (D-7).

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
