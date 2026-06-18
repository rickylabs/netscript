# Research — chore-prod-readiness--cleanup

> **SEED** — supervisor-level starting inventory. The generator owns the full dead-code/shim
> sweep (MEASURE-FIRST) before locking slices.

## Re-baseline

- Carried-in source: handover §3.1.
- Re-derived against `main` @ `cc3b8731`.
- The S1 program intentionally followed **L-no-backcompat** (renames delete, no alias/shim), so the
  shim surface should be small — **verify, do not assume**; pre-S1 cruft may remain at root and in
  `.llm/`.

## Findings

| # | Finding | How to verify |
|---|---------|---------------|
| 1 | Cleanup must not regress the 27-unit `publish:dry-run` 0-slow-types floor. | `deno task publish:dry-run`. |
| 2 | `.llm/tmp/{claude,cli-e2e,openhands}/` are gitignored scratch; `.llm/tmp/run/` is tracked evidence. | `.gitignore` 13–18. |
| 3 | Handover names `agents-handover.md` as an example stray root file to remove. | root listing. |
| 4 | Off-limits files exist (`scaffold-versions.ts`, `packages/aspire/src/public/mod.ts`, version pins, catalog). | handover §4. |

## Inventory to build (generator MEASURE-FIRST)

- **Dead code:** import-graph / `deno info` / codemogger symbol-reachability sweep across
  `packages/`, `plugins/`, `examples/`, `apps/`, `tools/`, `.llm/tools/`.
- **Compat shims/aliases:** grep for re-export-only modules, deprecated alias entrypoints, "compat"/
  "deprecated"/"legacy" markers; cross-check each against consumers.
- **Cruft:** stray root files, `.bak`/`.tmp`/scratch, non-gitignored build leftovers, dead doc files.
- **Doc files (delete-only):** orphaned `.md` not linked from any nav/README/CI.

## jsr-audit surface scan

- N/A (no single package surface). Per removal that touches a unit's exports, re-run that unit's
  `publish:dry-run` + full-export `deno doc --lint` to prove no surface regression.

## Open questions

- "Dead code" detection method (must resolve before slicing — see `plan.md`).
- `examples/`/`apps/` in scope vs fixtures.
- Which compat shims exist and who consumes them.
