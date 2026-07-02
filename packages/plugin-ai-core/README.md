# @netscript/plugin-ai-core

[![JSR](https://jsr.io/badges/@netscript/plugin-ai-core)](https://jsr.io/@netscript/plugin-ai-core)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The contract-only core for the NetScript AI plugin: the oRPC `/v1/ai` route surface — an
SSE-framed `chat` stream plus `models`, `tools/:name`, `embed`, and `transcribe` — that a connector
implements and the typed client calls. Zero service implementation; the route shapes derive from the
`@netscript/ai` engine vocabulary so plugin IO can never drift from the domain contracts.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/plugin-ai-core

# Node.js / Bun
npx jsr add @netscript/plugin-ai-core
bunx jsr add @netscript/plugin-ai-core
```

### Usage

The root export gives you the two contract handles — `aiContract` (for client generation) and
`aiContractV1` (the context-bindable implementer) — plus every route IO type.

```typescript
import { aiContractV1 } from '@netscript/plugin-ai-core';
import type { AiRouter, ChatChunk } from '@netscript/plugin-ai-core';

// A connector (P2) binds the contract to its request context, then implements
// each route's handler. The `chat` handler is an async generator: the contract
// output is an event-iterator of chunks, so it MUST stream frames.
const router = aiContractV1.$context<{ requestId: string }>();

const impl: AiRouter = router.router({
  chat: router.chat.handler(async function* ({ input }): AsyncGenerator<ChatChunk> {
    for (const message of input.messages) {
      yield { type: 'text', delta: `echo: ${JSON.stringify(message.content)}` };
    }
    yield { type: 'done' };
  }),
  // models / invokeTool / embed / transcribe / describe handlers follow.
});
```

### Advanced: validating a streamed chunk on the `./contracts/v1` subpath

The full IO surface — the Zod `*Schema` validators and the engine-derived vocabulary types — lives
on the `./contracts/v1` subpath, keeping the root export budget small.

```typescript
import { ChatChunkSchema, ChatInputSchema } from '@netscript/plugin-ai-core/contracts/v1';
import type { ChatChunk } from '@netscript/plugin-ai-core/contracts/v1';

// Parse an inbound request body against the streamed-chat input contract.
const request = ChatInputSchema.parse({
  model: 'anthropic:claude-sonnet-4',
  messages: [{ role: 'user', content: 'Stream me a haiku.' }],
});

// Validate each frame a provider emits before forwarding it down the SSE stream.
const chunk: ChatChunk = ChatChunkSchema.parse({ type: 'text', delta: 'silent...' });
console.log(request.model, chunk.type);
```

---

## 📦 The `/v1/ai` route surface

Route paths are relative; the `/v1/ai` prefix is applied where the service host mounts the router.

| Route        | Method | Path            | IO                                               |
| ------------ | ------ | --------------- | ------------------------------------------------ |
| `chat`       | POST   | `/chat`         | `ChatInput` → **SSE** `eventIterator<ChatChunk>` |
| `models`     | GET    | `/models`       | `ModelsInput?` → `ModelsResponse`                |
| `invokeTool` | POST   | `/tools/{name}` | `ToolInvokeInput` → `ToolInvokeResponse`         |
| `embed`      | POST   | `/embed`        | `EmbedInput` → `EmbedResponse`                   |
| `transcribe` | POST   | `/transcribe`   | `TranscribeInput` → `TranscribeResponse`         |
| `describe`   | GET    | `/describe`     | → `AiCapabilities` (base-seam route, unchanged)  |

### SSE framing (durable-CHAT)

`chat` is the streaming centerpiece. Its output is not a request/response pair but an
**`eventIterator`** whose element type is `ChatChunk` — an alias of the `@netscript/ai` engine's
`AgentChunk` union (`text`, `tool-call`, `tool-result`, `message`, `usage`, `error`, `done` frames).
Because the contract output type is an async event-iterator, a connector's `chat` handler must yield
frames; a buffered single-response implementation does not type-check. Recoverable and terminal
errors surface in-stream as the `error` chunk rather than as an oRPC error, matching the engine's
streaming model.

### Base-contract extension

`aiContract` `extends BasePluginContract` and spreads `BASE_PLUGIN_CONTRACT_ROUTES` from
[`@netscript/plugin/contract-base`](https://jsr.io/@netscript/plugin) verbatim, so it carries the
mandatory `describe` route (GET `/describe`) that returns a marketplace-discoverable
`AiCapabilities` (= `PluginCapabilities`) document — its shape is inherited unchanged. Non-streaming
routes converge onto the shared plugin error vocabulary (`NOT_FOUND`, `VALIDATION_ERROR`,
`INTERNAL`).

### Engine-derived IO

Every route schema is a **named, explicitly-annotated** Zod schema mirroring the
`@netscript/ai/contracts` vocabulary (`Message`, `ContentPart`, `ToolCall`, `ToolResult`, `Usage`,
`ModelDescriptor`, `AgentChunk`, …). Those engine types are re-exported from the `./contracts/v1`
subpath, and compile-time drift guards assert each schema stays assignable to the engine type it
mirrors — so the plugin IO can never diverge from the domain contract.

---

## 🔌 How the stack consumes this contract

- **Connector (P2)** — imports `aiContractV1`, binds its host request context via
  `aiContractV1.$context<Ctx>()`, and implements each route handler against a provider adapter. The
  contract's precise per-route IO types check every handler.
- **`@netscript/fresh/ai` client** — imports `aiContract` and generates a typed caller, so a Fresh
  island streams `chat` chunks and calls `models` / `embed` / `transcribe` with full type inference
  and no hand-written request types.
- **Marketplace tooling** — reads the `describe` route's `AiCapabilities` document to introspect a
  running AI plugin without parsing source.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/plugin-ai-core/](https://rickylabs.github.io/netscript/reference/plugin-ai-core/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
