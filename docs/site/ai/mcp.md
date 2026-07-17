---
layout: layouts/base.vto
title: MCP
templateEngine: [vento, md]
prev: { label: "AI", href: "/ai/" }
next: { label: "Durable chat", href: "/ai/durable-chat/" }
---

# MCP

`@netscript/ai/mcp` is the **MCP client stack**: it turns external Model Context
Protocol servers into typed tools your agent loop can call — transports, injected
auth, multi-server pooling, and a safe rendering path for the `ui://` resources a
tool result can carry. It is published as part of `@netscript/ai{{ releaseSpecifier }}` and
installs with the engine: `deno add jsr:@netscript/ai{{ releaseSpecifier }}`.

{{ comp callout { type: "note", title: "Two different MCP surfaces — don't conflate them" } }}
This page documents the <code>@netscript/ai/mcp</code> <strong>client library</strong>:
your app <em>consumes</em> external MCP servers as agent tools. That is a separate
surface from the NetScript MCP <strong>server</strong> — a standalone stdio server for
coding agents that you run with <code>netscript agent mcp</code> and install with
<code>netscript agent init</code>. The server exposes framework-aware diagnostics,
telemetry summaries, and doc search <em>about</em> your project; the client library on
this page wires <em>remote</em> MCP servers <em>into</em> your product's agent loop. See
<a href="/capabilities/agent-tooling/">Agent tooling</a> and the
<a href="/reference/mcp/"><code>@netscript/mcp</code> reference</a> for the server.
{{ /comp }}

## The story: one config instead of a protocol integration

Your agent needs a capability that lives behind an MCP server — a docs-search
server, an internal ops server, a vendor's tool endpoint. Wiring that by hand is a
protocol integration, not a feature: JSON-RPC framing over stdio or HTTP, session
lifecycle, reconnect-with-backoff when the connection drops mid-run, auth headers
that must not be hardcoded, translating the server's tool schemas into whatever
your agent's tool registry expects, and deciding what to do when a result embeds
UI content you did not author. Every one of those steps is a place for an agent —
human or AI — to burn a turn on glue that has nothing to do with the feature.

The `./mcp` subpath collapses that to configuration. You declare servers as data,
register the pool into the same tool registry the [agent loop](/ai/engine/)
already dispatches through, and the remote tools become ordinary registry entries:

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

From here the agent loop treats a remote MCP tool exactly like a local
`defineAiTool` definition — same registry, same dispatch, same
[`AgentChunk` stream](/ai/engine/) on the wire.

## Transports — stdio and reconnectable Streamable-HTTP

`createMcpTransport(config)` takes a discriminated config — `{ kind: "stdio" }` or
`{ kind: "streamable-http" }` — and returns an `McpTransportPort`. The
Streamable-HTTP transport is built for long-lived agent sessions: it reconnects
with configurable backoff (`McpBackoffConfig`) and exposes its lifecycle as an
observable state machine.

{{ comp.apiTable({
  caption: "Transport lifecycle — @netscript/ai/mcp",
  rows: [
    { name: "McpConnectionState", type: "\"disconnected\" | \"connecting\" | \"connected\" | \"reconnecting\" | \"closed\"", desc: "The transport lifecycle union; `reconnecting` is a first-class state, not an error." },
    { name: "onStateChange(handler)", type: "(state, previous) => void", desc: "Subscribe to lifecycle transitions (`McpStateChangeHandler`); returns an unsubscribe function." },
    { name: "StreamableHttpMcpTransport", type: "class", desc: "The reconnectable Streamable-HTTP transport; configured via `StreamableHttpMcpTransportConfig` (serverId, url, auth, backoff)." },
    { name: "StdioMcpTransport", type: "class", desc: "The stdio transport for local process-based MCP servers." }
  ]
}) }}

Auth is **injected at the composition root**, never baked into a transport class.
`McpAuthConfig` is a three-mode union — `{ mode: "none" }`,
`{ mode: "api-token", token, headerName?, scheme? }`, or
`{ mode: "oauth", accessToken, tokenType? }` — so the same server declaration works
across environments with only the secret changing.

## The pool — many servers, one tool namespace

Real agents talk to more than one server. `createMcpTransportPool(config)` builds a
multi-server pool from **serializable** transport configs (so server declarations
can live in configuration, not code); `createMcpTransportPoolFromTransports` wraps
transports you already own. The pool is itself an `McpTransportPort`, so everything
that accepts one transport accepts a pool of them.

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

`registerMcpTools(registry, transport)` is the bridge into the agent: it surfaces
the remote tools into a `ToolRegistryPort` and returns an `McpToolRegistration`
whose `.stop()` detaches them — registration is reversible, not a global mutation.

## `ui://` resources — tool results that carry UI, rendered safely

An MCP tool result can embed **`ui://` resources** — UI content authored by the
server, not by you. The pool surfaces these on every `McpPooledToolResult` as
`uiResources`, and `extractMcpUiResources(result)` pulls the **data-only**
`McpUiResource` records from any raw tool result. The engine stops there by design:
it extracts, it never renders.

Rendering belongs to the web layer, behind two guardrails you install with
`netscript ui:add ai`:

- the **`McpUiWidget` island** (from the `@netscript/fresh-ui` copy registry)
  renders a `ui://` resource in a sandboxed frame — sanitized, themed through the
  sandbox route, `no-referrer`;
- the **`createMcpSandboxHandler`** route (on `@netscript/fresh/ai/sandbox`)
  serves the resource with the active theme's tokens and a per-response CSP — see
  [the durable-chat sandbox section](/ai/durable-chat/) for the handler itself.

This is the same trust boundary as the [`render_ui` tool](/ai/chat-ui/): model- or
server-authored UI reaches the page only through a curated renderer or a sandbox,
never as raw HTML in your island tree. The whole path is exercised by the
framework's own merge gate — the CLI E2E suite drives a real Streamable-HTTP MCP
round trip through this client stack into a rendered `McpUiWidget` before a branch
can land.

## One comparison

Encore's MCP story points **inward**: it ships an MCP server that exposes a running
Encore backend's introspection surface to coding agents, so an agent can inspect
and verify the backend it is editing. NetScript ships **both halves**. The inward
half is the `netscript agent mcp` server (documented under
[Agent tooling](/capabilities/agent-tooling/) and the
[`@netscript/mcp` reference](/reference/mcp/)): a stdio server that gives a coding
agent framework-aware diagnostics, telemetry summaries, and doc search over the
project it is editing. The outward half — this page — is the `@netscript/ai/mcp`
client stack for consuming external MCP servers as tools inside your own product's
agents, with a sandboxed path for the UI those tools return. Both paths are
published and gate-tested.

## Where to go next

{{ comp.featureGrid({ items: [
  {
    title: "The engine — ports, tools, agent loop",
    body: "The @netscript/ai surface this stack plugs into: the tool registry, the agent loop, and the McpTransportPort seam.",
    href: "/ai/engine/",
    icon: "E"
  },
  {
    title: "Durable chat — the sandbox route",
    body: "createMcpSandboxHandler on @netscript/fresh/ai/sandbox: themed, CSP-guarded serving of ui:// resources.",
    href: "/ai/durable-chat/",
    icon: "◆"
  },
  {
    title: "Chat UI — rendering the transcript",
    body: "The fresh-ui copy registry: tool cards, the render_ui block renderer, and the McpUiWidget island.",
    href: "/ai/chat-ui/",
    icon: "U"
  },
  {
    title: "Look up — @netscript/ai",
    body: "The generated reference for the engine package, including every ./mcp export.",
    href: "/reference/ai/",
    icon: "≡"
  }
] }) }}
