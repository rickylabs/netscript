# Slice FA4 — #379 MCP App Call Handler

## Scope

- Adds `createMcpAppCallHandler` beside the FA3 MCP sandbox handler on
  `@netscript/fresh/ai/sandbox`.
- Uses the shared `McpTransportPool` from `@netscript/ai/mcp`; widget calls route through the warm
  pool client and do not construct a separate transport.
- Server-side same-server guard: the route URL's `serverId` selects the source MCP server, and a
  mismatched body `serverId` is rejected before any tool listing or tool call.
- Emits an `mcp.tool.call` client span with W3C parent context extracted from request headers.

## Evidence

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx`
  — exit 0; `filesSelected=161`, `failedBatches=0`, `totalOccurrences=0`.
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/fresh/src/runtime/ai --ext ts,tsx`
  — exit 0; `filesSelected=10`, `totalOccurrences=0`.
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/fresh/src/runtime/ai --ext ts,tsx`
  — exit 0; `filesSelected=10`, `failedBatches=0`, `findings=0`.
- `deno test --allow-all packages/fresh/src/runtime/ai` — exit 0; `25 passed`, `0 failed`.
- `deno task doc:lint --root packages/fresh --pretty` — exit 0; `totalErrors=0`.
- `deno publish --dry-run --allow-dirty` from `packages/fresh` — exit 0; no
  `--allow-slow-types`.
- `rtk proxy deno task arch:check` — exit 0; no `FAIL` rows. Existing WARN/INFO rows remain in
  packages/plugins outside this slice.
- `deno.lock` drift occurred during Deno resolution and was reverted before commit.
