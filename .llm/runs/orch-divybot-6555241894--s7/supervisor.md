# S7 phase 1 supervisor

- Assignment #2420; supplied leaf process; feature tier, implementation role.
- Implementer: Codex, OpenAI family; owner-requested Sol 6.1 xhigh.
- Baseline: 6a1d84a6e04c0d39df3926528e0380e267316aee.
- Branch: orch/divybot-6555241894; worktree: repository root.
- Matrix queried with `deno task agentic:matrix --tier feature --json`: implementation sol/xhigh → muse_spark_1_3/xhigh; PLAN-EVAL glm_5_3/provider_default → fable_5_1/low; IMPL-EVAL muse_spark_1_3/xhigh → opus_5/xhigh.
- Explicit owner evaluator override: `claude -p --model claude-opus-5-5 --effort high`, read-only, separate Anthropic session. Maximum two plan rounds; five implementation rounds; stop on two consecutive terminal failures.
- Writable surface: `docs/site/design-system/**`, `docs/site/_plugins/**`, `docs/site/_includes/**`, `docs/site/_components/**`, `docs/site/_data/**`, `docs/site/_config.ts`, `docs/site/deno.json`, `docs/site/static/**`, `tools/docs-site/**`, `.llm/tools/docs/**`, `packages/mcp/src/**`, generated documentation/publish carriers in `packages/cli/src/kernel/assets/**`, `packages/plugin/src/kernel/assets/**`, `packages/mcp/**`, `deno.json`, `.llm/runs/orch-divybot-6555241894--s7/**`.
- Private evidence is outside the worktree in the project's dated runs directory. Public artifacts use repo-relative paths, no session IDs or raw leak inventory.
- No dependency changes planned; Deno 2.9.7. RTK unavailable.
- Specific operator rules override generic boilerplate: draft PR, Refs #2420 only, no labels; no rebase/force push; Cockpit merges. Assignment file never committed.
