use harness

## SKILL

- netscript-harness
- netscript-release
- netscript-tools
- netscript-deno-toolchain
- jsr-audit
- netscript-pr
- rtk

Act as the separate formal PLAN-EVAL session for run `.llm/runs/feat-811-release-canary--canary-readiness/` in `/home/codex/repos/b10-canary`.

Read `.llm/harness/evaluator/plan-protocol.md`, `.llm/harness/gates/plan-gate.md`, `.llm/harness/evaluator/verdict-definitions.md`, `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`, the gate matrix, relevant debt, and the run's `research.md`, `plan.md`, and `worklog.md` Design section. Read the named skills in full. Spot-check load-bearing findings against the current tree and PR #810's local branch `fix/mcp-readme-text-import`.

Evaluate only the plan. Do not implement or edit release/product/workflow source. Write the verdict to `.llm/runs/feat-811-release-canary--canary-readiness/plan-eval.md` using the template. Emit exactly `PASS` or `FAIL_PLAN`, with checklist evidence and required fixes. This must be a separate Claude Code + OpenRouter/Qwen session from the Codex generator.
