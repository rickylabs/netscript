---
layout: layouts/base.vto
title: Live streaming
templateEngine: [vento, md]
prev: { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" }
next: { label: "Build", href: "/how-to/" }
---

# Live streaming

This chapter makes the chat stream. The chapter 3 island fires a turn, waits for it to **settle**,
then re-materializes the transcript in one jump. You switch it to a **live subscription** on the
same durable connection, so the reply appears token by token and a tool card moves through
`pending → streaming → complete` as chunks arrive.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" },
  { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" },
  { label: "6 · Live streaming", href: "/tutorials/chat/06-live-streaming/" }
] }) }}

## What you will build

A chat island that reads the session live: replies render as chunks arrive, a second tab on the
same session updates without a refresh, and a reload resumes the live read from the seed offset.

## Before you begin

You need the chat from chapters [1](/tutorials/chat/01-scaffold/)–[5](/tutorials/chat/05-mcp/), with
`aspire start` running.

## The live half of a durable stream

A durable chat session is one append-only log with two readers. The **seed** reader
(`resolveChatSnapshot`) materializes everything written so far for first paint. The **live** reader
is `createNetScriptChatConnection(...).subscribe(signal)`, an async iterable that yields each new
chunk as the server appends it. Chapter 3 opened the connection to `send` messages; this chapter
reads from it.

{{ comp.apiTable({
  caption: "@netscript/fresh/ai — the live-read seam",
  rows: [
    { name: "connection.subscribe(signal)", type: "AsyncIterable<chunk>", desc: "Yields each durable chunk as it lands." },
    { name: "initialOffset", type: "connection option", desc: "The seed snapshot's offset — hand it in so the live read continues from where SSR stopped, one continuous log." },
    { name: "connection.dispose()", type: "() => void", desc: "One idempotent teardown (close / stop / dispose) — call it on unmount so no subscription leaks." }
  ]
}) }}

The durable chat plane is the [durable-streams](/durable-workflows/streams/) plane specialized for
conversations. The chapter 2 route *produces* chunks into the session log, and the subscription
below *consumes* them in the browser. The log outlives both the turn that wrote it and the tab that
was watching.

## Step 1 — Subscribe from the island

Replace the chapter 3 settle-then-render flow with a live loop. On mount, open a subscription
seeded at the snapshot's `offset`. For each chunk, re-derive the rendered transcript through the
**same projection the seed used**, so the live and seed paths never disagree about an in-flight
tool card. The connection is the one from chapter 3; you are adding the read side.

```tsx
// apps/dashboard/islands/Chat.tsx — the live subscription (replaces the settle-then-render onSubmit)
import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { createNetScriptChatConnection, resolveChatSnapshot } from '@netscript/fresh/ai';
import type { NetScriptChatSnapshot } from '@netscript/fresh/ai';
import { chatTurnRoute } from '@app/contracts/routes/chat-turn.ts';

const Chat = ({ sessionId, seed }: { sessionId: string; seed: NetScriptChatSnapshot }) => {
  const snapshot = useSignal(seed);
  const base = `${location.origin}/api/chat-stream`;

  const connection = createNetScriptChatConnection({
    target: { sessionId, baseUrl: base },
    initialOffset: seed.offset ?? undefined, // continue from the SSR seed cursor
    authorize: () => true, // browser half; the server route re-checks ownership
  });

  // Live read: fold each chunk into the transcript as it lands.
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      for await (const _chunk of connection.subscribe(controller.signal)) {
        // Re-materialize through the SAME projection the seed used, so the in-flight
        // tool card moves pending → streaming → complete without drift.
        snapshot.value = await resolveChatSnapshot({ target: { sessionId, baseUrl: base } });
      }
    })();
    return () => {
      controller.abort();
      connection.dispose(); // idempotent teardown — no leaked subscription
    };
  }, []);

  const onSubmit = async (text: string) => {
    // 1. Append the user message to the durable session.
    await connection.send([{ id: crypto.randomUUID(), role: 'user', content: text }]);
    // 2. Fire the model turn. Its chunks now arrive through the subscription above —
    //    no manual re-materialize here; the live loop owns rendering.
    await fetch(chatTurnRoute.href({ path: { sessionId } }), { method: 'POST' });
  };

  return (
    <div class='ns-stack'>
      <div class='ns-stack'>
        {snapshot.value.messages.map((m) => <Message key={m.id} message={toMessageData(m)} />)}
      </div>
      <PromptInput onSubmit={onSubmit} placeholder='Ask anything…' />
    </div>
  );
};

export default Chat;
```

`onSubmit` no longer re-reads the transcript. It appends the prompt and fires the turn; the
**subscription** advances the UI one chunk at a time, for this tab and any other tab watching the
same session.

{{ comp callout { type: "important", title: "One projection, seed and live" } }}
The live loop re-derives through <code>resolveChatSnapshot</code>, which reduces the session through <code>projectChatSnapshot</code>, the reducer that seeded first paint (the one-projection law from chapter 3). Never hand-roll a separate live reducer: seed and live must share the projection, or a tool card rendered mid-stream can jump or vanish when the next chunk arrives.
{{ /comp }}

## Step 2 — Tear down cleanly

The `useEffect` above aborts its `AbortController` and calls `connection.dispose()` on unmount.
`close`, `stop` and `dispose` are one idempotent teardown: calling it twice is harmless, and calling
it once is mandatory. Skip it and every navigation away from the chat leaks a subscription against
the streams runtime.

{{ comp callout { type: "tip", title: "Backpressure and reconnect are already handled" } }}
If the island subscribes before the session stream exists (a new chat), <code>subscribe</code> re-polls with backoff instead of throwing. Because reads are seeded from <code>initialOffset</code>, a reconnect resumes from the last chunk you saw rather than replaying the whole log: the durable offset is the reconnect cursor.
{{ /comp }}

## Verify your progress

With `aspire start` running, open the app in two browser tabs pointed at the same session.

1. In tab A, send a message. The assistant reply **streams in**: text grows as chunks land, and a
   tool call surfaces as a card that fills from `pending` to `complete`, instead of appearing all
   at once when the turn settles.
2. Watch **tab B**. The same message and reply appear there live, with no refresh: two consumers,
   one durable log.
3. **Reload either tab.** The full transcript is still there, and the live read resumes from the
   seed offset.
4. Type-check the app:

   ```bash
   deno task --cwd apps/dashboard check
   ```

- [ ] The island opens `connection.subscribe(signal)` seeded at the snapshot `offset`.
- [ ] An assistant reply renders incrementally as chunks arrive, not only on settle.
- [ ] A second tab on the same session updates live.
- [ ] `connection.dispose()` runs on unmount (no leaked subscription).
- [ ] A reload replays the transcript and resumes the live read.
- [ ] `deno task --cwd apps/dashboard check` is clean.

{{ comp callout { type: "tip", title: "If the reply does not stream" } }}
If replies still appear only on settle, confirm the subscription loop is running. A thrown <code>authorize</code> on the server route (chapter 2) closes the stream, and an empty subscription usually means the streams runtime is not up (check the <a href="/explanation/aspire/">Aspire dashboard</a>). If a second tab never updates, make sure both tabs target the <em>same</em> <code>sessionId</code>: the session id is the stream identity.
{{ /comp }}

## What you built

A durable AI chat: an `authorize`-gated route that streams and persists each turn, an app-owned
chat UI, a server-side tool with citation chips, remote MCP tools whose `ui://` widgets render
themed and sandboxed, and a live subscription that folds the model's chunks into the transcript as
they land. Every part lives in the durable session rather than the browser, so it holds across
tabs and reloads. The same progression, from **one agreed message shape** to **durable delivery**
to a **live stream**, underlies every NetScript real-time surface.

## Next steps

Use the durable-chat seams directly with the [Build a durable chat](/ai/how-to/build-a-durable-chat/)
recipe. Related pages:

- [Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/): restyle any chat or widget
  component; you own the copied source.
- [Publish a durable stream](/durable-workflows/how-to/publish-a-durable-stream/): model live
  list, board or table data, the other real-time plane.
- [AI engine](/ai/engine/): the provider-neutral model registry, agent loop, tool registry and MCP
  transports.
- [fresh reference](/reference/fresh/): exact signatures.
