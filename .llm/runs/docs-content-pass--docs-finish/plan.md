# Plan & Design — READY FOR REVIEW

SCOPE-docs. Finish the seven-lane content and applied IA branch. Read integration-tracker.md, ia-plan.md and idioms-rule.md in .llm/runs/docs-content-pass.

1. Reconcile main after renderer merge; retain a merge commit.
2. Correct ephemeral endpoint guidance, anonymous dashboard access, service calls, tutorial/scaffold mismatches, canonical CLI install/help and redirect links. Prove source alignment and navigation/source-format tests.
3. Generate agent prose once and commit. Generate MCP export corpus, assets barrel and publish assets, then run every applicable check task, docs links/snippets/accuracy/exports and site verify. Revert docs lock churn.
4. Independent Gemini evaluation and green CI, including the docs browser job, before an ordinary squash merge.

Risks: generated prose preserves non-site context from its input; preserve main's non-site entries. Do not run build writers or link checks concurrently. Correct examples from actual templates, never from stale prose. PLAN-EVAL N/A: owner supplied order, scope, concrete acceptance and gates; no new public contract.
