# FAI-9 fixture contract (supervisor-approved design, Fable-lane prep 2026-07-11 ~03:45)

Resume message for Codex thread `019f4e9d-54c6-7d41-a8a2-3bd3e867d3e3` after T8 merges.

## Fixture approach
Single `deno eval` script gate (idiom of `UI_RENDER_ASSERTION_SCRIPT` in `ui-ai-gates.ts`), no
separate server process: `Deno.serve({ port: 0, hostname: '127.0.0.1' })` implementing the MCP
JSON-RPC streamable-HTTP subset on POST: `initialize` (echo protocolVersion, capabilities.tools,
serverInfo), `notifications/initialized` (202 empty), `tools/list` (one `render_widget` tool),
`tools/call` (content: `{type:'resource', resource:{uri:'ui://e2e/widget.html', mimeType:'text/html',
text:'<h1>ok</h1>'}}`). Read bound port from `server.addr.port`; `server.shutdown()` in finally;
60s exit-1 guard against wedged handshake.

## Round-trip assertions
1. `createMcpTransportPool` from `./packages/ai/mcp.ts` (subpath — NOT re-exported from mod.ts),
   servers `[{kind:'streamable-http', serverId:'widgets', url}]` (default tanstack connector →
   real wire protocol).
2. `pool.listTools()` → `['widgets__render_widget']`.
3. `pool.callTool(...)` → `result.uiResources[0]` src/uri `ui://e2e/widget.html`, mimeType
   text/html, serverId widgets, toolName render_widget (uiResources surfacing per
   `packages/ai/tests/mcp_test.ts:247` — tanstack client has no resources/read; UI resources are
   embedded in tool-call content).
4. Widget leg: import `islands/ui/McpUiWidget.tsx` + `mcpUiFrameAttributes`; assert sanitized
   sandbox (drops allow-same-origin), themed src (`?theme=dark`), `referrerpolicy=no-referrer`;
   render via `npm:preact-render-to-string@^6.7.0` and assert `<iframe` markup.
5. `pool.stop()` before `server.shutdown()`.

## Wiring
- `GATE.BEHAVIOR_MCP_WIDGET_ROUNDTRIP: 'behavior.mcp-widget-roundtrip'` in
  `packages/cli/e2e/src/domain/cli-surface.ts` (after BEHAVIOR_UI_RENDER); last entry of
  `createUiAiGates()`; flows via `scaffold-capability-gates.ts` — no suite wiring changes; mirror
  in suite-registry test.

## Pitfalls
- `deno eval --allow-net=127.0.0.1 --config deno.json` (jsx precompile already patched by
  `UI_LOCAL_SOURCE_SCRIPT`); port 0 always; answer plain application/json first, fall back to a
  single SSE `event: message` frame if @tanstack/ai-mcp@0.2.1 rejects JSON; echo `mcp-session-id`
  header if asserted.
- Iterate with `deno task e2e:cli gates scaffold.runtime`; full
  `run scaffold.runtime --cleanup --format pretty` at merge readiness.
