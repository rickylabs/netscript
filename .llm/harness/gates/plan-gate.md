# Plan-Gate

The Plan-Gate is the first of the two harness evaluator passes. It runs at the
end of Plan & Design, **before any implementation slice is committed**, and is a
hard stop: implementation may not begin until the verdict is `PASS` or the user
waives it in writing. PLAN-EVAL runs in a **separate session** using
`evaluator/plan-protocol.md`.

## Why this gate exists

Package-quality Wave 0 skipped Plan & Design even though `run-loop.md` documented
a Design checkpoint, because Design was an evidence section inside `worklog.md`
rather than a gated deliverable. Decisions that should have been made before
implementation were made during it, producing avoidable drift. The Plan-Gate
makes Plan & Design a deliverable with its own verdict, so the cheap fix (change
the plan) happens before the expensive one (rewrite the code). The gold-standard
reference is netscript-start PR #95.

## Checklist

A plan PASSES only if every box is checked. Any unchecked box → `FAIL_PLAN`.

- [ ] **Research present and current.** `research.md` exists; any carried-in
      plan/audit/run is explicitly re-baselined against current `main`.
- [ ] **Decisions locked.** Architecture decisions are stated with rationale.
- [ ] **Open-decision sweep.** Every still-open decision is listed and marked
      "safe to defer" or "must resolve now." **If any open decision would force
      rework when deferred → `FAIL_PLAN`.**
- [ ] **Commit slices.** Enumerated, ordered, < 30. Each names what it proves,
      the gate that proves it, and the files it touches.
- [ ] **Risk register.** Risks listed with mitigations.
- [ ] **Gate set selected.** Required gates chosen from
      `gates/archetype-gate-matrix.md` for this surface, plus scope overlays.
- [ ] **Deferred scope explicit.**
- [ ] **jsr-audit (package/plugin waves).** The `jsr-audit` skill's
      publishability rubric has been applied to the PLANNED public surface and
      slow-type / surface risks are named before slicing. Mark `N/A` with a
      reason for non-package waves.

## Verdict

- `PASS` — every box checked; implementation may begin.
- `FAIL_PLAN` — one or more boxes unchecked; return the plan with the specific
  items and required fixes. Two `FAIL_PLAN` cycles, then escalate to the user.

## Phase A reporting

Where a check has no script yet, PLAN-EVAL reports it as `PASS` with manual
evidence or `PENDING_SCRIPT` with manual evidence. Absence of a script is not
permission to omit the check.
