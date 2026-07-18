---
layout: layouts/base.vto
title: Chat UI
templateEngine: [vento, md]
prev: { label: "Durable chat", href: "/ai/durable-chat/" }
next: { label: "AI engine", href: "/ai/engine/" }
order: 3
---

# Chat UI

The AI chat interface ships as a **copy-registry collection** in
`@netscript/fresh-ui`: a composer, a message thread, tool-call cards, a model picker,
and a generative-UI block renderer. {{ comp.badge({ status: "alpha" }) }}

These are **not** package subpath imports. The published `@netscript/fresh-ui` subpath
exports (`.`, `./primitives`, `./interactive`, `./registry`) carry no chat symbols. The
chat surface is a set of files the NetScript CLI **copies into your app**, where you own
and edit them like any other source file. This is the same copy-source model as the rest
of the Fresh UI — see [Fresh UI & design](/capabilities/fresh-ui/) and
[Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/).

{{ comp callout { type: "important", title: "Copy-registry, not a dependency" } }}
The chat components are delivered through the <code>ai</code> collection in the fresh-ui
copy registry. You do <strong>not</strong> <code>import</code> them from a
<code>@netscript/fresh-ui/chat</code> subpath — that subpath does not exist. The CLI
copies each item into your workspace, and from that point the code is
<strong>yours</strong>: edit it, restyle it, delete what you do not need. Updates are a
re-copy, not a version bump.
{{ /comp }}

## The `ai` collection

The collection is described as the "AI / chat surface seams: grounded-agent citations,
message thread, composer, model picker, and tool-call disclosure." Its items:

{{ comp.apiTable({
  caption: "The ai copy-registry collection",
  columns: ["Item", "Role"],
  rows: [
    ["<code>prompt-input</code>", "Chat composer: auto-grow textarea plus a toolbar (research / grounding pills, model picker, attach / screenshot / voice, send)."],
    ["<code>message</code>", "A chat message: author + time, inline-markup body (bold / code / <code>[n]</code> citations), tool-call and chart / code blocks, follow-up chips, typing indicator. Exports <code>renderInline</code> and <code>TypingIndicator</code>."],
    ["<code>markdown</code>", "Sanitized streaming-markdown component plus its rendering pipeline."],
    ["<code>chat-render</code>", "The generative-UI block parser (a <code>lib</code> item): copies <code>parse-blocks.ts</code> into your app."],
    ["<code>tool-call-card</code>", "Tool-call disclosure card for an agent tool invocation."],
    ["<code>model-selector</code>", "Model picker used by the composer."],
    ["<code>citation-chip</code>", "Grounded-agent citation chip."],
    ["<code>code-block</code>", "Rendered code block."],
    ["<code>chart-block</code>", "Rendered chart block (a target of the generative-UI renderer)."],
    ["<code>avatar</code>", "Author avatar."],
    ["<code>command-palette</code>", "Command palette surface."],
    ["<code>search</code>", "Search surface."],
    ["<code>theme-seed</code>", "Theme token seed for the chat surface."]
  ]
}) }}

## The generative-UI renderer — `chat-render` / `parse-blocks`

The `chat-render` item copies `parse-blocks.ts` into your app (`@lib/chat/parse-blocks.ts`).
It is the parser that turns streamed markdown into typed, renderable blocks — the seam
that lets an agent emit a chart or a table inside its answer.

- **`parseBlocks(input: string): RenderPart[]`** — markdown → typed parts. It **never
  throws**; an unrecognized fenced block falls through to a verbatim `text` part.
- **`blockToText(part: RenderPart): string`** — the exact inverse projection (canonical
  markdown / plain-text fallback). `parseBlocks` is a boundary-stable fixed point, which
  is what gives the transcript reload fidelity.

### The presentation RenderPart

The renderer's `RenderPart` is a **rich presentation** union — distinct from the
**transport** `RenderPart` in [`@netscript/fresh/ai`](/ai/durable-chat/) (which is only
`text | tool`). Keep the two separate: one describes how a chunk streams, the other
describes how a block is drawn.

{{ comp.apiTable({
  caption: "Presentation RenderPart (chat-render) — one variant per rendered block",
  rows: [
    { name: "chart", type: "ChartRenderPart", desc: "A chart block (payload `ChartDatum[]`)." },
    { name: "donut", type: "DonutRenderPart", desc: "A donut block (payload `DonutDatum[]`)." },
    { name: "table", type: "TableRenderPart", desc: "A table block (`TableColumn` / `TableRow`, with `TableAlign`)." },
    { name: "stats", type: "StatsRenderPart", desc: "A stats grid (payload `StatsEntry[]`)." },
    { name: "line", type: "LineRenderPart", desc: "A line chart (payload `LinePoint[]`)." },
    { name: "text", type: "TextRenderPart", desc: "Verbatim text — the fallback for any unrecognized fence." }
  ]
}) }}

### The fenced-block grammar

`parseBlocks` reads a curated set of fenced-code info-strings —
`chart`, `donut`, `table`, `stats`, `line` — and accepts either canonical JSON or a
minimal DSL (`label: value @tone`, plus markdown pipe tables). A `RenderTone` colors a
value; a fence whose info-string is not in the set is left as a verbatim `text` part, so
ordinary code blocks pass through untouched.

````text
```chart
[{ "label": "Q1", "value": 42 }, { "label": "Q2", "value": 58 }]
```

```stats
Revenue: 1.2M @positive
Churn: 3% @negative
```
````

`parse-blocks.ts` is self-contained — it does not import `@netscript/fresh/ai`. The two
`RenderPart` types are intentionally separate (presentation vs transport); reconciling
them is a downstream concern, not something you wire by hand.

## Streaming markdown and the composer

Two components carry most of the interactive weight:

- **`markdown`** renders **sanitized streaming markdown** — safe to feed partial,
  mid-stream assistant text as chunks arrive, without waiting for a complete message.
- **`prompt-input`** is the composer: an **auto-grow** textarea that expands with the
  input, plus a toolbar for research/grounding pills, the model picker, attachment /
  screenshot / voice affordances, and send.

Because every item is copied into your workspace, restyling the composer, swapping the
chart renderer, or removing the citation chip is a normal source edit — there is no
package boundary to work around.

## Reference

{{ comp.featureGrid({ items: [
  {
    title: "Look up — @netscript/fresh-ui",
    body: "The generated reference for the fresh-ui package, including the copy-registry manifest surface.",
    href: "/reference/fresh-ui/",
    icon: "≡"
  },
  {
    title: "Do — customize Fresh UI",
    body: "How the CLI copies components into your app and how you own them afterward.",
    href: "/web-layer/how-to/customize-fresh-ui/",
    icon: "◆"
  },
  {
    title: "Back — durable chat",
    body: "The runtime that produces the transcript these components render, and the transport RenderPart they widen.",
    href: "/ai/durable-chat/",
    icon: "←"
  }
] }) }}
