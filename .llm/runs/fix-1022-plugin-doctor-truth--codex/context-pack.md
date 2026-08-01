# Context Pack: plugin doctor runtime truth

## Current State

Owner-approved plan is recorded and PLAN-EVAL is PASS. The generic manifest-to-adapter doctor
bridge, workers/sagas registry checks, non-zero command exit, and focused regression tests are
implemented locally.

## Key Decisions

- Generic host imports a plugin-owned doctor module declared in the plugin manifest.
- Error reports render first, then a `CliExitError` propagates non-zero status.
- AppHost acceptance boxes 4 and 6 are deferred by owner instruction.

## Next Steps

1. Commit/push the initial slice and open the draft PR.
2. Run the complete scoped gates and fix findings.
3. Update evidence and hand off for Opus 5 IMPL-EVAL.

## Drift and Debt

- Drift: evaluator transport owner override recorded in `supervisor.md`.
- Debt: none created yet.
