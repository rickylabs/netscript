---
layout: layouts/base.vto
title: Build a durable chat
templateEngine: [vento, md]
prev: { label: "Customize Fresh UI", href: "/how-to/customize-fresh-ui/" }
next: { label: "Deploy", href: "/how-to/deploy/" }
---

# Build a durable chat

**Goal:** wire an AI chat onto a Fresh route whose message history and in-flight tool
calls survive reload, reconnect, and a second tab — because the transcript is backed by a
**durable session stream**, not component state. This recipe uses the
[`@netscript/fresh/ai`](/reference/fresh/) durable-chat plane (published on JSR in
`@netscript/fresh`, usable now): one session route, one stream proxy, one SSR seed, and one
client island.

The chat surface is built from four seams, each a single function:

{{ comp.apiTable({
  caption: "@netscript/fresh/ai — the four durable-chat seams",
  rows: [
    { name: "toNetScriptChatResponse", type: "session route", desc: "Turn a server chat stream into a durable session Response; authorize-gated (→ 403 on deny)." },
    { name: "createNetScriptChatStreamProxy", type: "the one proxy", desc: "The single durable chat-stream proxy handler the browser reads through — strips misdescribing headers, attaches streams auth server-side." },
    { name: "resolveChatSnapshot", type: "SSR seed", desc: "Materialize the transcript so far for first paint, reduced through projectChatSnapshot." },
    { name: "createNetScriptChatConnection", type: "client island", desc: "Live handle over one session: subscribe / send, with idempotent close / stop / dispose." }
  ]
}) }}

## Prerequisites

- A NetScript workspace with a scaffolded `apps/dashboard/` Fresh app (`netscript init`).
- The **streams runtime** reachable — durable sessions are addressed through the
  `@netscript/plugin-streams-core` seam. Add it with `netscript plugin add streams` and
  bring it up under Aspire.
- A model provider key. This recipe calls Anthropic directly through
  [`@tanstack/ai`](https://tanstack.com/ai); export `ANTHROPIC_API_KEY` before you start
  the app (Aspire injects it into the app process).
- A stable `sessionId` per conversation — one durable stream lives per `sessionId`.

## The one-projection law (read this first)

`resolveChatSnapshot` (the SSR seed) and the live island projection MUST run the **same**
reducer — `projectChatSnapshot`. Seed and live are two entry points into one function:

```text
messages --> [ projectChatSnapshot ] --> { messages, renderParts }
```

If the seed path and the live path diverge, **tool cards drift**: a card materialized at
first paint renders differently — or vanishes — once the first live chunk arrives, because
the two projections disagree about intermediate tool state. Route both through
`projectChatSnapshot` (the seed already does) and the transcript is reload-stable by
construction.

## 1. The durable chat session route

This route runs one model turn and persists it to the durable session. Two things are
non-negotiable: an `authorize` hook (there is **no** default allow-all), and that the
model stream is handed to `toNetScriptChatResponse` as its `source`.

```ts
// apps/dashboard/routes/api/chat/[sessionId].ts
import { chat } from '@tanstack/ai';
import { anthropicText } from '@tanstack/ai-anthropic';
import { resolveChatSnapshot, toNetScriptChatResponse } from '@netscript/fresh/ai';

// Only the owner of a session may drive its turns. REQUIRED in production —
// the factory bakes in no default allow-all.
const authorize = (request: Request, sessionId: string): boolean =>
  sessionBelongsToUser(request, sessionId);

export const handler = {
  async POST(ctx: { req: Request; params: { sessionId: string } }): Promise<Response> {
    const { sessionId } = ctx.params;
    const target = { sessionId } as const;

    // History so far, reduced through the SAME projection the island uses.
    const snapshot = await resolveChatSnapshot({ target });
    const messages = snapshot.messages.map((m) => ({ role: m.role, content: m.content }));

    // Direct model wiring: a TanStack adapter + chat(). anthropicText() reads
    // ANTHROPIC_API_KEY from the environment when no key is passed.
    const adapter = anthropicText('claude-sonnet-4-5');
    const source = chat({
      adapter,
      messages,
      systemPrompts: ['You are a helpful assistant.'],
    });

    // Persist + stream the assistant turn into the durable session, gated by authorize.
    return toNetScriptChatResponse({
      target,
      request: ctx.req,
      authorize,
      source,
    });
  },
};
```

{{ comp callout { type: "important", title: "authorize is required — do not skip it" } }}
<code>toNetScriptChatResponse</code> only enforces access when you pass an <code>authorize</code> hook, and it applies <strong>no</strong> default. Without one, the session stream is unauthenticated. Supplying <code>authorize</code> without a <code>request</code> is a programming error and throws. Return <code>false</code> to deny — the response becomes <code>403 Forbidden</code> and the session stream is never touched.
{{ /comp }}

{{ comp callout { type: "note", title: "The @netscript/ai engine is published — this recipe still shows the direct wiring" } }}
This recipe calls the model through <code>@tanstack/ai</code> + <code>@tanstack/ai-anthropic</code> directly, the same way the reference chat app wires it on shipped seams. The <code>@netscript/ai</code> engine (model registry, provider ports, agent loop) is published on JSR as of <code>{{ releaseVersion }}</code> (<code>deno add jsr:@netscript/ai{{ releaseSpecifier }}</code>) and can own this model-call layer behind <code>import '@netscript/ai/anthropic'</code> — see the <a href="/ai/engine/">AI engine</a> page. The direct wiring below remains a valid, dependency-light path.
{{ /comp }}

## 2. The one stream proxy

The browser never talks to the durable-streams service directly — it reads through a
single proxy that attaches streams auth server-side and keeps every response header
accurate. Mount `createNetScriptChatStreamProxy` once, as a catch-all under your API namespace.

```ts
// apps/dashboard/routes/api/chat-stream/[...path].ts
import { createNetScriptChatStreamProxy } from '@netscript/fresh/ai';

const proxy = createNetScriptChatStreamProxy({
  // Derive the session from the request path: /api/chat-stream/ai/chat/{sessionId}
  target: (req) => ({ sessionId: new URL(req.url).pathname.split('/').pop()! }),
});

export const handler = { GET: proxy, POST: proxy };
```

{{ comp callout { type: "note", title: "Why a raw Request here, not a route contract" } }}
This resolver is the one documented exception to NetScript's typed-route rule: <code>createNetScriptChatStreamProxy</code>'s <code>target</code> only ever receives the raw <code>Request</code>, so the session id is parsed from <code>req.url</code> by hand. Everywhere else you build a URL or read a path param, prefer a bound <a href="/reference/fresh/"><code>createRouteReference</code></a> contract so the pattern and its typed params come from one source of truth.
{{ /comp }}

The proxy passes the durable-stream body through **unbuffered**, strips
`content-encoding` / `content-length` (they no longer describe the re-framed bytes) plus
the hop-by-hop headers, and propagates the client `AbortSignal` so a disconnect tears the
upstream fetch down. The `Authorization` header it overlays lives only on the
server → streams hop; it is never echoed to the browser.

## 3. Seed the first paint (SSR)

In the page loader, materialize the transcript so the chat renders complete on first paint
— no loading flash, and the same content a reload would show.

```ts
// apps/dashboard/routes/chat/[sessionId].tsx (loader)
import { resolveChatSnapshot } from '@netscript/fresh/ai';

const snapshot = await resolveChatSnapshot({ target: { sessionId } });
// snapshot -> { messages, renderParts, offset }
// `offset` seeds the live subscription so seed and live read one continuous log.
```

Pass `snapshot` into the island as its initial state. `renderParts` here is the
**transport** shape (`text` | `tool`) — the minimal reducer output. The rich presentation
parts (charts, tables) come from `parseBlocks` in the UI layer; see
[Customize Fresh UI](/how-to/customize-fresh-ui/) and the chat tutorial.

## 4. The client island

The island opens a durable connection, seeds from the SSR snapshot, `send`s the user
message into the session, fires the model turn, and re-materializes when the turn settles.
`close` / `stop` / `dispose` are one idempotent teardown — call it on cleanup.

```tsx
// apps/dashboard/islands/Chat.tsx
import { useSignal } from '@preact/signals';
import { createNetScriptChatConnection, resolveChatSnapshot } from '@netscript/fresh/ai';
import type { NetScriptChatSnapshot } from '@netscript/fresh/ai';

const Chat = ({ sessionId, seed }: { sessionId: string; seed: NetScriptChatSnapshot }) => {
  const snapshot = useSignal(seed);

  const connection = createNetScriptChatConnection({
    target: { sessionId, baseUrl: `${location.origin}/api/chat-stream` },
    initialOffset: seed.offset ?? undefined,
    authorize: (req, id) => sessionOwnedInBrowser(id), // REQUIRED in prod
  });

  const refresh = async () => {
    snapshot.value = await resolveChatSnapshot({
      target: { sessionId, baseUrl: `${location.origin}/api/chat-stream` },
    });
  };

  const onSubmit = async (text: string) => {
    // 1. Append the user message to the durable session.
    await connection.send([{ id: crypto.randomUUID(), role: 'user', content: text }]);
    // 2. Fire the model turn (the session route streams + persists the reply).
    await fetch(`/api/chat/${sessionId}`, { method: 'POST' });
    // 3. Re-materialize the settled transcript through the same projection.
    await refresh();
  };

  // Live durable updates (reload/second-tab replay); dispose on unmount.
  // for await (const chunk of connection.subscribe(signal)) { ... }
  // globalThis.addEventListener('beforeunload', () => connection.dispose());

  return renderTranscript(snapshot.value, onSubmit);
};

export default Chat;
```

{{ comp callout { type: "note", title: "Transport RenderPart vs presentation RenderPart" } }}
Two <code>RenderPart</code> types exist and must not be conflated. <code>@netscript/fresh/ai</code> emits the <strong>transport</strong> part (<code>text</code> | <code>tool</code>) — the durable-session wire shape. <code>@netscript/fresh-ui</code>'s <code>chat-render</code> (<code>parseBlocks</code>) owns the <strong>presentation</strong> part (<code>chart</code> | <code>donut</code> | <code>table</code> | <code>stats</code> | <code>line</code> | <code>text</code>) — the rich blocks you render. The transcript reduces through the first; the UI renders through the second.
{{ /comp }}

## Failure modes

- **`403 Forbidden` on the turn route:** `authorize` returned `false`, or the caller is
  not the session owner. This is the hook doing its job — not a bug.
- **`authorize` throws:** you passed `authorize` without a `request`. Thread `ctx.req` in.
- **Empty transcript on first subscribe:** a first-subscribe can race a not-yet-created
  session stream; `createNetScriptChatConnection` re-polls with backoff and returns an
  empty stream rather than a terminal error. A hard `401` / `403` propagates immediately.
- **Streams runtime unreachable:** the durable stream URL does not resolve. Confirm
  `netscript plugin add streams` ran and the streams service is up under Aspire.
- **Model call fails:** `ANTHROPIC_API_KEY` is unset or invalid — `chat()` surfaces the
  provider error into the assistant stream.

## Next steps

- Walk it end to end in the [AI Chat tutorial](/tutorials/chat/).
- Render rich blocks and citation chips: [Customize Fresh UI](/how-to/customize-fresh-ui/).
- The list/board/table live-data plane is different — see
  [Publish a durable stream](/how-to/publish-a-durable-stream/) and
  [Live Dashboard, chapter 05](/tutorials/live-dashboard/05-live-stream/).
- Look up exact signatures in the [fresh reference](/reference/fresh/).

{{ comp.nextPrev({
  prev: { label: "Customize Fresh UI", href: "/how-to/customize-fresh-ui/" },
  next: { label: "Deploy", href: "/how-to/deploy/" }
}) }}
