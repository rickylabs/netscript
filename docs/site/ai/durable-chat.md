---
layout: layouts/base.vto
title: Durable chat
templateEngine: [vento, md]
prev: { label: "AI", href: "/ai/" }
next: { label: "Chat UI", href: "/ai/chat-ui/" }
order: 2
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

This subpath is published on JSR as part of `@netscript/fresh{{ releaseSpecifier }}` and is usable
now.

## The primitives at a glance

{{ comp.apiTable({
  caption: "@netscript/fresh/ai — the durable-chat surface",
  rows: [
    { name: "createNetScriptChatStreamProxy", type: "(options) => handler", desc: "Build the single durable chat-stream proxy handler — resolves the session target (static or per-request), proxies to the durable-stream URL with server auth, passes the body through unbuffered, and tears down on client abort." },
    { name: "toNetScriptChatResponse", type: "(options) => Promise<Response>", desc: "Produce a durable-session `Response` from a server chat stream; enforces `authorize` (a denial becomes `403`) before the session stream is touched. With `producer: { id, epoch }`, appends are fenced against stale writers." },
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

`newMessages` accepts `readonly NetScriptChatSendMessage[]`: server-trusted TanStack UI
messages with `parts`, Model messages with `content` and `toolCalls`, or the existing
`{ id, role, content: string }` form. Native parts and metadata survive storage unchanged;
Model content is also exposed as replay parts. Validate any client input before this
seam and give the model the same prompt that is persisted. The plugin-AI scaffold
builds its own user turn from `message.text` and ignores client transcript fields.

No public API returns persisted native parts. `resolveChatSnapshot` exposes only
reduced text and tool cards; attachments remain in the durable log. A public native
reader remains part of #2068's follow-up scope, along with publication, a published
consumer check and the EIS live one-SSE-per-pane confirmation.

Native batch tool cards appear on seed/reload but not on live subscribers.
The upstream live reader ignores `CUSTOM netscript.chat.messages` and sees text echoes.
The paths use the same projection with different inputs: native live replay remains
an exception to the one-projection law. Ordinary assistant tool chunks still stream live.

{{ comp callout { type: "warning", title: "authorize is required in production — there is no default allow-all" } }}
<code>NetScriptChatAuthorize = (request, sessionId) =&gt; boolean | Promise&lt;boolean&gt;</code>
is optional at the type level (the framework cannot prove a caller is production), but
the factory <strong>never</strong> bakes in a default allow-all. Ship a real
<code>authorize</code> before exposing a chat route publicly — without one,
<code>toNetScriptChatResponse</code> cannot gate access to the session stream.
Supplying <code>authorize</code> without a <code>request</code> is a programming error
and throws.
{{ /comp }}

## Fencing a reclaimed chat executor

A chat turn that runs in the background — in a worker or saga under a service identity, not
in a request an open app keeps alive — can be reclaimed: its lease expires, a new claim runs
the turn again, and the old executor may still be writing. Pass `producer` to fence it.
Every append (the `newMessages` echo and each assistant chunk) then carries one
durable-streams idempotent-producer sequence `(id, epoch, seq)`, and the streams service
rejects a writer whose epoch is older than the newest one that has written.

```ts
import { NetScriptChatProducerError, toNetScriptChatResponse } from "@netscript/fresh/ai";

try {
  await toNetScriptChatResponse({
    target: { sessionId: turn.sessionId },
    newMessages: turn.newMessages,
    source: assistantChatStream,
    mode: "await", // the executor waits for every append to be acknowledged
    // id: stable across retries of this turn. epoch: this claim's generation.
    producer: { id: `chat-turn:${turn.sessionId}:${turn.id}`, epoch: claim.generation },
  });
} catch (error) {
  if (error instanceof NetScriptChatProducerError && error.kind === "stale-epoch") {
    // A newer claim (error.currentEpoch) owns this turn; nothing from this writer was stored.
    return;
  }
  throw error;
}
```

- **The caller owns the epoch.** NetScript never claims or bumps an epoch: `autoClaim` stays
  off, because re-claiming a stale epoch would defeat fencing. Use a non-negative integer that
  increases on every claim of the turn: a claim counter or row version your executor
  increments when it takes the turn. When your job runtime exposes a lease or claim
  generation, use that.
- **A replay under the same pair is deduplicated chunk by chunk.** Each chunk is sent as
  its own producer batch, so its sequence number is its index in the turn (the
  `newMessages` echo first, then the assistant chunks), however fast the source yields.
  Replaying the same turn under the same `(id, epoch)` therefore appends only the chunks an
  earlier call never stored, for example after the executor was interrupted. The service
  drops an already-stored index without comparing content, so use one id per turn.
- **A new epoch starts a new sequence.** A newer claim rewrites the turn from index `0`;
  whatever an older claim stored before it was fenced stays in the transcript.
- **One request per chunk.** Fenced turns trade batching for that determinism: each chunk is
  its own request, with at most five in flight.
- **Fencing starts once the newer claim has written.** Until the new epoch's first append,
  the service has not seen it, so an older writer is still accepted.
- **Errors are typed.** A rejected append becomes a `NetScriptChatProducerError` whose `kind`
  uses the same failure vocabulary as State Protocol producers (`'stale-epoch'`,
  `'sequence-gap'`, `'stream-closed'`, `'retryable'`, ...). It is thrown in `'await'` mode or
  while echoing `newMessages`. In the default `'immediate'` mode a failure after the `202` is
  logged, as the unfenced writer does, so executors should use `'await'`.
- **Without `producer` nothing changes.** Appends go through the upstream transport exactly as
  before, with no producer headers.

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

This page orients; the API reference enumerates every exported symbol.

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
