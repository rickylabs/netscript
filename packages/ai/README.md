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

## Providers

Two first-party providers ship as **self-registering subpaths**. Each wraps a
TanStack AI client and implements the E1 `ModelProviderPort`. Importing a subpath
runs a one-time side effect that registers its factory into the shared registry —
no explicit wiring — then re-exports the provider class and its id/config for
direct construction.

### `@netscript/ai/anthropic`

Wraps [`@tanstack/ai-anthropic`](https://www.npmjs.com/package/@tanstack/ai-anthropic).
The model catalog is taken verbatim from the wrapped package's `ANTHROPIC_MODELS`,
so it stays in lockstep with upstream.

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

Wraps [`@tanstack/ai-openai`](https://www.npmjs.com/package/@tanstack/ai-openai)'s
OpenAI-compatible client, so any endpoint that speaks the OpenAI Chat Completions
or Responses API (DeepSeek, Together, vLLM, a local gateway, …) works by pointing
`baseURL` at it. With no `models` configured the provider is *optimistic* — the
remote endpoint is the authority on its own catalog.

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

### Stopping long-lived streams

`createChatClient` returns the wrapped TanStack text adapter. In-flight
chat/streams are cancelled by passing an `AbortController` to the TanStack
`chat()` / `chatStream()` call — the documented stop path (F-13):

```ts
const abortController = new AbortController();
setTimeout(() => abortController.abort(), 5_000);
// chat({ adapter: client, messages, abortController });
```

### Bundle-isolation guarantee

The base `@netscript/ai` entrypoint **never** imports a provider subpath, and the
subpaths never import each other. The heavy provider SDKs are scoped to their own
subpath's module graph, so:

- `import '@netscript/ai'` pulls **zero** TanStack/provider dependencies.
- `import '@netscript/ai/anthropic'` pulls **only** `@tanstack/ai-anthropic`.
- `import '@netscript/ai/openai-compatible'` pulls **only** `@tanstack/ai-openai`.

This is enforced by `tests/provider_isolation_test.ts`, which imports a single
subpath in a fresh subprocess and asserts the registry contains **exactly** that
one provider.

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
- `@netscript/ai/anthropic` — self-registering Anthropic provider (wraps
  `@tanstack/ai-anthropic`); pulls the SDK only when imported.
- `@netscript/ai/openai-compatible` — self-registering OpenAI-compatible provider
  (wraps `@tanstack/ai-openai`); pulls the SDK only when imported.

## See also

- `@netscript/kv` — the adapter self-registration + singleton pattern this
  package's model registry mirrors.
- `@netscript/telemetry` — the real telemetry adapter injected as a
  `TelemetryPort` (slice E9); never imported by this core.
