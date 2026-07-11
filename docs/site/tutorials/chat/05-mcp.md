---
layout: layouts/base.vto
title: MCP tools & widgets
templateEngine: [vento, md]
prev: { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" }
next: { label: "6 · Live streaming", href: "/tutorials/chat/06-live-streaming/" }
---

# MCP tools & widgets

Chapter 4's tool was code you wrote. Real products also need capabilities that live behind
**Model Context Protocol** servers — a docs-search server, an ops server, a vendor's tool
endpoint. In this chapter you connect the chat to a remote MCP server with the
`@netscript/ai/mcp` client stack, call one of its tools from the same `authorize`-gated turn,
and render the `ui://` **widget** an MCP tool result can carry — sandboxed and themed, never
as raw HTML in your island tree.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" },
  { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" },
  { label: "6 · Live streaming", href: "/tutorials/chat/06-live-streaming/" }
] }) }}

## The pieces — all shipped, one boundary

Three seams do the work, and every one of them is published and installable today:

{{ comp.apiTable({
  caption: "The MCP surface this chapter uses",
  rows: [
    { name: "@netscript/ai/mcp", type: "client stack — jsr:@netscript/ai", desc: "createMcpTransportPool declares remote servers as data (stdio or reconnectable Streamable-HTTP, auth injected); callTool routes a call to its server; extractMcpUiResources pulls the data-only ui:// records out of a result." },
    { name: "createMcpSandboxHandler", type: "route — @netscript/fresh/ai/sandbox", desc: "Serves a registered ui:// resource themed with the active token set and behind a per-response CSP. The serving half of the render path." },
    { name: "McpUiWidget", type: "island — fresh-ui copy registry", desc: "The copied island (installed by netscript ui:add ai in chapter 3) that renders a ui:// resource in a sanitized, no-referrer sandboxed frame through the sandbox route." }
  ]
}) }}

{{ comp callout { type: "note", title: "Client, not server" } }}
NetScript's shipped MCP surface is <strong>client-side</strong>: your app <em>consumes</em>
external MCP servers as tools. There is no scaffolded NetScript MCP server in this release —
this chapter points your chat <em>at</em> a server, it does not make your app one. See
<a href="/ai/mcp/">the MCP guide</a> for the full client stack.
{{ /comp }}

## What you will build

A `searchRemote` tool whose handler routes through an MCP transport pool instead of your own
code: the model calls it like any chapter-4 tool, the pool executes it on the remote server,
and the result — including any `ui://` widget the server returns — lands in the durable
transcript and renders in the chat, themed and walled off behind a per-response CSP.

## Before you begin

You need the working chat from chapters [1](/tutorials/chat/01-scaffold/)–[4](/tutorials/chat/04-tool-call/),
plus the engine package, which owns the MCP client stack:

```sh
deno add jsr:@netscript/ai
```

You also need an MCP server to talk to — any Streamable-HTTP MCP endpoint you have access to
works (a docs-search server is the running example below). Put its URL and token in the app
environment next to your model key, never in code.

## Step 1 — Declare the server pool

`createMcpTransportPool` turns server declarations into a connected tool surface. The configs
are **serializable data** — kind, id, URL, auth — so they can live in configuration. Auth is
injected here at the composition root, never baked into a transport:

```ts
// apps/dashboard/lib/mcp/pool.ts
import { createMcpTransportPool } from '@netscript/ai/mcp';

export const mcpPool = createMcpTransportPool({
  servers: [{
    kind: 'streamable-http',
    serverId: 'search',
    url: Deno.env.get('MCP_SEARCH_URL')!,
    auth: { mode: 'api-token', token: Deno.env.get('MCP_TOKEN')!, scheme: 'Bearer' },
  }],
});

// connect() opens every pooled transport and returns the discovered tools,
// name-prefixed by server id ("search:…") so two servers' tools never collide.
export const mcpTools = await mcpPool.connect({});
```

The Streamable-HTTP transport is built for long-lived sessions: it reconnects with backoff,
and `reconnecting` is a first-class `McpConnectionState`, not an error. Add a second server to
the `servers` array and the pool keeps their tools namespaced — many servers, one surface.

## Step 2 — Bridge a pooled tool into the chat turn

Your route's model call runs on `@tanstack/ai` (chapter 2), so give the model a chapter-4-style
tool whose **handler routes through the pool**. `callTool` sends the prefixed tool name to its
server and hands back the result with any `ui://` resources already extracted:

```ts
// apps/dashboard/lib/tools/search-remote.ts
import { toolDefinition } from '@tanstack/ai';
import { mcpPool } from '../mcp/pool.ts';

export const searchRemote = toolDefinition({
  name: 'searchRemote',
  description: 'Search the product docs. Use for any product or how-to question.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string', description: 'The question to look up.' } },
    required: ['query'],
  },
}).server(async ({ query }: { query: string }) => {
  // Route the call to the remote server through the pool.
  const result = await mcpPool.callTool('search:search_docs', { query }, {});
  // Plain structured output, like chapter 4 — plus the extracted ui:// records.
  return { result, uiResources: result.uiResources ?? [] };
});
```

Add `searchRemote` to the same `tools` array as chapter 4's `searchDocs`. Nothing else in the
route changes: the tool runs server-side, inside the `authorize`-gated turn, and the whole
exchange — arguments, result, and the `ui://` references — is persisted as a transport `tool`
part in the durable session.

{{ comp callout { type: "note", title: "Two ways in — this track takes the bridge" } }}
The engine-native path is <code>registerMcpTools(registry, pool)</code>, which surfaces remote
tools into the engine's tool registry for its <a href="/ai/engine/">agent loop</a> to dispatch —
registration is reversible via <code>.stop()</code>. This track bridges through a
<code>@tanstack/ai</code> tool instead, because the durable session plane persists and replays
TanStack chunk streams (the wire-shape note from chapter 2). Same pool, same servers — choose
the entry point that matches your model-call layer.
{{ /comp }}

## Step 3 — Render the `ui://` widget, sandboxed

An MCP tool result can embed `ui://` resources — **UI authored by the server, not by you**.
They reach the page only through two guardrails, both already in your app:

1. **The sandbox route.** Mount `createMcpSandboxHandler` once; it serves a registered
   resource selected by `?uri=`, injects the active theme's `--ns-*` custom properties, stamps
   `data-theme`, and applies a per-response CSP derived from the resource URI. `?theme=` picks
   a token set; an unknown theme falls back to `defaultThemeName` (`"default"`).

```ts
// apps/dashboard/routes/mcp/sandbox.ts
import { createMcpSandboxHandler } from '@netscript/fresh/ai/sandbox';
import { resourceRegistry } from '../../lib/mcp/registry.ts';

export const handler = {
  GET: createMcpSandboxHandler({
    resolveResource: (uri, { signal }) => resourceRegistry.lookup(uri, { signal }),
    themes: {
      default: { '--ns-color-surface': '#ffffff' },
      dark: { '--ns-color-surface': '#111111' },
    },
  }),
};
```

2. **The widget island.** The `ai` collection you copied in chapter 3 includes the
   `McpUiWidget` island: hand it a `ui://` resource from the tool part's output and it renders
   the widget in a sanitized, `no-referrer` sandboxed frame served through the route above. In
   the chapter-4 render switch, a tool part whose output carries `uiResources` renders those
   through `McpUiWidget` alongside (or instead of) the plain tool-call card.

{{ comp callout { type: "important", title: "Server-authored UI never enters your island tree raw" } }}
This is the same trust boundary as the generative-UI renderer: model- or server-authored UI
reaches the page only through a curated renderer or the sandbox — sanitized, themed, CSP-guarded,
frame-isolated. Never interpolate a <code>ui://</code> resource's content into your own markup.
And do not build on <code>createNetScriptMcpSandbox</code> (the chat-activity tool sandbox): it
is a skeleton stub in this release — the route + widget path above is the shipped one.
{{ /comp }}

## Verify your progress

With `aspire start` running and your MCP server reachable:

1. Ask a question that triggers the remote tool. The reply carries a tool-call card naming
   `searchRemote` — its result came over MCP, not from your code.
2. If the server returned a `ui://` resource, the **widget renders** inside the chat, themed
   like the page around it.
3. Probe the sandbox route directly and check the isolation headers:

```sh
curl -i 'http://localhost:8010/mcp/sandbox?uri=ui%3A%2F%2Fwidget%2Fdemo&theme=dark'
```

You should see the resolved resource with `data-theme="dark"` and the dark `--ns-*` tokens,
under a `content-security-policy` response header derived from the resource URI.

4. **Reload.** The tool card — and the widget reference in its output — replays from the
   durable session, exactly like every other part of the transcript.
5. Type-check the app:

```bash
deno task --cwd apps/dashboard check
```

- [ ] `deno add jsr:@netscript/ai` resolved and the pool `connect()`s to your server.
- [ ] Asking a relevant question triggers the `searchRemote` tool over MCP.
- [ ] A `ui://` result renders through `McpUiWidget`, themed and framed.
- [ ] The sandbox route answers with theme tokens and a per-response CSP.
- [ ] A reload replays the tool card and its widget reference.
- [ ] `deno task --cwd apps/dashboard check` is clean.

{{ comp callout { type: "tip", title: "If the remote tool never fires" } }}
Check the pool first: <code>connect()</code> returns the discovered tool descriptors — if your
tool is missing, the server URL, auth mode, or token is wrong. A tool that fires but errors
surfaces as an <code>error</code> tool card (chapter 4's rule), and a dropped connection shows
as the transport's <code>reconnecting</code> state, not a crash — subscribe with
<code>onStateChange</code> to watch the lifecycle while debugging.
{{ /comp }}

## What you built

A chat whose tools no longer stop at your own code: a declared MCP server pool, a bridged tool
the model calls like any other, and server-authored `ui://` widgets rendered through the
sandbox route and the copied `McpUiWidget` island — durable in the transcript, isolated on the
page. Next you make the whole transcript feel live — folding the model's chunks into the UI as
they arrive instead of after each turn settles.

{{ comp.nextPrev({ prev: { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" }, next: { label: "6 · Live streaming", href: "/tutorials/chat/06-live-streaming/" } }) }}
