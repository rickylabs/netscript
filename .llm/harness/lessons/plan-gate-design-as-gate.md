# Lesson: Design must be a gate, not just evidence

## Context

Package-quality Wave 0 (`@netscript/shared`) skipped Plan & Design even though
`run-loop.md` documented a Design checkpoint. Implementation was sound, but
decisions that should have been settled up front were settled during
implementation, producing avoidable drift and a late decision-shift.

## Root cause

Design lived as a `## Design` evidence section inside `worklog.md`, and the only
evaluator pass ran after implementation. Nothing blocked an agent from going
straight to slices, and by the time the evaluator could flag a missing or weak
plan the cost was already paid. A carried-in audit that predated PR #98 also
gave false confidence that planning was "done."

## Rule

- Plan & Design is a gated phase ending in PLAN-EVAL (`gates/plan-gate.md`,
  `evaluator/plan-protocol.md`). No implementation slice is committed before a
  `PASS`.
- Carried-in plans/audits are starting skeletons; re-baseline against current
  `main` and record what changed before locking the plan.
- The reference for a well-run plan PR is netscript-start PR #95.

## Promotion

Promoted to `lessons/` because it is a stable, cross-run mechanic (every wave,
every supervisor program), per the harness promotion rule.
