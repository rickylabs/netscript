# eis-chat's real AI usage — extraction (file:line cited)

Read-only investigation against `C:\Dev\repos\netscript-framework\.llm\tmp\eis-chat-ref`. All paths
below are relative to that checkout. This is extraction only — no NetScript-suitability judgment;
see `analysis/F-ai/` for that.

## 1. TanStack AI is the whole chat/agent substrate — no hand-rolled loop

`apps/dashboard/routes/api/chat.ts` is a single Fresh route handler that IS the agent turn. It
imports `chat`, `toolDefinition`, `maxIterations`, `StreamProcessor`, `generateMessageId`, and
`UIMessage` straight from `@tanstack/ai` (chat.ts:2-9). There is no NetScript agent-loop package in
the path at all — eis-chat does not use (and predates) `@netscript/ai`'s `createAgentLoop`.

- The turn is built as one `chat({...})` call (chat.ts:516-540): `adapter` (provider-specific,
  built per-request by `buildChat`), `messages` (system + token-truncated history), `tools` (an
  array mixing an app-owned channel-KB tool + skill tools), `mcp: { clients: [pool] }` (native MCP
  merge), `modelOptions` (provider-native reasoning/token-cap knobs), `middleware:
  [chatOtelMiddleware]`, and `agentLoopStrategy: maxIterations(10)` — TanStack's own agent-loop
  bound, raised from the adapter default of 5 because investigative grounding fans out across
  several tool calls before answering (chat.ts:536-539).
- Multi-provider model resolution is per-model, not per-request-fixed: `resolveProvider(modelId)`
  picks Anthropic / OpenAI / OpenRouter / Ollama per call (chat.ts:121-163), so a single chat surface
  can mix providers turn-by-turn via a model picker.
- **Reasoning/thinking control** is provider-shape-aware, not a generic knob: Claude 4.7+/5 use
  `thinking: { type: 'adaptive' }` + `output_config.effort` (the older `enabled`+`budget_tokens`
  shape is REJECTED by current models); OpenAI/OpenRouter use portable `reasoning.effort`; Ollama
  exposes no reasoning knob at all (chat.ts:100-127, comment block above `buildChat`).
- **Token caps differ by provider wire shape**: OpenRouter's dedicated SDK takes
  `maxCompletionTokens` (camelCase → `max_completion_tokens`), OpenAI-compat/Anthropic adapters take
  `max_tokens` (chat.ts:149-161) — `modelOptions` is spread verbatim into the request body, so the
  wrong shape 400s.
- **BYOK (#120)**: per-provider API keys and an Ollama base-URL override come from a Settings store
  (`lib/provider-settings.ts`), resolved async and passed as overrides into the sync `lib/llm.ts`
  resolvers so that module stays free of the async store (chat.ts:116-119, 144-146).
- **Fail-loud on missing config**: a missing provider key or unreachable Ollama host returns a clear
  HTTP 503 with an actionable message, never a silent blank stream (chat.ts:394-419).
- **Context-window management**: `truncateHistory` walks newest→oldest and keeps messages until an
  input-token budget (`EISCHAT_HISTORY_TOKEN_BUDGET`, default 48,000, ~4 chars/token estimate) is
  exhausted, always keeping at least the current user turn (chat.ts:229-273). This mirrors Onyx's
  `construct_message_history` per the inline comment (chat.ts:231).

## 2. Native MCP client pool — grounding + generative widgets, zero hand-rolled adaptation

`apps/dashboard/lib/mcp.ts` builds the MCP surface entirely on `@tanstack/ai-mcp`'s
`createMCPClients`, replacing an earlier hand-rolled `Client` + `StdioClientTransport` +
`jsonSchemaToZod` + `mcpTools()` stack (mcp.ts:1-11, doc comment).

- Two servers are pooled: `legacy-archeo` (grounded estate facts/metrics + a flow-health widget) and
  `excalidraw` (an interactive diagram widget, #51) (mcp.ts:38-42, 109-112).
- **Per-server transport switching (#60)**: Streamable HTTP when Aspire injects the service URL
  (`LEGACY_ARCHEO_MCP_URL` / `EXCALIDRAW_MCP_URL`), else a stdio child (`deno run -A
  tools/<server>.ts`) for bare `deno task dev` (mcp.ts:89-100).
- **Windows/desktop landmine, worked around**: the stdio transport module is *lazily* `import()`ed
  only inside the stdio branch, never statically, because its transitive `cross-spawn → which →
  isexe` chain does a top-level `require("./windows.js")` that the `deno desktop` CEF bundler
  flattens to eager module-init without emitting the sibling file — a static import would crash
  desktop launch with `MODULE_NOT_FOUND` (mcp.ts:21-28).
- **OTel propagation into the stdio child**: `childEnv()` injects the OTLP exporter env vars
  (`getOtelEnvVars()`) plus the active trace context (`injectContext(env)`) into the spawned MCP
  subprocess so its own tracer's spans link to the parent turn — best-effort, built once at
  pool-creation time (mcp.ts:57-79).
- **Shared singleton pool**: `mcpPool()` is a module-level lazy singleton reused by both the chat
  turn (`chat({ mcp: { clients: [pool] } })`, `connection: 'keep-alive'`) and the interactive widget
  call handler (`createMcpAppCallHandler`), so tool discovery and widget round-trips hit the same
  connected server (mcp.ts:122-145; chat.ts:522-527).
- **`ui://` widget resources** surfaced by a tool call are native AG-UI `ui-resource` events — no
  hand-rolled adaptation; `toRenderParts` (lib/chat-render.ts:97-115) carries the resource + tool
  linkage through unchanged so `ChatPane` can mount the widget or fall back to a readable summary.
- The per-server transport descriptor map (`MCP_SERVER_TRANSPORTS`) is exposed separately so an
  independent MCP-status probe view can build one client per server without the shared pool's
  all-or-nothing connect failure mode (mcp.ts:102-119).

## 3. VIF→CSB investigative-assistant domain and generative-UI component catalog

The system prompt (chat.ts:165-227) frames eis-chat as "an investigative assistant for the Eisberg /
Sylvain & CO legacy production estate (VIF, PROSCO, MONTHOR)" whose primary use case is diagnosing
the VIF→CSB legacy-migration estate (`docs/PRODUCT.md:6-11, 38, 45, 64-93` — channel `#vif-to-csb`,
`legacy-archeo` MCP queries VIF program/table/cmd/file lineage cross-referenced against CSB ERP docs
to produce a port-surface/blast-radius report; described as "the killer use case").

- **Grounding discipline**: "Never invent hosts, tables, or flows" — the model is told to ground via
  the `legacy-archeo` estate lookup, an estate-metrics tool, and channel KB search before answering
  (chat.ts:168-172).
- **Native block types (#54)**: for a single simple dataset the model emits one of four fenced
  blocks — ` ```chart ` (bar/column/line), ` ```donut `, ` ```table `, ` ```stats ` — each a compact
  JSON payload (chat.ts:173-180).
- **Generative native UI (#68, "Child B")**: for anything richer the model composes ONE nested
  component tree in a single ` ```ui ` fence — `{"type": "...", ...props, "children": [...]}` — with
  a documented catalog of 30+ component types spanning layout (`stack`, `row`, `grid`, `card`,
  `section`, `split`, `tabs`, `accordion`), visualization (`chart`, `donut`, `area`, `sparkline`,
  `gauge`, `stat`, `progress`, `heatmap`), data (`table`, `keyvalue`, `timeline`, `list`, `tree`,
  `kanban`), a **domain-native** `flow` component for hop-by-hop pipeline/status health, feedback
  (`badge`, `callout`), interactive elements (`button` — clicking sends its `prompt` as the next
  user message; `toggle`, `link`, `copy`), and content (`text` with `[n]` citation rendering,
  `heading`, `code`, `divider`, `icon`, `image`, `avatar`) (chat.ts:181-217).
- **HTML escape hatch (#68, "Child C")**: only when no native component/composition can express a
  bespoke visual, the model emits ONE ` ```widget ` fence with a complete self-contained HTML
  document, rendered in a hard sandbox with **zero network** (no external scripts/styles/fonts/
  images, no fetch), themed via `var(--ns-*, <fallback>)` design tokens, capped at 32KB
  (chat.ts:219-225).
- **Design discipline instructions** are explicit in the prompt: lead with a stat-card grid, group
  charts/tables in cards or a split, one callout for the key insight, finish with 2-3 follow-up
  buttons; ground every number in real tool/KB results (chat.ts:211-217).
- **Client-side rendering**: `parseUiSpec` sanitizes/validates the emitted tree; the recursive
  `UiBlock` renderer mounts it; `HtmlBlock` mounts the sandboxed escape hatch
  (`apps/dashboard/routes/(design)/design/(_islands)/GenerativeUiDemo.tsx:1-16` mounts "the REAL
  production pipeline" for a design-gallery fixture, confirming this is not aspirational — the same
  renderer used in production chat is exercised there).
- The projection from TanStack's native `UIMessage.parts` to eis-chat's flat `RenderPart` shape
  (`text`/`reasoning`/`tool-call`/`tool-result`/`ui-resource`/`skill`) is centralized in
  `lib/chat-render.ts:36-54, 66-131` and consumed identically by the server-side seed snapshot
  (chat.ts:296-354) and the client-side live fold (`islands/ChatPane.tsx`) — "keeping the projection
  here (not duplicated) means the seed and the live path can never drift into different shapes"
  (chat-render.ts:13-15).

## 4. Skills — progressive-disclosure expertise loading (#69)

`apps/dashboard/lib/skills.ts:1-21` documents an L1/L2/L3 loading model "mirrors Claude-native Agent
Skills + TanStack lazy-tools":

- **L1** — metadata catalog (name + description) of every enabled, in-scope skill is always injected
  into the system prompt (cheap).
- **L2** — the full `SKILL.md` body loads on trigger: either AUTO (tag keyword match or embedding
  semantic proximity, resolved server-side by the eischat service) or ON DEMAND via a `use_skill`
  tool.
- **L3** — bundled resource files load only when the model calls `read_skill_resource`.
- Channel-scoped: `resolveForTurn` filters server-side so out-of-scope skills never reach the
  context; fully fail-soft (a skills-store outage degrades to a turn without skills, never a broken
  chat) (skills.ts:18-20).
- Backed by a real typed service contract: `skillsServiceClient` is a `createServiceClient` against
  `SkillsContractV1` from `@eis-chat/contracts`, routed at `serviceName: 'eischat'`,
  `routerName: 'skills'` (skills.ts:24-34) — not an in-process stub.
- Triggered skills persist as `skill`-typed `RenderPart`s alongside the settled turn so a "Context"
  rail can show which skills fired and survive reload (chat.ts:499-509; chat-render.ts:46-54).

## 5. Memory recall — distilled, durable, channel-scoped

Separate from the transcript/history budget (`truncateHistory`), eis-chat runs a **memory** layer:

- Before a turn, `channelServiceClient.recallMemory({ channelId, query, k: 5 })` fetches the top-k
  relevant distilled memories for the user's text and injects a compact "relevant context recalled
  from this channel's memory" block into the system prompt — fail-soft, never blocks the turn
  (chat.ts:464-488).
- After a turn, the user's message (if ≥24 chars) is distilled and written via
  `channelServiceClient.writeMemory({ channelId, content, category: 'user', sessionId, source:
  'chat-turn' })`, fully fail-soft (chat.ts:554-571).
- This is explicitly named as "the primary context strategy" with token-budget truncation as "the
  fallback cap" (chat.ts:234).

## 6. Durable session persistence — dual-write, not app-state

- The route is documented as "the durable PRODUCER": the native transport
  (`toDurableChatSessionResponse` from `@durable-streams/tanstack-ai-transport`) echoes the user turn
  and pipes the assistant AG-UI stream into the session's durable stream; the client reads it live
  via `durableStreamConnection`'s `subscribe()` — the client renders from its own read subscription,
  not from the POST response body (chat.ts:367-373, 596-625).
- **Separately**, both turns are mirrored into a per-channel tursodb via `channelServiceClient
  .createMessage(...)` — the cold-load seed source for the page loader's `listMessages` — best-effort
  and never blocking the turn (chat.ts:295-302, 542-594).
- `tapForSeed` taps the same AG-UI stream with TanStack's native `StreamProcessor` to snapshot the
  *settled* assistant turn without altering it in flight, and explicitly concatenates **every**
  assistant message's `RenderPart`s (not just the last) — a #52 regression fix, because a tool loop
  can split one turn into multiple assistant messages and an earlier bug dropped a tool-call
  card/widget that landed in a non-final message (chat.ts:303-354, comment block).

## 7. Full-turn OTel instrumentation (cross-ref Topic-B)

`chat.ts` wraps the whole turn in a root `chat.turn` span continuing the browser's trace via
`parentFromRequest` (chat.ts:439, 448 `{ parentContext }`), nests `chatOtelMiddleware`'s native
GenAI-semconv spans (`chat <model>`, `chat <model> #N`, `execute_tool <name>`) inside it
(chat.ts:44-48 per `analysis/B-telemetry/eis-chat-real-pipeline-map.md` §2a.2), records a `kb.search`
child span with degrade-on-failure attributes (chat.ts:55-83), and a `durable.write` PRODUCER child
span around the durable-stream write (chat.ts:604-625). See
`analysis/B-telemetry/eis-chat-real-pipeline-map.md` for the full cross-process trace map; this
document does not repeat it.

## 8. Sources read this pass

`apps/dashboard/routes/api/chat.ts`, `apps/dashboard/lib/{mcp.ts,chat-render.ts,skills.ts,
llm.ts,models.ts}`, `apps/dashboard/routes/(design)/design/(_islands)/GenerativeUiDemo.tsx`,
`docs/PRODUCT.md`. Not read in depth this pass (flagged, not claimed): `islands/ChatPane.tsx` (client
fold — referenced via `chat-render.ts`'s doc comment, not independently opened),
`islands/McpPanel.tsx`, `apps/dashboard/routes/api/mcp-apps/call.ts` (interactive widget call
handler — referenced by name in `mcp.ts` comments, not opened), `components/ui/mcp-widget.tsx`,
`tools/legacy-archeo-mcp.ts` internals (covered by the Topic-B pipeline map instead).
