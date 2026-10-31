---
layout: layouts/base.vto
title: Chat UI
templateEngine: [vento, md]
order: 3
---

# Chat UI

The AI chat interface ships as the `ai` collection in the `@netscript/fresh-ui` copy registry: a
composer, a message thread, tool-call cards, a model picker and a generative-UI block renderer.
{{ comp.badge({ status: "alpha" }) }}

Install it with `netscript ui:add ai`. The CLI copies each item into your app, where you own it like
any other source file: edit it, restyle it or delete what you do not need. An update is a new copy,
not a version bump. The collection is not a package import: the published `@netscript/fresh-ui`
subpaths (`.`, `./primitives`, `./interactive`, `./registry`) carry no chat symbols, and there is
no `@netscript/fresh-ui/chat` subpath. [Fresh UI & design](/web-layer/fresh-ui/) describes the
copy-source model.

## The `ai` collection

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

## The generative-UI renderer

The `chat-render` item copies `parse-blocks.ts` into your app as `@lib/chat/parse-blocks.ts`. It
turns streamed markdown into typed blocks, so an agent can emit a chart or a table inside its
answer.

- **`parseBlocks(input: string): RenderPart[]`** turns markdown into typed parts. It never throws:
  an unrecognized fenced block falls through to a verbatim `text` part.
- **`blockToText(part: RenderPart): string`** is the exact inverse projection, to canonical
  markdown or plain text. `parseBlocks` is a boundary-stable fixed point, which keeps the
  transcript identical after a reload.

### The presentation RenderPart

The renderer's `RenderPart` is a rich presentation union. It is separate from the transport
`RenderPart` of [durable chat](/ai/durable-chat/#the-transport-renderpart), which is only
`text | tool`: the transport part describes how a chunk streams, and the presentation part
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

`parseBlocks` reads the fenced-code info strings `chart`, `donut`, `table`, `stats` and `line`. Each
accepts canonical JSON or a minimal DSL (`label: value @tone`, plus markdown pipe tables), and a
`RenderTone` colors a value. A fence with any other info string stays a verbatim `text` part, so
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

`parse-blocks.ts` is self-contained and does not import `@netscript/fresh/ai`.

## Streaming markdown and the composer

`markdown` renders sanitized streaming markdown, so you can feed it partial assistant text as
chunks arrive. `prompt-input` is the composer: a textarea that grows with its input, plus the
toolbar described in the table above.

## Next steps

Copy the collection and adapt it with [Customize Fresh UI](/web-layer/how-to/customize-fresh-ui/).

- [Durable chat](/ai/durable-chat/) produces the transcript these components render.
- The [AI Chat tutorial](/tutorials/chat/) builds a complete chat end to end.
- The [`@netscript/fresh-ui` reference](/reference/fresh-ui/) covers the copy-registry manifest.
