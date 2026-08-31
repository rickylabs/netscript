use harness

## SKILL

- netscript-harness — perform the Amendment A1 substantive slice review; do not self-certify.
- netscript-doctrine — review the Archetype 2 contract-first test slice and dependency direction.
- netscript-tools — treat the structured RED report as evidence and preserve lock hygiene.

You are the independent opposite-family reviewer for Slice 1 of issue #1824. Work read-only. Do not
edit, commit, push, or contact GitHub. Inspect the uncommitted diff and these run artifacts:

- .llm/runs/fix-sdk-browser-full-key-normalization--impl/research.md
- .llm/runs/fix-sdk-browser-full-key-normalization--impl/plan.md
- .llm/runs/fix-sdk-browser-full-key-normalization--impl/worklog.md
- .llm/runs/fix-sdk-browser-full-key-normalization--impl/red-contract.json

Substantively verify that the tests pin all owner-required contracts: sagas-api and workers-api full
keys, unchanged orders, other invalid resource-name characters, unchanged shorthand, unchanged
server key, and cross-package SDK browser full == Aspire full. Check that the test-only dependency
does not introduce a production package dependency and that the RED failures demonstrate the
intended bug. Return exactly:

VERDICT: PASS or CHANGES_REQUESTED
IDENTITY: observed model/session information available to you
FINDINGS: numbered findings, or none
EVIDENCE: concise files/tests inspected
