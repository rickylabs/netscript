# Context Pack — feat-ai-e5-mcp-transport--e5

## Current State

- Branch: `feat/ai-e5-mcp-transport`
- Target: issue #244, `@netscript/ai/mcp`
- Archetype: 2 Integration with F-13 runtime lifecycle in scope

## Key Decisions

- Use exact `@tanstack/ai-mcp@0.2.1`; `0.15.13` does not exist.
- Add `ToolRegistryPort.unregister` so MCP tools can be removed on disconnect.
- Keep public types owned by NetScript because upstream MCP `.d.ts` resolution is fragile in Deno.

## Next

- Implement contracts, adapters, registry wiring, tests, gates, commits, push, PR.
