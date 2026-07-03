# Research — feat-ai-e5-mcp-transport--e5

## Re-baseline

- Carried-in source: issue #244 body via `gh issue view 244 --repo rickylabs/netscript`.
- Re-derived against branch `feat/ai-e5-mcp-transport` at `origin/main` tracking point.
- What changed vs prompt assumptions:
  - `packages/ai/src/ports/mcp-transport.ts` already exists from E1 as a minimal session port.
  - `@tanstack/ai-mcp@0.15.13` does not exist. npm `latest` is `0.2.1`, and it depends on `@tanstack/ai@0.39.0`, matching the existing core pin.
  - `ToolRegistryPort` has no remove/unregister operation, so de-registration on disconnect requires extending the port and in-memory registry.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | `@netscript/ai` already exports provider subpaths and a tools subpath; `./mcp` should mirror that pattern. | `packages/ai/deno.json`, `packages/ai/anthropic.ts`, `packages/ai/tools.ts` |
| 2 | The E4 in-memory registry stores descriptors and handlers by tool name but cannot delete them yet. | `packages/ai/src/tools/adapters/in-memory-registry.ts` |
| 3 | TanStack MCP exposes `createMCPClient`, HTTP transport config, and stdio through `@tanstack/ai-mcp/stdio`. | `deno doc npm:@tanstack/ai-mcp@0.2.1` |
| 4 | TanStack's `.d.ts` has a Deno resolution issue for `@modelcontextprotocol/sdk/shared/transport.js`, so NetScript must not leak those upstream types. | `deno doc npm:@tanstack/ai-mcp@0.2.1/stdio` |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: planned `packages/ai/mcp.ts` subpath plus `packages/ai/src/ports/mcp-transport.ts`.
- Slow-type / surface risks: upstream MCP SDK types are risky; public exports must be owned NetScript types only, with explicit return types and no upstream generic leakage.

## Open questions

- None blocking. Use `@tanstack/ai-mcp@0.2.1` as the exact pin and record the version drift.
