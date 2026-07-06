The deliverable — complete file content for `docs/site/reference/plugin-ai/index.md`:

---
layout: layouts/base.vto
title: "@netscript/plugin-ai"
---

# `@netscript/plugin-ai`

The NetScript AI plugin: a **thin** manifest, connector, and scaffolder that wires an app-owned,
**in-process** AI chat, tool, and agent surface onto `@netscript/ai` and `@netscript/fresh/ai`.
Here _thin_ names a layering choice, not a lowered quality bar — the plugin ships no runtime AI
logic. The engine (providers, tools, agent loop, embeddings) lives in
[`@netscript/ai`](jsr:@netscript/ai); the durable-chat runtime lives in `@netscript/fresh/ai`; and
the versioned `/v1/ai` contract lives in
[`@netscript/plugin-ai-core`](#internals-netscriptplugin-ai-core). This package is a manifest, a
connector, and a set of scaffolders that emit typesafe userland glue importing those installed
dependencies directly. This page is generated from the package public surface with `deno doc`
(US-2). For the full index of packages and plugins return to the
[reference overview](/reference/).

## Entrypoints

The plugin publishes the following entrypoints. Each is generated from its own `deno doc` surface.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/plugin-ai` | `./mod.ts` | Plugin manifest, identifiers, and manifest types (documented below). |
| `@netscript/plugin-ai/public` | `./src/public/mod.ts` | Curated public manifest surface (alias target of the root). |
| `@netscript/plugin-ai/plugin` | `./src/public/mod.ts` | Plugin manifest and constants (alias of the public surface). |
| `@netscript/plugin-ai/adapter` | `./src/adapter/plugin.ts` | `NetScriptPlugin` connector consumed by the CLI (install, resources, doctor). |
| `@netscript/plugin-ai/adapter-cli` | `./cli.ts` | Published CLI entrypoint (`createPluginAdapter(...).toCli()`). |
| `@netscript/plugin-ai/scaffold` | `./scaffold.ts` | Scaffolder protocol entrypoint (`createPluginAdapter(...).toScaffold()`). |
| `@netscript/plugin-ai/contracts` | `./contracts/v1/mod.ts` | Re-export of the `/v1/ai` contract owned by `@netscript/plugin-ai-core`. |

## Plugin manifest (`@netscript/plugin-ai`)

The root entrypoint exposes the plugin manifest consumed by the NetScript host and its stable
identifiers. The manifest is built with `definePlugin` from `@netscript/plugin`; shared manifest
inspection is provided by `inspectPlugin` from the same package. The AI manifest is intentionally
**thin**: it declares only its contribution axes (one runtime-config topic and one contract
version) and carries no bundled service or background processor.

| Symbol | Kind | Value | Description |
| --- | --- | --- | --- |
| `aiPlugin` | variable | `PluginManifest` | Plugin manifest for the NetScript AI plugin. |
| `AI_PLUGIN_ID` | variable | `"@netscript/plugin-ai"` | Canonical plugin id used across the manifest, connector, and scaffolder. |
| `AI_PLUGIN_VERSION` | variable | package version | Plugin version, single-sourced from the package `deno.json`. |
| `AI_WORKSPACE_NAME` | variable | `"ai"` | Runtime-config topic name and generated userland workspace directory. |
| `AiPluginManifest` | type alias | `PluginManifest` | Named handle consumers annotate a host plugin list with. |
| `AiPluginId` | type alias | `"@netscript/plugin-ai"` | Literal type of the plugin id. |
| `AiWorkspaceName` | type alias | `"ai"` | Literal type of the workspace name. |

Manifest contributions (verified by `tests/manifest_test.ts`):

- `type` is `"utility"` — a thin plugin with **no** contributed `services` and **no**
  `backgroundProcessors`.
- `contributions.runtimeConfigTopics` includes the `"ai"` topic.
- `contributions.contractVersions` includes `{ version: "v1", loader: "./contracts/v1/mod.ts" }`.
- `permissions` are `--allow-net`, `--allow-env`, `--allow-read` — the host permissions the
  scaffolded in-process chat route needs to reach a provider, read its API key, and materialize
  durable sessions.

```ts
import { aiPlugin } from "@netscript/plugin-ai";

console.log(aiPlugin.name); // "@netscript/plugin-ai"
console.log(aiPlugin.contributions.runtimeConfigTopics); // includes the "ai" topic
```

## Connector (`@netscript/plugin-ai/adapter`)

The adapter export is the `NetScriptPlugin` connector the CLI drives to install the plugin, add
resources incrementally, and run doctor. Its install seams are pure data, so a host can preview
exactly what an install will emit before writing any file.

| Symbol | Kind | Description |
| --- | --- | --- |
| `aiAdapterPlugin` | variable | The AI `NetScriptPlugin` connector (kind `"ai"`). |
| `aiStarterResources` | variable | The ordered starter resources emitted by the default install. |

The connector declares:

- `install.starterResources` — the six starter scaffolders emitted by a default install (see
  [scaffolded output](#scaffolded-output)).
- `install.dependencySpecifier` / `update.targetSpecifier` — `jsr:@netscript/plugin-ai@^0.0.1-beta.1`.
- `install.configParams` — `["AI_MODEL", "ANTHROPIC_API_KEY"]` (see [configuration](#configuration)).
- `doctor.requiredConfigKeys` — `["ANTHROPIC_API_KEY"]` (see [doctor](#doctor)).
- `resources` — the add-only resources `tool`, `agent`, and `thread-store`.
- `remove.strategy` — `"manifest-only"`; `update.strategy` — `"dependency"`.

```ts
import { aiAdapterPlugin } from "@netscript/plugin-ai/adapter";
import { collectInstallArtifacts } from "@netscript/plugin/adapter";

// Paths emitted by the default (in-process) install topology.
for (const artifact of collectInstallArtifacts(aiAdapterPlugin)) {
  console.log(artifact.path); // e.g. "ai/ai.ts", "ai/routes/chat-stream.ts"
}

// Add-only resources you can scaffold incrementally.
console.log(aiAdapterPlugin.resources?.map((resource) => resource.name));
// ["tool", "agent", "thread-store"]
```

## Install and variants

Install the AI plugin into a scaffolded NetScript app with the framework install command. The
plugin's `officialSource.canonicalName` is `ai`, so the bare kind resolves to
`@netscript/plugin-ai`:

```bash
netscript plugin install ai
```

This resolves and installs the JSR package, then runs the plugin's own scaffolder, emitting the
six default files under `ai/`. The default topology is **fully in-process**: the generated stream
route calls `@netscript/ai` directly inside your app's Fresh server — no AI gateway or network hop
is scaffolded.

### Variants

The AI plugin is designed around three install shapes. Their current, source-verified status:

| Variant | Intended effect | Status |
| --- | --- | --- |
| _default_ | Emit the six in-process starter files under `ai/`. | Wired. |
| `--persist-threads` | Also scaffold `ai/thread-store.ts` (a `Deno.Kv`-backed thread store). | Available at the adapter-resource layer, not yet a public install flag. |
| `--mcp` | Scaffold MCP / skill-loader wiring. | Deferred (tracked in #290); depends on a later core `SkillLoaderPort`. |

> **Callout — variant addressability (beta).** The public `netscript plugin install` command does
> not yet forward plugin-specific install flags, so `--persist-threads` is not currently a wired
> CLI flag. The thread-store scaffolder ships as an **add-only adapter resource** rather than part
> of the default install set, so an app that does not want durable threads never receives a bundled
> store. `--mcp` is intentionally not implemented in this version. Obtain the thread store from the
> adapter resource layer (`threadStoreResource`) as described in
> [add-only resources](#add-only-resources).

### Add-only resources

Beyond the default set, the connector exposes three resources that emit a single artifact each:

| Resource | Artifact | Purpose |
| --- | --- | --- |
| `tool` | `ai/tools/<id>.ts` | A Standard-Schema AI tool over `@netscript/ai/tools`. |
| `agent` | `ai/agents/<id>.ts` | A bounded agent loop over `@netscript/ai/agent`. |
| `thread-store` | `ai/thread-store.ts` | An opt-in `Deno.Kv`-backed durable-thread store (`--persist-threads`). |

Each resource derives its file and exported-symbol names from a user-supplied id via the shared
`fileStem` / `exportStem` helpers, so `summarize` emits `ai/tools/summarize.ts` exporting
`summarizeTool`, and `researcher` emits `ai/agents/researcher.ts` exporting
`createResearcherAgent`.

## Configuration

The connector records two config params at install time (`install.configParams`):

| Key | Required | Read by | Notes |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | Yes | `@netscript/ai`'s Anthropic provider (self-registered by the `@netscript/ai/anthropic` side-effect import). | Enforced by `netscript plugin doctor` — see below. |
| `AI_MODEL` | No | App-owned `ai/models.ts` (the starter pins model refs directly). | Recorded as a config param; the generated `models.ts` resolves `provider:model-id` refs and can read this key if you wire it. |

The scaffolded runtime resolves models by `provider:model-id` ref (for example
`anthropic:claude-sonnet-4-5`), which `@netscript/ai`'s `getModel` resolves against the
self-registered provider. The starter `ai/models.ts` is app-owned; edit it to pin the providers and
models your app uses.

## Doctor

`netscript plugin doctor <pkg>` dispatches the `doctor` verb to the plugin's published CLI, which
runs the core-owned doctor algorithm against the connector's `doctor.requiredConfigKeys`. For the
AI plugin that is `ANTHROPIC_API_KEY`, producing a single config check:

| Check name | Passes when | Failure message |
| --- | --- | --- |
| `config:ANTHROPIC_API_KEY` | `ANTHROPIC_API_KEY` is present in the resolved app config. | `Missing config key ANTHROPIC_API_KEY` |

Both branches are covered by `tests/adapter/doctor_test.ts`: an empty config reports `ok: false`
with the missing-key message, and a config carrying the key reports `ok: true`.

## Scaffolded output

`netscript plugin install ai` emits the following app-owned files (all under `ai/`), in this order.
Every file is **yours**: the scaffolder writes a typed wrapper importing the installed dependency,
never a copy of framework source.

| File | Scaffolder | Purpose |
| --- | --- | --- |
| `ai/models.ts` | `modelsScaffolder` | Provider ids + `provider:model-id` refs (edit freely). |
| `ai/ai.ts` | `barrelScaffolder` | Composition root: wires `@netscript/ai` once and re-exports the client, model resolver, and tool registry. |
| `ai/tools/echo.ts` | `toolResource` | Starter Standard-Schema tool over `@netscript/ai/tools`. |
| `ai/agents/assistant.ts` | `agentResource` | Starter bounded agent loop over `@netscript/ai/agent`. |
| `ai/routes/chat-stream.ts` | `streamProxyScaffolder` | In-process POST route: runs the agent loop directly and binds the `/v1/ai` router. |
| `ai/routes/chat.tsx` | `chatRouteScaffolder` | TanStack-backed chat island rendering assistant parts. |

The opt-in thread store adds one more file:

| File | Scaffolder | Purpose |
| --- | --- | --- |
| `ai/thread-store.ts` | `threadStoreScaffolder` | App-owned `ThreadStore` port + starter `Deno.Kv` store (opt-in). |

```text
ai/
├── ai.ts                 # composition root: ai(), chatModel(), aiTools
├── models.ts             # AI_PROVIDERS, AI_MODELS, DEFAULT_CHAT_MODEL
├── routes/
│   ├── chat-stream.ts    # in-process POST handler + createAiRouter(...) for /v1/ai
│   └── chat.tsx          # chat island (streams from /api/ai/chat-stream)
├── tools/
│   └── echo.ts           # starter defineAiTool
├── agents/
│   └── assistant.ts      # starter createAgentLoop factory
└── thread-store.ts       # opt-in Deno.Kv ThreadStore (--persist-threads)
```

### Runtime registries

`scaffold.runtime.json` declares two generated registries, compiled by
`src/cli/generate-runtime-registries.ts` and used by compiled runtimes to statically import
app-owned tools and agents:

| Registry kind | Source directory | Generated path | Item type |
| --- | --- | --- | --- |
| `ai-tools` | `ai/tools` | `.netscript/generated/plugin-ai/tools.registry.ts` | `AiToolDefinition` (`@netscript/ai/tools`) |
| `ai-agents` | `ai/agents` | `.netscript/generated/plugin-ai/agents.registry.ts` | `AgentLoop` (`@netscript/ai/agent`) |

## Contract (`@netscript/plugin-ai/contracts`)

The contract export re-exports the `/v1/ai` oRPC contract surface owned by
`@netscript/plugin-ai-core/contracts/v1`, so a host binds the AI plugin against a single pinned
contract. The generated stream route calls `createAiRouter(...)` to implement it and exports the
bound `aiRouter` and `aiRouteContract` (`aiContractV1`) for host integration and tests.

Route paths are relative; the `/v1/ai` prefix is applied where the service host mounts the router.

| Procedure | Route | Input schema | Output |
| --- | --- | --- | --- |
| `describe` | `GET /describe` | — | `AiCapabilities` capability document. |
| `chat` | `POST /chat` | `ChatInputSchema` | SSE-framed stream of `ChatChunk` (text, tool-call, tool-result, usage, done, error). |
| `models` | `GET /models` | `ModelsInputSchema` | `ModelsResponse` (available model descriptors). |
| `invokeTool` | `POST /tools/{name}` | `ToolInvokeInputSchema` | `ToolInvokeResponse`. |
| `embed` | `POST /embed` | `EmbedInputSchema` | `EmbedResponse` (embeddings, model, usage). |
| `transcribe` | `POST /transcribe` | `TranscribeInputSchema` | `TranscribeResponse`. |

Key exported symbols (see the [`@netscript/plugin-ai-core`](/reference/plugin-ai-core/) reference
for the full surface):

| Symbol | Kind | Description |
| --- | --- | --- |
| `aiContract` / `aiContractV1` | variable | The versioned `/v1/ai` oRPC contract handle. |
| `ChatInputSchema` / `ChatChunkSchema` | variable | Zod schemas for the streaming chat route IO. |
| `ModelsInputSchema` / `ModelsResponseSchema` | variable | Zod schemas for the models route IO. |
| `ToolInvokeInputSchema` / `ToolInvokeResponseSchema` | variable | Zod schemas for the tool-invocation route IO. |
| `EmbedInputSchema` / `EmbedResponseSchema` | variable | Zod schemas for the embeddings route IO. |
| `TranscribeInputSchema` / `TranscribeResponseSchema` | variable | Zod schemas for the transcription route IO. |
| `AiContract` / `AiContractV1` / `AiRouter` | type alias | Contract and router types derived from the contract. |

## Examples

### Compose the runtime and stream a reply

The generated `ai/ai.ts` wires `@netscript/ai` once and re-exports the client, model resolver, and
tool registry. The starter agent and chat route build on it:

```ts
import { createAgentLoop, slidingWindowHistory } from "@netscript/ai/agent";
import { ai, chatModelId, DEFAULT_CHAT_MODEL } from "./ai.ts";

const loop = createAgentLoop({
  modelProvider: ai().getModelProvider(),
  history: slidingWindowHistory({ maxMessages: 32 }),
  tools: ai().tools,
});

for await (const chunk of loop.run({
  model: chatModelId(DEFAULT_CHAT_MODEL),
  messages: [{ role: "user", content: "Summarize the release notes." }],
  system: "You are the assistant. Be concise and precise.",
})) {
  // stream text/tool chunks to the client
}
```

### Cancellable in-process chat route

The generated `ai/routes/chat-stream.ts` runs the agent loop directly inside the app server and
hands the token stream to `@netscript/fresh/ai`'s `toNetScriptChatResponse` for durable-session
persistence. It threads the request's `AbortSignal` into the loop and exposes `stop()` on the
connection, so a client can cancel an in-flight generation mid-stream:

```ts
import { toNetScriptChatResponse } from "@netscript/fresh/ai";
import { streamChat } from "./chat-stream.ts";

export async function handler(request: Request): Promise<Response> {
  const { sessionId, message } = await request.json();
  return toNetScriptChatResponse({
    target: { sessionId },
    source: streamChat({ message: message.text, signal: request.signal }),
    newMessages: [{ role: "user", text: message.text }],
    request,
  });
}
```

The generated chat island (`ai/routes/chat.tsx`) posts to `/api/ai/chat-stream`, renders assistant
`RenderPart[]` through the app's copy-based `Markdown` component, and shows a **Stop** button while
streaming that calls `connection.stop()`.

### Define an app-owned tool

`netscript plugin ai add tool summarize` (or the `tool` adapter resource) emits a thin
Standard-Schema tool over `@netscript/ai/tools`:

```ts
import { defineAiTool } from "@netscript/ai/tools";

export const summarizeTool = defineAiTool("summarize")
  .describe("Describe what summarize does so the model knows when to call it.")
  .parameters({
    type: "object",
    properties: { query: { type: "string", description: "The primary input for summarize." } },
    required: ["query"],
  })
  .input(/* Standard-Schema validator */)
  .server(({ query }) => {
    // App-owned business logic.
    return { ok: true, echo: query };
  });
```

## Internals: `@netscript/plugin-ai-core` {#internals-netscriptplugin-ai-core}

> **Internals.** `@netscript/plugin-ai-core` is the framework-internal package that owns the AI
> plugin's oRPC `/v1/ai` contract — the SSE-framed chat, models, tools, embed, and transcribe route
> surface, its Zod validators, the engine-derived vocabulary types, and the `createAiRouter`
> implementer factory. `@netscript/plugin-ai` re-exports its contract through
> `@netscript/plugin-ai/contracts`, and the generated stream route imports `createAiRouter`,
> `aiContractV1`, and `AiRouterImplementation` from it directly. It is published separately and
> documented on its own [reference page](/reference/plugin-ai-core/) (US-8). The runtime AI engine
> itself — providers, the tool registry, the agent loop, and embeddings — lives in the separate
> `@netscript/ai` package, and the durable-chat client/server runtime in `@netscript/fresh/ai`.

---

Back to the [reference overview](/reference/).
