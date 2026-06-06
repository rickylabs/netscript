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

## 2026-06-06 — Supervisor bookkeeping caught up to reality (Waves 0–1 merged, 2 staged)

- **What:** The supervisor `worklog`/`context-pack`/`phase-registry`/`commits` were
  frozen at "scaffolded, awaiting Wave 0 launch" while Waves 0, 0b, and 1 had in fact
  merged and Wave 2 had been staged.
- **Source:** `git log --merges origin/feat/package-quality`; draft PR #8.
- **Action:** accept — updated all four supervisor docs to current status. No code change.
- **Severity:** minor (bookkeeping only).

## 2026-06-05 — Wave 0b inserted (not in the original 7-wave map)

- **What:** A harness-reinforcement + agent-docs group (Wave 0b) was inserted between
  Wave 0 and Wave 1; it ships no publishable unit.
- **Source:** PRs #4/#5/#6; `lessons/plan-gate-design-as-gate.md`.
- **Expected:** the registry's 7 publishable waves (0–6).
- **Actual:** an 8th, non-publishable group (0b) that made Plan & Design a gated
  deliverable (two-gate PLAN/IMPL-EVAL) after Wave 0 skipped it. Unit count unchanged (27).
- **Severity:** significant (process), zero surface impact.
- **Action:** accept — recorded as `Wave 0b` in `phase-registry.md`.

## 2026-06-06 — Wave 2 sizing risk vs the Plan-Gate slice cap

- **What:** Wave 2 has 8 units; Wave 1 used 27 slices for 3. At that density Wave 2
  exceeds the Plan-Gate `< 30` slice cap.
- **Source:** `…/feat-package-quality-wave2-adapters--adapters/research.md` OQ-1.
- **Action:** fix — Wave 2 plan agent must resolve OQ-1 (recommended: sub-wave split
  2a/2b/2c). May change the registry's single-group assumption for Wave 2; escalate per
  `supervisor.md` § 4 if so.
- **Severity:** significant (planning).

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
