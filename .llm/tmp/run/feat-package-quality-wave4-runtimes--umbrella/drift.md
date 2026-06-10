# Drift Log — feat-package-quality-wave4-runtimes--umbrella

> Record every deviation from the locked plan, every subpath/folder rename, and every
> MEASURE-FIRST re-baseline finding here.

## Re-baseline drift (pre-research, 2026-06-08)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-08 | note | Canonical `evaluate_*`/`plan_*` are pre-rewrite/stale | Slow-type "before" counts (workers 50, plugin-triggers 16, watchers FAIL) all wrong; current dry-run = 0 slow types for all 9. Canonical also labels `streams` "Wave 1" + uses old package names. | Treat canonical as **structural intent only**. Name map in `research.md` §7. Re-measure doc-lint per sub-wave. |
| 2026-06-08 | **decision-needed** | Archetype-per-core disputed | Registry: `*-core` = A1/A4. Canonical: `plan_workers.md` = A3, `plan_streams.md` = A1. A3 ⇒ F-13 + Runtime/Aspire validation **required**. | Plan & Design must fix archetype per unit (declare in each `docs/architecture.md`) before selecting gates. Record the gate delta here. Recommendation: cores → A3 unless pure contract. |
| 2026-06-08 | note | A5 plugin tier has 0 tests | `plugin-{streams,workers,sagas,triggers}` = 0/0/0/0 test files. F-10 required for A5. | Test layer is net-new work per A5 unit; size the slices accordingly. |
| 2026-06-08 | note | `watchers` flat layout / no metadata | No README, no `docs/`, no `deno.json` tasks; code at package root (no `src/`). 0 slow types already. | Structural lift to `src/public` + README ≥150 + docs scaffold + tasks. Possibly its own micro sub-wave if 4a over budget. |
| 2026-06-08 | note | `unanalyzable-dynamic-import` warnings | `workers-core` ×1; `plugin-{workers,sagas,triggers}` ×2 each (non-blocking, like Wave 3 manifest-resolver). | Per unit: accept+document vs make-resolvable. Not a publish blocker. |

## Carried-in caveats

| Item | Decision | Impact |
|------|----------|--------|
| `e2e:cli` `behavior.triggers-health` | **Terminal owner = triggers sub-wave (4d)**, gated on Wave 3 OQ-D verdict. A5 ⇒ runtime validation required, can't defer further. | If Wave 3 attributes downstream → in-scope for 4d; if host → already fixed in Wave 3. |
| `#96` `check:services`/`check:workers` typing drift | Separate env-artifact gaps (generated DB) from real package debt during Research. | May surface as in-scope fixes in 4b (workers) / A5 service layers, or env-only (out of scope). |
| `cli-maintainer-sync-isolated-declarations` | Wave 6 CLI, not here. | Recorded in `.llm/harness/debt/arch-debt.md`. |

## Implementation drift

(append during Plan + Implement, per sub-wave)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
