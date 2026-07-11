---
layout: layouts/base.vto
title: Durable chat
templateEngine: [vento, md]
prev: { label: "AI", href: "/ai/" }
next: { label: "Chat UI", href: "/ai/chat-ui/" }
---

# Durable chat

`@netscript/fresh/ai` is the server + island seam that turns a Fresh route into a
**durable AI chat**: a chat whose message history and in-flight tool calls survive
reload, reconnect, and multi-tab replay because they are backed by a durable session
stream rather than component state. {{ comp.badge({ status: "alpha" }) }}

It composes three upstream libraries — `@durable-streams/tanstack-ai-transport`,
`@tanstack/ai-preact`, and `@tanstack/ai` — and adds only NetScript glue: durable-stream
URL resolution, server-side auth headers, and the projection law below. It does **not**
import `@netscript/ai`, so it composes with the [AI engine](/ai/engine/) but installs
independently — you can adopt durable chat without pulling in the engine.

This subpath is published on JSR as part of `@netscript/fresh@0.0.1-beta.7` and is usable
now.

## The primitives at a glance

{{ comp.apiTable({
  caption: "@netscript/fresh/ai — the durable-chat surface",
  rows: [
    { name: "createNetScriptChatStreamProxy", type: "(options) => handler", desc: "Build the single durable chat-stream proxy handler — resolves the session target (static or per-request), proxies to the durable-stream URL with server auth, passes the body through unbuffered, and tears down on client abort." },
    { name: "toNetScriptChatResponse", type: "(options) => Promise<Response>", desc: "Produce a durable-session `Response` from a server chat stream; enforces `authorize` (a denial becomes `403`) before the session stream is touched." },
    { name: "resolveChatSnapshot", type: "(options) => Promise<NetScriptChatSnapshot>", desc: "Resolve the seed snapshot for SSR / first paint by materializing the session and reducing it through `projectChatSnapshot`." },
    { name: "projectChatSnapshot", type: "(messages) => {messages, renderParts}", desc: "THE single projection reducer — deterministic and side-effect-free. Both seed and live paths MUST route through it (the one-projection law)." },
    { name: "createNetScriptChatConnection", type: "(options) => NetScriptChatConnection", desc: "Open a live durable session handle: SR2-tolerant `subscribe`, a `send` that persists client messages, and one idempotent teardown (`close`/`stop`/`dispose`)." }
  ]
}) }}

## The one-projection law

`resolveChatSnapshot` (the SSR/first-paint seed) and the live island projection MUST
run **the same reducer** — `projectChatSnapshot`. They are two entry points into one
function applied to one chunk log:

```text
chunks --> [ projectChatSnapshot ] --> { messages, renderParts }
```

If the seed path and the live path diverge — for example the server hand-rolls a
snapshot while the island reduces chunks differently — **tool cards drift**: a card
materialized at seed time renders differently, or vanishes, once the first live chunk
arrives, because the two projections disagree about intermediate tool state. This is a
hard invariant, not a nicety. Any downstream slice that adds a projection must route
both seed and live through it.

{{ comp callout { type: "important", title: "Route seed and live through one reducer" } }}
Never build a bespoke snapshot for SSR and a separate live reducer for the island.
Seed the first paint with <code>resolveChatSnapshot</code> (which calls
<code>projectChatSnapshot</code> internally) and hand its <code>offset</code> to the live
subscription so seed and live read one continuous chunk log. The returned
<code>renderParts</code> are the transport render parts described below.
{{ /comp }}

## The canonical chat-stream proxy

Every durable chat needs one route that proxies the browser's chat-stream request to
the session's durable-stream URL. `createNetScriptChatStreamProxy` is that route — it
resolves the session target (static or per-request), attaches server-side streams auth
(via `getStreamsAuth` by default), passes the upstream body through **unbuffered**,
strips headers that would misdescribe the re-framed bytes, and propagates the client
`AbortSignal` so a disconnect tears the upstream fetch down. Use it directly as a
Fresh `Handlers` entry.

```ts
// routes/api/chat/[sessionId].ts — the one canonical chat-stream proxy
import { createNetScriptChatStreamProxy } from "@netscript/fresh/ai";

const proxy = createNetScriptChatStreamProxy({
  // Resolve the session per request from the route param.
  target: (req) => ({
    sessionId: new URL(req.url).pathname.split("/").pop()!,
  }),
});

export const handler = { POST: proxy, GET: proxy };
```

{{ comp callout { type: "note", title: "Why a raw Request here, not a route contract" } }}
This resolver is the one documented exception to NetScript's typed-route rule: <code>createNetScriptChatStreamProxy</code>'s <code>target</code> only ever receives the raw <code>Request</code>, so the session id is parsed from <code>req.url</code> by hand. Everywhere else you build a URL or read a path param, prefer a bound <a href="/reference/fresh/"><code>createRouteReference</code></a> contract so the pattern and its typed params come from one source of truth.
{{ /comp }}

`NetScriptChatStreamProxyOptions` is small: a `target` (a `NetScriptChatSessionTarget`
or a `(request) => NetScriptChatSessionTarget` resolver), an optional `auth` header
provider (defaults to `getStreamsAuth` from `@netscript/plugin-streams-core`), and an
optional `fetch` override for tests. The returned handler accepts a bare `Request` or a
Fresh route context (anything with `.req`), so `{ POST: handler }` and a direct call in
a test both work.

## Authorizing the session response

The proxy moves bytes; **authorization happens where you produce the session
response**. `toNetScriptChatResponse` sanitizes a server-side chat stream into durable
chunks and returns the session `Response`. Supply an `authorize` hook and the matching
`request`: a denial yields `403 Forbidden` and the session stream is never touched.

```ts
// The server turn: persist the assistant stream into the durable session, gated by authorize.
import { toNetScriptChatResponse } from "@netscript/fresh/ai";

const response = await toNetScriptChatResponse({
  target: { sessionId },
  request,
  // REQUIRED in production — return false to deny (=> 403).
  authorize: (req, id) => sessionBelongsToUser(req, id),
  newMessages, // client messages to persist before the assistant turn
  source: assistantChatStream, // AsyncIterable of server chat chunks
});
```

{{ comp callout { type: "warning", title: "authorize is required in production — there is no default allow-all" } }}
<code>NetScriptChatAuthorize = (request, sessionId) =&gt; boolean | Promise&lt;boolean&gt;</code>
is optional at the type level (the framework cannot prove a caller is production), but
the factory <strong>never</strong> bakes in a default allow-all. Ship a real
<code>authorize</code> before exposing a chat route publicly — without one,
<code>toNetScriptChatResponse</code> cannot gate access to the session stream.
Supplying <code>authorize</code> without a <code>request</code> is a programming error
and throws.
{{ /comp }}

## Seeding first paint (SSR)

For SSR and first paint, materialize the session and reduce it through the one
projection reducer with `resolveChatSnapshot`, then hand the returned `offset` to the
live subscription so seed and live share one continuous log.

```ts
import { resolveChatSnapshot } from "@netscript/fresh/ai";

const snapshot = await resolveChatSnapshot({ target: { sessionId } });
// snapshot.messages   -> ordered NetScriptChatMessage[]
// snapshot.renderParts -> transport RenderPart[] (text + tool cards)
// snapshot.offset      -> replay cursor for the live subscription (or null if empty)
```

## The live connection

`createNetScriptChatConnection` opens the live session handle the island subscribes to.
Its `subscribe` is SR2-tolerant (a first-subscribe that races a not-yet-created stream
re-polls with backoff instead of throwing), `send` persists client messages, and
`close`/`stop`/`dispose` are one idempotent teardown so no connection leaks.

```ts
import { createNetScriptChatConnection } from "@netscript/fresh/ai";

const chat = createNetScriptChatConnection({
  target: { sessionId },
  authorize: (req, id) => sessionBelongsToUser(req, id), // REQUIRED in prod
  initialOffset: snapshot.offset ?? undefined, // continue from the seed cursor
});

try {
  for await (const chunk of chat.subscribe(signal)) {
    render(chunk);
  }
} finally {
  chat.dispose();
}
```

## The transport RenderPart

The reducer emits a **minimal, transport-level** `RenderPart` — either reduced message
`text` or a `tool` card reduced from the same chunk log. This is distinct from the
**rich presentation** `RenderPart` owned by the [chat UI](/ai/chat-ui/); the two are
intentionally separate and must not be conflated. The transport part is the stable
contract the UI widens.

{{ comp.apiTable({
  caption: "RenderPart (transport) — @netscript/fresh/ai",
  rows: [
    { name: "kind", type: "\"text\" | \"tool\"", desc: "Whether this part renders message text or a tool card." },
    { name: "id", type: "string", desc: "Stable id of this part within the transcript." },
    { name: "role", type: "\"system\" | \"user\" | \"assistant\" | \"tool\"", desc: "Author role the part belongs to." },
    { name: "text", type: "string?", desc: "Reduced text (present when `kind === 'text'`)." },
    { name: "toolName", type: "string?", desc: "Invoked tool name (present when `kind === 'tool'`)." },
    { name: "toolState", type: "\"pending\" | \"streaming\" | \"complete\" | \"error\"", desc: "Lifecycle state of the tool card reduced from the chunk log." },
    { name: "input", type: "unknown?", desc: "Reduced tool input (may be partial while `streaming`)." },
    { name: "output", type: "unknown?", desc: "Reduced tool output, present once `complete`." }
  ]
}) }}

The message and session shapes are equally small: `NetScriptChatMessage`
(`{ id, role, content }`), `NetScriptChatSessionTarget` (`{ sessionId, baseUrl?,
headers? }` — one durable stream per `sessionId`), and `NetScriptChatSnapshot`
(`{ messages, renderParts, offset }`).

## The `ui://` sandbox — `@netscript/fresh/ai/sandbox`

The sandbox subpath serves themed `ui://` resources for MCP-driven UI. Its shipped
piece is `createMcpSandboxHandler`: a Fresh route handler that serves a registered
`ui://` resource selected by `?uri=`, injects the active theme's `--ns-*` custom
properties, stamps `data-theme`, and applies a per-response CSP derived from the
resource URI. `?theme=` selects a token set; an absent or unknown theme falls back to
`defaultThemeName` (default `"default"`).

```ts
// routes/mcp/sandbox.ts
import { createMcpSandboxHandler } from "@netscript/fresh/ai/sandbox";

export const handler = {
  GET: createMcpSandboxHandler({
    resolveResource: (uri, { signal }) => registry.lookup(uri, { signal }),
    themes: {
      default: { "--ns-color-surface": "#ffffff" },
      dark: { "--ns-color-surface": "#111111" },
    },
  }),
};
```

{{ comp callout { type: "note", title: "The broader MCP tool sandbox is not yet wired" } }}
<code>createNetScriptMcpSandbox</code> (the chat-activity MCP tool sandbox that would
merge agent tools and bridge the island <code>useChat</code> surface) is an FA3
<strong>skeleton stub</strong> — it is not yet wired to a working chat activity. Only
the <code>ui://</code> resource route handler (<code>createMcpSandboxHandler</code>) is
real today. Do not build on <code>createNetScriptMcpSandbox</code> yet.
{{ /comp }}

## Reference

This page orients; the generated reference enumerates every exported symbol.

{{ comp.featureGrid({ items: [
  {
    title: "Look up — @netscript/fresh",
    body: "The generated API for the Fresh package, including the /ai and /ai/sandbox subpaths.",
    href: "/reference/fresh/",
    icon: "≡"
  },
  {
    title: "Next — the chat UI",
    body: "The fresh-ui copy-registry components that render this transcript: composer, message thread, tool cards, and the generative-UI block renderer.",
    href: "/ai/chat-ui/",
    icon: "→"
  },
  {
    title: "Understand — the two planes",
    body: "Why chat lives on the durable-session plane and list/board data lives on the StreamDB plane.",
    href: "/ai/",
    icon: "◎"
  }
] }) }}
