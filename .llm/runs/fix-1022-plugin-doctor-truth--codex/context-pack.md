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

1. Commit/push final evidence.
2. Hand draft PR #1045 to the Opus 5 supervisor for IMPL-EVAL.

## Drift and Debt

- Drift: evaluator transport owner override recorded in `supervisor.md`; production config child
  loader flattens Zod issues, so acceptance box 5 remains unticked.
- Debt: none created yet.
