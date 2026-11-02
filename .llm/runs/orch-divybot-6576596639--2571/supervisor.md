# Northwind showcase supervisor

- Assignment: #2571, opt-in Northwind commerce showcase for 0.0.9.
- Branch: `orch/divybot-6576596639`.
- Baseline: `b3c15fa582d456f7c5c4e6cd8c2b84abcad6894f`.
- Implementation: Codex, feature tier, matrix primary `sol`, effort `xhigh`.
- Matrix queried with `deno task agentic:matrix --tier feature --json`.
- Owner override: separate read-only Codex `gpt-6.1-sol` implementation evaluation;
  separate read-only `gpt-6-astra` visual evaluation. Claude is paused. These
  explicit assignment routes supersede the default evaluator family routing.
- Public artifacts contain repository-relative paths and no session identities.
- Allowed writes: this run directory; CLI init domain/application/adapters and
  canonical scaffold assets under `packages/cli/src/`; CLI scaffold tests and
  `packages/cli/e2e/`; showcase documentation; generated CLI/MCP/agent-docs asset
  carriers; root task/CI configuration only where needed for showcase gates.
- Private execution evidence lives in the project's dated run directory; generated
  applications live under the ignored `.llm/tmp/` surface.
- Never commit `.divybot-goal.md`. Never rebase, force-push, merge the PR, or add labels.
