# @netscript/ai

Zero-dependency AI engine core for NetScript — domain contracts, capability ports, a model registry,
and a composition root. This package is the foundation the AI stack builds on; it ships **no**
concrete provider or behavior (those are the E2–E10 slices) and takes **no** `@netscript/*` runtime
dependency.

## Install

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

Inject real ports (supplied by later slices or your app) via the config:

```ts
import { createAiRuntime } from '@netscript/ai';
import { createFakeTelemetryPort } from '@netscript/ai/testing';

const telemetry = createFakeTelemetryPort();
const ai = createAiRuntime({ telemetry, defaultModelProvider: 'anthropic' });
ai.telemetry.recordEvent('agent.finish', { ok: true });
```

## Model registry (self-registration)

Provider packages (E2) register themselves as an import side effect, exactly like
`@netscript/kv/redis` self-registers its adapter. Nothing in this core imports a provider, so no
provider SDK enters the module graph until an app opts in.

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
  the agent loop drives E4 tools through the existing seam. Alternate registries (e.g. a future
  MCP-backed one) substitute at the same seam.

### `render_ui` wire contract

`renderUiTool` is the built-in generative-UI tool **descriptor** — input schema + metadata only,
**no renderer**. It is the wire contract the fresh-ui generative-UI slice consumes. Dispatching it
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

## Public surface

| Verb / symbol                                             | Purpose                                              |
| --------------------------------------------------------- | ---------------------------------------------------- |
| `createAiRuntime(config)`                                 | Compose a runtime from injected ports (A10).         |
| `getAiRuntime()` / `resetAiRuntime()`                     | `getKv()`-shaped process singleton + reset.          |
| `registerModelProvider` / `getModelProvider` / `getModel` | Model registry: self-register + resolve.             |
| `defineAiTool` / `createToolRegistry` / `renderUiTool`    | Tool system: define, register, dispatch (`./tools`). |

### Subpath exports

- `@netscript/ai` — composition root + model registry.
- `@netscript/ai/contracts` — domain types (`Message`, `ToolDescriptor`, `Usage`, `AgentChunk`,
  `RenderUiToolDescriptor`, …) and the typed error hierarchy.
- `@netscript/ai/ports` — capability seams and their no-op/throwing defaults.
- `@netscript/ai/tools` — the tool system: `defineAiTool`, `createToolRegistry`, and the
  `renderUiTool` wire contract (validates input via Standard Schema).
- `@netscript/ai/testing` — deterministic fake ports for downstream unit tests.

## See also

- `@netscript/kv` — the adapter self-registration + singleton pattern this package's model registry
  mirrors.
- `@netscript/telemetry` — the real telemetry adapter injected as a `TelemetryPort` (slice E9);
  never imported by this core.
