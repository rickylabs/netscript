# Drift Log: plan-devtools-contribution--seed

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-11 — D-1: `major_ui_ux_*` GLM 5.2 lanes reactivated for this run

- **What:** This run dispatches the `major_ui_ux_design` GLM 5.2 xhigh pass (stage D2).
- **Source:** `.llm/harness/workflow/lane-policy.md` § Canonical routes; charter
  `.llm/devtools-rfc-orchestrator-brief.md` § Identity, routes, and evaluation.
- **Expected:** `lane-policy.md` marks the `major_ui_ux_*` GLM lanes **dormant** while the Dev
  Dashboard is paused (epic #400 moved to `0.0.1-beta.13`).
- **Actual:** The charter mandates the GLM pass for this RFC because the subject *is* major UI/UX
  architecture. The same `lane-policy.md` entry states the lanes "remain the enforced route for any
  major UI/UX work that does run" — so this is a reactivation of a dormant-but-enforced lane, not a
  route invention.
- **Severity:** minor
- **Action:** accept — recorded in `supervisor.md` § Recorded lane/eval overrides.
- **Evidence:** `lane-policy.md:49-53`; charter lines 44-49.

## 2026-08-11 — D-2: IMPL-EVAL is N/A by run shape

- **What:** No IMPL-EVAL session will be dispatched.
- **Source:** charter § Identity, routes, and evaluation; `.llm/harness/workflow/run-loop.md` § 7.
- **Expected:** `run-loop.md` makes IMPL-EVAL mandatory unless the owner explicitly waives it.
- **Actual:** The run commits **no implementation** — its changeset is an RFC plus run artifacts.
  There is no implementation for an IMPL-EVAL to evaluate.
- **Severity:** minor
- **Action:** accept, with substitute assurance recorded rather than the gate silently dropped:
  (a) the formal opposite-family Codex GPT-5.6 Sol high **PLAN-EVAL** at stage G against an immutable
  commit, and (b) the docs accuracy / link / format gate set on the RFC changeset.
- **Evidence:** charter lines 52-53; `supervisor.md` § Routes in force.

## 2026-08-11 — D-3: GLM 5.2 transport capability recorded honestly up front

- **What:** Pre-registering the GLM transport limitation before its output exists, so no later
  artifact can accidentally cite it as reasoning evidence.
- **Source:** `.llm/harness/workflow/lane-policy.md` § OpenRouter through Claude Code (drift D-4,
  amended) — per-model capability table.
- **Expected:** —
- **Actual:** `z-ai/glm-5.2` on the Claude Code + OpenRouter transport returns **zero thinking
  blocks**: tools + streaming, **no reasoning trace**. Its `xhigh` effort is therefore nominal on
  this transport.
- **Severity:** minor
- **Action:** accept — every citation of the stage-D2 pass states "tools + streaming, no reasoning
  trace" and never "GLM 5.2 · xhigh reasoning". GLM is never this run's formal evaluator.
- **Evidence:** `lane-policy.md:185-198`.
