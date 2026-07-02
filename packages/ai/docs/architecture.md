# @netscript/ai — Architecture

- **Archetype: 2 (Core / engine).** A zero-dependency vocabulary + seam package.
  It defines contracts, capability ports, a registry, and a composition root; it
  contains no concrete provider or behavior.

## Layers

- `src/contracts/` — pure domain types (`domain/` role): messages, content parts,
  tools, usage, agent-loop chunks, model identity, the `render_ui` type seam, and
  the typed error hierarchy. No IO. Exposed as `@netscript/ai/contracts`.
- `src/ports/` — the capability seams (consumed contracts) plus one default
  factory each. Also hosts the model registry (self-registration table). Exposed
  as `@netscript/ai/ports`.
- `src/runtime/` — the composition root: `createAiRuntime` (factory injection,
  A10) and the `getAiRuntime` process singleton. Exposed as `@netscript/ai` (`.`).
- `src/testing/` — public fakes for downstream unit tests. Exposed as
  `@netscript/ai/testing`.

## Port set and defaults

| Port                    | Default            | Rationale                                      |
| ----------------------- | ------------------ | ---------------------------------------------- |
| `TelemetryPort`         | no-op              | Only telemetry seam; real adapter is E9.       |
| `ToolRegistryPort`      | no-op (null-object)| Empty registry until E5/app supplies one.      |
| `SkillLoaderPort`       | no-op              | Returns no skills until a loader is wired.      |
| `AgentMemoryPort`       | no-op              | Append/load no-op; optional `recall` seam = E10.|
| `EmbeddingProviderPort` | throwing           | Embeddings need an explicit adapter (E6).       |
| `VisionProviderPort`    | throwing           | Vision needs an explicit adapter (E7).          |
| `McpTransportPort`      | throwing           | MCP transport needs an explicit adapter (E8).   |
| `AgentLoopPort`         | throwing           | The loop is E3; iterating the default rejects.  |
| `ModelProviderPort`     | registry-resolved  | Providers self-register (E2); unknown id throws.|

## Seam decisions

- **Provider self-registration (E2):** provider packages call
  `registerModelProvider(id, factory)` as an import side effect — the exact
  `@netscript/kv/redis` pattern. `getModel('<provider>:<model>')` parses the ref,
  resolves the provider from the module-level registry, and returns a
  `ModelHandle`. No provider SDK enters the graph until an app imports one.
- **Agent loop (E3):** implements `AgentLoopPort.run()` returning an
  `AsyncIterable<AgentChunk>`. A real `UsageChunk` is in the union from day one
  (Q1). E3 is injected into `createAiRuntime` — the core ships only the throwing
  default.
- **Relevance recall (E10):** `AgentMemoryPort.recall?` is an optional method,
  intentionally absent from the default. Callers guard on its presence and fall
  back to `load()`.
