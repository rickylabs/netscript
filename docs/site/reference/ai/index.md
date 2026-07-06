---
layout: layouts/base.vto
title: "@netscript/ai"
---

# `@netscript/ai`

The provider-agnostic AI engine core for NetScript: a composition root, a global model
registry, the domain vocabulary and capability ports for chat/embeddings/vision/tools/agents/MCP,
and a set of opt-in provider adapters. This page is generated from the package's public surface
with `deno doc` (US-2). For the full index of packages and plugins return to the
[reference overview](/reference/).

The base `@netscript/ai` entrypoint takes **no** `@netscript/*` runtime dependency and pulls no
provider SDK into the module graph. Provider adapters (Anthropic, OpenAI-compatible, OpenRouter,
Ollama, OpenAI embeddings/vision) live on **separate subpath exports** and **self-register** into
the shared registry as a side effect of being imported — so an application chooses its providers
with one-line side-effect imports and only those SDKs enter the graph:

```ts
import "@netscript/ai/anthropic"; // self-registers the 'anthropic' provider
import { getModel } from "@netscript/ai";

const handle = await getModel("anthropic:claude-sonnet-4-5");
```

## Export map

The package publishes the following entrypoints. Each is generated from its own `deno doc`
surface.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/ai` | `./mod.ts` | Composition root (`createAiRuntime` / `getAiRuntime`) and the model registry accessors. |
| `@netscript/ai/contracts` | `./src/contracts/mod.ts` | Domain vocabulary: messages, content parts, model identity, agent chunks, usage, errors. |
| `@netscript/ai/ports` | `./src/ports/mod.ts` | Capability port interfaces, their no-op/unconfigured defaults, and the provider registries. |
| `@netscript/ai/anthropic` | `./anthropic.ts` | Anthropic model provider (wraps `@tanstack/ai-anthropic`). |
| `@netscript/ai/openai-compatible` | `./openai-compatible.ts` | OpenAI-compatible model provider (any base URL / key / model list). |
| `@netscript/ai/openrouter` | `./openrouter.ts` | OpenRouter model provider with reasoning-effort passthrough. |
| `@netscript/ai/ollama` | `./ollama.ts` | Local Ollama model provider with a reachability preflight. |
| `@netscript/ai/openai-embeddings` | `./openai-embeddings.ts` | OpenAI-compatible embeddings **and** vision provider. |
| `@netscript/ai/tools` | `./tools.ts` | Standard-Schema tool definitions, in-memory registry, and the `render_ui` wire contract. |
| `@netscript/ai/agent` | `./agent.ts` | The E3 agent loop, typestate, and history strategies. |
| `@netscript/ai/mcp` | `./mcp.ts` | MCP transports (stdio, Streamable-HTTP), auth modes, and tool registration. |
| `@netscript/ai/testing` | `./src/testing/mod.ts` | Deterministic fakes for downstream unit tests. |

## Composition root and model registry (`@netscript/ai`)

The root entrypoint is the composition root plus the model-registry accessors. Model providers
are resolved through a module-level registry (not stored on the runtime), so provider packages
self-register independently of runtime construction.

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createAiRuntime` | function | `createAiRuntime(config?: AiRuntimeConfig): AiRuntime` | Compose a runtime, defaulting every unspecified port. Pure wiring — no IO, no global mutation. |
| `getAiRuntime` | function | `getAiRuntime(config?: AiRuntimeConfig): AiRuntime` | Lazy process singleton (shaped like `@netscript/kv`'s `getKv()`); config is used only on first call. |
| `isAiRuntimeInitialized` | function | `isAiRuntimeInitialized(): boolean` | Whether the singleton has been constructed. |
| `resetAiRuntime` | function | `resetAiRuntime(): void` | Clear the singleton (test isolation). |
| `registerModelProvider` | function | `registerModelProvider(id, factory): void` | Register a provider factory under an id (re-registering overwrites). |
| `getModelProvider` | function | `getModelProvider(id, config?): ModelProviderPort` | Resolve a fresh provider instance, or throw `ModelProviderNotFoundError`. |
| `getModel` | function | `getModel(ref: ModelRef, config?): Promise<ModelHandle>` | Resolve a `"<provider>:<model>"` ref (or `ModelSelector`) end-to-end. |
| `listModelProviders` | function | `listModelProviders(): readonly string[]` | Ids of all currently-registered providers. |
| `resetModelRegistry` | function | `resetModelRegistry(): void` | Clear the provider registry (test isolation). |
| `getEmbeddingProvider` / `getVisionProvider` | function | `(id, config?) => …ProviderPort` | Resolve a registered embedding / vision provider. |
| `registerEmbeddingProvider` / `registerVisionProvider` | function | `(id, factory) => void` | Register an embedding / vision provider factory. |
| `listEmbeddingProviders` / `listVisionProviders` | function | `() => readonly string[]` | Ids of registered embedding / vision providers. |
| `resetEmbeddingRegistry` / `resetVisionRegistry` | function | `() => void` | Clear the embedding / vision registries (test isolation). |
| `AiRuntime` | interface | - | Composed runtime: resolved ports plus `getModelProvider` / `getModel` bound to the default provider. |
| `AiRuntimeConfig` | interface | - | Optional ports injected into `createAiRuntime`; each omitted capability falls back to its default. |
| `ModelProviderPort` | interface | - | A concrete model backend (`listModels` / `getModel` / `supports` / optional `createChatClient`). |
| `ModelProviderConfig` | type alias | `Readonly<Record<string, unknown>>` | Opaque, provider-defined config bag passed to a provider factory. |
| `ModelHandle` / `ModelRef` | type alias | - | Resolved model (descriptor + provider id) and its `"<provider>:<model>"`-or-selector reference. |
| `AiError` | class | - | Base error for the AI stack. |
| `AiNotConfiguredError` | class | - | Thrown when a capability/provider is used without required configuration. |
| `ModelProviderNotFoundError` | class | - | Thrown when a ref names an unregistered provider id. |

### Runtime capability ports and their defaults

`createAiRuntime` injects each capability port, defaulting any omitted field to a no-op or a
throwing "unconfigured" port. Model providers are **not** on the runtime — they are resolved from
the global registry.

| `AiRuntimeConfig` field | Port | Default when omitted |
| --- | --- | --- |
| `telemetry` | `TelemetryPort` | No-op (`createNoopTelemetryPort`). |
| `tools` | `ToolRegistryPort` | No-op (`createNoopToolRegistry`). |
| `embeddings` | `EmbeddingProviderPort` | Throwing unconfigured port. |
| `vision` | `VisionProviderPort` | Throwing unconfigured port. |
| `mcp` | `McpTransportPort` | Throwing unconfigured port. |
| `skills` | `SkillLoaderPort` | No-op returning no skills. |
| `agentLoop` | `AgentLoopPort` | Throwing unconfigured port. |
| `memory` | `AgentMemoryPort` | No-op store. |
| `defaultModelProvider` | `string` | Unset — `getModelProvider()` then requires an explicit id. |

## Domain contracts (`@netscript/ai/contracts`)

The provider-neutral vocabulary. The tables below list the primary surface; the module is the
source of truth via `deno doc packages/ai/src/contracts/mod.ts`.

| Group | Symbols |
| --- | --- |
| Messages | `Message`, `MessageRole`, `MessageContent`, `ContentPart`, `TextContentPart`, `ImageContentPart`, `AudioContentPart`, `VideoContentPart`, `DocumentContentPart`, `ContentModality`, `ContentSource`, `DataContentSource`, `UrlContentSource` |
| Model identity | `ModelId`, `ModelDescriptor`, `ModelCapabilities`, `ModelSelector`, `ModelRef`, `ModelHandle` |
| Agent stream chunks | `AgentChunk`, `AgentChunkType`, `TextChunk`, `ToolCallChunk`, `ToolResultChunk`, `MessageChunk`, `UsageChunk`, `ErrorChunk`, `DoneChunk` |
| Tools | `ToolDescriptor`, `ToolParameters`, `ToolCall`, `ToolResult`, `ToolCallState`, `ToolResultState`, `ToolInputIssue`, `JsonSchema`, `RenderUiToolDescriptor`, `RenderUiResult`, `UiResource` |
| Usage | `Usage`, `UsageCostBreakdown`, `PromptTokensDetails`, `CompletionTokensDetails`, `ProviderUsageDetails` |
| Errors | `AiError`, `AiNotConfiguredError`, `InvalidModelRefError`, `ModelProviderNotFoundError`, `ToolNotFoundError`, `ToolInputValidationError` |

## Capability ports (`@netscript/ai/ports`)

The capability seams the engine is programmed against, their default implementations, and the
model/embedding/vision registries. Primary surface:

| Group | Symbols |
| --- | --- |
| Model registry | `registerModelProvider`, `getModelProvider`, `getModel`, `parseModelRef`, `listModelProviders`, `isModelProviderRegistered`, `resetModelRegistry`, `ModelProviderPort`, `ModelProviderFactory`, `ModelProviderConfig` |
| Embedding / vision registries | `registerEmbeddingProvider`, `getEmbeddingProvider`, `listEmbeddingProviders`, `isEmbeddingProviderRegistered`, `resetEmbeddingRegistry`, `registerVisionProvider`, `getVisionProvider`, `listVisionProviders`, `isVisionProviderRegistered`, `resetVisionRegistry` |
| Chat | `ChatClientPort`, `ChatModelProviderPort`, `ChatClientRequest`, `ChatClientCallOptions`, `ChatClientEvent`, `ChatTextEvent`, `ChatToolCallEvent`, `ChatFinishEvent`, `ChatErrorEvent`, `ChatFinishReason` |
| Embeddings / vision | `EmbeddingProviderPort`, `EmbeddingCallOptions`, `EmbeddingResponse`, `VisionProviderPort`, `VisionCallOptions`, `VisionResponse` |
| Agent | `AgentLoopPort`, `AgentLoopInput`, `AgentLoopOptions`, `AgentMemoryPort`, `MemoryRecord`, `RecallQuery`, `RecallResult` |
| Tools / skills / telemetry | `ToolRegistryPort`, `ToolHandler`, `SkillLoaderPort`, `SkillDescriptor`, `TelemetryPort`, `TelemetrySpan`, `TelemetryAttributes`, `TelemetryAttributeValue` |
| MCP | `McpTransportPort`, `McpTransportKind`, `McpConnectorConfig`, `McpClientConnection`, `McpConnectOptions`, `McpConnectionState`, `McpAuthConfig`, `McpAuthMode`, `McpToolRegistry`, `McpToolDescriptor`, `McpToolResult` |
| Reachability | `ReachabilityPort`, `ReachabilityCheckOptions`, `ReachabilityResult`, `createAssumeReachablePort` |
| Default factories | `createNoopTelemetryPort`, `createNoopToolRegistry`, `createNoopSkillLoader`, `createNoopAgentMemory`, `createUnconfiguredAgentLoop`, `createUnconfiguredEmbeddingProvider`, `createUnconfiguredVisionProvider`, `createUnconfiguredMcpTransport` |

## Model providers

Each provider lives on its own subpath. Importing the subpath self-registers the provider under
its stable id and re-exports the adapter class and config type for direct construction. All chat
adapters translate the wrapped SDK to the owned chat vocabulary — no provider-SDK type escapes the
public surface — and support per-turn cancellation through the chat client's `stream(_, { signal })`
option.

### `@netscript/ai/anthropic`

Registry id `"anthropic"`. Wraps `@tanstack/ai-anthropic`; the model catalog is taken verbatim
from the wrapped package's `ANTHROPIC_MODELS`.

| Symbol | Kind | Description |
| --- | --- | --- |
| `AnthropicModelProvider` | class | `ModelProviderPort` backed by `@tanstack/ai-anthropic`. |
| `ANTHROPIC_PROVIDER_ID` | variable | `"anthropic"`. |
| `AnthropicModelProviderConfig` | interface | Provider configuration (below). |

| Config field | Type | Default |
| --- | --- | --- |
| `apiKey` | `string` | Falls back to the `ANTHROPIC_API_KEY` environment variable at client construction. |
| `baseURL` | `string` | Anthropic default (override to route through a gateway/proxy). |

### `@netscript/ai/openai-compatible`

Registry id `"openai-compatible"`. Wraps `@tanstack/ai-openai/compatible` for any endpoint that
speaks the OpenAI wire (its own base URL, key, and model list).

| Symbol | Kind | Description |
| --- | --- | --- |
| `OpenAiCompatibleModelProvider` | class | `ModelProviderPort` backed by `@tanstack/ai-openai/compatible`. |
| `OPENAI_COMPATIBLE_PROVIDER_ID` | variable | `"openai-compatible"`. |
| `OpenAiCompatibleModelProviderConfig` | interface | Provider configuration (below). |
| `OpenAiCompatibleApi` | type alias | `"chat-completions" \| "responses"`. |

| Config field | Type | Default |
| --- | --- | --- |
| `baseURL` | `string` | Required to construct a client (e.g. `https://api.deepseek.com/v1`). |
| `apiKey` | `string` | Required to construct a client. No environment fallback — pass it yourself. |
| `models` | `readonly string[]` | Empty; when unset the provider is optimistic (`supports` returns `true`). |
| `api` | `OpenAiCompatibleApi` | `"chat-completions"`. |
| `name` | `string` | `"openai-compatible"`. |

When `baseURL` or `apiKey` is missing, `createChatClient` throws `AiNotConfiguredError` (the
provider still lists and reports its configured `models`).

### `@netscript/ai/openrouter`

Registry id `"openrouter"`. Reuses the OpenAI-compatible transport pinned to OpenRouter, with the
one wire divergence being reasoning: OpenRouter expects a top-level `reasoning: { effort }` object.

| Symbol | Kind | Description |
| --- | --- | --- |
| `OpenRouterModelProvider` | class | `ModelProviderPort` pinned to the OpenRouter endpoint. |
| `OPENROUTER_PROVIDER_ID` | variable | `"openrouter"`. |
| `DEFAULT_OPENROUTER_BASE_URL` | variable | `"https://openrouter.ai/api/v1"`. |
| `OPENROUTER_API_KEY_ENV` | variable | `"OPENROUTER_API_KEY"` — the env var read when `apiKey` is omitted. |
| `openRouterReasoningModelOptions` | function | Pure normalizer: `ReasoningEffort` → `{ reasoning: { effort } }` (or `undefined`). |
| `OpenRouterModelProviderConfig` | interface | Provider configuration (below). |
| `ReasoningEffort` | type alias | `"low" \| "medium" \| "high"`. |

| Config field | Type | Default |
| --- | --- | --- |
| `apiKey` | `string` | Falls back to the `OPENROUTER_API_KEY` environment variable. `createChatClient` throws `AiNotConfiguredError` when neither is present. |
| `baseURL` | `string` | `https://openrouter.ai/api/v1`. |
| `models` | `readonly string[]` | Empty; optimistic `supports` when unset. |
| `reasoningEffort` | `ReasoningEffort` | Unset — no reasoning object emitted. |

### `@netscript/ai/ollama`

Registry id `"ollama"`. Reuses the OpenAI-compatible transport pinned to a local Ollama daemon at
`{host}/v1`, with a reachability preflight and a placeholder key (Ollama ignores authorization).

| Symbol | Kind | Description |
| --- | --- | --- |
| `OllamaModelProvider` | class | `ModelProviderPort` for a local Ollama daemon; exposes `checkReachable()`. |
| `OLLAMA_PROVIDER_ID` | variable | `"ollama"`. |
| `DEFAULT_OLLAMA_HOST` | variable | `"http://localhost:11434"`. |
| `createHttpReachabilityPort` / `HttpReachabilityAdapter` | function / class | Fetch-backed probe of `GET {host}/api/tags`. |
| `DEFAULT_REACHABILITY_PATH` | variable | Default probe path. |
| `createAssumeReachablePort` | function | A port that reports reachable without probing (tests). |
| `OllamaModelProviderConfig` | interface | Provider configuration (below). |
| `ReachabilityPort` / `ReachabilityCheckOptions` / `ReachabilityResult` | interface | Reachability seam and its non-throwing result. |

| Config field | Type | Default |
| --- | --- | --- |
| `host` | `string` | `http://localhost:11434`. |
| `models` | `readonly string[]` | Empty; optimistic `supports` when unset. |
| `reachability` | `ReachabilityPort` | Fetch-backed probe of `GET {host}/api/tags`. |
| `fetch` | `typeof fetch` | Global `fetch` (override for the default probe in tests). |

### `@netscript/ai/openai-embeddings`

Registry id `"openai-embeddings"`, registered for **both** the embedding and vision capabilities.
Speaks the OpenAI-compatible HTTP API directly with Web `fetch` (no provider SDK).

| Symbol | Kind | Description |
| --- | --- | --- |
| `OpenAiEmbeddingsProvider` | class | Implements `EmbeddingProviderPort` (`embed`) and `VisionProviderPort` (`analyze`). |
| `OPENAI_EMBEDDINGS_PROVIDER_ID` | variable | `"openai-embeddings"`. |
| `DEFAULT_OPENAI_EMBEDDING_MODEL` | variable | `"text-embedding-3-small"`. |
| `DEFAULT_OPENAI_VISION_MODEL` | variable | `"gpt-4o-mini"`. |
| `OpenAiEmbeddingsProviderConfig` | interface | Provider configuration (below). |

| Config field | Type | Default |
| --- | --- | --- |
| `apiKey` | `string` | Required; sent as a bearer token. No environment fallback. `embed` / `analyze` throw `AiNotConfiguredError` when absent. |
| `baseURL` | `string` | `https://api.openai.com/v1`. |
| `embeddingModel` | `string` | `text-embedding-3-small`. |
| `visionModel` | `string` | `gpt-4o-mini`. |
| `fetch` | `typeof fetch` | Global `fetch` (override in tests). |

## Tools (`@netscript/ai/tools`)

Define server-executable (or client-deferred) tools, validate their input with **Standard
Schema** (bring any conforming schema — zod, valibot, arktype, or hand-written), and dispatch them
through an in-memory registry that satisfies `ToolRegistryPort`. The core adds no schema DSL and
takes no `@netscript/*` dependency.

| Symbol | Kind | Description |
| --- | --- | --- |
| `defineAiTool` | function | Start a tool definition chain (`.parameters(...).input(schema).server(handler)`). |
| `createToolRegistry` | function | Build an in-memory registry from tool definitions. |
| `renderUiTool` | variable | Built-in `render_ui` wire contract (input schema + metadata only, no renderer). |
| `AiToolRegistry` | interface | Registry surface extending `ToolRegistryPort`. |
| `AiToolBuilder` / `AiToolBuilderWithInput` | interface | Typestate builder surfaces. |
| `AiToolDefinition` | interface | A defined tool (input/output typed). |
| `AiToolExecutionResult` | interface | Result of a dispatch (`output`, or `deferred` for client tools). |
| `AiToolInvocationContext` | interface | Context passed to a server handler. |
| `AiToolServerHandler` | type alias | The server execution function. |
| `AiToolExecutionKind` | type alias | `"server" \| "client"`. |
| `RenderUiToolInput` | interface | Input shape of the `render_ui` contract. |
| `ToolInputValidationError` | class | Thrown when a tool's input fails schema validation. |

## Agent loop (`@netscript/ai/agent`)

The E3 agent loop drives a bounded, cancellable model/tool interaction and emits `AgentChunk`s.
It consumes its collaborators purely by factory injection — importing this subpath pulls **no**
provider SDK.

| Symbol | Kind | Description |
| --- | --- | --- |
| `createAgentLoop` | function | Construct a loop from `AgentLoopDeps` (a `ChatModelProviderPort`, a `ToolRegistryPort`, an optional history strategy). |
| `DEFAULT_MAX_STEPS` | variable | Default step ceiling for a run. |
| `slidingWindowHistory` | function | A `HistoryStrategy` that keeps the last N messages. |
| `DEFAULT_HISTORY_WINDOW` | variable | Default window used by `slidingWindowHistory`. |
| `SlidingWindowOptions` | interface | `{ maxMessages }` for the sliding-window strategy. |
| `HistoryStrategy` | interface | History-trimming seam. |
| `isTerminalState` | function | Narrow an `AgentLoopState` to a terminal state. |
| `AgentLoopState` | type alias | `"idle" \| "running" \| "awaiting-tool" \| "done" \| "aborted" \| "errored"`. |
| `TerminalAgentLoopState` | type alias | `"done" \| "aborted" \| "errored"`. |
| `AgentMaxStepsExceededError` | class | Thrown when a run exceeds its step ceiling. |

The subpath also re-exports the seams the loop is programmed against (`AgentLoopPort`,
`ChatClientPort` / `ChatModelProviderPort` and their event types, `ToolRegistryPort`) so it is a
self-contained wiring surface.

## MCP (`@netscript/ai/mcp`)

MCP transport adapters and tool registration: stdio, reconnectable Streamable-HTTP, injected auth
modes, and lifecycle state.

| Symbol | Kind | Description |
| --- | --- | --- |
| `createMcpTransport` | function | Build a transport from `McpTransportConfig` (`kind: "stdio"` or `"streamable-http"`). |
| `registerMcpTools` | function | Discover and register a transport's tools into a `ToolRegistry`. |
| `StdioMcpTransport` / `StdioMcpTransportConfig` | class / interface | Stdio transport and its config. |
| `StreamableHttpMcpTransport` / `StreamableHttpMcpTransportConfig` | class / interface | Reconnectable Streamable-HTTP transport and its config. |
| `McpTransportPort` | interface | The transport seam. |
| `McpAuthConfig` / `McpAuthMode` | type alias | Injected auth: `"none"`, `"api-token"`, or `"oauth"`. |
| `McpConnectionState` | type alias | `"disconnected" \| "connecting" \| "connected" \| "reconnecting" \| "closed"`. |
| `McpToolRegistration` / `McpToolDescriptor` / `McpToolResult` | interface | Registration and tool-call vocabulary. |

## Testing (`@netscript/ai/testing`)

Deterministic fakes for unit-testing code built on the ports. This subpath is excluded from the
provider dependency graph.

| Symbol | Kind | Description |
| --- | --- | --- |
| `createFakeModelProvider` | function | A `ModelProviderPort` over a fixed descriptor list. |
| `createFakeChatModelProvider` | function | A chat provider that replays scripted turns of `ChatClientEvent`s. |
| `createFakeEmbeddingProvider` | function | An `EmbeddingProviderPort` returning a fixed vector. |
| `createFakeVisionProvider` | function | A `VisionProviderPort` returning fixed text. |
| `createFakeAgentLoop` | function | An `AgentLoopPort` that yields a fixed `AgentChunk[]`. |
| `createFakeAgentMemory` | function | An `AgentMemoryPort` with toggleable recall. |
| `createFakeTelemetryPort` | function | A recording `TelemetryPort` (`FakeTelemetryPort`). |
| `createInMemoryToolRegistry` | function | A `ToolRegistryPort` for tests. |

## Configuration

`@netscript/ai` reads no `@netscript/*` config surface — capabilities are wired through
`AiRuntimeConfig` (see [runtime capability ports](#runtime-capability-ports-and-their-defaults))
and providers through their config bags. Two adapters resolve an API key from the environment when
`apiKey` is omitted:

| Environment variable | Read by | When |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | `@netscript/ai/anthropic` | When `apiKey` is omitted (via the wrapped `@tanstack/ai-anthropic` client). |
| `OPENROUTER_API_KEY` | `@netscript/ai/openrouter` | When `apiKey` is omitted (exported as `OPENROUTER_API_KEY_ENV`). |

> The `openai-compatible`, `openai-embeddings`, and `ollama` providers do **not** read the
> environment. Pass `apiKey` (and `baseURL`/`host`) explicitly — commonly from
> `Deno.env.get(...)` in your composition code. Reading a key from the environment requires
> `--allow-env` for the variable in question.

## Examples

### Compose a runtime

```ts
import { createAiRuntime } from "@netscript/ai";

const ai = createAiRuntime();
// Telemetry defaults to a no-op port — safe to call with nothing wired.
ai.telemetry.recordEvent("agent.start");
```

### Register a provider and resolve a model

```ts
import "@netscript/ai/anthropic"; // self-registers the 'anthropic' provider
import { getModel } from "@netscript/ai";

const handle = await getModel("anthropic:claude-sonnet-4-5");
```

### Configure an OpenAI-compatible endpoint

```ts
import "@netscript/ai/openai-compatible"; // self-registers the provider
import { getModelProvider } from "@netscript/ai";

const provider = getModelProvider("openai-compatible", {
  baseURL: "https://api.deepseek.com/v1",
  apiKey: Deno.env.get("DEEPSEEK_KEY"),
  models: ["deepseek-chat", "deepseek-reasoner"],
});
```

### Stream a reasoning turn through OpenRouter

```ts
import "@netscript/ai/openrouter"; // self-registers the provider
import { getModelProvider } from "@netscript/ai";

const provider = getModelProvider("openrouter", {
  apiKey: Deno.env.get("OPENROUTER_API_KEY"),
  models: ["anthropic/claude-sonnet-4.5"],
  reasoningEffort: "high",
});
```

### Preflight a local Ollama daemon

```ts
import "@netscript/ai/ollama"; // self-registers the provider
import { getModelProvider } from "@netscript/ai";

const provider = getModelProvider("ollama", { models: ["llama3.2"] });
const health = await provider.checkReachable();
if (!health.reachable) {
  console.warn(`Ollama is down: ${health.detail}`);
}
```

### Define, register, and dispatch a tool

```ts
import { createToolRegistry, defineAiTool } from "@netscript/ai/tools";

const add = defineAiTool("add")
  .parameters({
    type: "object",
    properties: { a: { type: "number" }, b: { type: "number" } },
    required: ["a", "b"],
  })
  .input(myAddSchema) // any StandardSchemaV1<unknown, { a: number; b: number }>
  .server(({ a, b }) => ({ sum: a + b }));

const registry = createToolRegistry([add]);
const { output } = await registry.dispatch("add", { a: 2, b: 3 });
```

### Drive a bounded, cancellable agent loop

```ts
import { createAgentLoop, slidingWindowHistory } from "@netscript/ai/agent";

const loop = createAgentLoop({
  modelProvider, // a ChatModelProviderPort
  tools, // a ToolRegistryPort
  history: slidingWindowHistory({ maxMessages: 12 }),
});

for await (const chunk of loop.run({ model: "anthropic:claude-sonnet-4-5", messages })) {
  if (chunk.type === "text") console.log(chunk.delta);
  if (chunk.type === "done") console.log(chunk.usage);
}
```

### Register MCP tools over Streamable-HTTP

```ts
import { createMcpTransport, registerMcpTools } from "@netscript/ai/mcp";
import { createToolRegistry } from "@netscript/ai/tools";

const transport = createMcpTransport({
  kind: "streamable-http",
  serverId: "search",
  url: "https://mcp.example.com",
  auth: { mode: "api-token", token: "injected-at-runtime", scheme: "Bearer" },
});

const registry = createToolRegistry();
await registerMcpTools(registry, transport);
```

---

Back to the [reference overview](/reference/).
