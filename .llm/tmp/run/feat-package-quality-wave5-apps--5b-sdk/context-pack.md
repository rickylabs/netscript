# Context pack — Sub-wave 5b: `@netscript/sdk` (implementation)

## Current state

PLAN-EVAL is locked as PASS via OpenHands run `27343770321` / PR #29 comment
2026-06-11, materialized locally in `plan-eval-summary.md` because the evaluator made
no commits. First duties are complete and pushed at `13dca51`.

Slices 1-19/19 are implemented. The SDK now follows the locked layer model: L0
package-owned ports, L1 primitives, L2 factories, and the L3 `defineServices()`
one-liner. Sources live under `packages/sdk/src/` with thin public facades; the
forbidden `interfaces` vocabulary is replaced by `ports`; subpaths are reduced from
12 to 10; stream private-type chains are fixed through additive
plugin-streams-core type exports; `QueryClientPort`, `ServiceQueryUtils<TContract>`,
`QueryCollection<TItem>`, and `ServiceClient<TContract>` preserve full inference
without public upstream leaks; the HTTP transport is behind the internal
`ClientLinkFactory` seam; and `docs/architecture.md` records the layer map,
composability contract, and transport seam audit.

Final validation has been run for the implementation handoff: package publish
dry-run is exit 0 with no raw slow-type or excluded-module diagnostics, combined
SDK doc-lint is 0, independent root-barrel `deno doc --lint packages/sdk/mod.ts`
is 0, package tests are 14 passed / 0 failed across 6 files, root `check`,
`lint`, and `fmt:check` wrappers pass with SDK included, live service integration
covers discovery round-trip plus B2 failure paths, and the measure-after artifact
shows 0 combined doc-lint, 0 dry-run findings, 6 test files, 4,377 tracked source
LOC, and 0 files over the 350-line cap. The Fresh consumer import was updated to
`@netscript/sdk/ports`; the Fresh package check still exits 0 with its pre-existing
future-wave root-exclude warning, so that caveat is recorded for IMPL-EVAL.

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
