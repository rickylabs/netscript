# AI MCP service discovery — #2581

- Branch: feat/ai-mcp-service-discovery; baseline6766130bbafbe78a9bb5870f704987cb0743c5e6.
- Owner continuation after merged #2589 selects the existing unclaimed #2581 sibling of #2571.
- Implementer: Codex Astra; issue explicitly requests Astra/high, feature leaf.
- Pinned matrix queried: feature plan evaluation GLM5.3 (provider default), Fable5.1 (low) fallback;
  implementation evaluation Muse Spark1.3 (xhigh), Opus5 (xhigh) fallback. Independent sessions
  and vendor families required; route availability will be recorded before evaluation.
- Archetype5 plugin, with CLI/tooling and integration concerns inside the existing plugin.
- Allowed product scope: plugins/ai/ MCP configuration, plugin CLI/resource generator/runtime,
  focused docs/site AI MCP documentation if required, and existing derived documentation carriers.
- No CLI init/scaffold assets, Northwind files, app-data MCP server, or sibling run edits.
- Public run scope: .llm/runs/feat-ai-mcp-service-discovery--2581/.
- Plan evaluation and implementation evaluation required. No new dependency is anticipated.
- Normal push only. Cockpit owns merge/release. Public evidence is repo-relative, no session IDs.
