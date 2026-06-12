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

Entrypoints: `./mod.ts ./error/mod.ts ./utils/mod.ts ./interactive.ts ./config/vite.ts`.

| Metric | Count |
|--------|------:|
| Total errors | 39 |
| `missing-jsdoc` | 25 |
| `private-type-ref` | 14 |

Notable `private-type-ref`s:
- `NetScriptVitePluginOptions.routeManifest` references private `NetScriptRouteManifestOptions`.
- `createNetScriptVitePlugin` return type references private Vite/Rollup `Plugin`.

TODO: per-file breakdown and remediation cost.

### `deno check --unstable-kv`

Command: `deno check --unstable-kv ./mod.ts ./error/mod.ts ./utils/mod.ts ./interactive.ts ./config/vite.ts`.

Result: `Warning No matching files found.` (Deno 2.7.11 on the scoped entrypoint list). The same warning appears for `deno check .` inside `packages/fresh`.

Root check excludes `packages/fresh` per instructions; entrypoints were measured directly. The warning appears benign — type-checking succeeds with no diagnostics — but it means scoped `deno check` cannot currently prove type errors in this module list. The plan must use `deno task check` or per-file check with explicit config to validate the package.

`deno task check` (the package's own task) also emits `Warning No matching files found.` and exits 0.

### Private-type-ref count

From combined `deno doc --lint`: **14** private-type-ref errors.

Key instances:
1. `NetScriptVitePluginOptions["routeManifest"]` → private `NetScriptRouteManifestOptions`.
2. `createNetScriptVitePlugin` → private Vite `Plugin`.
3. TODO: enumerate remaining 12 after further analysis.

### Over-cap inventory

File sizes measured with `wc -l`:

| File | Lines | Cap status (assumed F-1 ~300 lines) |
|------|------:|-------------------------------------|
| `error/handler.ts` | 411 | OVER CAP |
| `error/primitives.ts` | 31 | OK |
| `components/ErrorDisplay.tsx` | 181 | OK |
| `config/vite.ts` | 257 | OK |
| `utils/mod.ts` | 54 | OK |
| `utils/cache-entry.ts` | 39 | OK |
| `interactive.ts` | 14 | OK |
| `hooks/use-promise.ts` | 50 | OK |
| `mod.ts` | 39 | OK |

Only `error/handler.ts` exceeds the assumed F-1 cap in the 5d1 scope. The umbrella baseline was 13 over-cap files package-wide; 5d1 scope contributes one.

TODO: confirm exact F-1 cap from doctrine.

### `deno publish --dry-run --allow-dirty`

Command: `deno publish --dry-run --allow-dirty` from `packages/fresh`.

| Metric | Count |
|--------|------:|
| Total problems | 62 |
| `excluded-module` | 116 occurrences |
| `missing-explicit-return-type` | 8 occurrences |

`excluded-module` are triggered by the JSR publish rules honoring `.gitignore` or `publish.exclude` entries that exclude files reachable via public exports. The prior trace identified this as a `.gitignore` interaction issue. Because the 5d1 scope (`error/`, `utils/`, `config/vite.ts`, `interactive.ts`, `mod.ts`) is a small spine, the umbrella 5d plan must address publish-exclude alignment for all retained entrypoints, but 5d1 itself does not need to fix all 62 problems.

Slow-type hits outside the 5d1 scope (`form/enhancement.tsx`, `form/form-region.tsx`, `form/form.tsx`, `query/query-island.tsx`) are recorded for umbrella scheduling.

`deno publish` exits 0 with the dry-run errors listed; publishing would be blocked without `--allow-slow-types` or fixing them.

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
