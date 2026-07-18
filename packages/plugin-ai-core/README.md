# @netscript/plugin-ai-core

[![JSR](https://jsr.io/badges/@netscript/plugin-ai-core)](https://jsr.io/@netscript/plugin-ai-core)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**The contract-only core for the NetScript AI plugin: typed API routes for streaming chat, models,
tools, embeddings, and transcription, derived from the AI engine vocabulary.**

An AI API contract has one job: keep the service that implements it and the clients that call it
from ever disagreeing — especially about streaming. This package is that contract and nothing else.
The `/v1/ai` surface defines an SSE-framed `chat` stream plus `models`, `tools/{name}`, `embed`, and
`transcribe`; every route's IO is a named Zod schema mirroring the
[`@netscript/ai`](https://jsr.io/@netscript/ai) engine vocabulary, with compile-time drift guards
asserting each schema stays assignable to the engine type it mirrors. It ships no service
implementation: a connector implements the routes, and typed clients call them.

## Why teams use it

- **Streaming enforced by types** — the `chat` route's output is an event-iterator of `ChatChunk`
  frames (`text`, `tool-call`, `tool-result`, `message`, `usage`, `error`, `done`); a buffered
  single-response implementation does not type-check, so every implementation streams.
- **Errors stay in-stream** — recoverable and terminal chat errors surface as the `error` chunk
  rather than as a transport error, matching the engine's streaming model; non-streaming routes
  converge onto the shared plugin error vocabulary (`NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL`).
- **Engine-derived IO that cannot drift** — route schemas re-export and mirror the engine types
  (`Message`, `ContentPart`, `ToolCall`, `ToolResult`, `Usage`, `ModelDescriptor`, `AgentChunk`),
  and compile-time guards fail the build if a schema diverges.
- **Discoverable by design** — the contract extends the base plugin contract from
  [`@netscript/plugin`](https://jsr.io/@netscript/plugin), carrying the mandatory `describe` route
  that returns an `AiCapabilities` document tooling can introspect without parsing source.
- **Small root, full depth on a subpath** — the root export carries the two contract handles and
  route IO types; the full Zod validator surface lives on `./contracts/v1`.

## The `/v1/ai` route surface

Route paths are relative; the `/v1/ai` prefix is applied where the service host mounts the router.

| Route        | Method | Path            | IO                                               |
| ------------ | ------ | --------------- | ------------------------------------------------ |
| `chat`       | POST   | `/chat`         | `ChatInput` → **SSE** `eventIterator<ChatChunk>` |
| `models`     | GET    | `/models`       | `ModelsInput?` → `ModelsResponse`                |
| `invokeTool` | POST   | `/tools/{name}` | `ToolInvokeInput` → `ToolInvokeResponse`         |
| `embed`      | POST   | `/embed`        | `EmbedInput` → `EmbedResponse`                   |
| `transcribe` | POST   | `/transcribe`   | `TranscribeInput` → `TranscribeResponse`         |
| `describe`   | GET    | `/describe`     | → `AiCapabilities` (inherited base route)        |

## Install

```bash
deno add jsr:@netscript/plugin-ai-core
```

For version pins in configuration, use the `@<version>` placeholder pinned to your installed CLI;
bare `jsr:@netscript/*` specifiers do not resolve on the pre-release line.

## Quick example

The root export gives you the contract handles (`aiContract` for client generation, `aiContractV1`
for context binding), every route IO type, and `createAiRouter` — the one-call way to bind a
complete implementation. The `chat` handler is an async generator: the contract output is an
event-iterator of chunks, so it must stream frames:

```typescript
import { createAiRouter } from '@netscript/plugin-ai-core';

const router = createAiRouter({
  describe: () => ({
    pluginName: '@netscript/plugin-ai',
    contractVersions: ['v1'],
    routeGroups: ['ai'],
    capabilities: ['chat'],
  }),
  async *chat({ input }) {
    for (const message of input.messages) {
      yield { type: 'text', delta: `echo: ${JSON.stringify(message.content)}` };
    }
    yield { type: 'done' };
  },
  models: () => ({ models: [] }),
  invokeTool: () => ({ content: 'No tools registered.', state: 'error' }),
  embed: () => ({ embeddings: [] }),
  transcribe: () => ({ text: '' }),
});

console.log(Object.keys(router)); // the six bound route handlers
```

Validate route IO with the Zod schemas on the `./contracts/v1` subpath:

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

## Public surface

| Entry            | What it gives you                                                         |
| ---------------- | ------------------------------------------------------------------------- |
| `.`              | `aiContract`, `aiContractV1`, `createAiRouter`, and every route IO type   |
| `./contracts/v1` | The full Zod `*Schema` validators and the engine-derived vocabulary types |

How the stack consumes it: a service connector binds `aiContractV1` to its request context and
implements each handler against a provider adapter; the NetScript frontend client generates a typed
caller from `aiContract`, so islands stream `chat` chunks with full inference; and tooling reads
`describe` to introspect a running AI plugin. The always-current symbol list is
[`deno doc jsr:@netscript/plugin-ai-core@<version>`](https://jsr.io/@netscript/plugin-ai-core/doc)
(pin `<version>` on the pre-release line, as above).

## Docs

- **AI core reference — routes, schemas, and vocabulary**:
  [rickylabs.github.io/netscript/reference/plugin-ai-core/](https://rickylabs.github.io/netscript/reference/plugin-ai-core/)
- **AI engine reference — providers, tools, agents, MCP client**:
  [rickylabs.github.io/netscript/reference/ai/](https://rickylabs.github.io/netscript/reference/ai/)
- **API docs on JSR**:
  [jsr.io/@netscript/plugin-ai-core/doc](https://jsr.io/@netscript/plugin-ai-core/doc)

## Compatibility

Contracts, schemas, and types are plain TypeScript — importable in any TypeScript environment,
including Node.js and Bun via JSR's npm compatibility. This package carries no runtime AI logic, no
telemetry, and no MCP server surface; those live in the engine and the deployable plugin.

## License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to
JSR with cryptographically verified provenance.
