# 5d1 research — `@netscript/fresh` support spine

Run: `feat/package-quality-wave5-apps-5d1-support` (PR #34)  
Scope: PLAN-phase research only — error · utils · vite config · interactive · mod skeleton.

## Reused findings from prior trace

Prior trace: `.llm/tmp/run/openhands/pr-34/run-27442019802-1/summary.md`

- The previous session was interrupted before writing artifacts; its completion claims are false.
- Distilled findings reused here:
  - `packages/fresh/deno.json` tasks currently: `test`, `check` only.
  - `deno publish --dry-run` reported **58 `excluded-module` errors** and **4 `missing-explicit-return-type`** errors (to be re-verified below).
  - `deno doc --lint` over key entrypoints showed `missing-jsdoc` and `private-type-ref` diagnostics.
  - File-size inventory: `error/handler.ts` (411 lines), `components/ErrorDisplay.tsx` (181 lines), `config/vite.ts` (257 lines), `utils/mod.ts` (54), `utils/cache-entry.ts` (39), `interactive.ts` (14), `hooks/use-promise.ts` (50), `mod.ts` (39).
  - Suspected publish-exclusion cause: `.gitignore` honored by JSR publish or include/exclude misalignment.

## MEASURE-FIRST

### Entrypoints and file inventory

```text
packages/fresh/
  mod.ts                    (root barrel)
  server.ts
  interactive.ts
  error/mod.ts
  error/handler.ts          (large: ~11.8K)
  error/primitives.ts
  utils/mod.ts
  utils/cache-entry.ts
  config/vite.ts
  hooks/use-promise.ts
  components/ErrorDisplay.tsx
  defer/telemetry.ts
  form/telemetry.ts
```

### Combined `deno doc --lint`

TODO: run combined `deno doc --lint` for `.`, `./error`, `./utils`, `./vite`, `./interactive` entrypoints and record counts.

### `deno check --unstable-kv`

TODO: run scoped `deno check --unstable-kv` over the same entrypoints.

### Private-type-ref count

TODO: count from `deno doc --lint` output.

### Over-cap inventory

TODO: file-size caps from doctrine F-1.

### `deno publish --dry-run --allow-dirty`

TODO: capture current dry-run status, excluded-module list, slow-type list.

## Current-state inventory

### `error/`

TODO: summarize `handler.ts`, `primitives.ts`, `mod.ts`, `components/ErrorDisplay.tsx`.

### `utils/`

TODO: summarize `mod.ts`, `cache-entry.ts`.

### `config/vite.ts`

TODO: summarize wrapper surface.

### `interactive.ts` and `hooks/use-promise.ts`

TODO: summarize seam and relocation candidacy.

### `mod.ts` (root barrel)

TODO: summarize curated root policy question.

## Telemetry forks

### `defer/telemetry.ts`

TODO: map exports, naming, span/event shapes, OTel alignment.

### `form/telemetry.ts`

TODO: map exports, naming, span/event shapes, OTel alignment.

### Proposed ONE cross-cutting convention

TODO: raw material synthesis for phase-2 design.md.

## Market comparison

### TanStack Start

TODO: error taxonomy + telemetry conventions.

### Next.js App Router

TODO: error taxonomy + telemetry conventions.

### Remix / React Router

TODO: error taxonomy + telemetry conventions.

## Gaps and blockers

TODO: remaining research gaps to close before design trigger.
