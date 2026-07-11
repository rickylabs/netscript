---
layout: layouts/base.vto
title: AI Chat
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" }
---

# AI Chat

This track builds one thing end to end: a **durable AI chat app** — think a production
support-chat surface, the kind of assistant a real product ships next to its docs. By the
last chapter you will have a chat whose transcript — messages, streaming markdown, tool-call
cards, and MCP widgets — survives reload, reconnect, and a second tab, and whose replies
stream in live as the model produces them, because it is backed by a durable session stream
rather than component state. That is the differentiator this track proves: most chat UIs keep
the conversation in component state, so a refresh, a dropped socket, or a second tab loses it —
here the transcript lives in the durable session and the UI is only a view of it, so the same
log replays identically on reload, reconnect, and every other tab watching. It runs on shipped
NetScript seams: the
[`@netscript/fresh/ai`](/reference/fresh/) durable-chat plane (published on JSR in
`@netscript/fresh` and usable now, including the `ai/sandbox` MCP-UI subpath), the
[`@netscript/fresh-ui`](/reference/fresh-ui/) copy-registry chat components, and the
[`@netscript/ai`](/reference/ai/) MCP client stack.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" },
  { label: "5 · MCP tools & widgets", href: "/tutorials/chat/05-mcp/" },
  { label: "6 · Live streaming", href: "/tutorials/chat/06-live-streaming/" }
] }) }}

## What you will build

A `chat-app/` Fresh workspace whose home screen is a working chat. The reader scaffolds a
fresh NetScript project with the streams runtime, wires a durable chat session route that
calls a model directly on `@tanstack/ai`, copies the fresh-ui `ai` component collection and
hydrates a chat island, adds one server-side tool whose result surfaces as a tool-call card
with citation chips, connects the chat to a remote MCP server and renders the `ui://`
widgets its tools return, and finally turns the island live so replies stream in as they
arrive. This is a learning track: the same project grows chapter by chapter, so do them in
order.

## Before you begin

You need the standard NetScript toolchain — Deno, the Aspire CLI, and Docker — plus a model
provider key. Confirm the toolchain:

```sh
deno --version && aspire --version && docker info
```

You should see a Deno 2.x version, an Aspire CLI version, and Docker engine details. If any
are missing, the [quickstart](/quickstart/) walks through installing them. Install the
NetScript CLI once:

```sh
deno install --global --allow-all --name netscript jsr:@netscript/cli{{ releaseSpecifier }}
```

{{ comp callout { type: "important", title: "You need a model provider key" } }}
This track calls Anthropic directly through <code>@tanstack/ai</code>. Have an <code>ANTHROPIC_API_KEY</code> ready before chapter 1 — chapter 1 shows where to set it so Aspire injects it into the app process. Any provider <code>@tanstack/ai</code> supports works; this track uses Anthropic for concreteness.
{{ /comp }}

## The arc: route → UI → tools → MCP → live streaming

Each chapter adds exactly one link in the durable-chat spine:

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold the workspace",
    body: "Create <code>chat-app/</code> with <code>netscript init</code>, add the <code>streams</code> plugin so durable sessions have a runtime, set <code>ANTHROPIC_API_KEY</code>, and boot under Aspire.",
    href: "/tutorials/chat/01-scaffold/"
  },
  {
    title: "2 · The durable chat route",
    body: "Wire the session route with <code>toNetScriptChatResponse</code> + a required <code>authorize</code> hook, the one <code>createNetScriptChatStreamProxy</code>, and a direct model call on <code>@tanstack/ai</code>.",
    href: "/tutorials/chat/02-durable-chat-route/"
  },
  {
    title: "3 · The chat UI",
    body: "Copy the fresh-ui <code>ai</code> collection (message, prompt-input, markdown, chat-render) and hydrate an island that seeds from <code>resolveChatSnapshot</code> and drives <code>createNetScriptChatConnection</code>.",
    href: "/tutorials/chat/03-chat-ui/"
  },
  {
    title: "4 · A server-side tool call",
    body: "Add one <code>@tanstack/ai</code> tool the model can call; surface the invocation as a <code>tool-call-card</code> and render its citations as chips.",
    href: "/tutorials/chat/04-tool-call/"
  },
  {
    title: "5 · MCP tools & widgets",
    body: "Connect a remote MCP server with <code>createMcpTransportPool</code> from <code>@netscript/ai/mcp</code>, bridge its tools into the chat turn, and render <code>ui://</code> widgets sandboxed through <code>createMcpSandboxHandler</code> and the copied <code>McpUiWidget</code>.",
    href: "/tutorials/chat/05-mcp/"
  },
  {
    title: "6 · Live streaming",
    body: "Upgrade the island from settle-then-render to a live <code>connection.subscribe(signal)</code> read, folding each chunk through the one projection so replies stream in as they arrive, across tabs.",
    href: "/tutorials/chat/06-live-streaming/"
  }
] }) }}

{{ comp callout { type: "note", title: "What this track deliberately leaves out" } }}
The tutorial stays on the durable-chat spine: durable chat, streaming markdown, tools (local and over MCP), sandboxed <code>ui://</code> widgets, and a live subscription. It does <strong>not</strong> cover the generative-UI renderer, agent memory / semantic recall, or RAG. The <a href="/ai/engine/">@netscript/ai engine</a> — model registry, agent loop, tool registry, and MCP transports — is published on JSR as of <code>0.0.1-beta.7</code>; this track wires the model call directly on <code>@tanstack/ai</code>, because the durable session plane persists and replays TanStack chunk streams. Chapter 2 shows where the engine fits, and chapter 5 uses its MCP client stack.
{{ /comp }}

## What you built

By the end of this track you own a working durable chat app and understand the seams that
make it durable — the session route, the stream proxy, the SSR seed, and the client
connection's send and live-subscribe sides — plus how the fresh-ui chat components render
its transcript, how a tool call (yours or a remote MCP server's) lands as a durable card,
and how MCP `ui://` widgets render themed and sandboxed inside the chat.

{{ comp.nextPrev({ prev: { label: "Tutorials", href: "/tutorials/" }, next: { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" } }) }}
