---
layout: layouts/base.vto
title: AI & agents
templateEngine: [vento, md]
---

# AI & agents

The AI capability is NetScript's stack for **agentic chat and tool-calling**: a
provider-agnostic engine at the design center, a durable-chat runtime that makes a chat
survive reload and reconnect, and an app-owned chat UI you copy into your workspace.
{{ comp.badge({ status: "alpha" }) }}

It is layered so each piece stands alone. Two layers ship and install today — the
**durable-chat runtime** (`@netscript/fresh/ai`) and the **chat UI**
(`@netscript/fresh-ui` `ai` copy registry). The provider-agnostic **engine**
(`@netscript/ai`) and the **AI plugin** (`@netscript/plugin-ai` +
`@netscript/plugin-ai-core`) arrive in the next cut.

{{ comp callout { type: "important", title: "Available from 0.0.1-beta.2" } }}
The <strong>engine</strong> (<code>@netscript/ai</code>) and the <strong>AI plugin</strong>
(<code>@netscript/plugin-ai</code>, <code>@netscript/plugin-ai-core</code>, and the
<code>netscript generate ai</code> codegen — <code>ai-tools</code> and
<code>ai-agents</code> registries) are <strong>not installable today</strong> — they
ship in <strong>0.0.1-beta.2</strong>. Do not
<code>deno add jsr:@netscript/ai</code> yet. What you can build on <em>now</em> is the
durable-chat runtime and the chat UI, both self-contained and already on JSR.
{{ /comp }}

## The two planes

NetScript models live state in two distinct planes, and the headline rule of this
capability is **never build chat on the wrong primitive**. A **StreamDB shape** is the
right tool for live lists, boards, and tables — CRUD rows reconciled last-writer-wins. A
**durable chat session** is an append-only, replayable chunk log keyed by `sessionId`,
because a tool call is a multi-chunk mid-stream event that cannot collapse into a single
row without losing its `pending → streaming → complete` states. Reach for
[durable streams](/capabilities/streams/) for data; reach for
[durable chat](/ai/durable-chat/) for conversation.

## Minimal taste — a durable chat proxy

Every durable chat needs one route that proxies the browser's chat-stream request to the
session's durable-stream URL. That route is a single call:

```ts
// routes/api/chat/[sessionId].ts
import { createNetScriptChatStreamProxy } from "@netscript/fresh/ai";

const proxy = createNetScriptChatStreamProxy({
  target: (req) => ({
    sessionId: new URL(req.url).pathname.split("/").pop()!,
  }),
});

export const handler = { POST: proxy, GET: proxy };
```

Authorization lives where you produce the session response (`toNetScriptChatResponse`
with an `authorize` hook — required in production), and the transcript is rendered by the
copy-registry chat UI. The [durable chat page](/ai/durable-chat/) walks the full recipe.

## The section

{{ comp.featureGrid({ items: [
  { title: "Overview & the two planes", icon: "◎", body: "The stack story, the plane rule, the engine as design center, and the plugin thinness laws.", href: "/ai/" },
  { title: "Durable chat", icon: "💬", body: "@netscript/fresh/ai: the chat-stream proxy, the one-projection law, authorize, and the ui:// sandbox. Ships today.", href: "/ai/durable-chat/" },
  { title: "Chat UI", icon: "🎨", body: "The fresh-ui `ai` copy registry: composer, message thread, tool cards, and the generative-UI block renderer. Ships today.", href: "/ai/chat-ui/" },
  { title: "AI engine", icon: "⚙️", body: "@netscript/ai: runtime, contracts vocabulary, ports, tools, agent loop, MCP transports, provider adapters. Beta.2.", href: "/ai/engine/" }
] }) }}

## Reference

The section pages orient; the generated reference enumerates every symbol. The shipping
layers live under [`@netscript/fresh`](/reference/fresh/) (the `/ai` and `/ai/sandbox`
subpaths) and [`@netscript/fresh-ui`](/reference/fresh-ui/) (the copy-registry manifest).
