---
layout: layouts/base.vto
title: AI engine
templateEngine: [vento, md]
prev: { label: "Chat UI", href: "/ai/chat-ui/" }
next: null
order: 4
---

# AI engine

This is the **engine guide** — how the pieces of `@netscript/ai` fit together and
when to reach for each one. `@netscript/ai` is the provider-agnostic AI engine at
the design center of the stack: a zero-`@netscript/*`-dependency, ports-and-adapters
core that owns the domain vocabulary, the capability seams, the model registries,
the tool system, the agent loop, MCP transports, and opt-in provider adapters. It
wraps `@tanstack/ai*` and `@standard-schema/spec` and adds no schema DSL of its own.
We keep this page at the "which piece, and why" altitude; the exact symbol tables
live in the generated reference, linked at the end.

{{ comp callout { type: "note", title: "Published in " + releaseVersion } }}
<code>@netscript/ai</code> is <strong>published on JSR</strong> and installs today:
<code>deno add jsr:@netscript/ai</code>. Every subpath on this page resolves against the
published <strong>{{ releaseVersion }}</strong> surface. The engine carries zero
<code>@netscript/*</code> dependencies, so you can adopt it on its own — the
<a href="/ai/durable-chat/">durable-chat runtime</a> and <a href="/ai/chat-ui/">chat UI</a>
each stand alone and neither requires it.
{{ /comp }}

## The map: which subpath answers which question

{{ comp.apiTable({
  caption: "@netscript/ai — subpath exports",
  columns: ["Subpath", "Purpose"],
  rows: [
    ["<code>.</code>", "Runtime wiring + the model / embedding / vision registries."],
    ["<code>./contracts</code>", "Domain vocabulary — pure types and the error hierarchy."],
    ["<code>./ports</code>", "Capability seams (hexagonal) plus default port / registry factories."],
    ["<code>./tools</code>", "Tool definition / validation / registry, plus the built-in <code>render_ui</code> contract."],
    ["<code>./agent</code>", "The agent loop."],
    ["<code>./mcp</code>", "MCP transport adapters (stdio + Streamable-HTTP)."],
    ["<code>./anthropic</code>", "Anthropic provider (side-effect self-register)."],
    ["<code>./openai-compatible</code>", "OpenAI-compatible chat provider."],
    ["<code>./openrouter</code>", "OpenRouter chat provider (OpenAI-compatible base + reasoning option)."],
    ["<code>./ollama</code>", "Ollama local chat provider (OpenAI-compatible base + reachability preflight)."],
    ["<code>./openai-embeddings</code>", "OpenAI embeddings + vision provider."],
    ["<code>./testing</code>", "Deterministic port fakes."]
  ]
}) }}

A useful way to read that table: the top half is the engine (vocabulary, seams,
tools, loop), the bottom half is what you opt into (providers) and how you test
without them (fakes).

## The runtime and registries

`createAiRuntime(config)` is a **pure wiring** function: it resolves every
capability port, defaulting each to a no-op or throwing implementation, with no IO
and no global mutation. `getAiRuntime(config?)` is the process singleton (shaped
like `getKv()`), with `resetAiRuntime()` and `isAiRuntimeInitialized()` alongside.
Use `createAiRuntime` when you want an isolated instance (tests, one runtime per
tenant); use `getAiRuntime` when the process should share one. `AiRuntimeConfig`
mirrors the resolved runtime field-for-field, all optional, so you inject only the
ports you have real implementations for — everything else stays a safe default
until you need it.

Three registries sit at the root — models, embeddings, and vision — each with the
same register / get / list / reset shape. Models are addressed by reference: a
`ModelRef` is `string | ModelSelector`, and the string form is
`"<provider>:<model>"`, e.g. `"anthropic:claude-sonnet-4-5"`. Errors are a small
hierarchy rooted at `AiError`; the two you will actually catch are
`AiNotConfiguredError` (you called a capability whose port was never injected) and
`ModelProviderNotFoundError` (the reference names a provider that never
registered).

## Contracts — the shared vocabulary

`@netscript/ai/contracts` is pure types with no IO — the vocabulary every layer
above the engine speaks. It carries the `Message` / `MessageRole` conversation
model, the multimodal `ContentPart` union (text, image, audio, video, document,
each backed by a base64 or URL `ContentSource`), the model descriptors and
capability flags, and the tool-call shapes.

The one contract worth internalizing before anything else is the **`AgentChunk`
union** — the wire vocabulary the whole stack streams. A run yields text spans,
tool calls, tool results, message boundaries, usage, and errors as discriminated
chunks, always terminating in a final `done` chunk. The durable-chat runtime
persists these chunks and the chat UI renders them, which is why the layers compose
without adapters: they all speak `AgentChunk`.

The vocabulary also carries the generative-UI contract: `RENDER_UI_TOOL_NAME =
"render_ui"`, `RenderUiResult`, and a `UiResource` whose `uri` is a `ui://` string
(mirroring the MCP resource shape).

## Ports — the seams you wire

`@netscript/ai/ports` exposes the capability interfaces — telemetry, tool
registry, embeddings, vision, MCP transport, skill loading, the agent loop,
memory, and the chat/model provider seams — plus their registry and default
factories. Two are worth calling out because they shape how you wire things:

- **`ModelProviderPort`** covers discovery (`listModels()`, `getModel()`,
  `supports()`), and `createChatClient?()` is optional on it — so a discovery-only
  provider can omit chat entirely. The agent loop injects the narrower
  `ChatModelProviderPort`, which requires `createChatClient(modelId)`.
- **`AgentMemoryPort`** — `append(threadId, message)` and `load(threadId)` are the
  base; **`recall?(threadId, query)` is optional and `undefined` by default**.
  There is no built-in semantic recall — guard `recall` and fall back to `load`.

## Tools — Standard Schema, no DSL

The tool system validates with **Standard Schema**, so you bring any conforming
validator (zod, valibot, arktype, or hand-rolled) — the core adds no schema
language.

- **`defineAiTool(name)`** returns a builder: `.describe()`,
  `.parameters(jsonSchema)`, `.input(schema)`, terminating in either
  `.server(handler)` or `.client()` (a deferred tool, e.g. `render_ui`).
- **`createToolRegistry(defs?)`** implements `ToolRegistryPort`; its
  `.dispatch(name, input, ctx?)` validates input before your handler runs and
  throws `ToolNotFoundError` / `ToolInputValidationError` when it should.
- **`renderUiTool`** is the built-in `render_ui` wire contract: schema-only and
  **client-deferred** (`result.deferred === true`). The engine runs **no
  renderer** — rendering is the [chat UI's](/ai/chat-ui/) job.

## The agent loop

`createAgentLoop(deps)` builds the loop from injected collaborators: a required
`modelProvider: ChatModelProviderPort`, plus optional `tools`, `history`, and
`defaultMaxSteps`. `loop.run(input, options?)` returns an
`AsyncIterable<AgentChunk>`; the loop exposes `loop.state` and `loop.stop()`.

The defaults are deliberately conservative: the built-in
`slidingWindowHistory` strategy keeps `DEFAULT_HISTORY_WINDOW = 20` messages, and
`DEFAULT_MAX_STEPS = 8` bounds how many tool-calling steps a run may take before
it must settle. Hitting that bound throws `AgentMaxStepsExceededError` inside the
run — the loop settles `errored`, yields an `error` chunk, then the final `done`,
so a consumer never hangs on an unterminated stream.

## MCP transports

`@netscript/ai/mcp` adapts remote Model Context Protocol servers into the same
tool registry the loop dispatches. `createMcpTransport(config)` takes a
discriminated config (`kind: "stdio"` or `kind: "streamable-http"`) and returns an
`McpTransportPort`; `registerMcpTools(registry, transport)` surfaces the remote
tools and returns a registration whose `.stop()` detaches. The Streamable-HTTP
transport reconnects with backoff, and auth (`none` / `api-token` / `oauth`) is
injected by your app's startup wiring rather than hardcoded. The full client
story — pooling multiple servers, auth modes, rendering `ui://` resources — is
the [MCP guide](/ai/mcp/).

## Provider adapters — opt-in side-effect imports

Providers self-register on import, mirroring `@netscript/kv/redis`. The base
engine pulls **no** provider SDK; you opt in per provider, and an import is all it
takes:

```ts
import "@netscript/ai/anthropic"; // self-registers the "anthropic" provider

const model = await getModel("anthropic:claude-sonnet-4-5");
```

Choosing between them is mostly a question of where your models live:

- **`./anthropic`** talks to Anthropic directly, catalog taken verbatim from
  `@tanstack/ai-anthropic`, `apiKey` defaulting to `ANTHROPIC_API_KEY`.
- **`./openai-compatible`** is the workhorse for any endpoint that speaks the
  OpenAI API: no fixed catalog (the remote endpoint owns its model list), and it
  throws `AiNotConfiguredError` rather than guessing when `baseURL` / `apiKey`
  are missing.
- **`./openrouter`** builds on the OpenAI-compatible base for OpenRouter (key
  from `OPENROUTER_API_KEY`) and adds a `reasoningEffort` option
  (`"low" | "medium" | "high"`) normalized to OpenRouter's wire format.
- **`./ollama`** builds on the same base for a local endpoint and runs a
  reachability preflight against the host first — so a missing local daemon fails
  fast instead of at the first token.
- **`./openai-embeddings`** registers for the embedding and vision seams, not
  chat: `.embed()` and `.analyze()`.

Per-provider config fields and defaults are enumerated in the
[generated reference]({{ "ref:ai" |> xref |> url }}).

## Testing — deterministic fakes

`@netscript/ai/testing` supplies port fakes so an agent or tool can be exercised
without a network: fake chat model providers and agent loops that replay scripted
turns and chunks, fake memory, embedding, and vision ports, an in-memory tool
registry, and `createFakeTelemetryPort()` (whose `.records` capture emitted
telemetry). The full factory list lives in the generated reference.

## Wiring tool and agent registries

Today you wire the engine's registries **directly** at app startup:
`createToolRegistry(defs?)` from `@netscript/ai/tools` for tools and
`createAgentLoop(deps)` from `@netscript/ai/agent` for agent loops. No codegen
step sits between your files and the runtime — you register against the engine
factories yourself.

{{ comp callout { type: "note", title: "Not in this release: netscript generate ai" } }}
A <code>netscript generate ai</code> codegen — compiling app-owned tool and agent files
into name-keyed and stem-keyed registries — is a planned target but is <strong>not in
the CLI today</strong>. The shipped <code>netscript generate</code> targets are
<code>plugins</code>, <code>runtime-schemas</code>, and <code>aspire</code>. Until an AI
target lands, register tools and agent loops against the engine factories directly.
{{ /comp }}

## Where the exact tables live

This guide stops at the altitude of "which piece, and why". For the complete,
generated symbol tables — every export, signature, and config field — use:

- [`@netscript/ai`]({{ "ref:ai" |> xref |> url }}) — the engine itself: runtime,
  contracts, ports, tools, agent loop, MCP transports, provider adapters.
- [`@netscript/plugin-ai`]({{ "ref:plugin-ai" |> xref |> url }}) — the thin AI
  plugin delivery shell.
- [`@netscript/plugin-ai-core`]({{ "ref:plugin-ai-core" |> xref |> url }}) — the
  plugin's reusable `/v1/ai` contract core.

And for the rest of the stack: the [AI overview](/ai/) tells the layering story,
[durable chat](/ai/durable-chat/) covers the Fresh runtime, and the
[chat UI](/ai/chat-ui/) covers the components that render what this engine
streams.
