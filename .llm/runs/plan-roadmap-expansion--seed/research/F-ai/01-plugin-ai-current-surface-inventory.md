# F-ai: current AI surface inventory (plugin-ai-core / plugin-ai / packages/ai / fresh/ai)

Scope: the full public surface of every package in the AI stack today, evidenced by `deno doc`
output plus direct source reads. Paths below are relative to the worktree root
`C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion` unless stated otherwise.

## 1. Four packages, four archetypes

| Package | Published id | Version | Role | Archetype signal |
|---|---|---|---|---|
| `packages/ai` | `@netscript/ai` | `0.0.1-alpha.0` (`packages/ai/deno.json`) | Standalone provider-agnostic AI **engine** — no `@netscript/*` runtime dependency. | Capability-port composition root (A10), closer to a library core than a NetScript "package archetype." |
| `packages/plugin-ai-core` | `@netscript/plugin-ai-core` | `0.0.1-beta.2` (`packages/plugin-ai-core/deno.json`) | oRPC contract-only surface for the `/v1/ai` route family. | **Archetype 1 — Small Contract**, explicit: `packages/plugin-ai-core/docs/architecture.md:3` ("plugin-ai-core is a **thin, Archetype 1 (Small Contract)** package"). |
| `plugins/ai` | `@netscript/plugin-ai` | `0.0.1-beta.2` (`plugins/ai/deno.json`) | Thin scaffolder + connector; emits app-owned resources. | Archetype 5 per harness convention (plugin); `"publish": false` in `plugins/ai/deno.json` — **not yet on JSR**, unlike its siblings. |
| `packages/fresh/src/runtime/ai` | subpath `@netscript/fresh/ai` inside `packages/fresh` | tracks `packages/fresh` version | Durable-chat client/SSR/proxy runtime UI seam. | Runtime subpath of an existing Archetype-2/3 package, not a standalone package. |

## 2. `@netscript/ai` (`packages/ai`) — engine core

### 2.1 Root export map (`packages/ai/deno.json`)

Exports: `.` (engine root: `createAiRuntime`, `getAiRuntime`, registry functions, `AiRuntime`/
`AiRuntimeConfig`), `./anthropic`, `./openai-compatible`, `./openai-embeddings`, `./openrouter`,
`./ollama`, `./mcp`, `./agent`, `./contracts`, `./ports`, `./tools`, `./testing`. Dependencies
include `@tanstack/ai@^0.39.0`, `@tanstack/ai-anthropic@^0.15.13`, `@tanstack/ai-mcp@0.2.1`
(exact-pinned), `@tanstack/ai-openai@^0.15.10` — **TanStack AI**, not Vercel AI SDK, is the wrapped
provider-abstraction toolkit (cross-referenced in the sibling `matrix/F-ai/external-resources-matrix.md`,
which reaffirms this as the correct Deno/telemetry fit).

### 2.2 Capability-port pattern (A10)

Every injectable capability is an interface + default no-op/throwing factory, composed by
`createAiRuntime(config)`; `getAiRuntime()` is a KV-singleton-style process accessor. Ports found
under `packages/ai/src/ports/` (via `deno doc packages/ai/src/ports/mod.ts`):

- `ModelProviderPort` — `id`, `listModels()`, `getModel(modelId)`, `supports(modelId)`, optional
  `createChatClient?`.
- `ChatModelProviderPort` (`packages/ai/src/ports/chat-client.ts:58`) — the narrower seam the
  agent loop actually injects; never a concrete provider. Composes `createChatClient(modelId):
  ChatClientPort`.
- `ChatClientPort` (`chat-client.ts:108`) — `stream(request, options): AsyncIterable<ChatClientEvent>`;
  an already-aborted `signal` yields at most a terminal event and never hangs (F-13 discipline).
- `EmbeddingProviderPort` (`packages/ai/src/ports/embedding.ts:23`) — `embed(input, options)`.
- `VisionProviderPort` (`packages/ai/src/ports/vision.ts:22`) — `analyze(image, prompt, options)`.
- `ToolRegistryPort` (`packages/ai/src/ports/tool-registry.ts:22`) — register/unregister/has/get/
  list/resolveHandler.
- `AgentLoopPort` (`packages/ai/src/ports/agent-loop.ts`) — `run(input, options):
  AsyncIterable<AgentChunk>`.
- `McpTransportPort` (`packages/ai/src/ports/mcp-transport.ts:168`) — `connect`/`reconnect`/
  `listTools`/`callTool`/`onStateChange`/`stop`.
- `TelemetryPort` (`packages/ai/src/ports/telemetry.ts:33`) — deliberately tiny (`startSpan`,
  `recordEvent`), no-op default. This is the Topic-B seam (see `context/F-ai/`-adjacent telemetry
  note below, §5).
- `ReachabilityPort` — unique to Ollama (local daemon liveness preflight); cloud adapters
  (Anthropic/OpenAI-compatible/OpenRouter) do not need it.

### 2.3 Provider-adapter model — six self-registering subpaths

Each subpath is a side-effect import that calls a `registerModelProvider`/analogous registry
function, mirroring `@netscript/kv/redis`'s self-registration pattern:

| Subpath | Class | File | Distinguishing shape |
|---|---|---|---|
| `@netscript/ai/anthropic` | `AnthropicModelProvider` | `packages/ai/anthropic.ts` | Catalog-bound; wraps `@tanstack/ai-anthropic`. |
| `@netscript/ai/openai-compatible` | `OpenAiCompatibleModelProvider` | `packages/ai/openai-compatible.ts` | Generic BYO-endpoint; `OpenAiCompatibleApi` type (`"chat-completions"\|"responses"`); optimistic no-catalog behavior. |
| `@netscript/ai/openrouter` | `OpenRouterModelProvider` | `packages/ai/openrouter.ts` | `openRouterReasoningModelOptions` normalizer; `ReasoningEffort` type — cross-provider reasoning-effort wire-shape normalization (OpenRouter `{reasoning:{effort}}`, OpenAI flat `reasoning_effort`, Anthropic `thinking`/`output_config`, Ollama emits nothing). |
| `@netscript/ai/ollama` | `OllamaModelProvider` | `packages/ai/ollama.ts` | Unique `checkReachable()`; `HttpReachabilityAdapter`/`createHttpReachabilityPort`/`createAssumeReachablePort`; `DEFAULT_OLLAMA_HOST`. |
| `@netscript/ai/openai-embeddings` | `OpenAiEmbeddingsProvider` | `packages/ai/src/adapters/openai-embeddings.adapter.ts:53` | Implements **both** `EmbeddingProviderPort` and `VisionProviderPort` from one adapter (`embed()` via `/embeddings`, `analyze()` via `/chat/completions`); registers under id `"openai-embeddings"` (`openai-embeddings.adapter.ts:22`), documented as "the OpenAI-compatible E6 provider" — confirming an `E`-numbered engine slice scheme. |
| `@netscript/ai/mcp` | `StdioMcpTransport`, `StreamableHttpMcpTransport` | `packages/ai/src/mcp/adapters/{stdio,streamable-http}-transport.ts` | Two transports implementing `McpTransportPort`; `createMcpTransport(config)` factory dispatches on a `kind` discriminant (`"stdio"` \| `"streamable-http"`); `registerMcpTools(registry, transport)` surfaces remote tools into a `McpToolRegistry`. Both transports carry reconnect backoff (`McpBackoffConfig`) and lifecycle state (`McpConnectionState`). |

Five model-catalog providers (anthropic, openai-compatible, openrouter, ollama, plus
openai-embeddings for embedding/vision) plus one capability-transport adapter family (MCP, two
transport kinds) — six adapter surfaces in total, not four.

### 2.4 Agent loop (E3) and tools (`@netscript/ai/agent`, `@netscript/ai/tools`)

- `createAgentLoop(deps: AgentLoopDeps): AgentLoop` (`packages/ai/src/agent/loop.ts:89`) — pure
  factory injection (A10): "importing this subpath pulls no provider SDK." `AgentLoopDeps` requires
  only `modelProvider: ChatModelProviderPort`; `tools`/`history`/`defaultMaxSteps` are optional.
  Typestate: `AgentLoopState` = `idle|running|awaiting-tool|done|aborted|errored`
  (`packages/ai/src/agent/state.ts:26`). `AgentMaxStepsExceededError` (`agent/errors.ts:14`) settles
  a run in `errored` and yields an `error` chunk before the final `done`.
- `slidingWindowHistory(options)` (`agent/history.ts:50`) — default `HistoryStrategy`, window size
  `DEFAULT_HISTORY_WINDOW = 20` (`agent/history.ts:37`), always preserves leading `system` messages
  unless `preserveSystem: false`.
- Tool system (`packages/ai/src/tools/`) wraps **Standard Schema** (`StandardSchemaV1`) for input
  validation — "bring any conforming schema (zod, valibot, arktype...)"; no schema DSL, no
  `@netscript/*` runtime dependency (module doc, `packages/ai/src/tools/` mod comment). Builder:
  `defineAiTool(name)` → `.describe()/.parameters()/.input(schema)` → terminal `.server(handler)` or
  `.client()`. Ships a built-in `renderUiTool` (`packages/ai/src/tools/application/render-ui.ts:27`)
  — a schema-only, client-deferred `render_ui` tool contract consumed by the fresh-ui
  generative-UI slice; dispatch validates input and returns `deferred: true` with no renderer
  running in the core.

## 3. `@netscript/plugin-ai-core` — the `/v1/ai` contract

### 3.1 Layering (Archetype 1 — Small Contract)

Per `packages/plugin-ai-core/docs/architecture.md` (58 lines) and `README.md` (140 lines): declares
route shapes only, zero service implementation. Public surface: root (`aiContract`, `aiContractV1`,
`AiCapabilities`, `AiContract`, `AiContractDefinition`, `AiContractV1`, `AiRouter`, `ChatChunk`,
`ChatInput`, `EmbedInput`, `EmbedResponse`, `ModelsResponse`, `ToolInvokeInput`,
`ToolInvokeResponse`, `TranscribeInput`, `TranscribeResponse`) plus the `./contracts/v1` subpath
(10 named Zod schemas, each a `z.ZodType<T>` drift guard, plus re-exported engine types).

### 3.2 Route table (`packages/plugin-ai-core/src/contracts/v1/ai.contract.ts`)

| Route | Method/path | Notes |
|---|---|---|
| `describe` | inherited `GET /describe` | Mandatory base-seam route from `BASE_PLUGIN_CONTRACT_ROUTES` (`@netscript/plugin/contract-base`), spread verbatim — line 327. |
| `chat` | `POST /chat` | **SSE-framed**: output is `eventIterator(chatChunkZodSchema)` (line 332). Built off `oc.route` directly (not `baseContract`), so its error map is `Record<never, never>` — errors surface in-stream as a `ChatChunk` `error` frame, not an oRPC error (lines 275–294). This forces any connector's handler to be an async-generator/stream implementation; a buffered single response cannot type-check (line 281 comment: "F-13"). |
| `models` | `GET /models` | Line 334–337. |
| `invokeTool` | `POST /tools/{name}` | Line 339–342. |
| `embed` | `POST /embed` | Line 344–347. |
| `transcribe` | `POST /transcribe` | Line 349–352. |

Every route IO type derives from `@netscript/ai/contracts` engine types via `typeof <zodSchema>`
(never a hand-authored parallel shape) — e.g. `ChatChunk = AgentChunk` (line 129), so the contract
can never silently diverge from the engine (lines 296–305 doc comment on `AiContractDefinitionShape`).
Zero erasure casts on the contract/implementer path: `aiContract`, `aiContractV1 =
implement(aiContractDefinition)`, and `AiRouter = ReturnType<typeof
aiContractV1.$context<Record<never, never>>>` are all real, precisely-typed oRPC values (lines
355–409) — this is one of the two doctrinally-accepted contract-boundary casts (the base-errors
cast at line 92–94), not an additional one.

## 4. `plugins/ai` — thin plugin (connector + scaffolder)

### 4.1 Connector object (`plugins/ai/src/adapter/plugin.ts`)

`aiAdapterPlugin: NetScriptPlugin` — `kind: 'ai'`, `install.dependencySpecifier:
'jsr:@netscript/plugin-ai@^0.0.1-beta.1'`, `install.configParams: ['AI_MODEL',
'ANTHROPIC_API_KEY']`, `doctor.requiredConfigKeys: ['ANTHROPIC_API_KEY']`, `update.strategy:
'dependency'`, `remove.strategy: 'manifest-only'`. Six starter resources emitted on `install`
(`aiStarterResources`, lines 29–36): `models`, `barrel`, `tool`, `agent`, `stream-proxy`,
`chat-route`.

### 4.2 The stream-proxy scaffolder does **not** exercise the `/v1/ai` contract

`plugins/ai/src/adapter/resources/stream-proxy/stream-proxy.stub.ts:16-64` emits a plain
`export async function handler(request: Request): Promise<Response>` that calls
`createAgentLoop()` from `@netscript/ai/agent` **directly** and returns
`toNetScriptChatResponse(...)` from `@netscript/fresh/ai` — a raw in-process POST handler, never
constructing or binding `aiContractV1`/`AiRouter` from `plugin-ai-core` at all. This is the exact
gap GitHub issue #388 names (see `research/F-ai/04-github-ai-program-state.md` §2): *"the contract
exists in `plugin-ai-core` but is unexercised — the scaffolded `stream-proxy.stub.ts` bypasses it
with a raw POST handler."* Confirmed here by direct source read, not merely by the issue text.

### 4.3 Publish state

`plugins/ai/deno.json` sets `"publish": false` — **not published to JSR**, unlike `packages/ai`
(alpha.0) and `packages/plugin-ai-core` (beta.2), which are. Exports: `.`, `./adapter-cli`,
`./public`, `./plugin`, `./adapter`, `./scaffold`, `./contracts`.

### 4.4 `--mcp` deferral

`plugins/ai/README.md` documents `--mcp` scaffold-flag deferral, tracked as GitHub #290, depending
on the not-yet-shipped `SkillLoaderPort` (E7/#246, still open per `research/F-ai/04-github-ai-program-state.md`).

## 5. `@netscript/fresh/ai` (`packages/fresh/src/runtime/ai`)

Per `packages/fresh/src/runtime/ai/README.md` (205 lines) and `mod.ts` (105 lines, module JSDoc
mirrors the README):

- **THE ONE-PROJECTION LAW**: seed (`resolveChatSnapshot`) and live (`useChat`/island reducer)
  projections MUST be the literal same `projectChatSnapshot` function, else tool-card rendering
  drifts between SSR and client hydration.
- Distinguishes StreamDB **shapes** (CRUD/reconciled rows) from durable **Sessions** (append-only
  chunk logs) — conflating them is documented as "the doctrinal root of #219."
- Slice map: **FA0** (skeleton, closed), **FA1** (landed — connection/response/snapshot,
  `create-chat-connection.ts`), **FA2** (landed — stream proxy, sibling slice #251, fixed the #239
  gzip-mislabel bug), **FA3** (skeleton only — MCP `ui://` sandbox on
  `@netscript/fresh/ai/sandbox`, still open per the GitHub sweep). A fourth slice, **FA4**
  (`createMcpAppCallHandler`, the ACT half of interactive MCP Apps), was filed later
  (#379, OPEN) and is not yet reflected in this README's slice table — a documentation-lag gap, not
  a code gap (see `research/F-ai/02-ai-stack-architecture-and-migration-delta.md`).
- F-13 cancellation/lifecycle convention (`AbortSignal`-threaded cancellation + idempotent
  `close()/stop()/dispose()`) applied consistently — visible again in the `stream-proxy.stub.ts`
  read above (§4.2), which threads `request.signal` into the agent loop and calls
  `generation.stop()` on abort.
- SR2 tolerance: transient-empty/error subscribe retries with exponential backoff (5×250ms→5s cap)
  rather than surfacing as terminal errors — corresponds to GitHub #267 (closed).
- `mod.ts` re-exports only from `create-chat-connection.ts` (FA1) and `stream-proxy.ts` (FA2) —
  **FA3 has no corresponding export yet**, consistent with it being a skeleton.

## 6. Archetype/thinness summary

- `plugin-ai-core` = Archetype 1 (Small Contract), explicitly labeled in its own doctrine file.
- `plugins/ai` = thin connector/scaffolder (Archetype 5 by harness convention), unpublished.
- `packages/ai` = a standalone, zero-`@netscript/*`-dependency engine core — architecturally closer
  to `@netscript/kv`'s adapter-by-subpath shape than to any single package archetype; it is the
  "fat" home for AI capability, by design (per the five-home split recorded in GitHub #238 — see
  file 02).
- `packages/fresh/src/runtime/ai` is a runtime subpath, not an independent package, and is
  presentation/durable-chat-runtime concerned only.

## Verification gaps

- `docs/site/capabilities/ai.md` / `docs/site/ai/index.md` — not confirmed to exist in this
  worktree; a targeted `Glob`/directory listing for `docs/site/**/ai*` returned no matches (the
  glob index may be stale for this worktree — a direct `Get-ChildItem docs/site` sweep was not run
  before this file was written; treat "no public docs page found" as provisional, not certain).
- `deno doc --lint packages/plugin-ai-core` (the jsr-audit publish-bar check, task item 5) was
  **not run** in this pass — recorded as an open item for a follow-up jsr-audit-scoped cell rather
  than fabricated here.
- The E-number engine slice scheme (E1–E12) referenced above (E3 agent loop, E6 openai-embeddings,
  E7 SkillLoaderPort, E9 OTel adapter, E10 MemoryPort, E11 RetrieverPort, E12 skill-authoring) is
  corroborated end-to-end only via the sibling GitHub-state cell
  (`research/F-ai/04-github-ai-program-state.md`); this file independently confirms E3 and E6 by
  source-level module-doc citation (agent/loop.ts, openai-embeddings.adapter.ts) but did not
  independently re-derive E1/E2/E4/E5/E7–E12 from source comments alone.
