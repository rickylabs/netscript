---
layout: layouts/base.vto
title: AI Chat
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" }
order: 5
---

# AI Chat

This track builds a durable AI chat app, the kind of support assistant a product ships next to
its docs. Most chat UIs keep the conversation in component state, so a refresh, a dropped socket
or a second tab loses it. Here the transcript (messages, streaming markdown, tool-call cards and
MCP widgets) lives in a durable session stream, and the UI is a view of it: the same log replays
on reload, on reconnect and in every tab watching, and replies stream in as the model produces
them.

The track uses three NetScript packages:

- [`@netscript/fresh/ai`](/reference/fresh/), the durable-chat plane, published on JSR in
  `@netscript/fresh` with the `ai/sandbox` MCP-UI subpath;
- [`@netscript/fresh-ui`](/reference/fresh-ui/), the copy-registry chat components;
- [`@netscript/ai`](/reference/ai/), the MCP client stack.

## What you will build

A `chat-app/` Fresh workspace whose home screen is a working chat. The same project grows
chapter by chapter, so do the chapters in order.

## Before you begin

- **Deno 2.x, the Aspire CLI and Docker.** The [quickstart](/quickstart/) covers installing
  them; chapter 1 checks each one.
- **An `ANTHROPIC_API_KEY`.** The track calls Anthropic directly through `@tanstack/ai`. Any
  provider `@tanstack/ai` supports works; Anthropic keeps the examples concrete. Chapter 1 shows
  where to set the key.

## The arc: route → UI → tools → MCP → live streaming

Each chapter adds one link to the durable-chat spine.

{{ comp.featureGrid({ items: [
  {
    title: "1 · Scaffold the workspace",
    body: "Create <code>chat-app/</code> with <code>netscript init</code>, add the <code>streams</code> plugin, set <code>ANTHROPIC_API_KEY</code> and boot under Aspire.",
    href: "/tutorials/chat/01-scaffold/"
  },
  {
    title: "2 · The durable chat route",
    body: "Wire the session route with <code>toNetScriptChatResponse</code> and a required <code>authorize</code> hook, mount <code>createNetScriptChatStreamProxy</code>, and call the model on <code>@tanstack/ai</code>.",
    href: "/tutorials/chat/02-durable-chat-route/"
  },
  {
    title: "3 · The chat UI",
    body: "Copy the fresh-ui <code>ai</code> collection and hydrate an island that seeds from <code>resolveChatSnapshot</code> and drives <code>createNetScriptChatConnection</code>.",
    href: "/tutorials/chat/03-chat-ui/"
  },
  {
    title: "4 · A server-side tool call",
    body: "Add one <code>@tanstack/ai</code> tool, render the call as a <code>tool-call-card</code> and its citations as chips.",
    href: "/tutorials/chat/04-tool-call/"
  },
  {
    title: "5 · MCP tools & widgets",
    body: "Connect a remote MCP server with <code>createMcpTransportPool</code>, bridge its tools into the turn, and render <code>ui://</code> widgets through <code>createMcpSandboxHandler</code> and <code>McpUiWidget</code>.",
    href: "/tutorials/chat/05-mcp/"
  },
  {
    title: "6 · Live streaming",
    body: "Switch the island from settle-then-render to <code>connection.subscribe(signal)</code>, so replies stream in as they arrive, across tabs.",
    href: "/tutorials/chat/06-live-streaming/"
  }
] }) }}

{{ comp callout { type: "note", title: "What this track leaves out" } }}
The track does <strong>not</strong> cover the generative-UI renderer, agent memory or semantic recall, or RAG. It calls the model directly on <code>@tanstack/ai</code>; chapter 2 explains where the <a href="/ai/engine/">@netscript/ai engine</a> fits, and chapter 5 uses its MCP client stack.
{{ /comp }}

When you finish, the [AI & Agents](/ai/) guides pick up where the track stops. Start with
chapter 1.

{{ comp.nextPrev({ prev: { label: "Tutorials", href: "/tutorials/" }, next: { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" } }) }}
