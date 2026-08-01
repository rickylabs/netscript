# Drift

## D1 — Evaluator waiver

The owner explicitly waived open-model PLAN-EVAL and assigned both PLAN-EVAL and IMPL-EVAL to the
supervisor. No external evaluator is launched and no `plan-eval.md` is fabricated.

## D2 — Final-only push

The harness normally prefers per-slice pushes. The slice brief requires one explicit final refspec,
so reviewable commits remain local until all required gates pass.
