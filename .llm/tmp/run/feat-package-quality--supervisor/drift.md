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
- **Resolution (2026-06-07):** RESOLVED → promoted to escalation. The Wave 2 generator
  resolved OQ-1 by splitting into 2a (logger·telemetry·aspire, 10 slices) / 2b
  (kv·database·prisma-adapter-mysql, 23 slices) / 2c (queue·cron, 17 slices) — each
  `< 30`, ordered 2a→2b→2c. This changes the registry's single-group assumption →
  recorded in `escalations/wave2-subwave-split.md`; user brief pending on PLAN-EVAL
  routing (see entry below).

## 2026-06-07 — Wave 2 Plan & Design complete; sub-wave split promoted (group-structure change)

- **What:** Wave 2 generator finished Plan & Design (Design checkpoint complete, all
  7 OQs resolved, full A2 matrix selected, real dynamic re-baseline done). The locked
  plan splits Wave 2 into three sub-groups (2a/2b/2c), each with its own branch + PR +
  evaluator pass — a dependency-graph / group-ordering change vs the single-group
  Wave 2 in the registry.
- **Source:** `…/feat-package-quality-wave2-adapters--adapters/{plan.md,worklog.md,drift.md}`.
- **Action:** brief user (escalation.md § 3 answers 2–4 = yes). Do NOT begin
  implementation until (a) user accepts the sub-wave structure + PLAN-EVAL routing and
  (b) PLAN-EVAL returns `PASS` in a separate session. Supervisor does not run PLAN-EVAL.
- **Severity:** significant (group structure / process).
- **Evidence:** `escalations/wave2-subwave-split.md`.
- **Re-baseline note (promoted from wave drift):** carried-in 2026-05 counts were stale
  as expected (L-rebaseline held). Real numbers: logger/kv already clean; telemetry 2
  doc-lint; aspire 20 doc-lint; database 1 slow-type + 22 doc-lint + from-scratch;
  prisma-adapter-mysql 14 doc-lint; queue 19 doc-lint; cron 5 doc-lint.

## 2026-06-07 — PLAN-EVAL PASS; ARCHETYPE-2 gate list lags the gate matrix (doc drift)

- **What:** Wave 2 PLAN-EVAL cycle 2 returned `PASS`. In doing so the evaluator found the
  plan's A2 fitness set stopped at F-15, and added F-16/F-17/F-18 in place (instruction #10).
  Root cause: `archetypes/ARCHETYPE-2-integration.md`'s gate list disagrees with
  `gates/archetype-gate-matrix.md`, which marks F-16/F-17/F-18 `required` for Arch 2.
- **Source:** PR #8 PLAN-EVAL PASS comment (4640656448); `gates/archetype-gate-matrix.md` rows 32–34.
- **Action:** **the matrix governs.** Two outcomes: (1) reinforces **L-full-matrix** — every
  future generator prompt must select the gate set from the *matrix*, not an archetype doc's
  prose list; (2) cross-cutting doc-drift to fix so Waves 3–6 don't re-inherit a stale list —
  reconcile `ARCHETYPE-2-integration.md` (and spot-check the other ARCHETYPE-*.md gate lists)
  against the matrix, or file a debt entry. Carried as a standing supervisor item.
- **Severity:** significant (would silently under-gate future waves if unaddressed).

## 2026-06-08 — Wave 2 complete; two out-of-scope caveats carried to downstream tracks

- **What:** Wave 2 (2a+2b+2c, 6 packages) merged to the track via umbrella PR #11
  (`d4f971e`). Two failures surfaced during 2c that are **out-of-scope** for the
  messaging rename and were adjudicated as non-blocking by IMPL-EVAL, but they
  must not be lost — they belong to downstream tracks.
- **Caveat 1 — `e2e:cli` `behavior.triggers-health`:** the final 2c merge-readiness
  `deno task e2e:cli` ran 35 passed / 1 failed. The sole failure is a generated
  trigger-service runtime health probe (`localhost:8093/health`, os error 10054
  conn reset), not a queue/cron compile/surface/publish/doc-lint failure. **Owner:
  Wave 3 (`@netscript/plugin` host) / Wave 4 (`plugin-triggers`)** — determine
  which layer owns the regression during Wave 3 scoping.
- **Caveat 2 — `cli-maintainer-sync-isolated-declarations`:** 3 pre-existing
  TS9016/TS9027 errors in `packages/cli/.../copy-official-plugin.ts:205`,
  byte-identical to base, CLI imports neither queue nor cron. Recorded in
  `.llm/harness/debt/arch-debt.md`. **Owner: Wave 6 (CLI).**
- **Severity:** significant (cross-wave hand-off; would be lost if not tracked).
- **Action:** accept + carry forward. Both recorded in `phase-registry.md` Wave 2
  closeout + Wave 3 notes. Do not block Wave 2 (per plan risk register).
- **Process note:** four harness lessons promoted to `.llm/harness/lessons/`
  (`package-quality-archetype`, `sub-wave-orchestration`, `validation`, `platform`)
  — the durable Wave 2 knowledge, archetype-agnostic.

## 2026-06-05 — Stale slow-type counts must be re-measured

- **What:** The 2026-05 readiness numbers predate the platform rewrite.
- **Source:** nested `audit/readiness/_summary.md`, `audit/JSR-DRY-RUN-MATRIX.md`.
- **Expected:** the per-package "today's state" counts in the nested plans.
- **Actual:** many `*-core` units and their plugins reached 0 slow-types during the
  rewrite; some non-runtime packages may have shifted too.
- **Severity:** minor
- **Action:** fix — Wave 0 re-runs `.llm/tools/fitness/release-readiness.ts` in this repo
  and supersedes the stale numbers before any wave refactors.
- **Evidence:** to be produced by the Wave 0 baseline re-audit.

## D-SUP-W6 — Wave 6 generator runs slices continuously (not strict per-slice eval-gate)

- **Source:** maintainer directive (2026-06-16): sub-agents must respect a per-slice
  commit→push→PR-comment pace and "work without interruption until fully done."
- **Expected (harness default):** per slice — generator brief → impl → SEPARATE IMPL-EVAL →
  supervisor re-verifies → next slice (generator idles between slices).
- **Actual:** ONE Codex generator executes Slices 0,1,2,3,5 end-to-end, committing+pushing per
  slice and not idling. IMPL-EVALs run as separate OpenHands sessions triggered by the supervisor
  as slices land (in parallel / after), and the supervisor still independently re-verifies. The
  hard merge gate is preserved: Slice 2 self-runs `scaffold.runtime` and stops if not 41/41.
- **Severity:** minor (process cadence, not scope/quality). Dual-session evaluation and the
  load-bearing gate are intact; only the inter-slice barrier is relaxed for momentum.
- **Action:** accept. Supervisor posts per-slice PR #43 comments (gh unauth in WSL) and routes
  IMPL-EVALs; any eval FAIL_FIX becomes a follow-up fix slice rather than blocking the run.

## D-SUP-W7 — Test-suite green-up (PR #46) de-cataloged the workspace; reverted by maintainer directive

- **What:** The Slice 7 green-up generator hit `deno task test` exit 1 with
  `Unsupported scheme "catalog"` resolving member graphs, and "fixed" it by destroying the Deno
  workspace catalog — twice. (1) `103f9a8` materialized member `catalog:` → per-member pinned
  `npm:`; maintainer rejected. (2) head `30ed34b6` stripped all 67 `catalog:` refs across 18 member
  `deno.json` and dumped concrete versions into root `imports` (root `catalog` block orphaned).
- **Source:** maintainer directive (2026-06-17); PR #46 diff vs base `733388f`.
- **Why it matters:** the catalog is intentional centralized dependency management; removing it
  breaks single-source versioning AND JSR publishability (published packages must declare imports
  via `catalog:`, not a workspace-root flat `imports` map).
- **Brief gap (root cause):** the green-up BRIEF.md had no catalog-protection boundary, so the
  agent treated catalog as fair game. Standing lesson: every generator brief touching `deno.json`
  must declare the catalog wiring off-limits.
- **Action:** supervisor steered. Original session `019ed499` was context-exhausted (resume errors
  "ran out of room"), so launched a FRESH thread `019ed571` on the same worktree with a maintainer-
  authority correction file (`SUPERVISOR-CORRECTION.md`). Result: commit `20d6b036` "revert
  de-catalog; restore 67 catalog: refs + root imports {}" — verified catalog-wiring diff vs
  `733388f` is empty, 67 refs across 18 files, root imports `{}`. Agent is re-running
  `deno task test` from the workspace root with catalog preserved; hard-stop instruction = if not
  green with catalog intact, record root cause in drift, do NOT de-catalog again.
- **Severity:** significant (would have shipped a broken deps model + unpublishable packages).
- **Gate:** Phase P remains blocked until `deno task test` is green WITH the catalog intact.
