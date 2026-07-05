# Archetype grounding — eis-chat's AI usage mapped onto thin `plugins/ai` / fat `plugin-ai-core` /
`@netscript/fresh/ai`

Cites `context/F-ai/01-eis-chat-ai-usage-extraction.md` for eis-chat evidence and reads directly
against the current NetScript AI surface in this worktree
(`C:\Dev\repos\netscript-framework\.llm\tmp\wt-roadmap-expansion`). Doctrine refs: ARCHETYPE-2
(Core/engine) for `@netscript/ai`, ARCHETYPE-5 (Plugin Package) for `plugins/ai`/`@netscript/plugin-
ai-core`, A10 (composition root over container), A11 (name extension axes before abstraction).

## 1. The current three-layer split (already built, not proposed)

The suite already exists as three packages, each independently readable via `deno doc`:

| Layer | Package | Archetype | What it owns |
| --- | --- | --- | --- |
| Engine core | `packages/ai` (`@netscript/ai`) | 2 — zero-dependency contracts + ports + composition root; **no** TanStack/provider SDK in the base entrypoint (`packages/ai/README.md:126-136`; `packages/ai/docs/architecture.md:1-24`) | `Message`/`Tool`/`Usage`/`AgentChunk` contracts, capability ports (telemetry, tools, memory, embeddings, vision, MCP transport, skill loader — each with a no-op/throwing default), the model registry (self-registering providers), the agent loop (`createAgentLoop`, bounded/cancellable typestate machine), the tool system (`defineAiTool`/`createToolRegistry`), and the `render_ui` **wire contract** (generic envelope only). |
| Provider adapters | `packages/ai/anthropic`, `packages/ai/openai-compatible`, `packages/ai/ollama`, `packages/ai/openrouter` subpaths + `src/adapters/*.adapter.ts` | 2 (adapter subset) | Each wraps a TanStack AI provider client and self-registers on import — the exact `@netscript/kv/redis` self-registration pattern (`packages/ai/README.md:42-61`). Bundle-isolated: importing one subpath pulls only that provider's SDK (`provider_isolation_test.ts`). |
| Plugin contract | `packages/plugin-ai-core` (`@netscript/plugin-ai-core`) | 5 (Plugin Package, contract-only half) | The oRPC `/v1/ai` route surface (`chat` SSE stream, `models`, `tools/:name`, `embed`, `transcribe`, `describe`) whose IO schemas are Zod mirrors of the `@netscript/ai` engine vocabulary with compile-time drift guards (`packages/plugin-ai-core/README.md:74-113`). Zero service implementation. |
| Thin plugin | `plugins/ai` (`@netscript/plugin-ai`) | 5 (Plugin Package, connector + scaffolders) | Manifest + `NetScriptPlugin` connector + scaffolders emitting **app-owned** userland glue: `ai/ai.ts` (composition root), `ai/models.ts`, `ai/routes/chat-stream.ts`, `ai/routes/chat.tsx`, `ai/tools/echo.ts`, `ai/agents/assistant.ts` (`plugins/ai/README.md:57-69`). No copied framework source — a typed wrapper importing the installed dependency (Mandate: scaffold-surface-typesafe-codegen). |
| Fresh UI/runtime seam | `packages/fresh/src/runtime/ai/` (`@netscript/fresh/ai`) | 3 (Runtime/Behavior, subset) | The durable-chat runtime plane: `createNetScriptChatConnection`, `toNetScriptChatResponse`, `resolveChatSnapshot` + the **one-projection law** (`projectChatSnapshot` must be the single reducer both SSR seed and live `useChat` route through) (`packages/fresh/src/runtime/ai/mod.ts:1-73`), plus `createNetScriptChatStreamProxy` and an MCP sandbox subpath. |

This is materially the same shape the plugin re-architecture v2 mandate calls for (fat core / thin
plugin / provider adapters as leaves) — the suite is not greenfield, it is partially-built and needs
grounding + gap-closing, not a redesign.

## 2. Where each piece of eis-chat's pattern belongs

Walking the extraction file section by section:

- **§1 (TanStack AI chat/agent substrate)** → belongs entirely in `@netscript/ai`'s agent layer
  (`src/agent/`) and provider adapters (`src/adapters/`). eis-chat itself does *not* use
  `@netscript/ai` (it predates it and calls `@tanstack/ai`'s `chat()` directly) — but the shape it
  exercises (per-model provider resolution, provider-native reasoning/token-cap options, BYOK
  override, fail-loud-on-missing-key, token-budget history truncation) is exactly the surface
  `createAgentLoop` + the provider adapters + a `HistoryStrategy` are meant to own. **Grounding
  verdict: correct layer, capability gap** — see `analysis/F-ai/02-flagship-quality-gap-vs-eis-
  chat.md` for what's thin today (reasoning-effort passthrough, BYOK, token-budget history).
- **§2 (native MCP client pool)** → the transport-selection/pooling logic (stdio vs HTTP by env,
  shared singleton, `ui://` resource passthrough) is **engine-core** behavior — it belongs in
  `@netscript/ai`'s `src/mcp/` (which already has `createMcpTransport` for stdio/streamable-http,
  `packages/ai/src/mcp/application/factory.ts:1-21`) and its `McpTransportPort` seam. What eis-chat
  additionally has that the core does not: multi-server **pooling** with a shared/keep-alive
  connection reused across the chat turn and an interactive widget-call handler, and `ui://` resource
  extraction feeding a generative-UI renderer. The pooling/keep-alive shape is core-worthy (a
  convention every AI-using app needs); the desktop stdio-lazy-import landmine (§2, mcp.ts:21-28) is
  a documented gotcha the core's stdio adapter should absorb or at least flag in its own doc comment
  so downstream plugin authors don't rediscover it.
- **§3 (VIF→CSB system prompt + generative-UI catalog)** → the **system prompt content** is app-
  specific (never belongs in the framework). The **generative-UI wire contract and renderer
  mechanism** is the framework-worthy part, and it is split correctly today but incomplete: the core
  ships only a generic `{ component, props, title }` envelope (`packages/ai/src/tools/domain/render-
  ui.ts:20-32`) — "deliberately carries no design vocabulary... the enumerated component set and the
  renderer land in the fresh-ui slices" (render-ui.ts:5-9). That downstream renderer is the
  `@netscript/fresh/ai` MCP-sandbox subpath, which is **currently an FA0 skeleton stub** throwing
  `"not implemented (FA0 skeleton)"` on every symbol (`packages/fresh/src/runtime/ai/sandbox.ts:17-
  28, 56-60`). eis-chat's actual 30+-component recursive tree renderer (`UiBlock`/`parseUiSpec`,
  proven in production via the design-gallery fixture) has no framework-side counterpart yet — this
  is the single largest capability gap (detailed in `02-flagship-quality-gap-vs-eis-chat.md`).
- **§4 (skills, progressive disclosure)** → the core already names this seam (`SkillLoaderPort`,
  `packages/ai/src/ports/skill-loader.ts`) but ships only a no-op loader, and `plugins/ai`'s README
  explicitly defers `--mcp`/skill-loader scaffolding ("tracked in #290"; `plugins/ai/README.md:85-
  88`). eis-chat's L1/L2/L3 loading model, tag/semantic auto-trigger, and `use_skill`/
  `read_skill_resource` tools are a real, working reference implementation the eventual core loader
  should be grounded against — but the *storage* (`SkillsContractV1` service, embeddings-based
  semantic match) is app/service-shaped, not core-shaped; the core's job is the **port contract**
  (load/trigger/inject) plus maybe a filesystem-backed reference loader, not a skills database.
- **§5 (memory recall)** → `AgentMemoryPort.recall?` is already named as an **optional**, explicitly
  deferred seam ("E10... intentionally NOT built here"; `packages/ai/src/ports/memory.ts:1-11, 49-
  55`). eis-chat's distilled-write + top-k-recall-injected-into-system-prompt pattern is exactly what
  E10 should implement against — grounding confirms the seam shape (append/load base + optional
  recall) is right; only the recall adapter is missing.
- **§6 (durable session persistence, dual-write)** → this is squarely `@netscript/fresh/ai`'s job,
  and the doctrine comment there (the "ONE-PROJECTION LAW", `packages/fresh/src/runtime/ai/mod.ts:38-
  57`) reads as a direct generalization of eis-chat's own `lib/chat-render.ts` doc comment ("keeping
  the projection here... means the seed and the live path can never drift into different shapes",
  extraction §3 / chat-render.ts:13-15) and its `tapForSeed` dual-write mechanism (extraction §6).
  **This is the best-grounded slice in the whole suite** — FA1/FA2 are landed and the doctrine
  explicitly encodes the lesson eis-chat's own #52 regression taught it. No material gap here beyond
  finishing FA3 (the MCP sandbox, see §3 above).
- **§7 (OTel span nesting)** → out of scope for this cell (Topic-B owns it); the seam is
  `TelemetryPort` (`packages/ai/src/ports/telemetry.ts`), explicitly a no-op with "the real
  OpenTelemetry-backed adapter is slice E9 (`@netscript/telemetry`)... injected... MUST NOT be
  imported here" (telemetry.ts:1-9) — correct seam shape, adapter wiring is Topic-B's concern.

## 3. What the thin `plugins/ai` surface should look like (grounded, not sketched from scratch)

`plugins/ai` already emits the right shape of file (`ai/ai.ts` composition root, `ai/models.ts`,
`ai/routes/chat-stream.ts`, `ai/routes/chat.tsx`, starter tool/agent stubs —
`plugins/ai/README.md:57-69`). Grounded against eis-chat, the scaffolded surface should grow (not
restructure) to cover:

1. A scaffolded **MCP pool composition point** (`ai/mcp.ts` or similar) once the core's pooling +
   `ui://` extraction lands — mirroring eis-chat's `lib/mcp.ts` shape (per-server transport config,
   shared singleton, keep-alive) as app-owned glue, not copied framework source.
2. A scaffolded **reasoning/BYOK model resolver** once the core's provider adapters expose a
   `modelOptions`-shaped reasoning passthrough — mirroring eis-chat's `buildChat`/`resolveProvider`
   shape (`ai/models.ts` already exists as the file to extend, not a new file).
3. Once `@netscript/fresh/ai`'s generative-UI renderer (FA3 + the design-vocabulary component set)
   lands, a scaffolded **system-prompt fragment or builder** documenting the component catalog the
   installed renderer supports — this is the one place app-specific prompt content and
   framework-owned renderer contract meet, and it should stay a *scaffolded, editable* file (per the
   plugin's own "each emitted file is yours" law, README.md:77-79), never a hidden framework default.
4. Skills and memory-recall scaffolders are correctly deferred (`#290`) until the core ports above
   grow real (non-no-op) reference adapters — scaffolding a seam with no working implementation
   behind it would violate A2 (simple over easy at published boundaries): it's easier to ship an
   empty stub than to be honest that the capability isn't real yet, and the doctrine mandate is to
   resist that shortcut.

## 4. Cross-topic seams (handshake points for the supervisor)

- **→ Topic-B (GenAI telemetry spans)**: `TelemetryPort` (`packages/ai/src/ports/telemetry.ts`) is
  the injection seam Topic-B's `@netscript/telemetry` adapter must fill; eis-chat's `chat.turn` /
  `chatOtelMiddleware` GenAI-semconv spans / `kb.search` / `durable.write` span nesting
  (extraction §7, and the full map in `analysis/B-telemetry/eis-chat-real-pipeline-map.md`) is the
  reference shape that adapter should reproduce. No code change needed in this cell — flagging the
  seam so Topic-B's plan explicitly names `@netscript/ai`'s `TelemetryPort` as a consumer, not just
  `@netscript/telemetry`'s own surface.
- **→ Topic-A dashboard AI panel / open fork OF-6 (AI-invocation)**: a dashboard AI panel that lets a
  user invoke AI capability from the NS One dashboard shell is a **consumer** of the same `/v1/ai`
  oRPC contract (`packages/plugin-ai-core`) and the `@netscript/fresh/ai` chat-connection surface —
  it is not a new AI surface. The panel should compose `createNetScriptChatConnection` /
  `resolveChatSnapshot` (already landed, FA1/FA2) the same way a scaffolded `plugins/ai` chat island
  would, rather than growing a parallel dashboard-specific chat client. If OF-6 needs
  dashboard-triggered tool invocation (not just a chat surface), that maps onto the plugin-ai-core
  `invokeTool` route (`POST /tools/{name}`, README.md:82) — already contract-shaped for this use, no
  new route needed. Flag for Topic-A: confirm whether OF-6's "AI-invocation" scope is chat-shaped
  (use FA1/FA2) or single-tool-call-shaped (use `invokeTool`) before design locks — the two have very
  different UI shapes (a chat pane vs. a triggered action + result card).
