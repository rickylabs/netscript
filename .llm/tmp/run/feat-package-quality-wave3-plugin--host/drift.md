# Drift Log — feat-package-quality-wave3-plugin--host

> Record every deviation from the locked `plan.md`, every subpath/folder rename, and
> every MEASURE-FIRST re-baseline finding here.

## Re-baseline drift (seed)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-08 | note | Canonical `evaluate_plugin.md`/`plan_plugin.md` are pre-rewrite/stale | Canonical: 5 files / 1956 LOC / 33 slow types / 0 tests / no docs. Reality at `89071df`: full hexagonal `src/` layout, 8 exports, README 139 LOC, `docs/` present, 4 test files, `inspectPlugin` shipped. | **MEASURE-FIRST**: re-run full-export `deno doc --lint` (all 8 entrypoints) + `deno publish --dry-run` at base; record real numbers in `research.md` before locking slice effort. |
| 2026-06-08 | note | `plugins/hello-world` removed | Replaced by `packages/plugin/src/templates/skeleton/` (the `netscript plugin scaffold` template). | Canonical hello-world references in `plan_plugin.md` do not apply. No hello-world slice. |

## Carried-in caveats (from Wave 2 closeout)

| Item | Decision | Impact |
|------|----------|--------|
| `e2e:cli` `behavior.triggers-health` | Investigate ownership during Research (OQ-D): plugin-host bootstrap (`src/sdk/runtime/*`) vs downstream `plugin-triggers` (Wave 4). | If host defect → fix in-scope; if downstream → carry forward, do not block. |
| `cli-maintainer-sync-isolated-declarations` | Out of scope (Wave 6 CLI). | Recorded in `.llm/harness/debt/arch-debt.md`. Not this wave. |

## Implementation drift

(append during Plan + Implement)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
