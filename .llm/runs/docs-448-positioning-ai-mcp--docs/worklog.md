# Worklog — docs/448-positioning-ai-mcp (issue #448, D9)

Branch: `docs/448-positioning-ai-mcp` from `7f7ed76be66fbfcf1133f7c4bcab33737aa09c78`.
Slice: AI-stack + MCP positioning stories (`docs/site/ai/{index,mcp}.md`) plus elimination of the
stale "arrives from 0.0.1-beta.2 / publish:false" claims in `ai/engine.md` and `ai/durable-chat.md`.

## Gate pre-flight (proposal §3.5 verification obligation)

The issue was GATED on `@netscript/ai` publish state. Verified satisfied:

| Check | Command | Result |
|---|---|---|
| `@netscript/ai` published | `curl jsr.io/@netscript/ai/meta.json` | `0.0.1-beta.7` present (2026-07-11T12:10:53Z) |
| Engine root surface | `deno doc jsr:@netscript/ai@0.0.1-beta.7` (scratch config, `minimumDependencyAge: "0"`) | `createAiRuntime` / `getAiRuntime` / model registry confirmed |
| `@netscript/plugin-ai` published | JSR meta.json | `0.0.1-beta.7` present |
| `@netscript/plugin-ai-core` published | JSR meta.json | `0.0.1-beta.7` present |
| `@netscript/fresh` beta line | JSR meta.json | `0.0.1-beta.7` present |
| `@netscript/fresh-ui` published | JSR meta.json | `0.0.1-beta.7` present, exports `./ai/render-ui` |

Per proposal §3.5's owner lever: the engine has shipped, so engine content becomes present-tense
(no more caveated forward-ref for the engine itself).

## Plan

1. `ai/mcp.md` — fill the #433 stub with the D9 MCP story: elevator pitch → story spine →
   mechanism (transports / auth / pool / registry registration / `ui://` render path, all
   deno-doc-traceable) → one factual competitor comparison (Encore MCP blog, direction inverted:
   Encore ships an MCP *server* for its backend; NetScript's shipped surface is an MCP *client*
   stack) → cross-links. Explicit non-claim: no scaffolded NetScript MCP server.
2. `ai/index.md` — story-template pass (pitch, spine, one factual comparison: Medusa
   agents-as-operators / Convex agent-building-blocks vs NetScript's published-layer stack);
   replace the stale "beta.2-pending" callout with the beta.7 shipped state; fix
   `/capabilities/*` redirect-stub links to canonical pillar paths; add the MCP card; correct the
   `netscript generate ai` claim (codegen NOT shipped — CLI `generate` targets today are
   `plugins`, `runtime-schemas`, `aspire`).
3. `ai/engine.md` — replace the "Available from 0.0.1-beta.2 / not published" callout with the
   published beta.7 state; rewrite "Generated runtime registries" as a clearly-caveated
   forward-reference (codegen unshipped); fix the "beta.2 engine" featureGrid copy; link the MCP
   transports section to the new story page.
4. `ai/durable-chat.md` — drop the "beta.2 engine" phrasing; badge alpha → beta.

## API-claim verification table (every present-tense symbol claim on the new/edited prose)

All via `deno doc jsr:@netscript/ai@0.0.1-beta.7[/<subpath>]` in a scratch dir with
`minimumDependencyAge: "0"` unless noted.

| Claim (page) | Verification | Found |
|---|---|---|
| Export map `.` `./contracts` `./ports` `./tools` `./agent` `./mcp` `./anthropic` `./openai-compatible` `./openrouter` `./ollama` `./openai-embeddings` `./testing` (index, engine) | `0.0.1-beta.7_meta.json` exports | yes — exact match |
| `createMcpTransport(config: McpTransportConfig): McpTransportPort` (mcp) | `deno doc .../mcp` | yes |
| `McpTransportConfig` discriminants `stdio` / `streamable-http`; `MCP_TRANSPORT_KINDS` (mcp) | `deno doc .../mcp` | yes |
| `StreamableHttpMcpTransport` "Reconnectable Streamable-HTTP MCP transport"; `McpBackoffConfig`; `McpConnectionState = disconnected\|connecting\|connected\|reconnecting\|closed`; `onStateChange`/`McpStateChangeHandler` (mcp) | `deno doc .../mcp` | yes |
| `McpAuthConfig` = `none` / `api-token {token, headerName?, scheme?}` / `oauth {accessToken, tokenType?}` (mcp) | `deno doc .../mcp` | yes |
| `createMcpTransportPool(config)` "multi-server MCP pool from serializable transport configs"; `McpTransportPool` members `serverId`, `state`, `serverIds`, `server()`, `connect()` "prefixed tool descriptors", `reconnect()`, `listTools()` "without tearing down warm connections", `callTool()` "Call a prefixed pooled tool name and extract ui:// resources", `onStateChange`, `stop()`; `createMcpTransportPoolFromTransports` (mcp) | `deno doc --filter McpTransportPool .../mcp` | yes |
| `McpPooledToolResult extends McpToolResult` with `uiResources` (mcp) | `deno doc .../mcp` + `packages/ai/README.md` §MCP ("pooled tool results surface embedded ui:// resources as uiResources") | yes |
| `registerMcpTools(registry, transport)` → `McpToolRegistration { toolNames, stop() }` (mcp, engine) | `deno doc .../mcp` (module example + `McpToolRegistration` "Handle returned by registerMcpTools") | yes |
| `extractMcpUiResources(result): readonly McpUiResource[]` "data-only ui:// resources" (mcp) | `deno doc .../mcp` | yes |
| `createToolRegistry` / dispatch (mcp example) | `deno doc .../tools` (prior pass) + README | yes |
| Agent-loop telemetry: injected `TelemetryPort`, `gen_ai.chat` run span, `gen_ai.chat.turn` per-turn span, `gen_ai.tool.call` events (index) | `packages/ai/README.md` §"Agent telemetry (injected TelemetryPort)" (canonical README, PR #610) | yes |
| `createAiRuntime` pure wiring / `getAiRuntime` singleton (index, engine — pre-existing prose retained) | `deno doc jsr:@netscript/ai@0.0.1-beta.7` | yes |
| `@netscript/fresh-ui` `./ai/render-ui`: `RenderUiSurface`, `renderUiPayload`, `RENDER_UI_MAX_DEPTH = 6`, block types `stack\|grid\|section\|chart\|metric\|table\|list\|card`, fallback reasons `max-depth\|unknown-type\|invalid-node` (mcp/index cross-refs) | `deno doc jsr:@netscript/fresh-ui@0.0.1-beta.7/ai/render-ui` | yes |
| `McpUiWidget` island installs via the fresh-ui copy registry (`netscript ui:add ai`) (mcp) | `packages/fresh-ui/registry/islands/McpUiWidget.tsx` + `registry.manifest.ts`; `ui:add` in `packages/cli/src/public/features/ui/add/` | yes |
| `createMcpSandboxHandler` on `@netscript/fresh/ai/sandbox` (mcp cross-ref; durable-chat prose pre-existing) | existing durable-chat page + `@netscript/fresh@0.0.1-beta.7` published | yes |
| `netscript generate ai` NOT shipped (engine, index corrections) | `ls packages/cli/src/public/features/generate/` → `aspire`, `plugins`, `runtime-schemas` only | confirmed absent |
| No scaffolded NetScript MCP server (mcp non-claim) | context pack (#448 comment) + no server surface in `deno doc .../mcp` | confirmed absent |
| CLI E2E merge gate exercises a real streamable-HTTP MCP round trip into `McpUiWidget` (mcp proof line) | context pack (PR #600 / FAI-9, `scaffold.runtime` gate) | yes |

## Competitor comparisons (one per page, factual)

- `ai/index.md`: Medusa (agents-as-first-class-operators hero + Build/Optimize/Operate blog) and
  Convex ("backend building blocks for your agents") — shape comparison only, no multipliers, no
  superlatives, sourced from `research/D-positioning/competitor-teardown.md` (not `_plan/*`).
- `ai/mcp.md`: Encore MCP-server blog — factual direction contrast (server-side introspection vs
  NetScript's client-side consumption), no borrowed numbers.

## Resumption (predecessor died mid-flight on spend limit)

Predecessor had committed nothing; working tree held finished `ai/{index,mcp}.md` plus this
worklog, but the planned `ai/engine.md` (step 3) and `ai/durable-chat.md` (step 4) edits were
never applied — `git status` showed only index/mcp modified and both files still carried
`beta.2` claims. Resumed in place on branch `docs/448-positioning-ai-mcp`.

Reviewed predecessor `index.md`/`mcp.md`: prose is deno-doc-traceable against the API-claim table,
positioning-law-clean, one comparison per page, correct pillar cross-links. Accepted as-is.

Completed the pillar (this session):

- `ai/engine.md`: replaced the "Available from 0.0.1-beta.2 / not published" `important` callout
  with a `note` "Published in 0.0.1-beta.7" (installable now, zero `@netscript/*` deps); rewrote
  "Generated runtime registries" (which asserted a shipped `netscript generate ai`) as "Wiring tool
  and agent registries" — direct `createToolRegistry`/`createAgentLoop` wiring plus a caveated
  `note` that `generate ai` is NOT in the CLI (shipped targets: `plugins`, `runtime-schemas`,
  `aspire`, confirmed by `ls packages/cli/src/public/features/generate/`); dropped "ahead of the
  beta.2 engine" / "Ships today —" featureGrid framing now that the engine ships.
- `ai/durable-chat.md`: rewrote the "ships and installs today, independently of the [beta.2 engine]"
  sentence to "composes with the [AI engine] but installs independently"; pinned the JSR line to
  `@netscript/fresh@0.0.1-beta.7`.

### Badge decision (deviation from predecessor plan step 4)

Predecessor plan said "badge alpha → beta" on `durable-chat.md`. **Left as `alpha`.** The
`badge.vto` component supports only `stable|alpha|partial` (no `beta` variant — any other value
falls back to muted styling), and the site chrome brands NetScript site-wide as "Alpha software"
(`base.vto`). The badge is a maturity indicator, not a version/availability claim, so it is outside
the stale-`beta.2`/`publish:false` remediation scope and changing it would be both unsupported by
the component and inconsistent with the site framing.

## Evidence

Grep verdicts (whole `docs/site/ai/` pillar), post-edit:

- `beta[.\- ]?2` / `publish.*false` → **(clean)**
- `not published` / `does not resolve` / `arrives in|from` → **(clean)**
- positioning-law (`honest|candor|throughput|fastest|best-in-class|blazing|Nx faster|N% faster`) →
  **(clean)**

`deno task verify` in `docs/site` — **GREEN**:

- build → `🍾 Site built into _site` (500 files, 8.45s)
- `check:links` → `23029 internal links across 162 pages — all resolve`
- `check:caveats` → `27 caveat markers across 22 pages — all references resolve`
