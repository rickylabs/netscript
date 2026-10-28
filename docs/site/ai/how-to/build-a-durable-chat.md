---
layout: layouts/base.vto
title: Build a durable chat
templateEngine: [vento, md]
order: 101
oldUrl: /how-to/build-a-durable-chat/
---

# Build a durable chat

Wire an AI chat onto a Fresh route so its message history and in-flight tool calls survive
reload, reconnect and a second tab. The transcript lives in a durable session stream from
[`@netscript/fresh/ai`](/ai/durable-chat/), not in component state. You add four pieces: a session
route, a stream proxy, an SSR seed and a client island.

## Prerequisites

- A NetScript workspace with a scaffolded `apps/dashboard/` Fresh app (`netscript init`).
- A reachable streams runtime, because durable sessions are addressed through the
  `@netscript/plugin-streams-core` seam. Add it with
  `netscript plugin install stream --name streams` and bring it up under Aspire.
- A model provider key. This recipe calls Anthropic through [`@tanstack/ai`](https://tanstack.com/ai);
  export `ANTHROPIC_API_KEY` before you start the app, and Aspire injects it into the app process.
- A stable `sessionId` per conversation. One durable stream exists per `sessionId`.

> [!IMPORTANT]
> The SSR seed and the live island must reduce the transcript through the same function,
> `projectChatSnapshot`, or tool cards drift once the first live chunk arrives. The steps below
> follow that rule; [the one-projection law](/ai/durable-chat/#the-one-projection-law) explains why.

## Step 1 — Add the session route

This route runs one model turn and persists it to the durable session. It needs an `authorize`
hook, and it hands the model stream to `toNetScriptChatResponse` as its `source`.

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

> [!CAUTION]
> `toNetScriptChatResponse` enforces access only when you pass an `authorize` hook, and it applies no
> default. Without one, the session stream is unauthenticated. Return `false` to deny: the response
> becomes `403 Forbidden` and the session stream is never touched.

> [!NOTE]
> This recipe calls the model through `@tanstack/ai` and `@tanstack/ai-anthropic` directly. The
> [AI engine](/ai/engine/) can own this model call instead, behind `import '@netscript/ai/anthropic'`.

## Step 2 — Mount the stream proxy

The browser never talks to the durable-streams service directly. It reads through one proxy that
attaches streams auth on the server and keeps every response header accurate. Mount
`createNetScriptChatStreamProxy` once, as a catch-all under your API namespace.

```ts
// apps/dashboard/routes/api/chat-stream/[...path].ts
import { createNetScriptChatStreamProxy } from '@netscript/fresh/ai';

const proxy = createNetScriptChatStreamProxy({
  // Derive the session from the request path: /api/chat-stream/ai/chat/{sessionId}
  target: (req) => ({ sessionId: new URL(req.url).pathname.split('/').pop()! }),
});

export const handler = { GET: proxy, POST: proxy };
```

The proxy passes the body through unbuffered, strips `content-encoding`, `content-length` and the
hop-by-hop headers, and propagates the client `AbortSignal`. The `Authorization` header it adds
exists only on the server-to-streams hop and is never echoed to the browser.

## Step 3 — Seed the first paint

In the page loader, materialize the transcript so the chat renders complete on first paint, with
no loading flash and the same content a reload would show.

```ts
// apps/dashboard/routes/chat/[sessionId].tsx (loader)
import { resolveChatSnapshot } from '@netscript/fresh/ai';

const snapshot = await resolveChatSnapshot({ target: { sessionId } });
// snapshot -> { messages, renderParts, offset }
// `offset` seeds the live subscription so seed and live read one continuous log.
```

Pass `snapshot` into the island as its initial state. Its `renderParts` use the transport shape
(`text` | `tool`); rich presentation parts such as charts and tables come from `parseBlocks` in the
[chat UI](/ai/chat-ui/).

## Step 4 — Build the client island

The island opens a durable connection, seeds from the SSR snapshot, sends the user message into the
session, fires the model turn and re-materializes when the turn settles. `close`, `stop` and
`dispose` are one idempotent teardown; call it on cleanup.

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

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `403 Forbidden` on the turn route | `authorize` returned `false`, or the caller does not own the session. The hook is working as intended. |
| `authorize` throws | You passed `authorize` without a `request`. Pass `ctx.req`. |
| Empty transcript on first subscribe | The first subscribe raced a session stream that did not exist yet. `createNetScriptChatConnection` re-polls with backoff and returns an empty stream instead of a terminal error; a hard `401` or `403` propagates immediately. |
| Streams runtime unreachable | The durable stream URL does not resolve. Check that `netscript plugin install stream --name streams` ran and the streams service is up under Aspire. |
| Model call fails | `ANTHROPIC_API_KEY` is unset or invalid; `chat()` surfaces the provider error into the assistant stream. |

## Next steps

Walk the same chat end to end in the [AI Chat tutorial](/tutorials/chat/).

- Render rich blocks and citation chips: [Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/).
- Understand each primitive: [Durable chat](/ai/durable-chat/).
- Look up exact signatures in the [`@netscript/fresh` reference](/reference/fresh/).

{{ comp.nextPrev({
  prev: { label: "Customize Fresh UI", href: "/web-layer/how-to/customize-fresh-ui/" },
  next: { label: "Deploy", href: "/orchestration-runtime/how-to/deploy/" }
}) }}
