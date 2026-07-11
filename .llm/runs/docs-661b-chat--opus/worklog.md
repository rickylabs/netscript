# Worklog — docs-661b-chat (Opus 4.8, beta-8 orchestrator)

Issue #661: CHAT tutorial series quality + durable-chat callouts.
Branch `docs/661-chat-quality`, worktree `/home/codex/repos/ns-b8-661b`.

## Preflight (passed)

- `git rev-parse HEAD` = `955b4abf639522c7da50bd15d20c6e999acb808f` (starts `955b4abf`). OK.
- `docs/site/tutorials/chat/05-mcp.md` exists. OK.

## API grounding (never invent APIs)

`deno doc packages/fresh/src/application/route/mod.ts`:

- `createRouteReference(pattern)` → `RouteReference`, doc example
  `createRouteReference("/orders/[id]").href({ path: { id: "42" } })`.
- `RouteReference` exposes `href(...)`, `parsePath(input): TPath`, `safeParsePath`,
  `parseSearch`, `getLinkProps`, `Link`, `withPartial`.

Scratch type-check of the exact new example (`createRouteReference('/api/chat/[sessionId]')`
+ `.href({ path: { sessionId } })` + `.parsePath(params)`): types resolve; the only diagnostic
is `isolatedDeclarations` (a library-publish constraint that does NOT apply to scaffolded app
`contracts/` files). Sound for the doc's app-code context. Scratch removed.

## Slices

### Proposal #4 — one-line honesty callout (3 files, identical wording)

Placed immediately after the `target: (req) => ...` stream-proxy block in:
`tutorials/chat/02-durable-chat-route.md`, `how-to/build-a-durable-chat.md`, `ai/durable-chat.md`.
Identical `note` callout: the proxy `target` resolver only ever receives the raw `Request`, so
the session id is parsed from `req.url` by hand; this is the one documented exception — elsewhere
prefer a bound `createRouteReference` contract. Converts a silent look-alike anti-pattern into a
documented exception (source-verified in the audit: `stream-proxy.ts` target resolver receives a
bare `Request`, not `ctx.params`).

- code:prose: +3 lines prose each, no code change. Balance stays good.

### Proposal #5 + matrix gap (chat/02 typed `[sessionId]`; chat/03 & 06 bound URL)

- **chat/02**: introduced the small route-contract file `contracts/routes/chat-turn.ts`
  (`createRouteReference('/api/chat/[sessionId]')`) the way the workspace/05 exemplar introduces
  its bound contract. The session route now imports it and reads its param via
  `chatTurnRoute.parsePath(ctx.params)` instead of `ctx.params.sessionId`. Closes the matrix gap
  "dynamic `[sessionId]` route never shown typed."
  - before: `const target = { sessionId: ctx.params.sessionId } as const;`
  - after: `const { sessionId } = chatTurnRoute.parsePath(ctx.params); const target = { sessionId } as const;`
- **chat/03**: POST URL now `chatTurnRoute.href({ path: { sessionId } })` (was template
  `` `/api/chat/${sessionId}` ``); imports the shared contract.
- **chat/06**: identical `.href(...)` swap + contract import.
  - code:prose: URL construction now flows from the one contract in all three chapters; the server
    param read and the client URL can no longer drift.

### Matrix gap — chat/03 island-query (not forced)

Added a `note` callout "Why not useIslandQuery for the transcript?" — honestly scopes when
`useIslandQuery`/`useLiveQuery` apply (typed service-contract reads, per live-dashboard/04) vs why
the chat transcript stays on `createNetScriptChatConnection` (durable session stream, one
projection). Points readers to where an island query WOULD belong (e.g. a typed past-conversations
sidebar) without fabricating a service the chat app does not have. Honors "do not force it."

### Proposal #17 — chat index lede

`tutorials/chat/index.md`: added an explicit differentiator + contrast sentence to the lede
(mirrors live-dashboard/index.md's move): most chat UIs keep the conversation in component state
and lose it on refresh/dropped socket/second tab; here the transcript lives in the durable session
and the UI is only a view, so the same log replays identically everywhere.

### Medusa rebalance (scope item 5)

No action: the audit matrix marks all touched chat chapters **good** on code:prose balance
(chapters are 150–210 lines with complete files). The audit's code:prose "thin" cells are elsewhere
(`web-layer/query.md`, etc.), out of this brief's scope. Did not rewrite good chapters.

## Validation (evidence)

- `deno task verify` (docs/site) → EXIT 0. Build: 512 files / 15.3s.
  `check:links`: **23454 internal links across 169 pages — all resolve** (≥169 met).
  `check:caveats`: 27 caveat markers across 22 pages — all resolve.
- Public-docs grep gate on the 6 touched files
  (`eis-chat|eischat|VIF|CSB|PR #|pull/[0-9]|dogfood|issues/[0-9]`): **0 hits**.

## Touched files

- docs/site/tutorials/chat/02-durable-chat-route.md
- docs/site/tutorials/chat/03-chat-ui.md
- docs/site/tutorials/chat/06-live-streaming.md
- docs/site/tutorials/chat/index.md
- docs/site/how-to/build-a-durable-chat.md
- docs/site/ai/durable-chat.md
- .llm/runs/docs-661b-chat--opus/worklog.md (this file)
