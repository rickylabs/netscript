# Drift — 5d1-support

Append-only. Reality vs RFC/doctrine/plan divergences.

- D-5d1-001: Previous trace `.llm/tmp/run/openhands/pr-34/run-27442019802-1/` ran out of iteration budget and wrote no artifact files; its completion claims are false. Reusing only its distilled findings.
- D-5d1-002: This run is research-only; design.md and plan.md are deferred to phase-2 trigger after supervisor review.
- D-5d1-003: Root workspace excludes `packages/fresh` from root `deno.json`. Effect: `deno check` on any `packages/fresh` entrypoint emits `Warning No matching files found.`; root `check`/`fmt`/`lint` tasks skip the package; `deno publish --dry-run` reports 58 `excluded-module` errors for every source file. The umbrella plan says 5d6 will lift `fresh` into root quality gates, but the publish errors are already blocking today. Proposed plan handling: 5d1 includes a workspace-integration slice that removes `packages/fresh` from root `exclude` once the 5d1 spine passes `deno doc --lint` and `deno publish --dry-run` for its own entrypoints. Controlled early un-exclusion, not a silent rescope.
- D-5d1-004: `deno doc --lint` baseline is 39 errors even though 5d1 scope is small. Most errors are inherited from `defer/`/`form/`/`builders/`/`route/` through `mod.ts`/`interactive.ts` re-exports. Umbrella target of doc-lint 0 cannot be achieved within 5d1 alone. 5d1 plan must state partial retirement target (0 new private-type-refs/missing-JSDoc in 5d1-created exports) and defer full 0 to 5d6 close.
- D-5d1-005: `config/vite.ts` leaks private Vite / internal types (`NetScriptRouteManifestOptions`, Vite `Plugin`). In scope for 5d1 design; implementation deferred.
- D-5d1-006: `defer/telemetry.ts` + `form/telemetry.ts` forks predate unified convention. Umbrella default position: replace with one cross-cutting convention in 5d1. 5d1 designs the convention; 5d4/5d5 implement the cutover.
- D-5d1-007: `components/ErrorDisplay.tsx` lives outside `error/` while umbrella target folder shape places it in `error/`. 5d1 plan will propose relocation and any re-export/deprecation shim.
