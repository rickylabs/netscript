---
layout: layouts/base.vto
title: Live streaming
templateEngine: [vento, md]
prev: { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" }
next: { label: "Tutorials", href: "/tutorials/" }
---

# Live streaming

Your chat works, but it still feels turn-based: chapter 3's island fires a turn, waits for it to
**settle**, then re-materializes the transcript in one jump. Real chat streams — the reply appears
token by token, the tool card moves through `pending → streaming → complete` in front of you. In this
final chapter you switch the island from settle-then-render to a **live subscription**, folding each
chunk into the transcript as it arrives on the same durable connection you already opened.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" },
  { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" },
  { label: "6 · Live streaming", href: "/tutorials/chat/06-live-streaming/" }
] }) }}

## The live half of a durable stream

A durable chat session is one append-only log, and it has two readers. The **seed** reader
(`resolveChatSnapshot`) materializes everything written so far for first paint. The **live** reader is
`createNetScriptChatConnection(...).subscribe(signal)` — an async iterable that yields each new chunk
as the server appends it. You already opened the connection in chapter 3 to `send` messages; here you
finally read from it.

{{ comp.apiTable({
  caption: "@netscript/fresh/ai — the live-read seam",
  rows: [
    { name: "connection.subscribe(signal)", type: "AsyncIterable<chunk>", desc: "Yields each durable chunk as it lands. SR2-tolerant: a first subscribe that races a not-yet-created stream re-polls with backoff instead of throwing." },
    { name: "initialOffset", type: "connection option", desc: "The seed snapshot's offset — hand it in so the live read continues from where SSR stopped, one continuous log." },
    { name: "connection.dispose()", type: "() => void", desc: "One idempotent teardown (close / stop / dispose) — call it on unmount so no subscription leaks." }
  ]
}) }}

{{ comp callout { type: "note", title: "This is the same producer→consumer split as any durable stream" } }}
The durable chat plane is the <a href="/durable-workflows/streams/">durable-streams</a> plane
specialized for conversations: the server <em>produces</em> chunks into the session log, and the
browser <em>consumes</em> them live over the connection — the log outlives both the turn that wrote it
and the tab that was watching. Chapter 2's route is the producer; the subscription below is the
consumer.
{{ /comp }}

## Step 1 — Subscribe from the island

Replace chapter 3's "fire the turn, then re-materialize on settle" flow with a live loop. On mount,
open a subscription seeded at the snapshot's `offset`; for each chunk, re-derive the rendered
transcript through the **same projection the seed used**, so live and seed never disagree about an
in-flight tool card. The connection is the one from chapter 3 — you are adding the read side.

```tsx
// apps/dashboard/islands/Chat.tsx — the live subscription (replaces the settle-then-render onSubmit)
import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { createNetScriptChatConnection, resolveChatSnapshot } from '@netscript/fresh/ai';
import type { NetScriptChatSnapshot } from '@netscript/fresh/ai';

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
    await fetch(`/api/chat/${sessionId}`, { method: 'POST' });
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

The shape of the change is the point: `onSubmit` no longer re-reads the transcript itself. It just
appends the prompt and fires the turn; the **subscription** is what advances the UI, one chunk at a
time, for this tab and any other tab watching the same session.

{{ comp callout { type: "important", title: "One projection, seed and live" } }}
The live loop re-derives through <code>resolveChatSnapshot</code> — which reduces the session through
<code>projectChatSnapshot</code>, the <strong>same</strong> reducer that seeded first paint. That is
the one-projection law from chapter 3 doing its job under streaming: because both paths route through
one reducer, a tool card rendered mid-stream never jumps or vanishes when the next chunk arrives. Never
hand-roll a separate live reducer — seed and live must share the projection.
{{ /comp }}

## Step 2 — Tear down cleanly

A live subscription is a long-lived resource. The `useEffect` above aborts its `AbortController` and
calls `connection.dispose()` on unmount — `close` / `stop` / `dispose` are one idempotent teardown, so
calling it twice is harmless and calling it once is mandatory. Skip it and every navigation away from
the chat leaks a subscription against the streams runtime.

{{ comp callout { type: "tip", title: "Backpressure and reconnect are already handled" } }}
<code>subscribe</code> is SR2-tolerant: if the island mounts and subscribes before the session stream
exists (a fresh chat), it re-polls with backoff instead of throwing. And because reads are seeded from
<code>initialOffset</code>, a reconnect resumes from the last chunk you saw rather than replaying the
whole log — the durable offset is the reconnect cursor.
{{ /comp }}

## Verify your progress

With `aspire start` running, open the app in two browser tabs pointed at the same session:

1. In tab A, send a message. The assistant reply **streams in** — text grows as chunks land, and a
   tool call surfaces as a card that fills from `pending` to `complete` — rather than appearing all at
   once when the turn settles.
2. Watch **tab B**: the same message and reply appear live there too, with no refresh. Two consumers,
   one durable log.
3. **Reload either tab.** The full transcript is still there and the live read resumes from the seed
   offset — durability and live streaming on the one connection.
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
If replies still appear only on settle, confirm the subscription loop is actually running — a thrown
<code>authorize</code> on the server route (chapter 2) closes the stream, and an empty subscription
usually means the streams runtime is not up (check the <a href="/explanation/aspire/">Aspire
dashboard</a>). If a second tab never updates, both tabs must target the <em>same</em>
<code>sessionId</code> — the session id is the stream identity.
{{ /comp }}

## What you built

A complete, production-shaped durable AI chat: a scaffolded workspace, an `authorize`-gated route that
streams and persists each turn, an app-owned chat UI, a server-side tool with citation chips, remote
MCP tools whose `ui://` widgets render themed and sandboxed, and now a live subscription that folds the
model's chunks into the transcript the moment they land — across tabs and across reloads, because every
part lives in the durable session rather than the browser.

That progression — **one agreed message shape → durable delivery → live stream** — is the spine every
NetScript real-time surface is built from; you just built it in its AI-chat form. Where to go next:

- Reach for the durable-chat seams directly with the
  [Build a durable chat](/how-to/build-a-durable-chat/) recipe.
- Restyle any chat or widget component — you own the copied source:
  [Customize Fresh UI](/how-to/customize-fresh-ui/).
- Model live list/board/table data (the other real-time plane) with
  [Publish a durable stream](/how-to/publish-a-durable-stream/).
- Compose the provider-neutral engine — model registry, agent loop, tool registry, MCP
  transports: [AI engine](/ai/engine/).
- Look up exact signatures in the [fresh reference](/reference/fresh/).

{{ comp.nextPrev({ prev: { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" }, next: { label: "Tutorials", href: "/tutorials/" } }) }}
