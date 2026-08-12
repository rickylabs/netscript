# Drift — #1405

## 2026-08-12 — bare test command lacks package permissions

- Severity: minor gate-invocation mismatch.
- Expected: `deno test packages/plugin-streams-core` passes as written in the brief.
- Observed: it exits 1 with 19 `NotCapable` failures because tests read
  `DURABLE_STREAMS_URL` and the command grants no env permission; 14 permission-free tests pass.
- Action: preserved the red evidence and ran the checked-in package task, which grants the package's
  declared test permissions and passes 33/33. No test or permission surface was edited.

## 2026-08-12 — root quality gate omits the target package

- Severity: minor gate-coverage limitation.
- Expected: mandatory `quality:gate` provides changed-package quality evidence.
- Observed: it exits 0, but its configured scan/doctrine roots do not include
  `packages/plugin-streams-core`.
- Action: ran an explicit target quality scan (`findings=[]`, `allowCount=0`) and target doctrine
  audit. The doctrine audit has no failures and one 500-line-cap warning: the supervisor is 515
  lines after this locked change (baseline 497). A structural split is outside the no-refactor slice.
