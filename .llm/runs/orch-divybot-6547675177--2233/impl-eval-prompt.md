## SKILL

Use netscript-harness, netscript-doctrine, netscript-pr, and netscript-tools for this scoped review. No profiles/ reads. The owner explicitly requests this evaluator model/effort and read-only blockers-only review.

You are the independent IMPL-EVAL reviewer for issue #2233, PR #2546. Read-only: do not edit files, post comments, or create commits. The implementation session is OpenAI; you are the separate Anthropic evaluator. Review the current working-tree implementation before the sign-off commit. Later you will be resumed to review the exact pushed head.

Read .llm/runs/orch-divybot-6547675177--2233/{plan,plan-eval,worklog,context-pack,drift,validation}.md and negative-controls.json, relevant docs .llm/tools/docs/generated-carriers.md, and the two changed files:
packages/cli/src/public/adapters/agent/deno-agent-docs-generator.ts
packages/cli/src/public/adapters/agent/deno-agent-docs-generator_test.ts
Read .llm/tools/docs/agent-docs-page-carrier.ts and the actual init installer if necessary to verify the chain.

Owner chose option (b): restore exact historical rows Prose source commit and Prose extraction time with nonvolatile data, add strict full-MANIFEST byte parity from canonical generated carrier through real generator and real consumer installation, preserve determinism/line mergeability. The API generation clock is intentionally retained and fixed for parity. Corpus hash is computed at install time, never stored in sidecar/carrier. The parity test independently reads canonical carrier and constructs expected bytes; it uses the real generator and initAgent installer. Four row removal/volatility mutations fail the actual byte assertion.

Check correctness, public API/dependency stability, no locks, scope, test independence, and sufficient recorded validation. Owner forbids local scaffold.runtime; this scope does not change scaffold/plugin/DB/Aspire/runtime wiring so e2e-cli is not required. PR is Refs-only and labels/milestone coordinator-owned by explicit owner direction. Do not flag these as blockers. No need to audit unrelated baseline debt/warnings. Report concrete blockers only, with location and minimal correction; otherwise say no blockers and briefly explain inspected proof. End with VERDICT: PASS or VERDICT: FAIL_FIX.
