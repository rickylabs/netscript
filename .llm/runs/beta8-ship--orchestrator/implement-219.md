use harness

# Slice brief — #219 (anchor): durable-CHAT integration — @netscript/fresh/ai connection adapter

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/deno-fresh/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — but this is the LARGEST slice of the milestone:
  write a real plan section in your worklog (design, files, contract) BEFORE implementing.
- Worktree: `/home/codex/repos/ns-b8-219`, branch `feat/219-durable-chat-adapter`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-219`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-219 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-219 push origin HEAD:refs/heads/feat/219-durable-chat-adapter`.
- Worklog at `/home/codex/repos/ns-b8-219/.llm/runs/feat-219-durable-chat--codex/worklog.md`.

## Task (issue #219 — read it FULLY first)

Root cause per the issue: StreamDB shapes (`createNetScriptStreamDB` + `useLiveQuery`) are the
wrong primitive for durable AI chat in the browser (Electric shape consumer throws
`TypeError: Decoding failed` on gzip/multibyte; no optimistic turns/live tokens/resume). AI chat
needs a **TanStack-AI connection adapter** that subscribes to the durable message stream and
drives `useChat` (optimistic + live + resume + multi-tab) — per TanStack-AI's own
"Persistent Transports"/`SubscribeConnectionAdapter` docs.

Ship in `@netscript/fresh/ai` (streams seam):
1. A durable-chat connection adapter (`SubscribeConnectionAdapter`-shaped) that subscribes to the
   NetScript durable message stream endpoint (the plain-HTTP durable read + live tail) and drives
   TanStack-AI `useChat`. Study the existing `@netscript/fresh` ai runtime surface first
   (`packages/fresh/src/runtime/ai/` — stream-proxy, chat client glue) and the existing streams
   consumer (`packages/fresh/src/.../streams`) — wrap existing endpoints, don't invent new wire
   protocols. Check the workspace's pinned TanStack-AI version for the exact adapter interface
   (`deno doc` / node_modules types / deno.lock).
2. Server-side: whatever thin glue the adapter needs that doesn't already exist (e.g. an SSE/tail
   endpoint over the durable stream, if the durable read is snapshot-only). Prefer reusing the
   existing stream endpoints; add the minimal seam otherwise.
3. Docs/guidance is OWNED ELSEWHERE (docs wave) — but write JSDoc with a usage example on the new
   exports, and note in the worklog what the docs page should say (chat ≠ StreamDB shapes).

A stale pre-alpha.19 attempt exists at `/home/codex/repos/netscript-219-durablechat`
(branch feat/streams-durable-chat-transport, uncommitted run notes in `.llm/tmp/run/`) — you MAY
read it for design context; do NOT copy code from it blindly (base is ~400 commits old).

Acceptance (derive precise boxes from the issue; at minimum):
- A browser chat built on the new adapter gets: SSR seed + live tokens + optimistic user turn +
  resume after reload + multi-tab convergence (prove with unit/integration tests against an
  in-memory/faked stream — no real browser needed; simulate the subscribe lifecycle).
- Multibyte content (em-dash/ellipsis) round-trips (the original Decoding failed trigger).
- No regression to StreamDB shapes for data tables.

## Validation (evidence in worklog)

- Scoped check/lint on `packages/fresh` (+ any streams package touched).
- Unit/integration tests as above, green.
- `deno doc --lint` clean on new exports; `deno task publish:dry-run` green for `@netscript/fresh`.

## Done means

Adapter + server glue + tests + gates committed and pushed, worklog committed. Report "DONE" or
"BLOCKED: <why>".
