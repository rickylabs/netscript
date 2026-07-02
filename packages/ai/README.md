# @netscript/ai

Zero-dependency AI engine core for NetScript — domain contracts, capability
ports, a model registry, and a composition root. This package is the foundation
the AI stack builds on; it ships **no** concrete provider or behavior (those are
the E2–E10 slices) and takes **no** `@netscript/*` runtime dependency.

## Install

```ts
import { createAiRuntime, getModel, registerModelProvider } from '@netscript/ai';
```

## Quick start

Compose a runtime. Every capability defaults to a no-op or throwing port, so an
unconfigured runtime is safe to hold and inspect:

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
`@netscript/kv/redis` self-registers its adapter. Nothing in this core imports a
provider, so no provider SDK enters the module graph until an app opts in.

```ts
import { getModel, registerModelProvider } from '@netscript/ai';

// A provider package does this on import:
registerModelProvider('demo', () => ({
  id: 'demo',
  listModels: () => Promise.resolve([]),
  getModel: (id) =>
    Promise.resolve({ providerId: 'demo', descriptor: { id, provider: 'demo' } }),
  supports: () => true,
}));

const handle = await getModel('demo:some-model');
```

## Public surface

| Verb / symbol                                            | Purpose                                            |
| -------------------------------------------------------- | -------------------------------------------------- |
| `createAiRuntime(config)`                                | Compose a runtime from injected ports (A10).       |
| `getAiRuntime()` / `resetAiRuntime()`                    | `getKv()`-shaped process singleton + reset.        |
| `registerModelProvider` / `getModelProvider` / `getModel`| Model registry: self-register + resolve.           |

### Subpath exports

- `@netscript/ai` — composition root + model registry.
- `@netscript/ai/contracts` — domain types (`Message`, `ToolDescriptor`, `Usage`,
  `AgentChunk`, `RenderUiToolDescriptor`, …) and the typed error hierarchy.
- `@netscript/ai/ports` — capability seams and their no-op/throwing defaults.
- `@netscript/ai/testing` — deterministic fake ports for downstream unit tests.

## See also

- `@netscript/kv` — the adapter self-registration + singleton pattern this
  package's model registry mirrors.
- `@netscript/telemetry` — the real telemetry adapter injected as a
  `TelemetryPort` (slice E9); never imported by this core.
