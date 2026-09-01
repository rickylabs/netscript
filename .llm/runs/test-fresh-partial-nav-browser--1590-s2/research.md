# Research — deterministic Fresh/Vite browser proof

## Re-baseline

- Work began at `102ef8a10`, matching `origin/main` and containing merged Slice 1 (#1848).
- The locked authority is
  `.llm/runs/fix-fresh-partial-nav--1590/plan.md`, section “Slice 2 — deterministic Fresh/Vite
  A → B → A browser proof”; its separate PLAN-EVAL is `PASS`.
- Installed Fresh is `@fresh/core` 2.3.3 with `@fresh/plugin-vite` 1.1.2 and Vite 7.2.2.
- Fresh 2.3.3 awaits `Response.text()` before title/head/partial mutation and performs its possible
  `replaceState` only after application. A response-stream barrier at headers/EOF therefore tests
  the exact logical-drop seam.
- Fresh serializes marker keys with colon-to-underscore normalization. The passed PLAN-EVAL directs
  dynamic remount names to remain colon-free and the colon normalization to be asserted separately.

## Existing surfaces

- `packages/fresh/tests/form-navigation_browser.ts` is already the explicit hosted browser task.
- The hosted `fresh-browser` lane already selects any `packages/fresh/**` change; no workflow or
  classifier change is needed.
- `packages/fresh/deno.json` already runs the browser file, so the conditional task slot is unused.
- The public `@netscript/fresh/navigation` surface is import-safe and includes the coordinator plus
  `KeyedPartial`; no product source change is needed.

## Open finding

The locked plan assumed browser fixtures were excluded from publication. The current publish filter
includes `tests/fixtures/**/*.ts(x)` and `tests/form-navigation_browser.ts`; the dry-run lists all
five proof files. Resolving that requires a plan/file-contract decision by the supervisor.
