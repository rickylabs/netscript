---
layout: layouts/base.vto
title: The chat UI
templateEngine: [vento, md]
prev: { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" }
next: { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" }
---

# The chat UI

The backend streams and persists turns; now it needs a face. In this chapter you copy the
fresh-ui `ai` component collection into your app, seed the first paint from
`resolveChatSnapshot`, and hydrate a chat island that drives `createNetScriptChatConnection`
— subscribe, send, dispose. The transcript renders complete on load and updates as turns
settle.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" }
] }) }}

## Step 1 — Copy the AI component collection

The chat primitives are **copy-source**: the CLI copies them into your app, where you own
them. The `ai` collection installs the whole chat surface in one command — message,
prompt-input, markdown, the `chat-render` block parser, and the tool-call and citation
components you use in chapter 4:

```bash
netscript ui:add ai
```

This copies component files into `apps/dashboard/components/ui/`, the `chat-render` parser
into `apps/dashboard/lib/chat/parse-blocks.ts`, and their CSS into `apps/dashboard/assets/ui/`,
then wires the styles and merges any required imports. After the copy, that code is yours to
edit — see [Customize Fresh UI](/how-to/customize-fresh-ui/) for the ownership model.

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

In the page that hosts the chat, materialize the transcript so far and pass it into the
island. `resolveChatSnapshot` returns `{ messages, renderParts, offset }`; the `offset`
seeds the live subscription so seed and live read one continuous log:

```ts
// In your chat page route (server side)
import { resolveChatSnapshot } from '@netscript/fresh/ai';

const sessionId = 'demo-1'; // from the route params / the signed-in user's session
const seed = await resolveChatSnapshot({ target: { sessionId } });
// Render <Chat sessionId={sessionId} seed={seed} /> as an island.
```

Wire `seed` into your page with the scaffold's page builder the same way the dashboard
passes data to a view — see [Customize Fresh UI](/how-to/customize-fresh-ui/) for the
`definePage` pattern. The important part is that the island receives `seed` as a prop.

{{ comp callout { type: "note", title: "The one-projection law, in one sentence" } }}
<code>resolveChatSnapshot</code> reduces the session through <code>projectChatSnapshot</code> — the <strong>same</strong> reducer the live path uses. That is why a tool card rendered at first paint does not jump or vanish when the first live chunk arrives: seed and live never disagree about intermediate state.
{{ /comp }}

## Step 3 — The chat island

The island is where the browser hydrates. It holds the snapshot in a signal, opens a durable
connection pointed at the proxy from chapter 2, and on submit: appends the user message with
`connection.send`, fires the model turn, then re-materializes the settled transcript.

```tsx
// apps/dashboard/islands/Chat.tsx
import { useSignal } from '@preact/signals';
import { createNetScriptChatConnection, resolveChatSnapshot } from '@netscript/fresh/ai';
import type { NetScriptChatMessage, NetScriptChatSnapshot } from '@netscript/fresh/ai';
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
    await fetch(`/api/chat/${sessionId}`, { method: 'POST' });
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

A few rules keep the island cheap and correct: keep it leaf-shaped, pass plain serializable
props in (the seed snapshot is serializable), and declare handlers as arrow functions. The
connection's `close` / `stop` / `dispose` are one idempotent teardown — call
`connection.dispose()` when the island unmounts so no subscription leaks.

{{ comp callout { type: "note", title: "Live streaming vs settle-then-render" } }}
This island re-materializes each turn once it <strong>settles</strong>, which keeps the code mechanical and correct. The connection also exposes <code>subscribe(signal)</code> for token-by-token live chunks; folding those chunks incrementally is the job of the FB2 live island reducer landing alongside the durable-chat plane. Reload durability — the headline feature — is fully in hand either way.
{{ /comp }}

## Step 4 — Rich blocks with chat-render

Assistant replies are markdown, and they can embed fenced data blocks (`chart`, `donut`,
`table`, `stats`, `line`). `parseBlocks` from the copied `chat-render` parser turns that
markdown into typed **presentation** parts you render with the copied primitives:

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

`parseBlocks` never throws — an unrecognized fence falls back to a verbatim `text` part — and
its inverse `blockToText` guarantees a parsed message survives a reload without drift.

{{ comp callout { type: "note", title: "Two RenderParts — transport vs presentation" } }}
Do not conflate the two <code>RenderPart</code> types. <code>@netscript/fresh/ai</code> emits the <strong>transport</strong> part (<code>text</code> | <code>tool</code>) — the durable-session wire shape in <code>snapshot.renderParts</code>. <code>chat-render</code>'s <code>parseBlocks</code> owns the <strong>presentation</strong> part (<code>chart</code> | <code>donut</code> | <code>table</code> | <code>stats</code> | <code>line</code> | <code>text</code>) — the rich blocks you mount. The transcript reduces through the first; the UI renders through the second.
{{ /comp }}

## Verify your progress

With `aspire start` running, open the app in the browser:

1. The chat renders your existing transcript on load — no loading flash.
2. Type a message and send it; the assistant reply appears once the turn settles.
3. **Reload the page.** The full transcript is still there — that is the durable session, not
   browser state.
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

A working chat UI: copied, app-owned components; an SSR-seeded island that sends through the
durable connection and re-renders on settle; and `chat-render` turning assistant markdown
into rich blocks. Next you give the model a tool to call — and render its result as a
tool-call card with citation chips.

{{ comp.nextPrev({ prev: { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" }, next: { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" } }) }}
