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
| 2026-06-10 | info | D1 `publish:dry-run` task already present before implementation | `packages/plugin-triggers-core/deno.json` already contained `"publish:dry-run": "deno publish --dry-run --allow-dirty"` at slice start; D1 plan expected adding it alongside `test` and expanded `check`. | Treat as closed-by-base hygiene. D1 implementation changed only the missing `test` task and widened `check` to all 11 export entrypoints. |
| 2026-06-09 | info | Pull-forward done by supervisor | 4a (`2c24662`) + 4b (`1896f854`, PR #19) + 4c (`8264a1c`, PR #20) all merged; 4d merged the umbrella (`8264a1c`) → merge `32637a9`, clean (ort, no conflicts), `deno.lock` identical to umbrella. New base = `8264a1c`. | Re-run full MEASURE-FIRST per entrypoint against `8264a1c`. Upstream 4a streams/watchers, 4b workers, 4c sagas are all now A3/A5-clean — attribute remaining 211/138 doc-lint to triggers-owned surface. |
| 2026-06-09 | info | **MEASURE-FIRST re-baseline: per-EP vs combined vs barrel reconciliation** | Core: per-EP sum 279 ptr / 490 total; combined run 46 ptr / 211 total; barrel `mod.ts` 55 ptr / 78 total. Plugin: per-EP sum 97 ptr / 165 total; combined run 76 ptr / 138 total; barrel `mod.ts` 6 ptr / 9 total. **Ground truth = combined run** (all EPs in one invocation). Barrel undercounts total; per-EP sum overcounts ptr. | Final doc-lint gate MUST use combined run. Recorded in `research.md` §1.3. |
| 2026-06-09 | info | **MEASURE-FIRST: `behavior.triggers-health` PASS on base** | E2E gate `behavior.triggers-health` → `http://127.0.0.1:8093/health` passed in 16ms on `8264a1c`. Port 8093 confirmed. | OQ-D resolved; 4d owns the health probe as A5 runtime evidence. No regression. |
| 2026-06-09 | info | **MEASURE-FIRST: `verify-plugin.ts` MISSING** | `plugins/triggers` has no `verify-plugin.ts`; all sibling A5 plugins (workers, streams, sagas) have one. | In-scope: slice D18. |
| 2026-06-09 | info | **MEASURE-FIRST: core F-6 gaps** | `plugin-triggers-core` missing `test` and `publish:dry-run` tasks; `check` only covers `mod.ts`. | In-scope: slice D1. |
| 2026-06-09 | info | **Inherited umbrella-level `deno.lock` churn (NOT a 4d finding)** | Umbrella carries lock churn introduced by the 4b PLAN-EVAL OpenHands automation (`@opentelemetry/semantic-conventions` 1.40.0→1.28.0 + esbuild/preact/loader; +179/−63 vs `2c24662`). 4b/4c both validated green on it; 4c IMPL-EVAL bot did NOT re-churn it (lesson held). | Do NOT revert here (would re-churn). 4d inherits it; MEASURE-FIRST dry-runs run against it. **Terminal reconcile = Wave 4 closeout (umbrella→track), via one deliberate reviewed lock pass** — 4d is the LAST sub-wave, so this reconcile lands right after 4d merges. Tracked in supervisor registry + `lessons/platform.md`. |
| 2026-06-09 | info | **Inherited umbrella-level CLI carry (NOT a 4d finding)** | `packages/cli` `deno task check` pre-existing `isolatedDeclarations` failures (TS9016/TS9027) in `src/maintainer/.../copy-official-plugin.ts`, plus 4c IMPL-EVAL noted `fresh-ui`/`fresh`/`telemetry` isolated-decl failures — all pre-existing, deferred to Wave 6. | NOT a 4d concern. When running consumer-import against `packages/cli`, scope to type-resolution of the triggers surface only; do not treat pre-existing isolated-declaration failures as a 4d regression. Tracked in `arch-debt.md`. |
| 2026-06-09 | info | **Lesson carried from 4c IMPL-EVAL: full-merge doc-lint, not per-EP** | 4c generator's C14 worklog claimed `private-type-ref-count=0` but IMPL-EVAL found 2 `private-type-ref` (SagaCorrelation) on the full-barrel `mod.ts` because per-entrypoint lint missed the merged builders graph. | 4d generator: final doc-lint gate MUST run `deno doc --lint <pkg>/mod.ts` (full public-barrel merge) and reconcile ptr count against that, not only per-entrypoint runs. The per-EP undercount is exactly the F-7 trap. |

## PLAN-EVAL drift (append during Plan-Eval)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-09 | warn | **Stale OpenHands `<!-- openhands-agent-summary -->` PR comment** — the auto-summary comment posted on PR #21 for the 4d PLAN-EVAL run shows the **prior 4c sagas IMPL-EVAL `FAIL_FIX`** body, not the 4d PLAN-EVAL verdict. | PR #21 comment `4664487688` (`updated_at` 22:11:23 = same instant as the 4d PLAN-EVAL bot commit `bb985d0`) reads "OpenHands Summary — Wave 4 · 4c sagas IMPL-EVAL (PR #20) … FAIL_FIX". The committed `plan-eval.md` (`bb985d0`) is the genuine 4d artifact (23 slices D1–D23, A3 core/A5 plugin, spot-checks `test-webhooks-e2e.ts` 423 + core `check` task) → verdict **PASS**. `summary.md` was not refreshed for this run. | **Verdict source = the committed `plan-eval.md` / `evaluate.md`, NOT the PR-comment summary.** 4d PLAN-EVAL = PASS confirmed. Promoted to `lessons/platform.md`. Do not let the stale comment mislead the IMPL-EVAL or umbrella-merge review. |

## Implementation drift (append during Implement)

| Date | Severity | Item | Evidence | Action |
|------|----------|------|----------|--------|
| 2026-06-10 | info | D5 pulled same-file D8 JSDoc blockers forward | After the D5 type re-exports, raw `deno doc --lint src/{adapters,ports,runtime}/mod.ts` no longer reported `private-type-ref` but still failed on public member `missing-jsdoc` in the D5-owned file set. D5's per-slice gate must be raw green, not filtered. | Added concise JSDoc to the affected ports/runtime/adapters public members in D5. D8 will have fewer remaining ports/runtime/adapters JSDoc items; no scope expansion beyond D5's planned file set. |
| 2026-06-10 | info | D6 pulled same-file D7/D9 JSDoc blockers forward | After the D6 type re-exports, raw `deno doc --lint src/{telemetry,testing}/mod.ts` still failed on public member `missing-jsdoc` in the D6-owned file set. D6's per-slice gate must be raw green, not filtered. | Added concise JSDoc to affected telemetry/testing public members in D6. D7/D9 will be residual validation/smaller documentation slices; no scope expansion beyond D6's planned file set. |
