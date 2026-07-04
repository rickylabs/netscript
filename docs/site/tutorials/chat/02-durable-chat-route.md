---
layout: layouts/base.vto
title: The durable chat route
templateEngine: [vento, md]
prev: { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" }
next: { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" }
---

# The durable chat route

The backend of a durable chat is two routes and one model call. In this chapter you wire the
**session route** (runs a model turn, persists it durably, gated by `authorize`), the **one
stream proxy** the browser reads through, and the direct model call on `@tanstack/ai`. When
you finish, a `curl` can drive a full turn and a second `curl` replays it — the transcript
is durable.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" }
] }) }}

## The four seams

`@netscript/fresh/ai` gives you one function per job. This chapter uses three of the four;
chapter 3 uses the fourth (`createNetScriptChatConnection`) in the island.

{{ comp.apiTable({
  caption: "@netscript/fresh/ai — the durable-chat seams used here",
  rows: [
    { name: "toNetScriptChatResponse", type: "session route", desc: "Turn a server chat stream into a durable session Response; authorize-gated (→ 403 on deny)." },
    { name: "resolveChatSnapshot", type: "history seed", desc: "Materialize the transcript so far, reduced through projectChatSnapshot — the model's context." },
    { name: "createNetScriptChatStreamProxy", type: "the one proxy", desc: "The single durable chat-stream proxy the browser reads through; attaches streams auth server-side." }
  ]
}) }}

## Step 1 — The model call

The model layer is wired directly on `@tanstack/ai` and a provider adapter. `chat()` returns
an async iterable of stream chunks — exactly the `source` shape `toNetScriptChatResponse`
persists. `anthropicText()` reads `ANTHROPIC_API_KEY` from the environment, so no key
appears in code:

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

{{ comp callout { type: "note", title: "The @netscript/ai engine replaces this in beta.2" } }}
Calling <code>@tanstack/ai</code> directly is how the reference chat app wires the model on shipped seams today. The <code>@netscript/ai</code> engine — a model registry, provider ports, and an agent loop behind <code>import '@netscript/ai/anthropic'</code> — arrives in <code>0.0.1-beta.2</code> and will own this layer. It is <code>publish:false</code> right now, so do not <code>deno add jsr:@netscript/ai</code>; use the direct wiring above.
{{ /comp }}

## Step 2 — The session route

This route runs one turn and persists it. It pulls the transcript so far through
`resolveChatSnapshot` (so the model has context), calls the model, and hands the stream to
`toNetScriptChatResponse` — gated by an `authorize` hook.

```ts
// apps/dashboard/routes/api/chat/[sessionId].ts
import { chat } from '@tanstack/ai';
import { anthropicText } from '@tanstack/ai-anthropic';
import { resolveChatSnapshot, toNetScriptChatResponse } from '@netscript/fresh/ai';

// REQUIRED in production — no default allow-all. Replace with your real check
// (session cookie → owner lookup). Returning false denies the turn with a 403.
const authorize = (request: Request, sessionId: string): boolean =>
  Boolean(request) && sessionId.length > 0;

export const handler = {
  async POST(ctx: { req: Request; params: { sessionId: string } }): Promise<Response> {
    const target = { sessionId: ctx.params.sessionId } as const;

    // History so far, reduced through the SAME projection the island seeds from.
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

{{ comp callout { type: "important", title: "authorize is not optional" } }}
<code>toNetScriptChatResponse</code> enforces access only when you pass an <code>authorize</code> hook, and the factory applies <strong>no</strong> default. Omit it and the session stream is unauthenticated. Pass <code>authorize</code> without a <code>request</code> and it throws — always thread <code>ctx.req</code> through. A denial returns <code>403 Forbidden</code> and the session stream is never touched.
{{ /comp }}

The user message is appended to the durable session by the island in chapter 3 (via
`connection.send`), so this route reads it back through `resolveChatSnapshot` and only needs
to stream the assistant reply. You could instead pass `newMessages: [userMessage]` to
`toNetScriptChatResponse` to persist the prompt here — one place, either way, never both.

## Step 3 — The one stream proxy

The browser must not hold streams credentials, so it never talks to the durable-streams
service directly. It reads through a single proxy that attaches auth server-side and keeps
every response header accurate. Mount `createNetScriptChatStreamProxy` once as a catch-all:

```ts
// apps/dashboard/routes/api/chat-stream/[...path].ts
import { createNetScriptChatStreamProxy } from '@netscript/fresh/ai';

const proxy = createNetScriptChatStreamProxy({
  // The session id is the last path segment: /api/chat-stream/ai/chat/{sessionId}
  target: (req) => ({ sessionId: new URL(req.url).pathname.split('/').pop()! }),
});

export const handler = { GET: proxy, POST: proxy };
```

{{ comp callout { type: "note", title: "Why a proxy at all?" } }}
The proxy exists so the browser gets a durable stream <em>without</em> streams credentials. It attaches the <code>Authorization</code> header only on the server → streams hop (never echoed back), passes the body through unbuffered, and strips <code>content-encoding</code> / <code>content-length</code> — which stop describing the bytes once the stream is re-framed across the proxy. A client disconnect aborts the upstream fetch, so no stream is left dangling.
{{ /comp }}

## Verify your progress

With `aspire start` running, drive one turn against a fresh session id, then replay it:

```sh
# Run a turn (the assistant reply streams back and is persisted durably).
curl -N -X POST http://localhost:8010/api/chat/demo-1

# Replay: read the same session again — the transcript is still there.
curl -N http://localhost:8010/api/chat-stream/ai/chat/demo-1
```

The first call streams a reply; the second shows the durable session already holds it —
that is durability, not a re-run. Then type-check:

```sh
deno task check
```

- [ ] `POST /api/chat/{sessionId}` streams an assistant reply.
- [ ] A denied `authorize` returns `403`.
- [ ] Re-reading the session through the proxy replays the transcript.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "If the turn errors" } }}
A provider error (bad or missing <code>ANTHROPIC_API_KEY</code>) surfaces <em>into</em> the assistant stream rather than as an HTTP error — check the reply body. A <code>403</code> means <code>authorize</code> returned <code>false</code>. An empty replay means the streams runtime is not up: confirm it in the Aspire dashboard.
{{ /comp }}

## What you built

The durable backend: a session route that runs a model turn and persists it behind a
required `authorize` gate, and the one proxy the browser reads through. Next you give it a
face — copy the fresh-ui chat components and hydrate an island.

{{ comp.nextPrev({ prev: { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" }, next: { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" } }) }}
