---
layout: layouts/base.vto
title: A server-side tool call
templateEngine: [vento, md]
prev: { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" }
next: { label: "Tutorials", href: "/tutorials/" }
---

# A server-side tool call

A chat gets useful when the model can *do* something. In this final chapter you give the
model one server-side tool, pass it into the same `chat()` call from chapter 2, and surface
the invocation in the UI as a **tool-call card** whose results render as **citation chips**.
The tool runs on the server — its result is captured in the durable transcript, so the card
survives a reload exactly like the messages around it.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" }
] }) }}

## What you will build

One tool — `searchDocs` — that the model can call to look something up, returning a short
answer plus a list of sources. When the model calls it, the transcript records the
invocation as a transport `tool` part, and the UI renders it as a `tool-call-card` with the
sources shown as inline `[1]`, `[2]` citation chips.

## Step 1 — Define the tool

A tool is a name, a description the model reads to decide when to call it, an input schema, and
a server handler. Build it with `toolDefinition(...).server(handler)` from `@tanstack/ai`:
`.server()` marks the handler server-side, and `chat()` runs it automatically — on the server,
inside the turn — whenever the model calls the tool. Keep the handler pure and fast; return a
plain object, including a `citations` array, which is just structured output your UI knows how
to render:

```ts
// apps/dashboard/lib/tools/search-docs.ts
import { toolDefinition } from '@tanstack/ai';

export const searchDocs = toolDefinition({
  name: 'searchDocs',
  description: 'Look up a short factual answer from the docs. Use for product questions.',
  // Plain JSON Schema is accepted; bring a Standard Schema library (Zod, Valibot, …)
  // as `inputSchema` instead if you want the handler args typed for you.
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string', description: 'The question to look up.' } },
    required: ['query'],
  },
}).server(async ({ query }: { query: string }) => {
  const hits = await lookup(query); // your retrieval — DB query, search index, etc.
  return {
    answer: hits.map((h) => h.snippet).join(' '),
    citations: hits.map((h, i) => ({ index: i + 1, source: h.title, href: h.url })),
  };
});
```

{{ comp callout { type: "note", title: "Citations are plain tool output — not RAG magic" } }}
The <code>citations</code> array is ordinary structured data your tool returns. There is no retrieval framework, no vector store, and no semantic-recall seam behind it in this cut — you decide what <code>lookup</code> does. The UI renders whatever citations the tool hands back. Full RAG and agent memory are out of scope for this track.
{{ /comp }}

## Step 2 — Pass the tool to the model

Wire the tool into the same `chat()` call from chapter 2 by adding a `tools` array. The model
now decides, per turn, whether to call `searchDocs`; when it does, the runtime executes it and
feeds the result back into the turn — and the whole exchange lands in the durable session.

```ts
// apps/dashboard/routes/api/chat/[sessionId].ts  (add tools to the existing chat() call)
import { chat } from '@tanstack/ai';
import { anthropicText } from '@tanstack/ai-anthropic';
import { resolveChatSnapshot, toNetScriptChatResponse } from '@netscript/fresh/ai';
import { searchDocs } from '../../../lib/tools/search-docs.ts';

// ...inside POST, after building `messages` and the authorize check:
const source = chat({
  adapter: anthropicText('claude-sonnet-4-5'),
  messages,
  systemPrompts: ['You are a helpful assistant. Use searchDocs for product questions.'],
  tools: [searchDocs],
});

return toNetScriptChatResponse({ target, request: ctx.req, authorize, source });
```

{{ comp callout { type: "important", title: "The tool runs server-side — behind authorize" } }}
The tool's server handler runs in the route, on the server, inside the same <code>authorize</code>-gated turn. Its result is persisted into the durable session as a transport <code>tool</code> part, so a reload replays the tool call and its result. Never move tool execution into the island — the browser has neither the credentials nor the trust boundary for it.
{{ /comp }}

## Step 3 — Render the tool call as a card

The tool invocation arrives in the transcript as a transport `tool` part (`kind: 'tool'`)
carrying `toolName`, `toolState`, `input`, and `output`. Map it onto the copied
`tool-call-card`, and turn the `output.citations` into the `sources` list that `message`'s
inline `[n]` markup renders as chips:

```tsx
// In the chat island's assistant renderer
import { ToolCallCard } from '@app/components/ui/tool-call-card.tsx';
import { CitationChip } from '@app/components/ui/citation-chip.tsx';
import type { RenderPart } from '@netscript/fresh/ai';

const toStatus = (state?: string) =>
  state === 'error' ? 'error' : state === 'complete' ? 'done' : 'running';

const renderToolPart = (part: RenderPart) => {
  if (part.kind !== 'tool') return null;
  const citations = (part.output as { citations?: { index: number; source?: string; href?: string }[] })
    ?.citations ?? [];
  return (
    <div class='ns-stack'>
      <ToolCallCard
        name={part.toolName ?? 'tool'}
        args={part.input}
        result={part.output}
        status={toStatus(part.toolState)}
      />
      {citations.length
        ? (
          <div class='ns-citations'>
            {citations.map((c) => <CitationChip index={c.index} source={c.source} />)}
          </div>
        )
        : null}
    </div>
  );
};

// Drive it from the transport render parts the snapshot already gives you:
// {snapshot.value.renderParts.filter((p) => p.kind === 'tool').map(renderToolPart)}
```

{{ comp callout { type: "note", title: "One projection feeds the card" } }}
The card reads from <code>snapshot.renderParts</code> — the transport parts produced by <code>projectChatSnapshot</code>, the same reducer the SSR seed used. That is the one-projection law paying off: because the tool part is materialized once, the card renders identically on first paint and after a reload, and its <code>toolState</code> is never ambiguous between the seed and live paths.
{{ /comp }}

## Verify your progress

With `aspire start` running, open the app and ask a question that triggers the tool — for
example, "what database does a scaffold use by default?":

1. The assistant reply includes a **tool-call card** naming `searchDocs`, expandable to show
   its arguments and result.
2. The answer carries inline `[1]` / `[2]` **citation chips** matching the tool's sources.
3. **Reload.** The card and its chips are still there — the tool call is in the durable
   transcript, not transient UI state.
4. Type-check the app:

```bash
deno task --cwd apps/dashboard check
```

- [ ] Asking a product question triggers a `searchDocs` tool-call card.
- [ ] The card shows the tool arguments and result on expand.
- [ ] Sources render as inline citation chips.
- [ ] A reload replays the card and chips.
- [ ] `deno task --cwd apps/dashboard check` is clean.

{{ comp callout { type: "tip", title: "If the model never calls the tool" } }}
Models call a tool only when the description makes it obviously relevant. Sharpen the tool <code>description</code> and add a nudge to <code>systemPrompts</code> ("use searchDocs for product questions"). If the card renders but stays <code>running</code>, your tool handler threw — check the route logs; a thrown tool surfaces as an <code>error</code> card, not a crash.
{{ /comp }}

## What you built

A complete durable AI chat: a scaffolded workspace, an `authorize`-gated session route that
streams a model turn and persists it, a copied fresh-ui chat UI seeded from
`resolveChatSnapshot`, and one server-side tool whose call and citations render as a durable
tool-call card. Every part of that transcript — messages, streamed markdown, and the tool
card — survives a reload, because it lives in the durable session rather than the browser.

Where to go next:

- Reach for the seams directly with the [Build a durable chat](/how-to/build-a-durable-chat/)
  recipe.
- Restyle any chat component — you own the copied source:
  [Customize Fresh UI](/how-to/customize-fresh-ui/).
- The list/board/table live-data plane is a different tool:
  [Publish a durable stream](/how-to/publish-a-durable-stream/).
- Look up exact signatures in the [fresh reference](/reference/fresh/).

{{ comp.nextPrev({ prev: { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" }, next: { label: "Tutorials", href: "/tutorials/" } }) }}
