use harness

## SKILL
Opposite-family review of Claude-authored repo tooling (review_claude lane). Findings must be checkable; run the tests yourself. No fixes unless trivial; findings report is the deliverable.

## Task — review PR #1217 (branch feat/agentic-claude-openrouter-run)
Worktree: /home/codex/repos/ns-clor. Diff: a194d5a03..HEAD (6 files: openrouter-run.ts + tests, claude-print.ts refactor, config/versions.ts constant, deno.json task, README section).

Focus: (1) the claude-print.ts refactor — does the exported runClaudePrint preserve the guard kill/escalation semantics and exit-code fidelity of the previous inline flow? Is the guard env spread genuinely override-proof? (2) credential handling — can the key leak to stdout/logs/argv? Is blanking ANTHROPIC_API_KEY sufficient against a cached native login? (3) parseOpenRouterApiKey reuse from opencode-run.ts — sound coupling or hidden cycle? (4) test quality — do the 6 tests actually pin the mapping/guard behavior? Run: deno test --no-lock --allow-read --allow-env --allow-run .llm/tools/agentic/claude/openrouter-run_test.ts and the volatile guard test. (5) anything that would burn OpenRouter credit silently.

Write /home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/clor-review/review.md with findings (blocking/major/minor + evidence) and verdict APPROVE / FIX_FIRST. Do not commit or push.
