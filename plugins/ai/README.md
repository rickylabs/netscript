# @netscript/plugin-ai

**The thin NetScript AI plugin: scaffold an app-owned, in-process chat, tool, and agent surface from
a manifest, connector, and typesafe userland generators.**

Here _thin_ names a layering choice, not a reduced quality bar: convention-bearing AI logic lives
in the core packages. The plugin is held to the same reference-plugin parity checklist as `workers`
and `sagas` (verify harness, scaffolder golden tests, `plugin doctor` coverage, a
`scaffold.runtime` e2e case, and an in-repo-exercised contract). It ships no runtime AI logic: the
engine lives in [`@netscript/ai`](jsr:@netscript/ai) and the durable-chat runtime in
[`@netscript/fresh/ai`](jsr:@netscript/fresh). Its scaffolders emit typesafe userland glue that
imports those installed dependencies directly.

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

## Telemetry

The scaffolded surface runs on `@netscript/ai`, whose agent loop records per-run and per-turn spans
through an injected telemetry port when the app supplies one (e.g. the `@netscript/telemetry`
adapter), following the #402 telemetry convention (`gen_ai.*` semconv keys, `netscript.*` for
NetScript-owned attributes). This plugin scaffolds no telemetry wiring of its own.

## MCP

The MCP surface is **client-side**: `@netscript/ai/mcp` ships the MCP client transport pool
(streamable-HTTP and stdio transports plus tool-registry bridging), which apps can wire into their
scaffolded tool registry directly. This plugin does not scaffold any MCP server, and `--mcp` /
skill-loader scaffolding is intentionally **not** included in this version (tracked in #290); it
depends on a deferred core `SkillLoaderPort`.

## License

Apache-2.0
