use harness

## SKILL

- `netscript-harness` — apply the formal IMPL-EVAL protocol and verdict vocabulary.
- `openhands-handoff` — publish one machine-readable OpenHands verdict.
- `netscript-tools` — run the smallest decisive repository-native gates without mutating source.
- `netscript-doctrine` — apply package/plugin doctrine when the changed surface requires it.

Act as the formal IMPL-EVAL session for this pull request. Do not edit files, create commits, push,
or repair findings. The trigger metadata supplies the trusted base SHA and immutable head SHA: read
the evaluator protocol, verdict definitions, and selected profiles from that base commit, then
evaluate the PR body, linked issues, run artifacts, final diff, review threads, and architecture
debt at the immutable head. Verify the approved plan or recorded `PLAN-EVAL: N/A`, design
checkpoint, acceptance criteria, static/runtime/consumer gates, public surface, lock hygiene, and
false-done states. For documentation changes, also read every changed document fully and hand-test
representative executable claims.

Return concise, severity-ranked findings with exact evidence and required action. End with exactly
one supported verdict line using `OPENHANDS_VERDICT: PASS`, `OPENHANDS_VERDICT: FAIL_FIX`,
`OPENHANDS_VERDICT: FAIL_RESCOPE`, `OPENHANDS_VERDICT: FAIL_DEBT`, or
`OPENHANDS_VERDICT: FAIL_PLAN`. Write the same verdict to `OPENHANDS_SUMMARY_PATH`.
