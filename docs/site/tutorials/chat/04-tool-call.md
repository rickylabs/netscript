---
layout: layouts/base.vto
title: A server-side tool call
templateEngine: [vento, md]
prev: { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" }
next: { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" }
---

# A server-side tool call

This chapter gives the model one server-side tool to call and renders each call in the chat as a
**tool-call card** with **citation chips**. The tool's result is captured in the durable
transcript, so the card survives a reload like the messages around it.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" },
  { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" },
  { label: "6 · Live streaming", href: "/tutorials/chat/06-live-streaming/" }
] }) }}

## What you will build

A `searchDocs` tool that returns a short answer and a list of sources. When the model calls it,
the transcript records the call as a transport `tool` part, and the UI renders it as a
`tool-call-card` with the sources as inline `[1]`, `[2]` citation chips.

## Before you begin

You need the chat UI from [chapter 3](/tutorials/chat/03-chat-ui/), with `aspire start` running.

## Step 1 — Define the tool

A tool has a name, a description the model reads to decide when to call it, an input schema and a
server handler. Build it with `toolDefinition(...).server(handler)` from `@tanstack/ai`.
`.server()` marks the handler server-side, and `chat()` runs it on the server, inside the turn,
whenever the model calls the tool. Keep the handler pure and fast, and return a plain object. The
`citations` array is ordinary structured output that your UI knows how to render:

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

{{ comp callout { type: "note", title: "Citations are plain tool output" } }}
No retrieval framework or vector store sits behind <code>citations</code>. You decide what <code>lookup</code> does, and the UI renders whatever citations the tool returns. For embeddings-backed retrieval under <code>lookup</code>, the <a href="/ai/engine/">@netscript/ai engine</a> ships embedding provider ports (<code>@netscript/ai/openai-embeddings</code>). Full RAG and agent memory are out of scope for this track.
{{ /comp }}

## Step 2 — Pass the tool to the model

Add a `tools` array to the `chat()` call from chapter 2. The model now decides, per turn, whether
to call `searchDocs`. When it does, the runtime runs the tool and feeds the result back into the
turn, and the whole exchange lands in the durable session.

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

{{ comp callout { type: "caution", title: "The tool runs server-side — behind authorize" } }}
The tool's handler runs in the route, on the server, inside the same <code>authorize</code>-gated turn. Its result is persisted into the durable session as a transport <code>tool</code> part, so a reload replays the call and its result. Never move tool execution into the island: the browser has neither the credentials nor the trust boundary for it.
{{ /comp }}

## Step 3 — Render the tool call as a card

The call arrives in the transcript as a transport `tool` part (`kind: 'tool'`) carrying
`toolName`, `toolState`, `input` and `output`. Map it onto the copied `tool-call-card`, and turn
`output.citations` into the `sources` list that the inline `[n]` markup in `message` renders as
chips:

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

The card reads from `snapshot.renderParts`, the transport parts produced by
`projectChatSnapshot`: the same reducer the SSR seed used (the one-projection law from chapter 3).
The card renders identically on first paint and after a reload, and its `toolState` never differs
between the seed and live paths.

## Verify your progress

With `aspire start` running, open the app and ask a question that triggers the tool, for example
"what database does a scaffold use by default?".

1. Check that the reply includes a **tool-call card** naming `searchDocs`, which expands to show
   its arguments and result.
2. Check that the answer carries inline `[1]` / `[2]` **citation chips** matching the tool's
   sources.
3. **Reload.** The card and its chips are still there: the tool call is in the durable
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
Models call a tool only when its description makes it clearly relevant. Sharpen the tool <code>description</code> and add a nudge to <code>systemPrompts</code> ("use searchDocs for product questions"). If the card renders but stays <code>running</code>, your tool handler threw: check the route logs. A thrown tool surfaces as an <code>error</code> card, not a crash.
{{ /comp }}

## What you built

A server-side tool the model can call inside the same `authorize`-gated turn. Its call and
citations render as a `tool-call-card` stored in the durable transcript, so the card survives a
reload. Next, you connect the chat to a remote MCP server and render the `ui://` widgets its
tools return.
