---
layout: layouts/base.vto
title: AI
description: The AI engine, MCP client, durable chat, chat UI, and tooling for coding agents.
templateEngine: [vento, md]
prev: null
next: { label: "MCP", href: "/ai/mcp/" }
---

# AI

The NetScript AI stack gives you four layers for agentic chat and tool calling: a
provider-agnostic engine, an MCP client, a durable-chat runtime for Fresh routes and a chat UI
that you copy into your app. Each layer is published on its own, so you can adopt one without the
others.

Start with durable chat when a conversation must survive reload, reconnect and a second tab, and
add the chat UI to render it. The MCP client turns external MCP servers into tools for your agent,
and the engine owns the contracts, ports and agent loop that the other layers share. Agent tooling
covers the opposite direction: what NetScript gives the coding agents that build your app.

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Concept", title: "Durable chat", body: "Turn a Fresh route into a chat whose history and in-flight tool calls survive reload, reconnect and a second tab.", href: "/ai/durable-chat/" },
  { eyebrow: "Concept", title: "Chat UI", body: "The fresh-ui `ai` copy-registry collection: composer, message thread, tool-call cards and the generative-UI block renderer.", href: "/ai/chat-ui/" },
  { eyebrow: "Concept", title: "MCP", body: "Use external MCP servers as agent tools, with injected auth, pooling and sandboxed `ui://` resources.", href: "/ai/mcp/" },
  { eyebrow: "Concept", title: "AI engine", body: "`@netscript/ai`: contracts, ports, tools, the agent loop, MCP transports and provider adapters.", href: "/ai/engine/" },
  { eyebrow: "Concept", title: "Agent tooling", body: "The CLI, skills, MCP server and agent-readable docs for the coding agents that build your app.", href: "/ai/agent-tooling/" },
  { eyebrow: "Tutorial", title: "AI chat tutorial", body: "Build a durable, tool-calling chat with MCP and live streaming.", href: resolveXref("tut:chat").href },
  { eyebrow: "Recipes", title: "Recipes", body: "One AI task per recipe.", href: "/ai/how-to/" },
  { eyebrow: "Reference", title: "`@netscript/ai` reference", body: "Generated API reference. Related units: `plugin-ai`, `plugin-ai-core`, `mcp`.", href: resolveXref("ref:ai").href },
  { eyebrow: "Explanation", title: "Plugin system", body: "Why the AI plugin is a thin shell over a core package.", href: resolveXref("explain:plugin-system").href }
] }) }}
