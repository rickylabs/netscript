# PR-A context pack

## Current state

S1 adds executable RED contracts for #1436 and #1415 on top of base `01aa12b67`. The focused test
command exits 1 with six missing-classification-contract type errors. No production predicate has
changed yet. PR #1527 is the sole draft PR; the orchestrator retains merge authority.

## Locked contracts

- Closing keywords reject only preceding word characters or hyphens; punctuation remains valid.
- Regex-derived PR references are excluded visibly; failed classification remains gated visibly.
- Not-yet-done evidence is rejected only when it would newly tick an unchecked acceptance box.
- Work stays inside `.llm/tools/validation/**` and this slice directory.

## Next

Implementation is complete through S4: S1 `a927790eb`, S2 `4ca4cc421`, S3 `0329acaf8`, S4
`c095303c8`. S5 has green scoped check/lint/fmt, green probe and live mirror dry-run, plus a green
48-test amended suite. The original command's missing-permission failure and the accepted narrow
predicate limit are recorded in `drift.md`. Final-head S5 evidence is ready for the PR timeline.
Next: orchestrator review. Do not merge, leave draft, and do not apply `status:ready-merge`.
