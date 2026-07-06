# Worklog — #403 telemetry T2 (ports/adapters restructure)

Branch `feat/403-telemetry-t2` off origin/main f88847d0 (contains T1/#402). Tier-B impl agent.
Baseline before work: scoped check clean (61 files), `deno doc --lint` full export set clean (8),
`deno publish --dry-run` Success, 17 tests pass.

## Slice 1 — structure move (kill `core/`, relocate `runtime/`, delete dead `sse.ts`)
- `src/core/types.ts` → `src/domain/types.ts` (vendor-neutral contract).
- `src/core/{span,span-utils,tracer}.ts` → `src/application/`.
- `src/core/mod.ts` deleted; new `src/application/mod.ts` barrel (domain types + span lifecycle + tracer).
- `src/runtime/` → `src/application/registry/` (registry lifecycle is application per doctrine target map).
- Deleted dead `src/instrumentation/sse.ts` (447 ln, zero consumers repo-wide; open-question #8 default=delete).
- Rewired every `../core/mod.ts`, `../runtime/mod.ts`, `./src/core/types.ts` import; `./tracer` facade → application barrel.
- Evidence: scoped check clean (60 files); `deno test` 17/17 pass incl. T1 TC-1..14 convention tests.
