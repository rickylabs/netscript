# @netscript/ai — Architecture

- **Archetype: 2 (Core / engine).** A zero-dependency vocabulary + seam package. It defines
  contracts, capability ports, a registry, and a composition root; it contains no concrete provider
  or behavior.

## Layers

- `src/contracts/` — pure domain types (`domain/` role): messages, content parts, tools, usage,
  agent-loop chunks, model identity, the `render_ui` type seam, and the typed error hierarchy. No
  IO. Exposed as `@netscript/ai/contracts`.
- `src/ports/` — the capability seams (consumed contracts) plus one default factory each. Also hosts
  the model registry (self-registration table). Exposed as `@netscript/ai/ports`.
- `src/runtime/` — the composition root: `createAiRuntime` (factory injection, A10) and the
  `getAiRuntime` process singleton. Exposed as `@netscript/ai` (`.`).
- `src/agent/` — the E3 agent loop implementation: the typestate machine (`state.ts`), the pluggable
  history strategy (`history.ts`), the loop error vocabulary (`errors.ts`), and `createAgentLoop`
  itself (`loop.ts`). Exposed as `@netscript/ai/agent`. Imports **no** provider SDK — it is
  programmed purely against the injected `ChatModelProviderPort` and `ToolRegistryPort` seams (A10).
- `src/adapters/` — the concrete E2 provider adapters (`@netscript/ai/anthropic`,
  `@netscript/ai/openai-compatible`) and the single TanStack bridge (`tanstack-chat-client.ts`).
  These are the **only** files that import `@tanstack/ai*`; every other graph in the package stays
  provider-SDK-free so the base entrypoint and `@netscript/ai/agent` remain bundle-isolated.
- `src/testing/` — public fakes for downstream unit tests. Exposed as `@netscript/ai/testing`.

## Port set and defaults

| Port                    | Default             | Rationale                                        |
| ----------------------- | ------------------- | ------------------------------------------------ |
| `TelemetryPort`         | no-op               | Only telemetry seam; real adapter is E9.         |
| `ToolRegistryPort`      | no-op (null-object) | Empty registry until E5/app supplies one.        |
| `SkillLoaderPort`       | no-op               | Returns no skills until a loader is wired.       |
| `AgentMemoryPort`       | no-op               | Append/load no-op; optional `recall` seam = E10. |
| `EmbeddingProviderPort` | throwing            | Embeddings need an explicit adapter (E6).        |
| `VisionProviderPort`    | throwing            | Vision needs an explicit adapter (E7).           |
| `McpTransportPort`      | throwing            | MCP transport needs an explicit adapter (E8).    |
| `AgentLoopPort`         | throwing            | The loop is E3; iterating the default rejects.   |
| `ModelProviderPort`     | registry-resolved   | Providers self-register (E2); unknown id throws. |

## Seam decisions

- **Provider self-registration (E2):** provider packages call `registerModelProvider(id, factory)`
  as an import side effect — the exact `@netscript/kv/redis` pattern.
  `getModel('<provider>:<model>')` parses the ref, resolves the provider from the module-level
  registry, and returns a `ModelHandle`. No provider SDK enters the graph until an app imports one.
- **Agent loop (E3):** implements `AgentLoopPort.run()` returning an `AsyncIterable<AgentChunk>`. A
  real `UsageChunk` is in the union from day one (Q1). E3 is injected into `createAiRuntime` — the
  core ships only the throwing default.
- **Relevance recall (E10):** `AgentMemoryPort.recall?` is an optional method, intentionally absent
  from the default. Callers guard on its presence and fall back to `load()`.
- **Owned chat client (D3):** the loop needs a streaming turn primitive, but no `@tanstack/ai` type
  may appear in a public signature (anti-corruption). The `ChatClientPort` seam
  (`src/ports/chat-client.ts`) owns that vocabulary: a `stream(request, { signal? })` method
  yielding an owned `ChatClientEvent` union (`text` | `tool-call` | `finish` | `error`), where
  `finish` carries the provider's **real** `Usage`.
  `ChatModelProviderPort.createChatClient(modelId)` mints one. The two E2 adapters build their
  TanStack text adapter internally and return it wrapped by `toTanstackChatClient(...)`, so the
  provider SDK type never escapes. Model ids cross the boundary as owned `ModelId` strings, narrowed
  to the TanStack catalog union inside the adapter (never in a public type).

## Agent-loop typestate (E3)

The loop is a single-writer typestate machine. `AgentLoop.state` exposes the current state; it is
only ever advanced by the active `run()` generator.

| State           | Meaning                                                         |
| --------------- | --------------------------------------------------------------- |
| `idle`          | Constructed, not yet run.                                       |
| `running`       | A model turn is streaming.                                      |
| `awaiting-tool` | The turn requested tool calls; the loop is executing them.      |
| `done`          | Terminal — the model finished a turn with no tool calls.        |
| `aborted`       | Terminal — `stop()` or the run `signal` cancelled the loop.     |
| `errored`       | Terminal — `maxSteps` was exceeded or a turn surfaced an error. |

Transitions:

```text
idle ──run()──▶ running ──▶ awaiting-tool ──▶ running ──▶ done
                   │              │                          
                   ├── signal/stop() ─────────────────────▶ aborted
                   └── maxSteps exceeded / turn error ────▶ errored
```

- **Bound (`maxSteps`, default 8):** before each model turn the loop checks the step count;
  exceeding it yields an `error` chunk carrying `AgentMaxStepsExceededError`, a terminal `done`
  chunk, and settles in `errored`.
- **Cancellation (F-13):** `AgentLoopOptions.signal` and `stop()` are combined via
  `AbortSignal.any`. On abort the loop stops streaming, emits a terminal `done` chunk, and settles
  in `aborted` — no request is left un-cancellable and the generator always returns.
- **History:** each turn's messages pass through the injected `HistoryStrategy` (default
  `slidingWindowHistory`, window 20) so per-call context stays bounded while leading system messages
  are preserved.
- **Usage:** usage is aggregated by summing the **real** `Usage` reported on each `finish` event —
  there is no `chars/4` estimation anywhere. The terminal `done` chunk carries the summed usage only
  when at least one turn reported it.
