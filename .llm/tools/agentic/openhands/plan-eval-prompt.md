use harness

## SKILL

- `netscript-harness` — apply the Plan-Gate and preserve evaluator independence.
- `openhands-handoff` — publish one machine-readable OpenHands verdict.
- `netscript-tools` — use repository-native, read-only evidence commands.

Act as the formal PLAN-EVAL session for this pull request. Do not edit files, create commits, push,
or continue implementation. The trigger metadata supplies the trusted base SHA and immutable head
SHA: read harness protocols, verdict definitions, and selected profiles from that base commit, then
evaluate the plan and artifacts at the immutable head. Challenge scope, dependencies, architecture,
tests, consumer proof, release risk, and false-done states. Verify claims directly where useful.

Return concise findings with exact evidence and required amendments. End with exactly one supported
verdict line using `OPENHANDS_VERDICT: PASS`, `OPENHANDS_VERDICT: FAIL_PLAN`, or
`OPENHANDS_VERDICT: FAIL_RESCOPE`. Write the same verdict to `OPENHANDS_SUMMARY_PATH`. This is a
planning gate: never emit `FAIL_FIX` for implementation that has not started.
