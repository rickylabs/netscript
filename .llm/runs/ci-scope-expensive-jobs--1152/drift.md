# Drift — ci-scope-expensive-jobs--1152 (append-only)

- 2026-08-03 `minor` — #1151 was executed outside a run dir, per the owner brief's explicit
  "you may just fix, verify and push" waiver; its trail lives on PR #1153 (body + evidence
  comment) instead of harness artifacts.
- 2026-08-03 `minor` — PLAN-EVAL not yet dispatched: the evaluator lane (separate open-model
  session per `lane-policy.md`) is supervisor-triggered; this session stopped at the plan report
  as the brief requires ("Report your plan before implementing #1152").
