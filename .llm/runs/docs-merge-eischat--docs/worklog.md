# Worklog — merge eis-chat on-ramp into the chat track (de-internalized)

Branch: `docs/merge-eis-chat-into-chat` (from `2205f926918879a940d93b6c52aae1a080dcf4db` = origin/main tip)
Lane: Claude documentation-authoring (beta-7 docs cut, orchestrator `df71d36c`)
Scope overlay: `SCOPE-docs.md`. Deliverable: docs prose + redirects only, no `packages/`/`plugins/`.

## Owner directive

Merge `docs/site/tutorials/eis-chat/` INTO `docs/site/tutorials/chat/` as ONE production-grade AI
chat tutorial — durable AI chat with MCP and the capabilities the internal reference app showed —
with **zero** mention of `eis-chat` / `EIS Chat` / `eis` in the result. Old `/tutorials/eis-chat/…`
URLs become redirect documents pointing at the merged chapters. Remove the eis-chat lane/nav
line/xref keys from `tutorials/index.md` / `_data.ts` / `_data/xref.ts`.

## Incident — stale-base first attempt (redone)

The first pass (commit `5936389f`, force-replaced) was authored against a **stale tree**: this
agent's cwd resets between shell calls, and most commands were prefixed with
`cd /home/codex/repos/netscript-547-lffix` — the main repo checkout on `feat/fresh-ui-pixel-polish`
(`0bbcfaca`, merge-base `e6a847db` with main) — instead of this worktree. Consequences: the tree
showed no eis-chat pages, no #433 redirect layout, pre-#438 chat chapters with stale `beta.2`
claims, and an environment whose frozen minimum-dependency date made `deno doc jsr:@netscript/ai`
appear unpublished. The stray commit was removed from the pixel-polish checkout
(`git reset --hard 0bbcfaca`; tree was clean before the incident), and the whole slice was redone in
this worktree at the true main tip. Pre-edit checks per coordinator: `ls docs/site/tutorials/eis-chat/`
→ 5 real content pages; `grep -c beta.2 docs/site/tutorials/chat/index.md` → 0. Both passed.

## Shipped-surface verification (positioning law is binding)

Verified against the canonical docs at the true main tip:

- `@netscript/ai` **is published** as of `0.0.1-beta.7` (per `docs/site/ai/mcp.md` and the #438 chat
  chapters), including the MCP client stack under `./mcp`: `createMcpTransport`,
  `createMcpTransportPool`, `registerMcpTools`, injected `McpAuthConfig`, `extractMcpUiResources`.
- Render path for `ui://` resources: `createMcpSandboxHandler` (`@netscript/fresh/ai/sandbox`) +
  the `McpUiWidget` fresh-ui copy-registry island (installed by `netscript ui:add ai`), per
  `ai/mcp.md` + `ai/durable-chat.md`.
- Still stubbed (do not build on): `createNetScriptMcpSandbox` (per `ai/durable-chat.md`).
- Shipped live-read: `createNetScriptChatConnection(...).subscribe(signal)` (per `ai/durable-chat.md`).
- MCP is **client-side** in this release (no scaffolded NetScript MCP server) — ch5 states this.

## Merged chapter structure (owner's target progression)

scaffold → durable chat route → chat UI → tools → **MCP** → **live streaming** (6 chapters):

1. `01-scaffold.md` — kept (#438 text); 6-step learningPath.
2. `02-durable-chat-route.md` — kept; 6-step path; folded the on-ramp's *contract + durable
   delivery* discipline into "What you built" (one message shape; the turn is persisted before it is
   rendered). The #438 engine callout (already beta.7-correct) untouched.
3. `03-chat-ui.md` — kept; 6-step path; the "live streaming vs settle-then-render" note now points
   at chapter 6 instead of the retired "FB2 live island reducer landing alongside" phrasing.
4. `04-tool-call.md` — kept; no longer "final chapter"; nav → ch5; finale trimmed to a ch5 handoff
   (its "where to go next" list moved to ch6).
5. `05-mcp.md` — NEW: connect a remote MCP server with `createMcpTransportPool` (+ injected auth),
   bridge a pooled tool into the track's `@tanstack/ai` tool layer via `callTool` (with the
   engine-native `registerMcpTools` path cross-referenced and the wire-shape rationale), and render
   `ui://` widgets through `createMcpSandboxHandler` + the copied `McpUiWidget` — sandbox/CSP trust
   boundary stated; `createNetScriptMcpSandbox` stub warning included.
6. `06-live-streaming.md` — NEW: upgrade the ch3 island from settle-then-render to
   `connection.subscribe(signal)` seeded at the snapshot offset, through the one projection reducer;
   teardown; two-tab + reload verification. This is where the on-ramp's **live SSE stream** spine
   lands, in its AI-chat form; the closing map ties contract → durable delivery → live stream to the
   other tracks' seams via the track index.

- `chat/index.md` — production support-chat framing (generic; nothing internal), 6-step path, 6
  cards, arc heading, leave-out note updated (MCP now covered; generative-UI/memory/RAG still out).
- `tutorials/index.md` — removed the eis-chat on-ramp card, the "Short on time?" on-ramp teaser, and
  the closing on-ramp recommendation; AI Chat card + chooser row updated to the 6-chapter scope.
- `_data.ts` — removed the `Mini eis-chat` nav line (one-line diff, per the hotspot rule).
- `_data/xref.ts` — removed the five `tut:eis-chat*` keys; added `tut:chat*` keys for the six merged
  chapters (matching every other track's per-chapter key pattern). Verified **zero usages** of
  `tut:eis-chat*` anywhere in `docs/site` before removal — nothing needed retargeting.
- Redirects (layout `layouts/redirect.vto` from #433 already exists — reused, not recreated):
  - `eis-chat/` → `/tutorials/chat/`
  - `eis-chat/01-scaffold/` → `/tutorials/chat/01-scaffold/`
  - `eis-chat/02-message-contract/` → `/tutorials/chat/02-durable-chat-route/`
  - `eis-chat/03-deliver-worker/` → `/tutorials/chat/02-durable-chat-route/`
  - `eis-chat/04-live-stream/` → `/tutorials/chat/06-live-streaming/`

## Validation verdict

`deno task verify` (in this worktree's `docs/site`) — **GREEN**:
- build: `🍾 Site built into _site`.
- `check:links`: `23450 internal links across 169 pages — all resolve` (fresh-tree range per
  coordinator: ~24k/167; the first attempt's 23238/154 was the stale-tree signature).
- `check:caveats`: `28 caveat markers across 22 pages — all references resolve`.
- exit 0.

Redirect emit check (base path `/netscript/` applied): `eis-chat/04-live-stream` → canonical
`…/tutorials/chat/06-live-streaming/`; `eis-chat/02-message-contract` →
`…/tutorials/chat/02-durable-chat-route/`. All 6 chat chapters emitted.

`grep -riE "eis"` over owned files (chat track, eis-chat redirects, tutorials/index.md, _data.ts,
_data/xref.ts): **ZERO** hits.

Residual `eis` in files NOT owned by this slice (reported, not fixed — other agents' scope):
- `docs/site/services-sdk/services.md:51`, `services-sdk/index.md:17`, `services-sdk/sdk.md:67`
  ("eis-chat, the production app NetScript is dogfooded against")
- `docs/site/durable-workflows/streams.md:240,242` (`/eischat/completions`, `eischat-ingestion`)
- `docs/site/tutorials/workspace/03-workspace-data.md:55`, `workspace/04-provision-job.md:18`,
  `workspace/index.md:11,58` (eis-chat as the modeled app)
Other `grep -i eis` matches are `useIsland*`/`*Island*` false positives.
