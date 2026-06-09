# Drift Log — feat-package-quality-wave4-runtimes--4d-triggers

> Record every deviation from the locked plan, every subpath/folder rename, and every
> MEASURE-FIRST re-baseline finding here.

## Carried-in (supervisor pre-research @ `ee9f26b` — confirm at MEASURE-FIRST after 4a+4b+4c pull-forward)

| Item | Status | Action for 4d |
|------|--------|---------------|
| `plugin-triggers-core` doc-lint = 211 (46 ptr + 165 jsdoc) | measured | Attribute per entrypoint; fix by type origin (Wave 3 LD-8). |
| `plugin-triggers` doc-lint = 138 (76 ptr + 62 jsdoc) | measured | Same. |
| Both dry-run PASS 0 slow types | measured | Confirm; not a slow-type wave. |
| **Both units missing `docs/` dir** | F-7 | Author architecture + usage docs for each (distinguishing 4d workload). |
| `plugin-triggers` tests = 0 | A5 ⇒ F-10 required | Build real test layer. `test-webhooks-e2e` (424) exists but unwired — verify. |
| OQ-D: `triggers-health` in-scope | resolved (Wave 3 closeout) | Validate health registration via live probe `localhost:8093/health` (confirm port). A5 runtime evidence. |
| 11/10 export surfaces | F-5/F-16 challenge | Consumer scan; trim or justify each. |
| F-1 over-cap: test-webhooks-e2e 424 | measured | Concept-split or move under tests/ layout. |
| `*-triggers-core` archetype A3 | decide | Declare in `docs/architecture.md`; gate delta = F-13 (trigger/schedule/dedup invariants) + Runtime/Aspire required. |
| F-6 task hygiene | confirm | `test` + `publish:dry-run` on both; `check` enumerates all entrypoints. |
| Combined-vs-split | sizing | Likely combined (lightest family); decide at Plan Gate. |

## Re-baseline drift (generator MEASURE-FIRST — append)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-09 | info | Pull-forward done by supervisor | 4a (`2c24662`) + 4b (`1896f854`, PR #19) + 4c (`8264a1c`, PR #20) all merged; 4d merged the umbrella (`8264a1c`) → merge `32637a9`, clean (ort, no conflicts), `deno.lock` identical to umbrella. New base = `8264a1c`. | Re-run full MEASURE-FIRST per entrypoint against `8264a1c`. Upstream 4a streams/watchers, 4b workers, 4c sagas are all now A3/A5-clean — attribute remaining 211/138 doc-lint to triggers-owned surface. |
| 2026-06-09 | info | **Inherited umbrella-level `deno.lock` churn (NOT a 4d finding)** | Umbrella carries lock churn introduced by the 4b PLAN-EVAL OpenHands automation (`@opentelemetry/semantic-conventions` 1.40.0→1.28.0 + esbuild/preact/loader; +179/−63 vs `2c24662`). 4b/4c both validated green on it; 4c IMPL-EVAL bot did NOT re-churn it (lesson held). | Do NOT revert here (would re-churn). 4d inherits it; MEASURE-FIRST dry-runs run against it. **Terminal reconcile = Wave 4 closeout (umbrella→track), via one deliberate reviewed lock pass** — 4d is the LAST sub-wave, so this reconcile lands right after 4d merges. Tracked in supervisor registry + `lessons/platform.md`. |
| 2026-06-09 | info | **Inherited umbrella-level CLI carry (NOT a 4d finding)** | `packages/cli` `deno task check` pre-existing `isolatedDeclarations` failures (TS9016/TS9027) in `src/maintainer/.../copy-official-plugin.ts`, plus 4c IMPL-EVAL noted `fresh-ui`/`fresh`/`telemetry` isolated-decl failures — all pre-existing, deferred to Wave 6. | NOT a 4d concern. When running consumer-import against `packages/cli`, scope to type-resolution of the triggers surface only; do not treat pre-existing isolated-declaration failures as a 4d regression. Tracked in `arch-debt.md`. |
| 2026-06-09 | info | **Lesson carried from 4c IMPL-EVAL: full-merge doc-lint, not per-EP** | 4c generator's C14 worklog claimed `private-type-ref-count=0` but IMPL-EVAL found 2 `private-type-ref` (SagaCorrelation) on the full-barrel `mod.ts` because per-entrypoint lint missed the merged builders graph. | 4d generator: final doc-lint gate MUST run `deno doc --lint <pkg>/mod.ts` (full public-barrel merge) and reconcile ptr count against that, not only per-entrypoint runs. The per-EP undercount is exactly the F-7 trap. |

## Implementation drift (append during Implement)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
