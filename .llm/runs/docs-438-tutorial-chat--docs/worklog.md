# Worklog — issue #438 (C5): rewrite chat tutorial track (durable AI chat)

Branch: `docs/438-tutorial-chat` from `9be23cce2cf65179df6aea39371f25cbddb55bcb`.
Lane: docs-authoring agent under beta-7 shipping orchestrator (common brief:
`.llm/runs/beta7-ship--orchestrator/docs-briefs/common-brief.md`).

## Pre-flight: `@netscript/ai` publish-state gate (proposal §3.5)

Gate is SATISFIED. Verified against the registry, not guessed:

- `https://jsr.io/@netscript/ai/meta.json` lists `0.0.1-beta.7`
  (createdAt `2026-07-11T12:10:53Z`).
- `deno doc jsr:@netscript/ai@0.0.1-beta.7` (run with a scratch `deno.json`
  setting `minimumDependencyAge: "0"` — the package is younger than Deno 2.9's
  default dependency-age guard; `deno doc` has no `--minimum-dependency-age`
  flag) resolves and renders the full surface. Entrypoints per
  `0.0.1-beta.7_meta.json` exports: `.`, `./anthropic`, `./openai-compatible`,
  `./openai-embeddings`, `./openrouter`, `./ollama`, `./mcp`, `./agent`,
  `./contracts`, `./ports`, `./tools`, `./testing`.

Symbols relied on in prose (all traced to `deno doc` output):

| Claim in rewritten prose | `deno doc` evidence |
| --- | --- |
| engine published on JSR at `0.0.1-beta.7` | registry meta.json + resolving `deno doc` |
| model registry: `registerModelProvider` / `getModel` | root entrypoint functions |
| provider self-registration via `import '@netscript/ai/anthropic'` | `./anthropic` module doc ("Self-registers … registerModelProvider") |
| agent loop: `createAgentLoop` | `./agent` entrypoint |
| tool registry: `defineAiTool` / `createToolRegistry` | `./tools` entrypoint |
| MCP transports (stdio + streamable-http) | `./mcp` entrypoint |
| embedding provider ports (`@netscript/ai/openai-embeddings`) | `./openai-embeddings` entrypoint |
| engine chat clients stream the engine's own event vocabulary | `AnthropicModelProvider.createChatClient` doc: "translated to the owned chat vocabulary internally (no provider-SDK type escapes the public surface)"; `ChatClientPort.stream` → `AsyncIterable<ChatClientEvent>` |

Shipped `@netscript/fresh@0.0.1-beta.7/ai` surface re-verified the same way:
`toNetScriptChatResponse`, `resolveChatSnapshot`, `projectChatSnapshot`,
`createNetScriptChatConnection`, `createNetScriptChatStreamProxy` all present;
`NetScriptChatResponseOptions.source: AsyncIterable<unknown>` "to sanitize and
persist as chunks"; module doc states the plane composes
`@durable-streams/tanstack-ai-transport` + `@tanstack/ai-preact` + `@tanstack/ai`.

## Load-bearing authoring decision

The engine is published, so §3.5's "engine content can become runnable" branch
applies — but only where an integration is actually documented. The durable-chat
plane's chunk log is the TanStack chunk vocabulary
(`@durable-streams/tanstack-ai-transport`; `projectChatSnapshot` reduces the
materialized session), while the engine's `ChatClientPort` streams the engine's
*owned* event vocabulary. No published doc states that engine chat-client events
can be handed to `toNetScriptChatResponse` and reduce correctly. Therefore:

- The track's **runnable model-call spine stays on direct `@tanstack/ai`**
  (unchanged, verified wiring — same as the reference chat app).
- Every `@netscript/ai` mention becomes a **present-tense shipped** statement
  (registry/agent-loop/tools/MCP/embeddings) with cross-links to `/ai/engine/`
  and `/reference/ai/` — no "arrives in beta.2", no `publish:false`, and no
  claim that the engine plugs into this route (undocumented integration).
- Engine runnable content shown = exactly the engine's own documented example
  shape (side-effect provider import + `getModel`), presented as the engine's
  entry seam, not spliced into the durable route.

## Plan (page-by-page)

1. `index.md` — rewrite the "What this track deliberately leaves out" callout:
   scope stays (no MCP-UI round-trips / generative-UI / memory / RAG *covered*),
   but ship-state claims corrected: engine is published at `0.0.1-beta.7`; the
   model call stays on `@tanstack/ai` because the durable plane persists
   TanStack chunk streams. Cross-link `/ai/engine/`.
2. `01-scaffold.md` — retarget `/capabilities/fresh-framework/` (post-#433
   redirect stub) to its pillar home `/web-layer/`. No other changes needed.
3. `02-durable-chat-route.md` — replace the "replaces this in beta.2" callout
   with a factual "where the engine fits" callout: published surface, one-line
   provider registration + `getModel` (documented example), why this route
   keeps direct TanStack wiring (chunk-vocabulary fact), links.
4. `03-chat-ui.md` — no stale claims found; no edit.
5. `04-tool-call.md` — citations callout: drop "no semantic-recall seam … in
   this cut" (embeddings provider ports now ship in the engine); state citations
   are plain tool output and point at `@netscript/ai/openai-embeddings` as the
   shipped seam for embeddings-backed retrieval (out of track scope). Add an
   engine entry to "Where to go next".

Slugs preserved (no renames) → no `_data.ts` edit. Scope: `docs/site/tutorials/chat/` only.

## Observed drift (out of my scope, for the orchestrator)

- `docs/site/ai/engine.md`, `docs/site/ai/index.md`, `docs/site/ai/durable-chat.md`
  carry the same stale "not published to JSR yet / arrives in 0.0.1-beta.2"
  claims. Those pages are workstream-D surface (AI pillar, D9) — not touched
  here to avoid cross-workstream collisions; flagging for the D9 agent.

## Evidence

Files changed (all under `docs/site/tutorials/chat/`):

- `index.md` — "What this track deliberately leaves out" callout: engine now
  stated as published (`0.0.1-beta.7`), links `/ai/engine/`, chunk-vocabulary
  rationale for keeping direct `@tanstack/ai`.
- `01-scaffold.md` — `/capabilities/fresh-framework/` (redirect stub) →
  `/web-layer/` pillar path.
- `02-durable-chat-route.md` — "replaces this in beta.2" callout replaced with
  "Where the @netscript/ai engine fits": published state, documented
  provider-registration example shape, two-wire-shapes fact, links
  `/ai/engine/` + `/reference/ai/`.
- `03-chat-ui.md` — untouched (no stale claims found).
- `04-tool-call.md` — citations callout: dropped stale "no semantic-recall seam
  in this cut", points at shipped `@netscript/ai/openai-embeddings`; added an
  AI-engine entry to "Where to go next".

`grep -rn "beta.2|publish:false|capabilities/" docs/site/tutorials/chat/` → no
matches (exit 1). Slugs unchanged; `_data.ts` untouched.

Validation (`docs/site`, `deno task verify` via `rtk proxy`):

- build: `Site built into _site — 500 files generated in 8.29 seconds`
- check:links: `23021 internal links across 162 pages — all resolve`
- check:caveats: `27 caveat markers across 22 pages — all references resolve`

VERDICT: `deno task verify` GREEN.
