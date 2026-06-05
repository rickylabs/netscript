# Drift Log: S1 — Package Quality (supervisor)

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or
current-state documentation.

## 2026-06-05 — Surface reconciliation: 29 units (2026-05) → 27 units (now)

- **What:** The nested canonical run's inventory does not match the current repo.
- **Source:** `.llm/tmp/run/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/PLAN.md` § 2; live `packages/`+`plugins/` deno.json scan.
- **Expected:** 29 publishable units (24 packages + 5 plugins), including
  `@netscript/{streams,triggers,workers,sagas}` packages and `plugins/hello-world`.
- **Actual:** 27 publishable units (23 packages + 4 plugins). The plugin-platform
  rewrite (`netscript-start` PR #84/#86–#95) replaced the old runtime packages with
  `@netscript/plugin-{streams,workers,sagas,triggers}-core` and removed
  `plugins/hello-world` (the `netscript plugin scaffold` template replaces it).
- **Severity:** significant
- **Action:** accept — `phase-registry.md` already maps the 7 waves onto the current
  27-unit surface; each wave reconciles the nested per-package docs to the new names
  via `harmonisation/PR84-COMPATIBILITY.md`.
- **Evidence:** `phase-registry.md` Summary Table (1+3+8+1+9+4+1 = 27);
  `harmonisation/PR84-COMPATIBILITY.md`.

## 2026-06-05 — Stale slow-type counts must be re-measured

- **What:** The 2026-05 readiness numbers predate the platform rewrite.
- **Source:** nested `audit/readiness/_summary.md`, `audit/JSR-DRY-RUN-MATRIX.md`.
- **Expected:** the per-package "today's state" counts in the nested plans.
- **Actual:** many `*-core` units and their plugins reached 0 slow-types during the
  rewrite; some non-runtime packages may have shifted too.
- **Severity:** minor
- **Action:** fix — Wave 0 re-runs `tools/fitness/release-readiness.ts` in this repo
  and supersedes the stale numbers before any wave refactors.
- **Evidence:** to be produced by the Wave 0 baseline re-audit.
