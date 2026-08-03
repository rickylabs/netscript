# Context Pack

## State

Harness bootstrap/research/plan complete on `fix/1016-scaffold-hygiene` at baseline `4634afe56`. No implementation started. PLAN-EVAL is the hard stop.

## Key facts

- #1016 boundary generators and emitted root/app files are present; only a counterfactually sensitive hostile-parent E2E remains.
- #1021 is not reproducible on current main: generated route files are tracked and a clean generated-project clone passes README `deno task check`.
- #1039 remains reproducible: all seven AI starters lack explicit sample classification.
- Never touch #1017 transport/plumbing.

## Next

Run separate-session PLAN-EVAL. On PASS, bootstrap the draft PR from the plan commit and implement one pushed/commented issue slice at a time.
