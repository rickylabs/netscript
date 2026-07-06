---
layout: layouts/base.vto
title: AI
templateEngine: [vento, md]
prev: null
next: { label: "Durable chat", href: "/ai/durable-chat/" }
---

# AI

The NetScript AI stack is a set of composable seams for building agentic chat and
tool-calling surfaces on the same contracts-first, hexagonal foundation as the rest
of the framework. It is deliberately layered: a provider-agnostic **engine** at the
design center, a **durable-chat runtime** that turns a Fresh route into a chat whose
history survives reload and reconnect, and an app-owned **chat UI** you copy into
your workspace and keep. Each layer stands on its own — you can ship durable chat and
the chat UI today without pulling in the engine.

{{ comp callout { type: "important", title: "What ships today, and what is beta.2-pending" } }}
Two pieces are published on JSR and usable now: the **durable-chat runtime**
(`@netscript/fresh/ai` + `@netscript/fresh/ai/sandbox`) and the **chat UI**
(the `@netscript/fresh-ui` <code>ai</code> copy-registry collection). The
provider-agnostic **engine** (`@netscript/ai`) and the AI plugin
(`@netscript/plugin-ai`, `@netscript/plugin-ai-core`) are **not** published yet —
they arrive in **0.0.1-beta.2**. Do not run <code>deno add jsr:@netscript/ai</code>
today; it resolves to nothing. Build on the durable-chat runtime and the chat UI now,
and treat the engine pages as the design you compose against once beta.2 lands.
{{ /comp }}

## The two planes — never build chat on the wrong primitive

NetScript models real-time state in two distinct planes, and the single most common
mistake is reaching for the wrong one. A **StreamDB shape** and a **durable chat
session** look adjacent — both are live and durable — but they answer different
questions.

{{ comp.apiTable({
  caption: "Two planes — pick by what you are modeling",
  columns: ["Axis", "StreamDB shapes (data)", "Durable chat sessions (AI chat)"],
  rows: [
    ["Unit", "A collection / row shape", "One chat session (append-only chunk log)"],
    ["Identity", "Keyed by row id inside a named shape", "Keyed by <code>sessionId</code> — one stream per chat"],
    ["Write model", "CRUD mutations reconciled into the shape", "Append-only sanitized chunks"],
    ["What survives", "The current materialized rows", "The full replayable log (messages + tool cards)"],
    ["Read primitive", "<code>useLiveQuery</code> over a shape", "<code>resolveChatSnapshot</code> + live <code>useChat</code>"],
    ["Use it for", "Lists, boards, tables, dashboards", "Conversational, streaming, tool-calling chat"]
  ]
}) }}

A chat needs the **session plane** because a tool call is a multi-chunk, mid-stream
event: it moves through `pending → streaming → complete` and cannot be expressed as a
single reconciled row without losing those intermediate states. Reach for
[durable streams](/capabilities/streams/) when you want live list/board/table data;
reach for [durable chat](/ai/durable-chat/) when you want a replayable conversation.
Conflating them is the documented root of the plane confusion — keep them distinct.

## The engine is the design center

`@netscript/ai` is a **ports-and-adapters** (hexagonal) core with zero
`@netscript/*` dependencies. Every capability — telemetry, tool registry, embeddings,
vision, MCP transport, the agent loop, memory — is a **port**: an interface the
composition root wires at startup, defaulting to a no-op or throwing implementation
until you inject a real one. Providers register themselves through **side-effect
imports** (`import "@netscript/ai/anthropic"`, mirroring `@netscript/kv/redis`), so
the base engine pulls no vendor SDK you did not ask for. Models are addressed by a
`"provider:model"` reference string, e.g. `"anthropic:claude-sonnet-4-5"`.

Because the engine owns the vocabulary — the `Message`/`ContentPart` content model,
the `AgentChunk` streaming union, the tool and MCP contracts — every layer above it
speaks the same types. The [engine reference](/ai/engine/) is the full map.

## Thin plugins, centralized convention

The AI capability follows the framework's plugin doctrine (Architecture Doctrine
ch. 11): **R-PLUGIN-THIN** — every convention-bearing primitive lives in a core
`@netscript/*` package, and a plugin carries only its own specifics — and
**R-PLUGIN-SEAM** — a plugin's contract lives in its `-core` sibling and conforms to
the base contract in `@netscript/plugin`. In practice the engine (`@netscript/ai`)
owns the vocabulary, `@netscript/plugin-ai-core` owns the `/v1/ai` oRPC contract, and
`@netscript/plugin-ai` stays a thin delivery shell that declares contributions and a
scaffolder. The AI plugin and the `netscript generate ai` codegen — which emits an `ai-tools`
registry and an `ai-agents` registry (see the [engine page](/ai/engine/)) — land
alongside the engine in **0.0.1-beta.2** (not installable today). This split is what
keeps the published surface coherent — and it is the reason the runtime layers you use
today (`@netscript/fresh/ai`, the fresh-ui copy registry) are self-contained and ship
independently of the deferred engine.

## Where to go next

{{ comp.cardsGrid({ columns: 3, cards: [
  { eyebrow: "Ships today", title: "Durable chat", body: "Turn a Fresh route into a durable AI chat: history and in-flight tool calls survive reload, reconnect, and multi-tab.", href: "/ai/durable-chat/", icon: "C" },
  { eyebrow: "Ships today", title: "Chat UI", body: "The fresh-ui `ai` copy-registry: composer, message thread, tool-call cards, and the generative-UI block renderer — copied into your app and owned by you.", href: "/ai/chat-ui/", icon: "U" },
  { eyebrow: "Beta.2", title: "AI engine", body: "@netscript/ai: the provider-agnostic runtime, contracts vocabulary, ports, tools, agent loop, MCP transports, and provider adapters.", href: "/ai/engine/", icon: "E" },
  { eyebrow: "Capability hub", title: "AI capability", body: "The one-screen orientation for the AI capability and how it composes with the rest of the framework.", href: "/capabilities/ai/", icon: "◎" },
  { eyebrow: "Related", title: "Durable streams", body: "The other real-time plane — live list/board/table data over the durable-stream server.", href: "/capabilities/streams/", icon: "🌊" },
  { eyebrow: "Related", title: "Web Layer", body: "The Fresh page and island model the durable-chat runtime plugs into.", href: "/web-layer/", icon: "O" },
  { eyebrow: "API Reference", title: "@netscript/ai", body: "Generated symbols for the AI engine package.", href: "/reference/ai/", icon: "R" },
  { eyebrow: "API Reference", title: "@netscript/plugin-ai", body: "Generated symbols for the thin AI plugin delivery shell.", href: "/reference/plugin-ai/", icon: "R" },
  { eyebrow: "API Reference", title: "@netscript/plugin-ai-core", body: "Generated symbols for the AI plugin's reusable contract and composition core.", href: "/reference/plugin-ai-core/", icon: "R" }
] }) }}
