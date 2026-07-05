# @netscript/plugin-ai

A **thin** NetScript plugin that scaffolds an app-owned, **in-process** AI chat, tool, and agent
surface. Here _thin_ names a layering choice — the convention-bearing AI logic lives in the core
packages, not a reduced quality bar. This plugin is held to the same reference-plugin parity
checklist as `workers` and `sagas` (verify harness, scaffolder golden tests, `plugin doctor`
coverage, a `scaffold.runtime` e2e case, and an in-repo-exercised contract). The plugin ships no
runtime AI logic: the engine lives in
[`@netscript/ai`](jsr:@netscript/ai) and the durable-chat runtime in
[`@netscript/fresh/ai`](jsr:@netscript/fresh). This package is a manifest, a connector, and a set of
scaffolders that emit typesafe userland glue importing those installed dependencies directly.

## What it is

- **Manifest** (`@netscript/plugin-ai`): declares the plugin's `ai` runtime-config topic and its
  `/v1/ai` contract version.
- **Connector**: the `NetScriptPlugin` adapter consumed by the CLI to install, add resources, and
  inspect the plugin.
- **Scaffolders**: emit app-owned files under `ai/` — a composition-root barrel, a provider/model
  registry, an in-process chat stream route, a chat island, and starter tool/agent stubs. Thread
  persistence is opt-in.

The default topology is **fully in-process**: the generated stream route calls `@netscript/ai`
directly inside your app's server. No AI gateway or network hop is scaffolded.

## Install

```ts
// The manifest a host registers to expose the AI plugin.
import { aiPlugin } from '@netscript/plugin-ai';

console.log(aiPlugin.name); // "@netscript/plugin-ai"
console.log(aiPlugin.contributions.runtimeConfigTopics); // includes the "ai" topic
```

From a scaffolded NetScript app:

```bash
netscript plugin add ai
netscript plugin add ai --persist-threads   # also scaffold a Deno.Kv thread store
```

### Advanced: inspect the connector before wiring a host

The adapter connector exposes the install seams and add-only resources a host drives. Read them to
preview what `plugin add ai` will emit:

```ts
import { aiAdapterPlugin } from '@netscript/plugin-ai/adapter';
import { collectInstallArtifacts } from '@netscript/plugin/adapter';

// Paths emitted by the default (in-process) install topology.
for (const artifact of collectInstallArtifacts(aiAdapterPlugin)) {
  console.log(artifact.path); // e.g. "ai/ai.ts", "ai/routes/chat-stream.ts"
}

// Add-only resources you can scaffold incrementally (tool, agent, thread-store).
console.log(aiAdapterPlugin.resources?.map((resource) => resource.name));
```

## What gets scaffolded

`netscript plugin add ai` emits the following app-owned files (all under `ai/`):

| File                       | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `ai/ai.ts`                 | Composition root: wires `@netscript/ai` once.            |
| `ai/models.ts`             | Provider ids + `provider:model-id` refs (edit freely).   |
| `ai/routes/chat-stream.ts` | In-process POST route: runs the agent loop directly.     |
| `ai/routes/chat.tsx`       | TanStack-backed chat island rendering assistant parts.   |
| `ai/tools/echo.ts`         | Starter Standard-Schema tool over `@netscript/ai/tools`. |
| `ai/agents/assistant.ts`   | Starter bounded agent loop over `@netscript/ai/agent`.   |

Add more resources incrementally:

```bash
netscript plugin ai add tool  summarize
netscript plugin ai add agent researcher
```

Each emitted file is **yours**: the scaffolder writes a typed wrapper importing the installed
dependency, never a copy of framework source.

## Cancellation (streaming)

The generated chat stream route threads the request's `AbortSignal` into the agent loop and exposes
a `stop()` on the chat connection, so a client can cancel an in-flight generation mid-stream.

## Deferred

`--mcp` / skill-loader scaffolding is intentionally **not** included in this version (tracked in
#290); it depends on a deferred core `SkillLoaderPort`.

## License

MIT
