---
layout: layouts/base.vto
title: "@netscript/plugin-ai-core"
---

# `@netscript/plugin-ai-core`

The contract-only core for the NetScript AI plugin: the oRPC `/v1/ai` route surface — an
SSE-framed `chat` stream plus `models`, `tools/{name}`, `embed`, and `transcribe` — that a
connector implements and the typed client calls. This page is generated from the package's
public surface with `deno doc` (US-2). For the full index of packages and plugins return to the
[reference overview](/reference/).

The package ships **zero service implementation** (Archetype 1 — Small Contract). It declares the
route shapes and their Zod IO vocabulary; a connector (`@netscript/plugin-ai`) binds the contract
to a host and the `@netscript/fresh/ai` client generates a typed caller from it. Every route schema
mirrors an engine type from `@netscript/ai/contracts`, and a compile-time drift guard
(`z.ZodType<EngineType> = schema`) asserts the mirror cannot silently diverge from the domain
contract.

## Entrypoints

The package publishes two entrypoints. Each is generated from its own `deno doc` surface.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-ai-core` | `./mod.ts` | Contract handles, router helpers, and route IO types (documented below). |
| `@netscript/plugin-ai-core/contracts/v1` | `./src/contracts/v1/mod.ts` | Full contract surface: the Zod `*Schema` validators plus the engine-derived vocabulary types. |

The root path curates to the handles and IO types a typical consumer imports (staying within the
≤20-export doctrine budget); the `./contracts/v1` subpath exposes the complete schema and
engine-vocabulary set a connector wires.

## Root surface (`@netscript/plugin-ai-core`)

### Contract handles and router helpers

| Symbol | Kind | Description |
| --- | --- | --- |
| `aiContract` | variable | AI service contract definition for client generation (the real, fully-inferred oRPC contract router — no erasure cast). |
| `aiContractV1` | variable | The implemented, context-bindable v1 contract (`implement(definition)`); `.$context<Ctx>()` returns the precisely-typed router implementer. |
| `createAiRouter` | function | Bind a complete in-process AI implementation to the v1 contract, returning the oRPC handlers for each route. |
| `AiRouterContext` | type alias | Request context accepted by the generated AI router (`Record<PropertyKey, unknown>`). |
| `ContextualAiRouter` | type alias | The router implementer returned by `aiContractV1.$context<TContext>()`. |
| `AiRouteHandler` | type alias | Handler function type for a single named route under a bound context. |
| `AiRouterImplementation` | interface | Per-route handler functions that implement every route in `aiContractV1`. |
| `BoundAiRoute` | type alias | The bound handler type produced by `router.<route>.handler(...)`. |
| `BoundAiRouter` | interface | Contract-bound route handlers returned by `createAiRouter`. |

### Route IO and capability types

| Symbol | Kind | Description |
| --- | --- | --- |
| `AiContract` / `AiContractDefinition` / `AiContractV1` | type alias | The fully-typed v1 contract shape and its context-binding implementer type. |
| `AiRouter` | type alias | The context-bound AI router implementer (`ReturnType<typeof aiContractV1.$context<...>>`). |
| `AiCapabilities` | interface | The capabilities document returned by the mandatory `describe` route (a named alias of `PluginCapabilities`). |
| `ChatInput` | type alias | Input accepted by the `chat` streaming endpoint. |
| `ChatChunk` | type alias | A single streamed chat frame — alias of the engine `AgentChunk` union. |
| `ModelsResponse` | type alias | Response returned by the `models` endpoint. |
| `ToolInvokeInput` / `ToolInvokeResponse` | type alias | Input and response for the `tools/{name}` invocation endpoint. |
| `EmbedInput` / `EmbedResponse` | type alias | Input and response for the `embed` endpoint. |
| `TranscribeInput` / `TranscribeResponse` | type alias | Input and response for the `transcribe` endpoint. |

## Full contract surface (`@netscript/plugin-ai-core/contracts/v1`)

The subpath re-exports both contract handles (`aiContract`, `aiContractV1`), every route IO type
above, and the following additional symbols.

### Zod IO schemas

Each schema is a named, explicitly-annotated Zod validator (annotated `z.ZodType<EngineType>` so the
module fails to compile if it drifts from the engine contract it mirrors). A connector validates
inbound bodies and outbound frames against these.

| Symbol | Kind | Validates |
| --- | --- | --- |
| `ChatInputSchema` | variable | `chat` request body (`ChatInput`). |
| `ChatChunkSchema` | variable | A single streamed `chat` frame (`ChatChunk`). |
| `ModelsInputSchema` | variable | Optional `models` filter (`{ provider? }`). |
| `ModelsResponseSchema` | variable | `models` response (`{ models: ModelDescriptor[] }`). |
| `ToolInvokeInputSchema` | variable | `tools/{name}` request body. |
| `ToolInvokeResponseSchema` | variable | `tools/{name}` response. |
| `EmbedInputSchema` | variable | `embed` request body. |
| `EmbedResponseSchema` | variable | `embed` response. |
| `TranscribeInputSchema` | variable | `transcribe` request body. |
| `TranscribeResponseSchema` | variable | `transcribe` response. |

### Engine-derived vocabulary types

The subpath re-exports the `@netscript/ai/contracts` streaming vocabulary verbatim, so a connector
references the same domain types the schemas mirror without reaching into the engine package:
`AgentChunk`, `AudioContentPart`, `CompletionTokensDetails`, `ContentModality`, `ContentPart`,
`ContentSource`, `DataContentSource`, `DocumentContentPart`, `DoneChunk`, `ErrorChunk`,
`ImageContentPart`, `Message`, `MessageChunk`, `MessageContent`, `MessageRole`,
`ModelCapabilities`, `ModelDescriptor`, `ModelId`, `ModelRef`, `ModelSelector`, `ModelsInput`,
`PromptTokensDetails`, `ProviderUsageDetails`, `TextChunk`, `TextContentPart`, `ToolCall`,
`ToolCallChunk`, `ToolCallState`, `ToolDescriptor`, `ToolResult`, `ToolResultChunk`,
`ToolResultState`, `UrlContentSource`, `Usage`, `UsageChunk`, `UsageCostBreakdown`,
`VideoContentPart`, plus the `AiContractDefinitionShape` structural type.

## The `/v1/ai` route surface

Route paths are relative; the `/v1/ai` prefix is applied where the service host mounts the router.
The contract layers five plugin-specific routes onto the base seam `describe` route.

| Route | Method | Path | Input | Output |
| --- | --- | --- | --- | --- |
| `chat` | POST | `/chat` | `ChatInput` | **SSE** `eventIterator<ChatChunk>` |
| `models` | GET | `/models` | `ModelsInput?` | `ModelsResponse` |
| `invokeTool` | POST | `/tools/{name}` | `ToolInvokeInput` | `ToolInvokeResponse` |
| `embed` | POST | `/embed` | `EmbedInput` | `EmbedResponse` |
| `transcribe` | POST | `/transcribe` | `TranscribeInput` | `TranscribeResponse` |
| `describe` | GET | `/describe` | — | `AiCapabilities` |

### `chat` input

`ChatInput` carries the request the connector forwards to its provider adapter.

| Field | Type | Notes |
| --- | --- | --- |
| `model` | `ModelRef` | A `"provider:model"` string or a `{ provider, model }` selector. |
| `messages` | `readonly Message[]` | The conversation transcript. |
| `tools` | `readonly ToolDescriptor[]` (optional) | Tool descriptors offered to the model. |
| `system` | `string` (optional) | System prompt. |
| `temperature` | `number` (optional) | Constrained `0`–`2` by the schema. |
| `maxTokens` | `number` (optional) | Positive integer. |
| `metadata` | `Record<string, unknown>` (optional) | Opaque per-request metadata. |

## SSE chat contract (durable-CHAT)

`chat` is the streaming centerpiece. Its output is not a request/response pair but an oRPC
**`eventIterator`** whose element type is `ChatChunk` — an alias of the engine `AgentChunk` union.
Because the contract output type is an async event-iterator, a connector's `chat` handler must be an
async generator that yields frames; a buffered single-response implementation does not type-check.
Recoverable and terminal errors surface **in-stream** as the `error` chunk rather than as an oRPC
error, matching the engine's streaming model — so the `chat` route (built with `oc.route`, not the
base contract) carries an empty error map.

### Event (chunk) shapes

Each streamed frame is one of seven discriminated shapes, keyed on `type`:

| `type` | Payload | Meaning |
| --- | --- | --- |
| `text` | `{ delta: string }` | Incremental assistant text appended this tick. |
| `tool-call` | `{ toolCall: ToolCall }` | A tool invocation requested by the model. |
| `tool-result` | `{ result: ToolResult }` | The result of an executed tool, fed back into the loop. |
| `message` | `{ message: Message }` | A fully-assembled message committed to the transcript. |
| `usage` | `{ usage: Usage }` | Token usage for the step or run. |
| `error` | `{ error: string, cause?: unknown }` | A recoverable or terminal error surfaced through the stream. |
| `done` | `{ usage?: Usage }` | Terminal frame closing the run, optionally carrying final usage. |

> **The contract declares frame shapes, not wire headers.** `@netscript/plugin-ai-core` is a
> transport-agnostic oRPC contract: the `text/event-stream` wire framing (per-frame `data:` lines,
> the response content type) is produced by the oRPC handler at the host mount point when it serves
> an `eventIterator` output, not declared in this package. This page documents the event *shapes*
> the stream carries; the HTTP framing belongs to the connector's service host.

## Base-contract extension

`aiContract` spreads `BASE_PLUGIN_CONTRACT_ROUTES` from
[`@netscript/plugin/contract-base`](https://jsr.io/@netscript/plugin) verbatim, so it inherits the
mandatory `describe` route (GET `/describe`) unchanged. `describe` returns a
marketplace-discoverable `AiCapabilities` document — a named alias of `PluginCapabilities`:

| Field | Type | Description |
| --- | --- | --- |
| `pluginName` | `string` | Canonical plugin package name, e.g. `@netscript/plugin-ai`. |
| `contractVersions` | `readonly string[]` | Contract version identifiers served by the plugin. |
| `routeGroups` | `readonly string[]` | Route group names exposed by the plugin. |
| `capabilities` | `readonly string[]` | Capability tags advertised by the plugin. |

The non-streaming routes (`models`, `invokeTool`, `embed`, `transcribe`, `describe`) converge onto
the shared plugin error vocabulary from `BASE_PLUGIN_ERRORS`:

| Code | HTTP status | Default message |
| --- | --- | --- |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Validation failed |
| `INTERNAL` | 500 | Internal server error |

## Binding the contract (`aiContractV1` / `AiRouter`)

A connector binds its host request context and implements each route handler. The precise per-route
IO types check every handler; there is no erasure cast on the contract or the implementer.

```typescript
import { aiContractV1 } from '@netscript/plugin-ai-core';
import type { AiRouter, ChatChunk } from '@netscript/plugin-ai-core';

// Bind the host request context, then implement each route.
const router = aiContractV1.$context<{ requestId: string }>();

const impl: AiRouter = router.router({
  // The `chat` output is an event-iterator, so the handler MUST stream frames.
  chat: router.chat.handler(async function* ({ input }): AsyncGenerator<ChatChunk> {
    for (const message of input.messages) {
      yield { type: 'text', delta: `echo: ${JSON.stringify(message.content)}` };
    }
    yield { type: 'done' };
  }),
  // models / invokeTool / embed / transcribe / describe handlers follow.
});
```

`createAiRouter` is a convenience over `aiContractV1.$context()` that binds a complete per-route
implementation in one call and returns the bound handlers (`BoundAiRouter`):

```typescript
import { createAiRouter } from '@netscript/plugin-ai-core';

const router = createAiRouter({
  describe: () => ({
    pluginName: '@netscript/plugin-ai',
    contractVersions: ['v1'],
    routeGroups: ['ai'],
    capabilities: ['chat'],
  }),
  async *chat() {
    yield { type: 'done' as const };
  },
  models: () => ({ models: [] }),
  invokeTool: () => ({ content: 'No tools registered.', state: 'error' as const }),
  embed: () => ({ embeddings: [] }),
  transcribe: () => ({ text: '' }),
});
```

## Validating IO on the `./contracts/v1` subpath

The Zod validators let a connector parse an inbound request body against the contract and validate
each frame before forwarding it down the stream:

```typescript
import { ChatChunkSchema, ChatInputSchema } from '@netscript/plugin-ai-core/contracts/v1';

// Parse an inbound request body against the streamed-chat input contract.
const request = ChatInputSchema.parse({
  model: 'anthropic:claude-sonnet-4-5',
  messages: [{ role: 'user', content: 'Stream me a haiku.' }],
});

// Validate each frame a provider emits before forwarding it down the SSE stream.
const chunk = ChatChunkSchema.parse({ type: 'text', delta: 'silent...' });
console.log(request.model, chunk.type);
```

## How the AI plugin stack consumes this contract

- **Connector (`@netscript/plugin-ai`)** — re-exports this contract surface from its own
  `./contracts/v1` (`export * from '@netscript/plugin-ai-core/contracts/v1'`) and declares the
  loader on its manifest (`withContractVersions`), so a host binds the AI plugin against a single
  pinned `/v1/ai` contract. It binds `aiContractV1.$context<Ctx>()` and implements each route against
  a provider adapter.
- **`@netscript/fresh/ai` client** — imports `aiContract` and generates a typed caller, so a Fresh
  island streams `chat` chunks and calls `models` / `embed` / `transcribe` with full type inference
  and no hand-written request types.
- **Marketplace tooling** — reads the `describe` route's `AiCapabilities` document to introspect a
  running AI plugin without parsing source.

---

Back to the [reference overview](/reference/).
