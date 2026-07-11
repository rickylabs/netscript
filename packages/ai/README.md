# @netscript/ai

Zero-dependency AI engine core for NetScript — domain contracts, capability ports, a model registry,
a bounded agent loop, a Standard-Schema tool system, an MCP client transport pool, and a composition
root. The base entrypoint ships **no** concrete provider and takes **no** `@netscript/*` runtime
dependency; providers and the MCP stack live on their own subpaths and enter the module graph only
when imported.

## Install

```bash
# Deno (recommended)
deno add jsr:@netscript/ai

# Node.js / Bun
npx jsr add @netscript/ai
bunx jsr add @netscript/ai
```

```ts
import { createAiRuntime, getModel, registerModelProvider } from '@netscript/ai';
```

## Quick start

Compose a runtime. Every capability defaults to a no-op or throwing port, so an unconfigured runtime
is safe to hold and inspect:

```ts
import { createAiRuntime } from '@netscript/ai';

const ai = createAiRuntime();

// Telemetry defaults to a no-op port — calling it does nothing, safely.
ai.telemetry.recordEvent('agent.start');

// Capabilities that need a real adapter reject/throw until injected.
// await ai.embeddings.embed({ model: 'x', input: 'hi' }); // AiNotConfiguredError
```

Inject real ports via the config — for example a fake telemetry port in tests, or the real
`@netscript/telemetry`-backed adapter in an app:

```ts
import { createAiRuntime } from '@netscript/ai';
import { createFakeTelemetryPort } from '@netscript/ai/testing';

const telemetry = createFakeTelemetryPort();
const ai = createAiRuntime({ telemetry, defaultModelProvider: 'anthropic' });
ai.telemetry.recordEvent('agent.finish', { ok: true });
```

## Agent Skills

`@netscript/ai/skills` validates a small `SKILL.md` standard and keeps discovery separate from full
instruction loading. `list()` and both match operations use metadata only; `load(id)` is the only
operation that requests the full Markdown body from the injected source.

```ts
import { createInMemorySkillContentSource, createSkillLoader } from '@netscript/ai/skills';

const source = createInMemorySkillContentSource([{ id: 'review', markdown: `---
id: review
name: Code review
tags: [review, quality]
description: Reviews a change for correctness.
---
Inspect the diff and report actionable findings.
` }]);

const skills = createSkillLoader(source);
const summaries = await skills.list();
const matches = await skills.matchByQuery('review this change');
const document = await skills.load(matches[0]!.skill.id);
```

Semantic matching is opt-in through an injected `EmbeddingProviderPort`. With semantic matching
disabled—or with no provider supplied—the loader performs no embedding call and uses tag matching
only. The shipped in-memory source uses caller-provided strings and requires no filesystem,
network, git, or environment permission.

## Model registry (self-registration)

Provider packages register themselves as an import side effect, exactly like `@netscript/kv/redis`
self-registers its adapter. Nothing in this core imports a provider, so no provider SDK enters the
module graph until an app opts in.

```ts
import { getModel, registerModelProvider } from '@netscript/ai';

// A provider package does this on import:
registerModelProvider('demo', () => ({
  id: 'demo',
  listModels: () => Promise.resolve([]),
  getModel: (id) => Promise.resolve({ providerId: 'demo', descriptor: { id, provider: 'demo' } }),
  supports: () => true,
}));

const handle = await getModel('demo:some-model');
```

## Providers

First-party providers ship as **self-registering subpaths**. Each chat provider wraps a TanStack AI
client and implements the `ModelProviderPort`. Importing a subpath runs a one-time side effect that
registers its factory into the shared registry — no explicit wiring — then re-exports the provider
class and its id/config for direct construction.

### `@netscript/ai/anthropic`

Wraps [`@tanstack/ai-anthropic`](https://www.npmjs.com/package/@tanstack/ai-anthropic). The model
catalog is taken verbatim from the wrapped package's `ANTHROPIC_MODELS`, so it stays in lockstep
with upstream.

```ts
import '@netscript/ai/anthropic'; // side effect: registers 'anthropic'
import { getModel, getModelProvider } from '@netscript/ai';

// Resolve a model handle through the registry.
const handle = await getModel('anthropic:claude-sonnet-4-5');

// Or construct a configured provider (apiKey falls back to ANTHROPIC_API_KEY).
const provider = getModelProvider('anthropic', { apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
const client = provider.createChatClient('claude-sonnet-4-5');
```

### `@netscript/ai/openai-compatible`

Wraps [`@tanstack/ai-openai`](https://www.npmjs.com/package/@tanstack/ai-openai)'s OpenAI-compatible
client, so any endpoint that speaks the OpenAI Chat Completions or Responses API (DeepSeek,
Together, vLLM, a local gateway, …) works by pointing `baseURL` at it. With no `models` configured
the provider is _optimistic_ — the remote endpoint is the authority on its own catalog.

```ts
import '@netscript/ai/openai-compatible'; // side effect: registers 'openai-compatible'
import { getModelProvider } from '@netscript/ai';

const provider = getModelProvider('openai-compatible', {
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: Deno.env.get('DEEPSEEK_KEY'),
  models: ['deepseek-chat', 'deepseek-reasoner'], // optional
  api: 'chat-completions', // or 'responses'
});
const client = provider.createChatClient('deepseek-chat');
```

### `@netscript/ai/openrouter` and `@netscript/ai/ollama`

- `@netscript/ai/openrouter` — self-registering `OpenRouterModelProvider` for the OpenRouter
  gateway, plus `openRouterReasoningModelOptions` for reasoning-model configuration.
- `@netscript/ai/ollama` — self-registering `OllamaModelProvider` for local models, with an
  injectable `ReachabilityPort` (`createHttpReachabilityPort` / `createAssumeReachablePort`) so
  hosts can probe or skip endpoint availability checks.

### `@netscript/ai/openai-embeddings`

`OpenAiEmbeddingsProvider` implements the `EmbeddingProviderPort` against OpenAI-compatible
embeddings endpoints and self-registers into the embeddings registry (`registerEmbeddingProvider` /
`getEmbeddingProvider`).

### Dedicated OpenAI-compatible vision adapter

`OpenAiVisionProvider` implements the dedicated `VisionProviderPort` through an OpenAI-compatible
Chat Completions endpoint. Importing `@netscript/ai/openai-compatible` self-registers the provider
family for both model and vision registries; the adapter accepts remote URLs and inline base64
sources, and reports provider token usage when available.

```ts
import '@netscript/ai/openai-compatible';
import { getVisionProvider } from '@netscript/ai';

const vision = getVisionProvider('openai-compatible', {
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});
const result = await vision.analyze(
  { type: 'url', value: 'https://example.com/diagram.png' },
  'Describe this diagram.',
);
```

The adapter performs network access and callers that read the key from the environment also need the
corresponding Deno environment permission.

### Stopping long-lived streams

`createChatClient(modelId)` returns an owned `ChatClientPort` — **not** a raw TanStack adapter, so
no provider-SDK type escapes the public surface. Its `stream(request, { signal })` method yields an
owned `ChatClientEvent` union (`text` | `tool-call` | `finish` | `error`, where `finish` carries the
real provider `Usage`). In-flight turns are cancelled by passing an `AbortSignal` — the port
forwards it to the underlying TanStack `AbortController`:

```ts
const client = provider.createChatClient('claude-sonnet-4-5');
const abort = new AbortController();
setTimeout(() => abort.abort(), 5_000);

for await (const event of client.stream({ messages }, { signal: abort.signal })) {
  if (event.type === 'text') console.log(event.delta);
  if (event.type === 'finish') console.log(event.usage);
}
```

Credentials and endpoints can be selected for one turn on that same call-level options surface.
Non-empty request values override provider construction defaults; later turns fall back to the
provider configuration again. Ollama uses `host` while hosted providers use `baseURL`:

```ts
await Array.fromAsync(client.stream(
  { messages },
  {
    connection: {
      apiKey: tenant.apiKey,
      baseURL: tenant.baseURL,
    },
  },
));
```

Connection values are used only to construct the request transport. Configuration errors identify
missing field names but never include key or endpoint values.

### Bundle-isolation guarantee

The base `@netscript/ai` entrypoint **never** imports a provider subpath, and the subpaths never
import each other. The heavy provider SDKs are scoped to their own subpath's module graph, so:

- `import '@netscript/ai'` pulls **zero** TanStack/provider dependencies.
- `import '@netscript/ai/anthropic'` pulls **only** `@tanstack/ai-anthropic`.
- `import '@netscript/ai/openai-compatible'` pulls **only** `@tanstack/ai-openai`.

This is enforced by `tests/provider_isolation_test.ts`, which imports a single subpath in a fresh
subprocess and asserts the registry contains **exactly** that one provider.

## System-prompt assembly

`composeSystemPrompt` orders opaque, app-owned sections by ascending numeric `precedence`; ties
retain contribution order. It drops whitespace-only content, trims retained blocks, and joins them
with exactly one blank line (`\n\n`). Duplicate section names throw
`DuplicatePromptSectionError`, including when one duplicate is blank.

```ts
import { composeSystemPrompt } from '@netscript/ai';

const system = composeSystemPrompt([
  { name: 'skills', precedence: 10, content: skillsSystemBlock },
  { name: 'memory', precedence: 20, content: recalledMemory },
  { name: 'catalog', precedence: 30, content: componentCatalog },
  { name: 'app', precedence: 40, content: appInstructions },
]);

for await (const chunk of loop.run({ model, messages, system })) {
  // consume chunks
}
```

The framework owns only ordering and composition. Section names, precedence values, and content
remain application or feature-slice policy. `new PromptAssembler(sections).compose()` provides the
same contract as an immutable object seam.

## Agent loop (`@netscript/ai/agent`)

`createAgentLoop` drives a bounded, cancellable multi-turn conversation. It is programmed purely
against the injected `ChatModelProviderPort` and `ToolRegistryPort` seams — importing this subpath
pulls **no** provider SDK, so you choose a provider by importing e.g. `@netscript/ai/anthropic`
separately.

```ts
import { createAgentLoop, slidingWindowHistory } from '@netscript/ai/agent';

const loop = createAgentLoop({
  modelProvider, // a ChatModelProviderPort
  tools, // a ToolRegistryPort
  history: slidingWindowHistory({ maxMessages: 12 }),
});

const abort = new AbortController();
for await (
  const chunk of loop.run(
    { model: 'anthropic:claude-sonnet-4-5', messages },
    { signal: abort.signal, maxSteps: 8 },
  )
) {
  switch (chunk.type) {
    case 'text':
      Deno.stdout.writeSync(new TextEncoder().encode(chunk.delta));
      break;
    case 'tool-result':
      console.log('tool ->', chunk.result.content);
      break;
    case 'done':
      console.log('usage', chunk.usage); // real, summed provider usage
      break;
  }
}

loop.stop(); // or abort.signal — either unwinds to the `aborted` terminal state
```

The loop is a **typestate machine**:
`idle → running → awaiting-tool → running →
done | aborted | errored`. `loop.state` exposes the
current state.

- **Bounded.** `maxSteps` (default 8) caps model turns; exceeding it emits an `error` chunk carrying
  `AgentMaxStepsExceededError` and settles in `errored`.
- **Cancellable.** `options.signal` and `loop.stop()` are combined via `AbortSignal.any`; on abort
  the loop stops streaming, emits a terminal `done` chunk, and settles in `aborted` — the generator
  always returns, nothing leaks.
- **Bounded context.** Each turn's history passes through the injected `HistoryStrategy` (default
  `slidingWindowHistory`, window 20), preserving leading system messages while trimming to the most
  recent turns.
- **Real usage.** Per-turn provider `Usage` is summed — there is no `chars/4` estimation anywhere;
  the terminal `done` chunk carries the aggregate.
- **Owned tools.** Tool calls surfaced by the model are executed through the injected
  `ToolRegistryPort`; a missing handler yields an `error`-state `ToolResult` rather than throwing,
  and the loop resumes with the result appended.

### Agent telemetry (injected `TelemetryPort`)

The loop takes an optional `telemetry: TelemetryPort` dependency (default: no-op). When a real port
is injected — e.g. the `@netscript/telemetry`-backed adapter — each run opens a per-run
`gen_ai.chat` span, each model turn opens a per-turn `gen_ai.chat.turn` span, tool calls are
recorded as `gen_ai.tool.call` events, and provider-reported usage lands on the spans. Attribute
names follow the #402 telemetry convention (upstream `gen_ai.*` semconv keys; NetScript-owned keys
under `netscript.*`). The core never imports `@netscript/telemetry` — the port is the seam.

## Tool system (`@netscript/ai/tools`)

Define server-executable tools, validate their input with **Standard Schema**, and register/dispatch
them through an in-memory registry that satisfies the `ToolRegistryPort` seam. The core wraps
`StandardSchemaV1` — bring any conforming schema (zod, valibot, arktype, or a hand-written one) —
and adds no schema DSL.

```ts
import { createToolRegistry, defineAiTool } from '@netscript/ai/tools';

const add = defineAiTool('add')
  .describe('Add two numbers')
  .parameters({
    type: 'object',
    properties: { a: { type: 'number' }, b: { type: 'number' } },
    required: ['a', 'b'],
  })
  .input(myAddSchema) // any StandardSchemaV1<unknown, { a: number; b: number }>
  .server(({ a, b }) => ({ sum: a + b }));

const registry = createToolRegistry([add]);

// Dispatch validates input against the Standard Schema BEFORE the handler runs.
const { output } = await registry.dispatch('add', { a: 2, b: 3 }); // { sum: 5 }
await registry.dispatch('add', { a: 'x' }); // throws ToolInputValidationError
await registry.dispatch('missing', {}); // throws ToolNotFoundError
```

- `defineAiTool(name)` — fluent builder. `.input(schema)` is required before a terminal;
  `.server(handler)` returns a server-executable definition, `.client()` a client-deferred one (no
  server handler).
- `createToolRegistry(defs?)` — in-memory `AiToolRegistry` (a widened `ToolRegistryPort`):
  `register` / `has` / `get` / `list` / `resolveHandler` plus `define`, `getDefinition`,
  `listDefinitions`, and validated `dispatch`. A definition is bridged to the port `ToolHandler`, so
  the agent loop drives tools through the existing seam. Alternate registries substitute at the same
  seam — the MCP registration below is one.

### `render_ui` wire contract

`renderUiTool` is the built-in generative-UI tool **descriptor** — input schema + metadata only,
**no renderer**. Its validated input type is `RenderUiToolInput`, the wire contract consumed by the
`@netscript/fresh-ui` generative-UI renderer (`@netscript/fresh-ui/ai/render-ui`). Dispatching it
validates the request and defers rendering downstream (`result.deferred === true`); the core ships
no renderer and no fresh-ui dependency.

```ts
import { createToolRegistry, renderUiTool } from '@netscript/ai/tools';

const registry = createToolRegistry([renderUiTool]);
const result = await registry.dispatch('render_ui', {
  component: 'Chart',
  props: { data: [1, 2, 3] },
});
// result.deferred === true; result.input is the validated { component, props } envelope.
```

## MCP client stack (`@netscript/ai/mcp`)

The `./mcp` subpath is NetScript's **client-side** MCP surface: transport adapters, a multi-server
**MCP client transport pool**, and tool-registry registration. It wraps the TanStack streamable-HTTP
MCP connector (`@tanstack/ai-mcp`) behind owned transport ports, and enters the module graph only
when imported.

```ts
import { createMcpTransportPool, registerMcpTools } from '@netscript/ai/mcp';
import { createToolRegistry } from '@netscript/ai/tools';

const pool = createMcpTransportPool({
  servers: [{
    kind: 'streamable-http',
    serverId: 'search',
    url: 'https://mcp.example.com',
    auth: { mode: 'api-token', token: 'injected-at-runtime', scheme: 'Bearer' },
  }],
});

const registry = createToolRegistry();
await registerMcpTools(registry, pool);
```

- **Transports**: `StreamableHttpMcpTransport` (reconnectable, backoff-configurable via
  `McpBackoffConfig`, injected auth modes) and `StdioMcpTransport`; `createMcpTransport` picks by
  config kind.
- **Pooling**: `createMcpTransportPool` / `McpTransportPool` manage connection lifecycle across
  multiple MCP servers and dispatch pooled tool calls (`McpPooledToolResult`).
- **Tool bridging**: `registerMcpTools` registers each remote MCP tool into a `ToolRegistryPort`, so
  the agent loop calls MCP tools through the same seam as local ones.
- **UI resources**: pooled tool results surface embedded `ui://` resources as `uiResources`
  (`McpUiResource`, extracted via `extractMcpUiResources`) — the payload the fresh-ui `McpUiWidget`
  island renders.

## Public surface

| Verb / symbol                                             | Purpose                                              |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `createAiRuntime(config)`                                 | Compose a runtime from injected ports.               |
| `getAiRuntime()` / `resetAiRuntime()`                     | `getKv()`-shaped process singleton + reset.          |
| `registerModelProvider` / `getModelProvider` / `getModel` | Model registry: self-register + resolve.             |
| `defineAiTool` / `createToolRegistry` / `renderUiTool`    | Tool system: define, register, dispatch (`./tools`). |
| `createAgentLoop` / `slidingWindowHistory`                | Bounded, cancellable agent loop (`./agent`).         |
| `composeSystemPrompt` / `PromptAssembler`                 | Ordered, named system-prompt composition.            |
| `createMcpTransportPool` / `registerMcpTools`             | MCP client transport pool + tool bridging (`./mcp`). |

### Subpath exports

- `@netscript/ai` — composition root + model registry.
- `@netscript/ai/contracts` — domain types (`Message`, `ToolDescriptor`, `Usage`,
  `RenderUiToolDescriptor`, `UiResource`, …) and the typed error hierarchy.
- `@netscript/ai/ports` — capability seams (including `TelemetryPort`, `AgentMemoryPort`,
  `McpTransportPort`) and their no-op/throwing defaults.
- `@netscript/ai/tools` — the tool system: `defineAiTool`, `createToolRegistry`, and the
  `renderUiTool` wire contract (`RenderUiToolInput`, validated via Standard Schema).
- `@netscript/ai/agent` — the bounded, cancellable agent loop: `createAgentLoop`, the
  `slidingWindowHistory` strategy, the typestate/terminal vocabulary, and the
  `ChatModelProviderPort` / `ToolRegistryPort` seams it is injected with.
- `@netscript/ai/mcp` — MCP client transports, the transport pool, `ui://` resource extraction, and
  tool-registry registration.
- `@netscript/ai/testing` — deterministic fake ports (including `createFakeTelemetryPort`) for
  downstream unit tests.
- `@netscript/ai/anthropic` — self-registering Anthropic provider (wraps `@tanstack/ai-anthropic`);
  pulls the SDK only when imported.
- `@netscript/ai/openai-compatible` — self-registering OpenAI-compatible provider (wraps
  `@tanstack/ai-openai`); pulls the SDK only when imported.
- `@netscript/ai/openrouter` — self-registering OpenRouter provider.
- `@netscript/ai/ollama` — self-registering Ollama provider with an injectable reachability port.
- `@netscript/ai/openai-embeddings` — self-registering OpenAI-compatible embeddings provider.

## See also

- `@netscript/kv` — the adapter self-registration + singleton pattern this package's model registry
  mirrors.
- `@netscript/telemetry` — the real telemetry adapter injected as a `TelemetryPort`; never imported
  by this core.
- `@netscript/fresh-ui` — consumes `RenderUiToolInput` in its safe generative-UI renderer and
  renders MCP `ui://` resources via the `McpUiWidget` island.
