---
layout: layouts/base.vto
title: AI engine
templateEngine: [vento, md]
prev: { label: "Chat UI", href: "/ai/chat-ui/" }
next: null
order: 4
---

# AI engine

`@netscript/ai` is the provider-agnostic AI engine at the design center of the stack: a
zero-`@netscript/*`-dependency, ports-and-adapters core that owns the domain
vocabulary, the capability seams, the model registries, the tool system, the agent
loop, MCP transports, and opt-in provider adapters. It wraps `@tanstack/ai*` and
`@standard-schema/spec` and adds no schema DSL of its own.

{{ comp callout { type: "note", title: "Published in " + releaseVersion } }}
<code>@netscript/ai</code> is <strong>published on JSR</strong> and installs today:
<code>deno add jsr:@netscript/ai</code>. Every subpath on this page resolves against the
published <strong>{{ releaseVersion }}</strong> surface. The engine carries zero
<code>@netscript/*</code> dependencies, so you can adopt it on its own — the
<a href="/ai/durable-chat/">durable-chat runtime</a> and <a href="/ai/chat-ui/">chat UI</a>
each stand alone and neither requires it.
{{ /comp }}

## The export map

{{ comp.apiTable({
  caption: "@netscript/ai — subpath exports",
  columns: ["Subpath", "Purpose"],
  rows: [
    ["<code>.</code>", "Composition root + model / embedding / vision registries."],
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

## The runtime and registries

`createAiRuntime(config)` is a **pure wiring** function: it resolves every capability
port, defaulting each to a no-op or throwing implementation, with no IO and no global
mutation. `getAiRuntime(config?)` is the process singleton (shaped like `getKv()`), with
`resetAiRuntime()` and `isAiRuntimeInitialized()` alongside. The resolved `AiRuntime`
exposes `telemetry`, `tools`, `embeddings`, `vision`, `mcp`, `skills`, `agentLoop`, and
`memory`, plus `getModelProvider()` / `getModel()`. `AiRuntimeConfig` is the same field
set, all optional, so you inject only the ports you have real implementations for.

Three registries sit at the root, each with the same register / get / list / reset
shape:

{{ comp.apiTable({
  caption: "Model, embedding, and vision registries",
  rows: [
    { name: "registerModelProvider / getModelProvider / getModel / listModelProviders / resetModelRegistry", type: "model", desc: "`getModel(ref, config?)` resolves a `ModelHandle {descriptor, providerId}` from a `ModelRef`." },
    { name: "registerEmbeddingProvider / getEmbeddingProvider / listEmbeddingProviders / resetEmbeddingRegistry", type: "embedding", desc: "The embedding provider seam." },
    { name: "registerVisionProvider / getVisionProvider / listVisionProviders / resetVisionRegistry", type: "vision", desc: "The vision provider seam." }
  ]
}) }}

Models are addressed by reference. A `ModelRef` is `string | ModelSelector`; the string
form is `"<provider>:<model>"`, e.g. `"anthropic:claude-sonnet-4-5"`. Errors are a small
hierarchy rooted at `AiError`: `AiNotConfiguredError` (`.capability`) and
`ModelProviderNotFoundError` (`.providerId`, `.availableProviders`).

## Contracts — the domain vocabulary

`@netscript/ai/contracts` is pure types with no IO — the vocabulary every layer above
the engine speaks.

- **Messages.** `Message { role, content, name?, toolCallId?, toolCalls? }` with
  `MessageRole = "system" | "user" | "assistant" | "tool"` and
  `MessageContent = string | readonly ContentPart[]`.
- **Multimodal content.** `ContentPart` is a `Text | Image | Audio | Video | Document`
  union; a `ContentSource` is either a base64 `DataContentSource` (with `mimeType`) or a
  `UrlContentSource`; `ContentModality = "text" | "image" | "audio" | "video" |
  "document"`.
- **Models.** `ModelDescriptor`, `ModelCapabilities` (`streaming?`, `tools?`, `vision?`,
  `embeddings?`, `inputModalities?`, token maxima), and `ModelSelector { provider,
  model }`.
- **Tools.** `ToolDescriptor`, `ToolParameters`, `ToolCall` (with a raw-JSON `arguments`
  string and a `ToolCallState`), and `ToolResult`.

The wire vocabulary the whole stack streams is the **`AgentChunk` union**:

{{ comp.apiTable({
  caption: "AgentChunk — the streaming chunk union (7 discriminants)",
  rows: [
    { name: "TextChunk", type: "text", desc: "A span of assistant text." },
    { name: "ToolCallChunk", type: "tool-call", desc: "A tool invocation (streamed input)." },
    { name: "ToolResultChunk", type: "tool-result", desc: "A tool result." },
    { name: "MessageChunk", type: "message", desc: "A completed message boundary." },
    { name: "UsageChunk", type: "usage", desc: "Token / cost usage (`Usage`, with prompt / completion detail and optional cost breakdown)." },
    { name: "ErrorChunk", type: "error", desc: "A terminal error before the final done." },
    { name: "DoneChunk", type: "done", desc: "The final chunk of a run." }
  ]
}) }}

The vocabulary also carries the generative-UI contract: `RENDER_UI_TOOL_NAME =
"render_ui"`, `RenderUiResult`, and a `UiResource` whose `uri` is a `ui://` string
(mirroring the MCP resource shape).

## Ports — the hexagonal seams

`@netscript/ai/ports` exposes the capability interfaces plus their registry and default
factories: `TelemetryPort`, `ToolRegistryPort`, `EmbeddingProviderPort`,
`VisionProviderPort`, `McpTransportPort`, `SkillLoaderPort`, `AgentLoopPort`,
`AgentMemoryPort`, `ChatClientPort`, `ChatModelProviderPort`, and `ModelProviderPort`.
Two are worth calling out:

- **`ModelProviderPort`** — `{ id, listModels(), getModel(), supports(),
  createChatClient?() }`. `createChatClient` is optional on the base, so discovery-only
  providers can omit it; `ChatModelProviderPort { id, createChatClient(modelId) }` is
  the narrow seam the agent loop injects.
- **`AgentMemoryPort`** — `append(threadId, message)` and `load(threadId)` are the base;
  **`recall?(threadId, query)` is optional and `undefined` by default**. There is no
  built-in semantic recall — callers must guard `recall` and fall back to `load`.

`ChatClientPort.stream()` yields `ChatClientEvent`s
(`ChatTextEvent | ChatToolCallEvent | ChatFinishEvent | ChatErrorEvent`) with a
`ChatFinishReason` of `stop | length | tool-calls | content-filter | error | unknown`.

## Tools — Standard Schema, no DSL

The tool system validates with **Standard Schema**, so you bring any conforming
validator (zod, valibot, arktype, or hand-rolled) — the core adds no schema language.

- **`defineAiTool(name)`** returns a builder: `.describe()`, `.parameters(jsonSchema)`,
  `.input(schema)`, terminating in either `.server(handler)` or `.client()` (a deferred
  tool, e.g. `render_ui`).
- **`createToolRegistry(defs?)`** implements `ToolRegistryPort`: `.define()`,
  `.getDefinition()`, `.listDefinitions()`, and `.dispatch(name, input, ctx?)`, which
  validates input and throws `ToolNotFoundError` / `ToolInputValidationError`.
- **`renderUiTool`** is the built-in `render_ui` wire contract: schema-only and
  **client-deferred** (`result.deferred === true`). The engine runs **no renderer** —
  rendering is the [chat UI's](/ai/chat-ui/) job. `AiToolExecutionKind` is
  `"server" | "client"`.

## The agent loop

`createAgentLoop(deps)` builds the loop from injected collaborators: a required
`modelProvider: ChatModelProviderPort`, plus optional `tools`, `history`, and
`defaultMaxSteps`. `loop.run(input, options?)` returns an `AsyncIterable<AgentChunk>`;
`input` is `{ model, messages, tools?, system? }` and `options` is `{ signal?,
maxSteps? }`. The loop exposes `loop.state` and `loop.stop()`.

{{ comp.apiTable({
  caption: "Agent loop — states and defaults",
  rows: [
    { name: "AgentLoopState", type: "\"idle\" | \"running\" | \"awaiting-tool\" | \"done\" | \"aborted\" | \"errored\"", desc: "`isTerminalState()` narrows to `TerminalAgentLoopState`." },
    { name: "slidingWindowHistory({ maxMessages?, preserveSystem? })", type: "HistoryStrategy", desc: "The built-in history strategy; `DEFAULT_HISTORY_WINDOW = 20`." },
    { name: "DEFAULT_MAX_STEPS", type: "8", desc: "Tool-calling steps before the loop must settle." },
    { name: "AgentMaxStepsExceededError", type: "error (.maxSteps)", desc: "Thrown when `maxSteps` is hit without a final answer; the run settles `errored`, yields an `error` chunk, then a final `done`." }
  ]
}) }}

## MCP transports

`@netscript/ai/mcp` adapts remote Model Context Protocol servers.
`createMcpTransport(config)` takes a discriminated config —
`{ kind: "stdio" } & StdioMcpTransportConfig` or `{ kind: "streamable-http" } &
StreamableHttpMcpTransportConfig` — and returns an `McpTransportPort`.
`registerMcpTools(registry, transport)` surfaces the remote tools into a registry and
returns a registration whose `.stop()` detaches. The Streamable-HTTP transport is
reconnectable with backoff (`McpConnectionState = disconnected | connecting | connected
| reconnecting | closed`).

Auth is injected by the app composition root — `McpAuthConfig` is
`{ mode: "none" }`, `{ mode: "api-token", token, headerName?, scheme? }`, or
`{ mode: "oauth", accessToken, tokenType? }`.

## Provider adapters — opt-in side-effect imports

Providers self-register on import, mirroring `@netscript/kv/redis`. The base engine
pulls **no** provider SDK; you opt in per provider.

{{ comp.apiTable({
  caption: "Provider adapters (import to self-register)",
  rows: [
    { name: "@netscript/ai/anthropic", type: "chat", desc: "Registers `\"anthropic\"` + `AnthropicModelProvider`; catalog taken verbatim from `@tanstack/ai-anthropic`. Config `{ apiKey? (→ ANTHROPIC_API_KEY), baseURL? }`; cancellation via `stream(_, { signal })`." },
    { name: "@netscript/ai/openai-compatible", type: "chat", desc: "Registers `\"openai-compatible\"` + `OpenAiCompatibleModelProvider`. No fixed catalog — optimistic `supports()` when `models` is unset (the remote endpoint owns its catalog); throws `AiNotConfiguredError` if `baseURL` / `apiKey` are missing. Config `{ baseURL?, apiKey?, models?, api?, name? }`, `api = \"chat-completions\" | \"responses\"`." },
    { name: "@netscript/ai/openrouter", type: "chat", desc: "Registers `\"openrouter\"` + `OpenRouterModelProvider` over the OpenAI-compatible base (reuses `@tanstack/ai-openai`, no new dependency). Config `{ apiKey? (→ OPENROUTER_API_KEY), baseURL?, models?, reasoningEffort? }`; `reasoningEffort` is `\"low\" | \"medium\" | \"high\"`, normalized to the OpenRouter `{ reasoning: { effort } }` wire option via `openRouterReasoningModelOptions`." },
    { name: "@netscript/ai/ollama", type: "chat", desc: "Registers `\"ollama\"` + `OllamaModelProvider` over the OpenAI-compatible base for a local endpoint. Config `{ host? (→ DEFAULT_OLLAMA_HOST), models?, reachability?, fetch? }`; runs a `ReachabilityPort` preflight against the local host — ships `createHttpReachabilityPort` / `HttpReachabilityAdapter` (or `createAssumeReachablePort` to skip)." },
    { name: "@netscript/ai/openai-embeddings", type: "embedding + vision", desc: "Registers `\"openai-embeddings\"` for both seams: `.embed()` (`/embeddings`) and `.analyze()` (`/chat/completions`). Defaults `text-embedding-3-small` / `gpt-4o-mini`." }
  ]
}) }}

An import is all it takes — the provider is then discoverable by its id:

```ts
import "@netscript/ai/anthropic"; // self-registers the "anthropic" provider

const model = await getModel("anthropic:claude-sonnet-4-5");
```

## Testing — deterministic fakes

`@netscript/ai/testing` supplies port fakes so an agent or tool can be exercised without
a network: `createFakeChatModelProvider(id, turns)`, `createFakeAgentLoop(chunks)`,
`createFakeAgentMemory({ recall? })`, `createFakeModelProvider`,
`createFakeEmbeddingProvider(vector)`, `createFakeVisionProvider(text)`,
`createInMemoryToolRegistry()`, and `createFakeTelemetryPort()` (whose `.records` capture
emitted telemetry).

## Wiring tool and agent registries

Today you wire the engine's registries **directly** in your composition root:
`createToolRegistry(defs?)` from `@netscript/ai/tools` for tools and
`createAgentLoop(deps)` from `@netscript/ai/agent` for agent loops (both documented
above). No codegen step sits between your files and the runtime — you register against
the engine factories yourself.

{{ comp callout { type: "note", title: "Not in this release: netscript generate ai" } }}
A <code>netscript generate ai</code> codegen — compiling app-owned tool and agent files
into name-keyed and stem-keyed registries — is a planned target but is <strong>not in
the CLI today</strong>. The shipped <code>netscript generate</code> targets are
<code>plugins</code>, <code>runtime-schemas</code>, and <code>aspire</code>. Until an AI
target lands, register tools and agent loops against the engine factories directly.
{{ /comp }}

## Reference

{{ comp.featureGrid({ items: [
  {
    title: "Look up — @netscript/ai",
    body: "The generated reference for the engine package: runtime, contracts, ports, tools, agent loop, MCP transports, and provider adapters.",
    href: "/reference/ai/",
    icon: "≡"
  },
  {
    title: "Back — the AI overview",
    body: "The stack story, the two planes, and the plugin thinness laws the engine anchors.",
    href: "/ai/",
    icon: "←"
  },
  {
    title: "Durable chat",
    body: "The self-contained Fresh runtime for a durable AI chat — composes with this engine but does not require it.",
    href: "/ai/durable-chat/",
    icon: "◆"
  },
  {
    title: "Chat UI",
    body: "The copy-registry components that render an agent transcript, including render_ui targets.",
    href: "/ai/chat-ui/",
    icon: "◆"
  }
] }) }}
