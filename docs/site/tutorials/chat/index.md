---
layout: layouts/base.vto
title: AI Chat
templateEngine: [vento, md]
prev: { label: "Tutorials", href: "/tutorials/" }
next: { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" }
---

# AI Chat

This track builds one thing end to end: a **durable AI chat app**. By the last chapter you
will have a chat whose transcript — messages, streaming markdown, and tool-call cards —
survives reload, reconnect, and a second tab, because it is backed by a durable session
stream rather than component state. It runs on shipped NetScript seams: the
[`@netscript/fresh/ai`](/reference/fresh/) durable-chat plane (published on JSR in
`@netscript/fresh` and usable now) and the [`@netscript/fresh-ui`](/reference/fresh-ui/)
copy-registry chat components.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" },
  { label: "2 · Durable chat route", href: "/tutorials/chat/02-durable-chat-route/" },
  { label: "3 · Chat UI", href: "/tutorials/chat/03-chat-ui/" },
  { label: "4 · Server-side tool call", href: "/tutorials/chat/04-tool-call/" }
] }) }}

## What you will build

A `chat-app/` Fresh workspace whose home screen is a working chat. The reader scaffolds a
fresh NetScript project with the streams runtime, wires a durable chat session route that
calls a model directly on `@tanstack/ai`, copies the fresh-ui `ai` component collection and
hydrates a chat island, then adds one server-side tool whose result surfaces as a tool-call
card with citation chips. This is a learning track: the same project grows chapter by
chapter, so do them in order.

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

## The arc: session → route → UI → tool

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
  }
] }) }}

{{ comp callout { type: "note", title: "What this track deliberately leaves out" } }}
The tutorial stops at what works on shipped seams: durable chat, streaming markdown, one server-side tool, and citations rendered from plain tool output. It does <strong>not</strong> cover MCP-UI widget round-trips, the generative-UI renderer, agent memory / semantic recall, or RAG — those seams are not shipped in this cut. The <code>@netscript/ai</code> engine that will own the model-call layer arrives in <code>0.0.1-beta.2</code> and is <code>publish:false</code> today.
{{ /comp }}

## What you built

By the end of this track you own a working durable chat app and understand the four seams
that make it durable — the session route, the stream proxy, the SSR seed, and the client
connection — plus how the fresh-ui chat components render its transcript.

{{ comp.nextPrev({ prev: { label: "Tutorials", href: "/tutorials/" }, next: { label: "1 · Scaffold", href: "/tutorials/chat/01-scaffold/" } }) }}
