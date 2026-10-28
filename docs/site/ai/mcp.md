---
layout: layouts/base.vto
title: MCP client
templateEngine: [vento, md]
order: 1
---

# MCP client

`@netscript/ai/mcp` turns external Model Context Protocol servers into typed tools that your agent
loop can call. It provides transports, injected auth, multi-server pooling and a safe rendering path
for the `ui://` resources a tool result can carry. It ships in `@netscript/ai{{ releaseSpecifier }}`
and installs with the engine: `deno add jsr:@netscript/ai{{ releaseSpecifier }}`.

> [!NOTE]
> This page covers the MCP client library, which your app uses to consume external MCP servers. The
> NetScript MCP server is a separate surface: a stdio server that gives coding agents diagnostics,
> telemetry summaries and doc search about your project. You run it with `netscript agent mcp` and
> install it with `netscript agent init`; see [Agent tooling](/ai/agent-tooling/).

## Register MCP tools

Declare servers as data and register the pool into the tool registry that the
[agent loop](/ai/engine/) dispatches through. The remote tools become ordinary registry entries:

```ts
import { createMcpTransportPool, registerMcpTools } from "@netscript/ai/mcp";
import { createToolRegistry } from "@netscript/ai/tools";

const pool = createMcpTransportPool({
  servers: [{
    kind: "streamable-http",
    serverId: "search",
    url: "https://mcp.example.com",
    auth: { mode: "api-token", token: Deno.env.get("MCP_TOKEN")!, scheme: "Bearer" },
  }],
});

const registry = createToolRegistry();
const registration = await registerMcpTools(registry, pool);
// registration.toolNames — the remote tools, now dispatchable like any local tool
// registration.stop()   — detach them again
```

The agent loop then treats a remote MCP tool like a local `defineAiTool` definition: same registry,
same dispatch, same [`AgentChunk` stream](/ai/engine/#contracts) on the wire.

## Transports

`createMcpTransport(config)` takes a discriminated config, `{ kind: "stdio" }` or
`{ kind: "streamable-http" }`, and returns an `McpTransportPort`. The Streamable-HTTP transport is
built for long-lived agent sessions: it reconnects with configurable backoff (`McpBackoffConfig`)
and exposes its lifecycle as an observable state machine.

{{ comp.apiTable({
  caption: "Transport lifecycle — @netscript/ai/mcp",
  rows: [
    { name: "McpConnectionState", type: "\"disconnected\" | \"connecting\" | \"connected\" | \"reconnecting\" | \"closed\"", desc: "The transport lifecycle union; `reconnecting` is a first-class state, not an error." },
    { name: "onStateChange(handler)", type: "(state, previous) => void", desc: "Subscribe to lifecycle transitions (`McpStateChangeHandler`); returns an unsubscribe function." },
    { name: "StreamableHttpMcpTransport", type: "class", desc: "The reconnectable Streamable-HTTP transport; configured via `StreamableHttpMcpTransportConfig` (serverId, url, auth, backoff)." },
    { name: "StdioMcpTransport", type: "class", desc: "The stdio transport for local process-based MCP servers." }
  ]
}) }}

`McpAuthConfig` is a three-mode union: `{ mode: "none" }`,
`{ mode: "api-token", token, headerName?, scheme? }` or `{ mode: "oauth", accessToken, tokenType? }`.
The same server declaration works across environments; only the secret changes.

> [!CAUTION]
> Inject auth at the composition root and never hardcode a token in a transport class or server
> declaration. The example above reads it from the environment with `Deno.env.get("MCP_TOKEN")`.

## The pool

`createMcpTransportPool(config)` builds a multi-server pool from serializable transport configs, so
server declarations can live in configuration instead of code. `createMcpTransportPoolFromTransports`
wraps transports you already own. The pool is itself an `McpTransportPort`, so everything that
accepts one transport accepts a pool.

{{ comp.apiTable({
  caption: "McpTransportPool — the multi-server surface",
  rows: [
    { name: "connect(options)", type: "Promise<readonly McpToolDescriptor[]>", desc: "Open every pooled transport and return the discovered tools, name-prefixed by server id so two servers' tools never collide." },
    { name: "listTools(options)", type: "Promise<readonly McpToolDescriptor[]>", desc: "Re-list tools from all pooled transports without tearing down warm connections." },
    { name: "callTool(name, args, options)", type: "Promise<McpPooledToolResult>", desc: "Route a prefixed tool name to its server and extract any `ui://` resources from the result." },
    { name: "state / onStateChange", type: "McpConnectionState", desc: "The aggregate lifecycle across all pooled transports." },
    { name: "server(serverId) / serverIds", type: "McpTransportPort | undefined", desc: "Reach a single pooled transport when you need it." },
    { name: "stop()", type: "Promise<void>", desc: "Stop every pooled transport and clear discovered tool routes." }
  ]
}) }}

`registerMcpTools(registry, transport)` surfaces the remote tools into a `ToolRegistryPort` and
returns an `McpToolRegistration` whose `.stop()` detaches them, so registration is reversible.

## `ui://` resources

An MCP tool result can embed `ui://` resources: UI content that the server authored, not you. The
pool surfaces them on every `McpPooledToolResult` as `uiResources`, and
`extractMcpUiResources(result)` pulls the data-only `McpUiResource` records from any raw tool
result. The engine extracts these resources and never renders them.

Rendering belongs to the web layer, behind two guardrails that you install with
`netscript ui:add ai`:

- the `McpUiWidget` island, from the `@netscript/fresh-ui` copy registry, renders a `ui://`
  resource in a sandboxed frame: sanitized, themed through the sandbox route and `no-referrer`;
- the `createMcpSandboxHandler` route on `@netscript/fresh/ai/sandbox` serves the resource with
  the active theme's tokens and a per-response CSP; see
  [the `ui://` sandbox](/ai/durable-chat/#the-ui-sandbox).

> [!CAUTION]
> Treat `ui://` resources as untrusted. Like the [`render_ui` tool](/ai/chat-ui/), model- or
> server-authored UI reaches the page only through a curated renderer or a sandbox, never as raw
> HTML in your island tree.

## Next steps

Turn agent output into a chat that survives reload with [durable chat](/ai/durable-chat/).

- The [AI engine](/ai/engine/) describes the tool registry, the agent loop and the
  `McpTransportPort` seam.
- The [chat UI](/ai/chat-ui/) renders tool cards, `render_ui` blocks and the `McpUiWidget` island.
- The [`@netscript/ai` reference](/reference/ai/) lists every `./mcp` export.
