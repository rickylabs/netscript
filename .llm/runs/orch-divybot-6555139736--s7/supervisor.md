# S7 phase 1 supervisor

- Assignment: #2420, supplied leaf profile; feature tier.
- Implementer: Codex, OpenAI family, high effort, owner-selected seat.
- Baseline: 6a1d84a6e04c0d39df3926528e0380e267316aee.
- Branch: orch/divybot-6555139736; worktree: repository root.
- Owner evaluator override: `claude -p --model claude-opus-5-5 --effort high`, read-only, separate Anthropic session for PLAN-EVAL and IMPL-EVAL.
- Matrix queried using `deno task agentic:matrix --tier feature --json`: implementation sol/xhigh → muse_spark_1_3/xhigh; plan evaluation glm_5_3/provider_default → fable_5_1/low; implementation evaluation muse_spark_1_3/xhigh → opus_5/xhigh. Owner's explicit seats take precedence. Plan maximum two rounds; implementation maximum five rounds with stop after two consecutive terminal failures.
- Writable surface: docs/site/design-system/**, docs/site/_plugins/**, docs/site/_includes/**, docs/site/_components/**, docs/site/_data/**, docs/site/_config.ts, docs/site/deno.json, docs/site/static/**, tools/docs-site/**, .llm/tools/docs/**, packages/mcp/src/**, generated documentation and publish carriers under packages/cli/src/kernel/assets/** and packages/plugin/src/kernel/assets/**, deno.json, .llm/runs/orch-divybot-6555139736--s7/**.
- Private evaluator transcripts and browser output: project runs directory, never committed. Public evidence uses repository-relative paths and no session identifiers.
- Assignment file remains excluded. No labels, merges, rebases, or force pushes. Follow owner-specific draft/Refs-only instruction over generic delivery boilerplate.
