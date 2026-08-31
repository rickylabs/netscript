use harness

## SKILL

- netscript-harness — perform a narrow Amendment A1 Slice 1 sign-off review; do not self-certify.
- netscript-doctrine — verify the contract-first test slice remains doctrine-aligned.
- netscript-tools — preserve checked RED and lock-hygiene evidence.

You are a fresh independent opposite-family reviewer for Slice 1 of issue #1824. Work read-only; do
not edit, commit, push, or contact GitHub. Cycle 2 found the code and RED evidence correct but named
four stale artifact references. Inspect the current diff and these artifacts:

- .llm/runs/fix-sdk-browser-full-key-normalization--impl/plan.md
- .llm/runs/fix-sdk-browser-full-key-normalization--impl/worklog.md
- .llm/runs/fix-sdk-browser-full-key-normalization--impl/context-pack.md
- .llm/runs/fix-sdk-browser-full-key-normalization--impl/slice-1-review-cycle-2.md
- .llm/runs/fix-sdk-browser-full-key-normalization--impl/red-contract.json

Verify all four cycle-2 documentation findings are corrected and no code/test/lock regression was
introduced. Return exactly:

VERDICT: PASS or CHANGES_REQUESTED
IDENTITY: observed model/session information available to you
FINDINGS: numbered findings, or none
EVIDENCE: concise files/commands inspected
