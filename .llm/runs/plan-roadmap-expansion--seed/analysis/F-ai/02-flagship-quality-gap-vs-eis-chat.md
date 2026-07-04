# Flagship-quality gap — `@netscript/plugin-ai` stack vs. eis-chat's real capabilities

Mandate on record (`ai-plugin-flagship-quality-mandate` memory): `@netscript/plugin-ai` MUST be
state-of-the-art and meet-or-exceed reference plugins; "thin" is a shape constraint, not a quality
ceiling. This file enumerates concrete, evidenced gaps between what the current suite
(`packages/ai`, `packages/plugin-ai-core`, `plugins/ai`, `packages/fresh/src/runtime/ai`) offers
today and what eis-chat's production chat surface actually does. Each gap cites the current-state
file and the eis-chat evidence (via `context/F-ai/01-eis-chat-ai-usage-extraction.md`).

## Top 5 gaps (ranked by user-visible impact)

### 1. No generative-UI design vocabulary or renderer — only a generic single-component envelope

- **Current state**: `renderUiTool`'s input is `{ component: string, props?, title? }` — "carries no
  design vocabulary... the enumerated component set and the renderer land in the fresh-ui slices"
  (`packages/ai/src/tools/domain/render-ui.ts:5-9, 20-32`). The intended downstream renderer,
  `@netscript/fresh/ai`'s MCP-sandbox subpath, is a **literal FA0 skeleton**: every exported function
  throws `"not implemented (FA0 skeleton)"` (`packages/fresh/src/runtime/ai/sandbox.ts:17-28, 56-60`).
- **eis-chat reference**: a model composes a full recursive component **tree** (not one component)
  in a single ` ```ui ` fence, drawn from a 30+-type catalog spanning layout, visualization
  (chart/donut/area/sparkline/gauge/stat/heatmap), data (table/tree/kanban/timeline), a
  domain-native `flow` component, interactive elements that drive the next conversation turn
  (`button`), and a hard-sandboxed zero-network HTML escape hatch for one-off visuals — proven in
  production and independently exercised by a design-gallery fixture
  (extraction §3; `chat.ts:181-225`; `GenerativeUiDemo.tsx:1-16`).
- **Gap**: the framework has a wire contract for "please render *a* component" but no shipped
  vocabulary of components, no recursive tree renderer, and no sandboxed HTML fallback. This is the
  single largest capability delta — it's the difference between "an AI can call one widget" and "an
  AI can compose a dashboard."

### 2. MCP is a single-transport port, not a pooled, multi-server, widget-aware client

- **Current state**: `createMcpTransport` builds one stdio-or-HTTP transport from a discriminated
  config (`packages/ai/src/mcp/application/factory.ts:1-21`); there is no pooling primitive, no
  keep-alive-across-turns sharing, and no `ui://` resource extraction wired to the render-ui seam.
- **eis-chat reference**: `createMCPClients` (native `@tanstack/ai-mcp`) pools multiple servers keyed
  by id, auto-prefixes tool names, extracts linked `ui://` widget resources as native AG-UI
  `ui-resource` events, and is shared as a `keep-alive` singleton across both the chat turn and a
  separate interactive widget-call handler so tool discovery and widget round-trips hit the same
  connected server (extraction §2; `mcp.ts:20-145`).
- **Gap**: no NetScript-owned pooling/sharing convention exists yet, so every `plugins/ai` consumer
  that wants >1 MCP server or widget round-trips would have to hand-roll what eis-chat already
  replaced its own hand-rolled version *of* (mcp.ts's doc comment: the old raw-SDK adaptation "is
  gone"). Building this once in the core avoids every downstream app reinventing it worse.

### 3. Skills (progressive-disclosure expertise) is a no-op port with no reference loader

- **Current state**: `SkillLoaderPort` is named but the only implementation is
  `createNoopSkillLoader` — "no skills are ever returned" (`packages/ai/src/ports/skill-loader.ts:37-
  49`); `plugins/ai`'s own README lists skill-loader scaffolding as explicitly deferred (`#290`,
  README.md:85-88).
- **eis-chat reference**: a working L1/L2/L3 progressive-disclosure system — always-on metadata
  catalog, auto-trigger via tag match or embedding semantic proximity, on-demand `use_skill`/
  `read_skill_resource` tools, channel-scoped filtering, full fail-soft degradation, and triggered-
  skill provenance persisted with the settled turn for a UI "Context rail" — backed by a real typed
  service contract (extraction §4; `skills.ts:1-50`).
- **Gap**: this is a documented, working differentiator pattern (explicitly modeled on Claude-native
  Agent Skills) with zero framework-side reference implementation. Even a filesystem-backed reference
  loader (skip the semantic-embedding tier initially) would close most of the gap and give
  `plugins/ai` a real "Skills" story instead of a deferred TODO.

### 4. No reasoning-effort / provider-native `modelOptions` passthrough convention, and no BYOK seam

- **Current state**: `ChatClientPort.stream(request, { signal })` yields an owned event union; the
  README shows constructing a chat client and streaming, but neither the port surface nor the two
  shipped adapters (`packages/ai/src/adapters/{anthropic,openai-compatible}.adapter.ts`) document or
  test a per-call, provider-shape-aware reasoning/effort or token-cap options bag comparable to
  eis-chat's `modelOptions`. There is no BYOK (bring-your-own-key) resolution seam at all — the
  provider factories take a static `apiKey`/`baseURL` at construction (`packages/ai/README.md:69-105`).
- **eis-chat reference**: `buildChat`/`reasoningModelOptions` resolve the *correct wire shape per
  provider* (Anthropic adaptive-thinking + effort vs. OpenAI/OpenRouter `reasoning.effort` vs.
  OpenRouter's distinct `maxCompletionTokens` token-cap key), reject the deprecated Anthropic
  `enabled`+`budget_tokens` shape models now 400 on, and resolve per-provider keys + an Ollama base
  URL from a live Settings store that overrides env defaults per request (extraction §1; chat.ts:87-
  163).
- **Gap**: getting the reasoning/token-cap wire shape wrong is a silent-400 or truncation bug class;
  eis-chat had to learn this the hard way (the inline comments read as scar tissue from exactly that
  class of bug). The core provider adapters should absorb this per-provider mapping once, so every
  `plugins/ai` consumer gets it for free instead of rediscovering it. BYOK is a materially different
  deployment shape (multi-tenant, user-supplied keys) the current construction-time-only config
  cannot express without an app hand-rolling its own override layer.

### 5. Memory recall (distilled, relevance-scored context injection) has a named seam and zero adapter

- **Current state**: `AgentMemoryPort.recall?` is optional and explicitly unbuilt — "Relevance recall
  (E10)... intentionally NOT built here. Downstream loops MUST treat `recall` as possibly-absent"
  (`packages/ai/src/ports/memory.ts:1-11, 49-55`; `packages/ai/docs/architecture.md:33, 49`).
- **eis-chat reference**: before every turn, top-k relevant distilled memories are recalled and
  injected as a "relevant context" system-prompt block; after every turn, the user's message is
  distilled and written back — both fully fail-soft, and explicitly named as "the primary context
  strategy" (vs. token-budget truncation as only "the fallback cap") (extraction §5; chat.ts:234,
  464-488, 554-571).
- **Gap**: this is a working, load-bearing pattern in the reference app that the core has correctly
  seamed but not implemented. Without it, `plugins/ai`'s starter agent only has the `slidingWindow
  History`/token-budget fallback — functionally correct but strictly weaker than the flagship bar for
  any long-running or multi-session channel/thread use case.

## Secondary observations (not top-5, but worth recording)

- **Bundle-isolation and self-registration discipline are already at or above flagship bar.** The
  provider-subpath isolation guarantee (`packages/ai/README.md:126-136`, enforced by
  `tests/provider_isolation_test.ts`) and the `@netscript/kv/redis`-mirrored self-registration
  pattern are arguably *more* disciplined than eis-chat's own direct `@tanstack/ai` usage (eis-chat
  has no bundle-isolation concern because it's an app, not a published package) — this is a place
  the framework should not regress trying to "match" eis-chat, since the constraint (zero-dependency
  core, JSR-published) doesn't apply to the reference app.
- **The durable-chat/one-projection design (`@netscript/fresh/ai` FA1/FA2) is already well-grounded**
  against eis-chat's own hard-won lesson (its #52 regression: a naive seed/live divergence dropped
  tool-call cards and widgets on reload) — see `analysis/F-ai/01-archetype-thin-plugin-vs-fat-core-
  grounding.md` §2. This is not a gap; it is a place the core already encodes eis-chat's lesson as an
  invariant rather than merely copying its output shape.
- **Tool system (`defineAiTool`/`createToolRegistry`) and the agent-loop typestate machine
  (idle→running→awaiting-tool→done/aborted/errored) are solid, tested primitives** with real
  cancellation (`AbortSignal.any`) and real summed provider `Usage` (no `chars/4` estimation) —
  eis-chat's own agent loop is TanStack's black box by comparison, so `@netscript/ai`'s agent loop is
  arguably *more* introspectable/typed than the reference's own substrate. Worth keeping as a
  differentiator claim once the other four gaps close, not something to weaken to "match" eis-chat.

## Net verdict

The suite's **shape** (contracts/ports/registry core → provider adapters → contract-only plugin
core → thin scaffolding plugin → Fresh runtime plane) is sound and doctrine-aligned; the **gaps are
concentrated in capability depth**, not architecture: generative-UI vocabulary/renderer (gap 1) and
MCP pooling/widgets (gap 2) are the two that most directly gate "does this look and feel like
eis-chat" for an end user, and both currently bottom out in an explicit stub or a single-transport
primitive. Skills (gap 3), reasoning/BYOK passthrough (gap 4), and memory recall (gap 5) are seamed
correctly but unimplemented — each is a scoped, well-understood slice (a reference adapter/loader)
rather than a design problem.
