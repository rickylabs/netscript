# Sagas — Extension Axes

> **Purpose.** Enumerate the **named** extension axes of the sagas
> architecture and the rules for adding a new implementer to each. Resolves
> evaluator finding F-10 (the previous plan had a speculative `src/abstracts/`
> folder with no named axes).
>
> **Rule.** A stub-only abstract base may exist in `src/abstracts/` only
> when (a) the axis is named in this document and (b) at least one second
> implementer exists or is committed in the same group.

## 1. Named axes

| Axis | Port interface | Stub-only base | Current implementers | Status |
|---|---|---|---|---|
| **Transport** | `SagaTransportPort` | `AbstractSagaTransport` | `NetScriptRedisTransport`, `GarnetListTransport`, `MemorySagaTransport` | Three implementers → base allowed |
| **Store** | `SagaStorePort` | `AbstractSagaStore` | `KvSagaStore`, `PostgresSagaStore` (planned), `MemorySagaStore` | Two+ implementers → base allowed |
| **Bus** | `SagaBusPort` | `AbstractSagaBus` | `SagaBusBridge` (native), `SagaBusLegacy` (`@saga-bus/core` wrap) | Two implementers → base allowed |
| **Agent runtime** | `SagaAgentRuntimePort` | `AbstractAgentRuntime` | Voltagent-wrapped runtime in `@netscript/plugin-ai-agent` (deferred) | Reserved; base ships empty in Group E |
| **Outbox** (T2) | `SagaOutboxPort` | `AbstractSagaOutbox` | `PostgresOutbox` (Phase 7d) | Port only in Group E; base deferred |
| **History** (T3) | `SagaHistoryStorePort` | `AbstractSagaHistory` | `KvHistoryStore` (Phase 7d) | Port only in Group E; base deferred |
| **Clock** | `SagaClockPort` | none (CLI-style stub not needed) | `SystemClock`, `TestSagaClock` | Two implementers; no base |
| **Publisher** | `SagaPublisherPort` | none | `HttpSagaPublisher` (in plugin), `MemorySagaPublisher` (in testing) | Two implementers; no base |

## 2. Stub-only base pattern (CLI pattern)

```ts
// src/abstracts/abstract-saga-transport.ts
export abstract class AbstractSagaTransport implements SagaTransportPort {
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract subscribe(topic: string, handler: TransportHandler): Promise<Subscription>;
  abstract publish(topic: string, message: TransportMessage): Promise<void>;

  // NO concrete methods. NO shared state. NO protected helpers.
  // The base exists only to give external implementers a type to extend
  // for nominal compatibility checks. Concrete implementers may compose
  // ports directly without inheriting from this class.
}
```

Properties:

- The base has **no executable methods** — all are abstract.
- The base has **no protected fields, no shared state**.
- Concrete implementers may **either** extend the base **or** implement
  the port interface directly. Both satisfy F-4 (inheritance audit) and
  F-PLG-1.
- This pattern is identical to `BaseTriggerHandler` and `BaseWorkerHandler`
  in workers-core.

## 3. Adding a new implementer

| Step | Action |
|---|---|
| 1 | Verify the axis is **named in §1**. If not, propose the new axis here first. |
| 2 | Create the file under the role-named folder (`src/transports/<name>.ts`, `src/stores/<name>.ts`, etc.). |
| 3 | Implement the port interface. Extending the abstract base is optional. |
| 4 | Add a test using the axis-specific test contract (`MemorySagaTransport` parity test for transports; `MemorySagaStore` parity test for stores; etc.). |
| 5 | Register via `createSagaRuntime({ transport: new MyTransport(...) })` — no global registry. |
| 6 | Add documentation under `docs/recipes/` showing the configuration shape. |

## 4. Forbidden extension patterns

| Pattern | Reason |
|---|---|
| **Plugin auto-discovery of implementers** | AP-11 (hidden globals). Implementers must be passed to `createSagaRuntime` explicitly. |
| **Decorator-based registration** (`@SagaTransport`) | Decorator semantics are not stable across Deno versions; explicit value passing is portable. |
| **Mixin chains** | AP-3 (deep inheritance). The CLI stub pattern is the only inheritance allowed. |
| **Concrete base with `protected` helpers** | AP-4/5/6. If two implementers share helper logic, extract it as a pure function under `src/utility/` (per doctrine §05). |
| **Re-exporting upstream types from the axis** | AP-14 / F-15. The port is the boundary. |

## 5. Agent-runtime axis (Voltagent wrap)

The agent-runtime axis is the most architecturally significant new axis. It
exists to allow `@netscript/plugin-ai-agent` to wrap Voltagent (or any other
AI agent framework) as a **durability adapter** for sagas:

```ts
interface SagaAgentRuntimePort {
  runStep(
    agentId: AgentId,
    conversationId: ConversationId,
    input: AgentInput,
    ctx: SagaContext,
  ): Promise<AgentStepResult>;

  serializeState(state: AgentRuntimeState): Promise<Uint8Array>;
  deserializeState(bytes: Uint8Array): Promise<AgentRuntimeState>;
}
```

A Voltagent-backed implementer wraps Voltagent's `Agent` and translates each
LLM turn into a saga handler invocation. The conversation history becomes
saga history (T3 durability tier). Tool calls become cascaded messages of
kind `'tool-call'`.

This axis is **reserved in Group E**: the port interface and abstract base
ship empty. The implementer (`@netscript/plugin-ai-agent`) is a separate
group.

## 6. Versioning extension points

When the public port interface changes:

| Change | Action |
|---|---|
| Add a new method | Provide a default implementation on the abstract base (returning `SagasError.notImplemented`) — does not break implementers |
| Change a method signature | Major version bump on `@netscript/plugin-sagas-core`. Old method stays as deprecated. |
| Remove a method | Two-step: deprecate in v0.N, remove in v0.(N+2) |

## 7. References

- Doctrine `07-composition-and-extension.md` — the canonical composition rules
- `dsl-canon.md` — userland DSL surface
- `architecture.md` §6 — the native engine on `SagaBusPort`
- `migration-strategy.md` — `SagaBusLegacy` extension implementation
- `04-voltagent-ai-durable-state.md` — agent-runtime axis source material
