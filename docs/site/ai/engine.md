---
layout: layouts/base.vto
title: AI engine
templateEngine: [vento, md]
order: 4
---

# AI engine

`@netscript/ai` is the provider-agnostic AI engine at the center of the stack. This page tells you
which piece of it to reach for and why; the API reference lists every symbol.

The engine is a ports-and-adapters core with no `@netscript/*` dependencies. It owns the domain
vocabulary, the capability seams, the model registries, the tool system, the agent loop, MCP
transports and opt-in provider adapters. It wraps `@tanstack/ai*` and `@standard-schema/spec` and
adds no schema DSL of its own. Install it with `deno add jsr:@netscript/ai{{ releaseSpecifier }}`.
[Durable chat](/ai/durable-chat/) and the [chat UI](/ai/chat-ui/) each work without it.

## Subpaths

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

The first six subpaths are the engine itself. The provider subpaths are opt-in, and `./testing`
replaces them in tests.

## The runtime and registries

`createAiRuntime(config)` is a pure wiring function: it resolves every capability port and defaults
each one to a no-op or throwing implementation, with no IO and no global mutation.
`getAiRuntime(config?)` is the process singleton, shaped like `getKv()`, with `resetAiRuntime()` and
`isAiRuntimeInitialized()` alongside. Use `createAiRuntime` for an isolated instance, such as in
tests or one runtime per tenant, and `getAiRuntime` when the process shares one. `AiRuntimeConfig`
mirrors the resolved runtime field for field, all optional, so you inject only the ports you have
real implementations for.

Three registries sit at the root: models, embeddings and vision, each with the same
register / get / list / reset shape. A `ModelRef` is `string | ModelSelector`; the string form is
`"<provider>:<model>"`, for example `"anthropic:claude-sonnet-5-5"`. Errors form a small hierarchy
rooted at `AiError`. The two you will catch are `AiNotConfiguredError` (you called a capability
whose port was never injected) and `ModelProviderNotFoundError` (the reference names a provider
that never registered).

## Contracts

`@netscript/ai/contracts` is pure types with no IO: the vocabulary every layer above the engine
speaks. It carries the `Message` / `MessageRole` conversation model, the multimodal `ContentPart`
union (text, image, audio, video and document, each backed by a base64 or URL `ContentSource`),
model descriptors and capability flags, and the tool-call shapes.

Learn the `AgentChunk` union first. It is the wire vocabulary the whole stack streams: a run yields
text spans, tool calls, tool results, message boundaries, usage and errors as discriminated chunks,
and always ends with a `done` chunk. Durable chat persists these chunks and the chat UI renders
them, so the layers compose without adapters.

The contracts also define generative UI: `RENDER_UI_TOOL_NAME = "render_ui"`, `RenderUiResult`, and
a `UiResource` whose `uri` is a `ui://` string, mirroring the MCP resource shape.

## Ports

`@netscript/ai/ports` exposes the capability interfaces (telemetry, tool registry, embeddings,
vision, MCP transport, skill loading, the agent loop, memory and the chat/model provider seams) plus
their registry and default factories. Three of them shape how you wire the engine:

- **`ModelProviderPort`** covers discovery (`listModels()`, `getModel()`, `supports()`).
  `createChatClient?()` is optional on it, so a discovery-only provider can omit chat. The agent
  loop injects the narrower `ChatModelProviderPort`, which requires `createChatClient(modelId)`.
- **`AgentMemoryPort`** has `append(threadId, message)` and `load(threadId)`.
  `recall?(threadId, query)` is optional and `undefined` by default, because there is no built-in
  semantic recall: guard `recall` and fall back to `load`.
- **`TelemetryPort`** makes an agent run observable once you inject a real one. The loop opens a
  `gen_ai.chat` span per run and a `gen_ai.chat.turn` span per model turn, and records tool calls as
  `gen_ai.tool.call` events.

## Tools

Tools validate with Standard Schema, so you bring any conforming validator: zod, valibot, arktype
or your own.

- **`defineAiTool(name)`** returns a builder: `.describe()`, `.parameters(jsonSchema)` and
  `.input(schema)`, ending in either `.server(handler)` or `.client()` for a deferred tool such as
  `render_ui`.
- **`createToolRegistry(defs?)`** implements `ToolRegistryPort`. Its `.dispatch(name, input, ctx?)`
  validates input before your handler runs and throws `ToolNotFoundError` or
  `ToolInputValidationError`.
- **`renderUiTool`** is the built-in `render_ui` wire contract: schema-only and client-deferred
  (`result.deferred === true`). The engine runs no renderer; rendering belongs to the
  [chat UI](/ai/chat-ui/).

## The agent loop

`createAgentLoop(deps)` builds the loop from injected collaborators: a required
`modelProvider: ChatModelProviderPort`, plus optional `tools`, `history` and `defaultMaxSteps`.
`loop.run(input, options?)` returns an `AsyncIterable<AgentChunk>`, and the loop exposes
`loop.state` and `loop.stop()`.

The built-in `slidingWindowHistory` strategy keeps `DEFAULT_HISTORY_WINDOW = 20` messages, and
`DEFAULT_MAX_STEPS = 8` bounds how many tool-calling steps a run may take. Hitting that bound throws
`AgentMaxStepsExceededError` inside the run: the loop settles `errored`, yields an `error` chunk and
then the final `done`, so a consumer never waits on an unterminated stream.

Register tools with `createToolRegistry(defs?)` and agent loops with `createAgentLoop(deps)` at app
startup. No codegen step sits between your files and the runtime; `netscript generate` has no AI
target.

## MCP transports

`@netscript/ai/mcp` adapts remote Model Context Protocol servers into the tool registry the loop
dispatches. `createMcpTransport(config)` takes a discriminated config (`kind: "stdio"` or
`kind: "streamable-http"`) and returns an `McpTransportPort`; `registerMcpTools(registry, transport)`
surfaces the remote tools and returns a registration whose `.stop()` detaches them. The
[MCP guide](/ai/mcp/) covers reconnects, pooling, auth modes and `ui://` resources.

## Provider adapters

Providers register themselves on import, like `@netscript/kv/redis`. The base engine pulls in no
provider SDK; you opt in per provider with one import:

```ts
import "@netscript/ai/anthropic"; // self-registers the "anthropic" provider

const model = await getModel("anthropic:claude-sonnet-5-5");
```

Pick a provider by where your models live:

- **`./anthropic`** talks to Anthropic directly; see [Anthropic](#anthropic) below.
- **`./openai-compatible`** serves any endpoint that speaks the OpenAI API. It has no fixed catalog,
  because the remote endpoint owns its model list, and it throws `AiNotConfiguredError` instead of
  guessing when `baseURL` or `apiKey` is missing.
- **`./openrouter`** builds on the OpenAI-compatible base for OpenRouter, reads its key from
  `OPENROUTER_API_KEY` and adds a `reasoningEffort` option (`"low" | "medium" | "high"`) normalized
  to OpenRouter's wire format.
- **`./ollama`** builds on the same base for a local endpoint. It runs a reachability preflight
  against the host first, so a missing local daemon fails fast instead of at the first token.
- **`./openai-embeddings`** registers the embedding and vision seams, not chat: `.embed()` and
  `.analyze()`.

### Anthropic

`./anthropic` combines the `@tanstack/ai-anthropic` catalog with Sonnet 5.5 through TanStack's model
extension API.

- **Credentials.** An explicit request or provider `apiKey` wins. Otherwise, when a turn starts, the
  upstream adapter checks `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_OAUTH_TOKEN`, then `ANTHROPIC_API_KEY`.
  Bearer tokens use `Authorization`; OAuth tokens also enable the upstream Claude Code identity
  headers and system block.
- **Extra model IDs.** Set `models` to additional API IDs when the provider catalog lags a release.
  Discovery and construction stay offline, unknown unconfigured IDs reject, and added IDs have no
  inferred capabilities. The registered provider factory accepts the same configuration.
- **Thinking.** Exact Opus 5.5 and Fable 5.1 IDs keep mandatory adaptive thinking when neutral
  effort is `off`; Sonnet 5.5 uses `between_tools`. Native option validation runs after all
  request and call layers are merged.
- **Streaming usage.** Input and cache counts from `message_start` are kept when cumulative
  `message_delta` frames report only output counts. Counters reset per turn, and the observer emits
  no provider logs.

> [!WARNING]
> With the TanStack AI 0.68 family, `usage.promptTokens` already includes uncached input, cache
> reads and cache writes exactly once. Use it directly as total input: adding
> `promptTokensDetails.cachedTokens` or `cacheWriteTokens` again double-counts the cache. Subtract
> those fields to get uncached input. `totalTokens` is the total input plus completion tokens.

Per-provider config fields and defaults are enumerated in the
[API reference]({{ "ref:ai" |> xref |> url }}).

## Testing

`@netscript/ai/testing` supplies port fakes, so you can exercise an agent or tool without a
network: fake chat model providers and agent loops that replay scripted turns and chunks, fake
memory, embedding and vision ports, an in-memory tool registry, and `createFakeTelemetryPort()`,
whose `.records` capture emitted telemetry.

## Next steps

Look up exact signatures and config fields in the
[`@netscript/ai` reference]({{ "ref:ai" |> xref |> url }}).

- [`@netscript/plugin-ai`]({{ "ref:plugin-ai" |> xref |> url }}) is the thin AI plugin delivery
  shell.
- [`@netscript/plugin-ai-core`]({{ "ref:plugin-ai-core" |> xref |> url }}) holds the plugin's
  reusable `/v1/ai` contract.
- [MCP](/ai/mcp/) connects external MCP servers to the tool registry.
