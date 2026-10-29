---
layout: layouts/base.vto
title: The durable chat route
templateEngine: [vento, md]
prev: { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" }
next: { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" }
---

# The durable chat route

This chapter builds the chat backend: a session route that runs a model turn and persists it
behind an `authorize` hook, the one stream proxy the browser reads through, and the model call on
`@tanstack/ai`.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" },
  { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" },
  { label: "6 · Live streaming", href: "/tutorials/chat/06-live-streaming/" }
] }) }}

## What you will build

Two routes and one model call. When you finish, one `curl` drives a full turn and a second `curl`
replays it from the durable session.

## Before you begin

You need the `chat-app/` workspace from [chapter 1](/tutorials/chat/01-scaffold/), with
`aspire start` running and `ANTHROPIC_API_KEY` set.

## The four seams

`@netscript/fresh/ai` has one function per job. This chapter uses three of them; chapter 3 uses
the fourth, `createNetScriptChatConnection`, in the island.

{{ comp.apiTable({
  caption: "@netscript/fresh/ai — the durable-chat seams used here",
  rows: [
    { name: "toNetScriptChatResponse", type: "session route", desc: "Turn a server chat stream into a durable session Response; authorize-gated (→ 403 on deny)." },
    { name: "resolveChatSnapshot", type: "history seed", desc: "Materialize the transcript so far, reduced through projectChatSnapshot — the model's context." },
    { name: "createNetScriptChatStreamProxy", type: "the one proxy", desc: "The single durable chat-stream proxy the browser reads through; attaches streams auth server-side." }
  ]
}) }}

## Step 1 — The model call

`chat()` from `@tanstack/ai` returns an async iterable of stream chunks, which is the `source`
shape `toNetScriptChatResponse` persists. `anthropicText()` reads `ANTHROPIC_API_KEY` from the
environment, so no key appears in code:

```ts
import { chat } from '@tanstack/ai';
import { anthropicText } from '@tanstack/ai-anthropic';

const adapter = anthropicText('claude-sonnet-4-5');
const source = chat({
  adapter,
  messages: [{ role: 'user', content: 'Hello!' }],
  systemPrompts: ['You are a helpful assistant.'],
});
// `source` is an AsyncIterable of TanStack stream chunks.
```

{{ comp callout { type: "note", title: "Where the @netscript/ai engine fits" } }}
NetScript also ships a provider-neutral engine, the <a href="/ai/engine/">@netscript/ai</a> package on JSR. Its entry seam is a model registry with self-registering providers: <code>import '@netscript/ai/anthropic'</code> registers the Anthropic provider, and <code>getModel('anthropic:claude-sonnet-4-5')</code> resolves a model handle. The agent loop, tool registry and MCP transports live behind its other subpaths (<a href="/reference/ai/">reference</a>). This route stays on <code>@tanstack/ai</code> because the durable session plane persists and reduces TanStack chunk streams, while the engine's chat clients stream the engine's own event vocabulary. The two wire shapes differ.
{{ /comp }}

## Step 2 — The route contract

Give the dynamic route a typed identity. `createRouteReference` from `@netscript/fresh/route`
infers the `{ sessionId }` path param from the `[sessionId]` pattern, so the id the server reads
and the URL the browser posts to in chapter 3 come from one declaration. Put it in the shared
`contracts/` tree so the route and the island import the same object:

```ts
// contracts/routes/chat-turn.ts
import { createRouteReference } from '@netscript/fresh/route';

/** The one place the chat turn route pattern is written. */
export const chatTurnRoute = createRouteReference('/api/chat/[sessionId]');
// chatTurnRoute.parsePath({ sessionId })      -> typed { sessionId: string }
// chatTurnRoute.href({ path: { sessionId } }) -> "/api/chat/<id>"  (the island posts here in ch. 3)
```

## Step 3 — The session route

This route runs one turn and persists it. It reads the transcript so far through
`resolveChatSnapshot`, so the model has context, calls the model, and hands the stream to
`toNetScriptChatResponse`, gated by an `authorize` hook. It reads its param through the contract
instead of touching `ctx.params` by hand:

```ts
// apps/dashboard/routes/api/chat/[sessionId].ts
import { chat } from '@tanstack/ai';
import { anthropicText } from '@tanstack/ai-anthropic';
import { resolveChatSnapshot, toNetScriptChatResponse } from '@netscript/fresh/ai';
import { chatTurnRoute } from '../../../../contracts/routes/chat-turn.ts';

// REQUIRED in production — no default allow-all. Replace with your real check
// (session cookie → owner lookup). Returning false denies the turn with a 403.
const authorize = (request: Request, sessionId: string): boolean =>
  Boolean(request) && sessionId.length > 0;

export const handler = {
  async POST(ctx: { req: Request; params: { sessionId: string } }): Promise<Response> {
    // Typed off the one route contract — the same object the island builds its URL from.
    const { sessionId } = chatTurnRoute.parsePath(ctx.params);
    const target = { sessionId } as const;

    // This text-only example uses the same reduced projection the island seeds from.
    const snapshot = await resolveChatSnapshot({ target });
    const messages = snapshot.messages.map((m) => ({ role: m.role, content: m.content }));

    const source = chat({
      adapter: anthropicText('claude-sonnet-4-5'),
      messages,
      systemPrompts: ['You are a helpful assistant.'],
    });

    return toNetScriptChatResponse({ target, request: ctx.req, authorize, source });
  },
};
```

{{ comp callout { type: "caution", title: "authorize is not optional" } }}
<code>toNetScriptChatResponse</code> enforces access only when you pass an <code>authorize</code> hook, and the factory applies <strong>no</strong> default. Omit it and the session stream is unauthenticated. Pass <code>authorize</code> without a <code>request</code> and it throws, so always pass <code>ctx.req</code> through. A denial returns <code>403 Forbidden</code> and never touches the session stream.
{{ /comp }}

### Where the prompt is persisted

In chapter 3 the island appends the user message to the durable session with `connection.send`.
This route reads it back through `resolveChatSnapshot` and only streams the assistant reply.

You can instead pass `newMessages: [userMessage]` to `toNetScriptChatResponse` to persist the
prompt in the route. Pick one place, never both.

- `newMessages` accepts server-trusted TanStack UI/Model messages as `NetScriptChatSendMessage`,
  including original parts, attachments, metadata and tool calls. Validate any client input and
  give the model that same prompt. The plugin-AI scaffold instead builds a user turn from
  `message.text` and ignores client transcript fields. The content-string input remains valid.
- `snapshot.nativeMessages` exposes the complete persisted messages for native consumers.
  `NetScriptChatMessage` is the reduced rendering projection this text-only example uses. For a
  multimodal model, validate and supply supported native parts instead of mapping to text.
- On the live connection, pair `initialMessages: snapshot.nativeMessages` with
  `initialOffset: snapshot.offset` so native `MESSAGES_SNAPSHOT` chunks keep stored history.
  Native tool and data parts replay on both the seed and live paths.

## Step 4 — The one stream proxy

The browser must not hold streams credentials, so it never talks to the durable-streams service
directly. It reads through one proxy that attaches auth on the server. Mount
`createNetScriptChatStreamProxy` once as a catch-all:

```ts
// apps/dashboard/routes/api/chat-stream/[...path].ts
import { createNetScriptChatStreamProxy } from '@netscript/fresh/ai';

const proxy = createNetScriptChatStreamProxy({
  // The session id is the last path segment: /api/chat-stream/ai/chat/{sessionId}
  target: (req) => ({ sessionId: new URL(req.url).pathname.split('/').pop()! }),
});

export const handler = { GET: proxy, POST: proxy };
```

The proxy attaches the `Authorization` header only on the server-to-streams hop and never echoes
it back. It passes the body through unbuffered and strips `content-encoding` and
`content-length`, which no longer describe the bytes once the stream is re-framed. A client
disconnect aborts the upstream fetch, so no stream is left open.

{{ comp callout { type: "note", title: "Why a raw Request here, not a route contract" } }}
This resolver is the one documented exception to NetScript's typed-route rule: the <code>target</code> of <code>createNetScriptChatStreamProxy</code> only receives the raw <code>Request</code>, so the session id is parsed from <code>req.url</code> by hand. Everywhere else you build a URL or read a path param, use a bound <a href="/reference/fresh/"><code>createRouteReference</code></a> contract.
{{ /comp }}

## Verify your progress

With `aspire start` running:

1. Drive one turn against a new session id, then replay it. Aspire assigns the app's port at
   start-up so several workspaces can run side by side, so take the app URL from the Aspire
   dashboard first:

   ```sh
   APP=http://localhost:<port shown for your app in the dashboard>

   # Run a turn (the assistant reply streams back and is persisted durably).
   curl -N -X POST "$APP/api/chat/demo-1"

   # Replay: read the same session again — the transcript is still there.
   curl -N "$APP/api/chat-stream/ai/chat/demo-1"
   ```

   The first call streams a reply. The second shows that the durable session already holds it:
   the reply is replayed, not generated again.

2. Type-check the workspace:

   ```sh
   deno task check
   ```

- [ ] `POST /api/chat/{sessionId}` streams an assistant reply.
- [ ] A denied `authorize` returns `403`.
- [ ] Re-reading the session through the proxy replays the transcript.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "If the turn errors" } }}
A provider error, such as a bad or missing <code>ANTHROPIC_API_KEY</code>, surfaces <em>inside</em> the assistant stream rather than as an HTTP error, so check the reply body. A <code>403</code> means <code>authorize</code> returned <code>false</code>. An empty replay means the streams runtime is not up: confirm it in the Aspire dashboard.
{{ /comp }}

## What you built

A session route that runs a model turn and persists it behind a required `authorize` gate, and
the one proxy the browser reads through. Each turn is written to the durable session before
anything renders it, so an accepted reply outlives the request that produced it. Every later
chapter builds on this. Next, you give the backend a face: copy the fresh-ui chat components and
hydrate an island.
