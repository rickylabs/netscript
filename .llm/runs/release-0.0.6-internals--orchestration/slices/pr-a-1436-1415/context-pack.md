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

S1 RED is `a927790eb`; S2 boundary is `4ca4cc421`. S3 adds pure classification consumption plus
call-site GitHub lookup for both close-gate and mirror. Next run its focused tests, then implement
the evidence assertion and the six requested gates.
