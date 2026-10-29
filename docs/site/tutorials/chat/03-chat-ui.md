---
layout: layouts/base.vto
title: The chat UI
templateEngine: [vento, md]
prev: { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" }
next: { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" }
---

# The chat UI

This chapter gives the chat backend a face. You copy the fresh-ui `ai` component collection into
your app, seed the first paint from `resolveChatSnapshot`, and hydrate a chat island that drives
`createNetScriptChatConnection`.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" },
  { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" },
  { label: "6 · Live streaming", href: "/tutorials/chat/06-live-streaming/" }
] }) }}

## What you will build

A chat page whose transcript renders complete on load and updates as each turn settles, built
from app-owned copies of the fresh-ui chat components.

## Before you begin

You need the session route and stream proxy from [chapter 2](/tutorials/chat/02-durable-chat-route/),
with `aspire start` running.

## Step 1 — Copy the AI component collection

The chat primitives are **copy-source**: the CLI copies them into your app, and you own them from
then on. The `ai` collection installs the chat surface in one command: message, prompt-input,
markdown, the `chat-render` block parser, and the tool-call and citation components chapter 4
uses:

```bash
netscript ui:add ai
```

The command copies component files into `apps/dashboard/components/ui/`, the `chat-render` parser
into `apps/dashboard/lib/chat/parse-blocks.ts` and their CSS into `apps/dashboard/assets/ui/`, then
wires the styles and merges any required imports. [Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/)
explains the ownership model.

{{ comp.apiTable({
  caption: "The ai collection — the pieces this track uses",
  rows: [
    { name: "message", type: "chat message", desc: "Author + time, inline markup (bold / code / [n] citation chips), tool-call + chart/code blocks, follow-up chips, typing indicator. Exports Message, renderInline, TypingIndicator." },
    { name: "prompt-input", type: "composer", desc: "Auto-grow textarea + toolbar. Presentational <form>; onSubmit(text, meta) reads the field." },
    { name: "markdown", type: "renderer", desc: "Sanitized streaming-markdown component + pipeline for assistant prose." },
    { name: "chat-render", type: "block parser (lib)", desc: "parseBlocks(input): RenderPart[] — turns assistant markdown into typed rich blocks. Never throws." },
    { name: "tool-call-card", type: "tool disclosure", desc: "Tool invocation + result as a <details> with a status badge (used in chapter 4)." },
    { name: "citation-chip", type: "citation", desc: "Inline [n] source marker that pairs with a sources list (used in chapter 4)." }
  ]
}) }}

## Step 2 — Seed the first paint

Build the page with the `definePage` builder. Resolve the transcript so far with
`resolveChatSnapshot` as a [request-scoped resource](/web-layer/resources/), then pass it to the
island layer:

```tsx
// apps/dashboard/routes/chat/[sessionId].tsx
import { definePage } from '@app/utils.ts';
import { resolveChatSnapshot } from '@netscript/fresh/ai';
import { z } from 'zod';
import Chat from '../../islands/Chat.tsx';

const chatPage = definePage()
  .withRouteContract({
    pathSchema: z.object({ sessionId: z.string() }),
  })
  .withResource('chatSeed', async (ctx) => {
    return await resolveChatSnapshot({ target: { sessionId: ctx.path.sessionId } });
  })
  .withLayer('chatWindow', Chat, {
    loader: async (ctx) => ({
      sessionId: ctx.path.sessionId,
      seed: await ctx.resource('chatSeed'),
    }),
  })
  .withLayout((slots) => (
    <main class='ns-page'>
      {slots.chatWindow()}
    </main>
  ))
  .build();

export default chatPage.default;
```

The route contract registers the `sessionId` path parameter and types `ctx.path.sessionId` in
resources, loaders and the layout. `resolveChatSnapshot` returns `{ messages, renderParts, offset }`;
`offset` seeds the live subscription, so the seed and the live read cover one continuous log.

`definePage` comes from `@app/utils.ts`, the module the scaffold wrote in chapter 1. It
re-exports the builder bound to the app's `State` type, so every page in the app shares one typed
context. Importing from `@netscript/fresh/builders` directly drops that binding.

{{ comp callout { type: "note", title: "The one-projection law, in one sentence" } }}
<code>resolveChatSnapshot</code> reduces the session through <code>projectChatSnapshot</code>, the <strong>same</strong> reducer the live path uses, so a tool card rendered at first paint does not jump or vanish when the first live chunk arrives.
{{ /comp }}

## Step 3 — The chat island

The island holds the snapshot in a signal and opens a durable connection pointed at the proxy
from chapter 2. On submit, it appends the user message with `connection.send`, fires the model
turn, then re-materializes the settled transcript.

```tsx
// apps/dashboard/islands/Chat.tsx
import { useSignal } from '@preact/signals';
import { createNetScriptChatConnection, resolveChatSnapshot } from '@netscript/fresh/ai';
import type { NetScriptChatMessage, NetScriptChatSnapshot } from '@netscript/fresh/ai';
import { chatTurnRoute } from '@app/contracts/routes/chat-turn.ts';
import { Message, type MessageData } from '@app/components/ui/message.tsx';
import { PromptInput } from '@app/components/ui/prompt-input.tsx';

const toMessageData = (m: NetScriptChatMessage): MessageData => ({
  role: m.role === 'assistant' ? 'assistant' : 'user',
  author: { name: m.role === 'assistant' ? 'Assistant' : 'You', agent: m.role === 'assistant' },
  body: m.content,
});

interface ChatProps {
  sessionId: string;
  seed: NetScriptChatSnapshot;
}

const Chat = ({ sessionId, seed }: ChatProps) => {
  const snapshot = useSignal(seed);
  const pending = useSignal(false);
  const base = `${location.origin}/api/chat-stream`;

  const connection = createNetScriptChatConnection({
    target: { sessionId, baseUrl: base },
    initialOffset: seed.offset ?? undefined,
    authorize: () => true, // browser half; the server route re-checks ownership
  });

  const onSubmit = async (text: string) => {
    pending.value = true;
    // 1. Append the user message to the durable session.
    await connection.send([{ id: crypto.randomUUID(), role: 'user', content: text }]);
    // 2. Fire the model turn (chapter 2's route streams + persists the reply).
    //    The URL comes from the same route contract the server reads its param through.
    await fetch(chatTurnRoute.href({ path: { sessionId } }), { method: 'POST' });
    // 3. Re-materialize the settled transcript through the same projection.
    snapshot.value = await resolveChatSnapshot({ target: { sessionId, baseUrl: base } });
    pending.value = false;
  };

  return (
    <div class='ns-stack'>
      <div class='ns-stack'>
        {snapshot.value.messages.map((m) => (
          <Message key={m.id} message={toMessageData(m)} />
        ))}
        {pending.value
          ? <Message message={ { role: 'assistant', author: { name: 'Assistant', agent: true }, pending: true } } />
          : null}
      </div>
      <PromptInput onSubmit={onSubmit} placeholder='Ask anything…' />
    </div>
  );
};

export default Chat;
```

Keep the island leaf-shaped, pass plain serializable props in (the seed snapshot is
serializable), and declare handlers as arrow functions. The connection's `close`, `stop` and
`dispose` are one idempotent teardown: call `connection.dispose()` when the island unmounts so no
subscription leaks.

{{ comp callout { type: "note", title: "Live streaming vs settle-then-render" } }}
This island re-materializes each turn once it <strong>settles</strong>. That keeps the code simple, and reload durability already works. The connection also exposes <code>subscribe(signal)</code> for token-by-token chunks; <a href="/tutorials/chat/06-live-streaming/">chapter 6</a> switches the island to that live subscription.
{{ /comp }}

{{ comp callout { type: "note", title: "Why not useIslandQuery for the transcript?" } }}
<code>useIslandQuery</code> and <code>useLiveQuery</code> read a <strong>typed service contract</strong>: a cache-first read of data behind an oRPC service, as the <a href="/tutorials/live-dashboard/04-definePage-QueryIsland/">live-dashboard track</a> shows. The chat transcript is a <strong>durable session stream</strong>, not a service query, so it is read through <code>createNetScriptChatConnection</code> and reduced by the one projection. A sidebar listing past conversations from a service would be a good fit for a <code>useIslandQuery</code> island; the transcript stays on the durable connection.
{{ /comp }}

## Step 4 — Rich blocks with chat-render

Assistant replies are markdown and can embed fenced data blocks (`chart`, `donut`, `table`,
`stats`, `line`). `parseBlocks` from the copied `chat-render` parser turns that markdown into typed
**presentation** parts you render with the copied primitives:

```tsx
import { parseBlocks, type RenderPart } from '@app/lib/chat/parse-blocks.ts';
import { Markdown } from '@app/components/ui/markdown.tsx';
import { ChartBlock } from '@app/components/ui/chart-block.tsx';

const renderPart = (part: RenderPart) => {
  switch (part.kind) {
    case 'text':
      return <Markdown>{part.text}</Markdown>;
    case 'chart':
      return <ChartBlock title={part.title} data={part.data} unit={part.unit} />;
    // donut / table / stats / line follow the same shape → their primitive.
    default:
      return null;
  }
};

// Render an assistant message body as rich blocks:
// {parseBlocks(message.content).map(renderPart)}
```

`parseBlocks` never throws: an unrecognized fence falls back to a verbatim `text` part. Its inverse,
`blockToText`, guarantees a parsed message survives a reload without drift.

{{ comp callout { type: "note", title: "Two RenderParts — transport vs presentation" } }}
<code>@netscript/fresh/ai</code> emits the <strong>transport</strong> part (<code>text</code> | <code>tool</code>), the durable-session wire shape in <code>snapshot.renderParts</code>. The <code>parseBlocks</code> function in <code>chat-render</code> owns the <strong>presentation</strong> part (<code>chart</code> | <code>donut</code> | <code>table</code> | <code>stats</code> | <code>line</code> | <code>text</code>), the rich blocks you mount. The transcript reduces through the first; the UI renders through the second.
{{ /comp }}

## Verify your progress

With `aspire start` running, open the app in the browser:

1. Check that the chat renders your existing transcript on load, with no loading flash.
2. Type a message and send it. The assistant reply appears once the turn settles.
3. **Reload the page.** The full transcript is still there: it comes from the durable session,
   not browser state.
4. Type-check the app:

   ```bash
   deno task --cwd apps/dashboard check
   ```

- [ ] `netscript ui:add ai` copied the chat components into `components/ui/` and the parser into `lib/chat/`.
- [ ] The chat renders the seeded transcript on first paint.
- [ ] Sending a message produces a persisted assistant reply.
- [ ] A reload replays the full transcript.
- [ ] `deno task --cwd apps/dashboard check` is clean.

## What you built

A chat UI built from app-owned components: a `definePage` page that resolves the transcript
snapshot as a request-scoped resource, an SSR-seeded island that sends through the durable
connection and re-renders on settle, and `chat-render` turning assistant markdown into rich
blocks. Next, you give the model a tool to call and render its result as a tool-call card with
citation chips.
