# Drift — docs accuracy

## 2026-07-31 — owner-authorized mechanical fast path

- Severity: process override
- Expected: standard harness plan document and PLAN-EVAL.
- Actual: the assignment explicitly says “MECHANICAL: go straight to implementation. Do not write
  a plan document.”
- Resolution: no `plan.md` or PLAN-EVAL; research and Design checkpoint retained, with separate
  IMPL-EVAL still required.

## 2026-07-31 — issue framing corrections

- #965 had already been corrected in current docs; this slice adds the regression contract.
- #971’s APIs were individually documented; the missing root was a preferred-route index.
- #972’s universal dry-run direction is unsafe/overbroad for external mutations; the map records
  actual preview support and blast radius.
