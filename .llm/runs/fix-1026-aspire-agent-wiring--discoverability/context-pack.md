# Context Pack

- Objective: close #1026 by making Aspire/Deno diagnostics discoverable from `netscript agent init`.
- Baseline: `3ab64720f`; branch `fix/1026-aspire-agent-wiring`.
- Phase: Plan-Gate blocked. The canonical local Qwen evaluator lacks an OpenRouter credential; implementation has not begun.
- Locked design: unconditional Aspire MCP config; optional bounded Aspire delegation behind port/adapter; shipped Aspire/Deno/help assets; symptom-indexed AGENTS block.
- User facts: Aspire 13.4.6 delegation completes in ~7s but writes no MCP config. No repository evidence contradicts this.
- Exclusions: scaffold runtime E2E, `.llm/tools` shipping, scaffold templates, `packages/mcp`.
