/**
 * `@netscript/fresh/ai` — durable-chat runtime plane for NetScript Fresh apps.
 *
 * This subpath is the server + island seam that turns a Fresh route into a
 * **durable** AI chat surface: a chat whose message history and in-flight tool
 * calls survive reload, reconnect, and multi-tab replay because they are backed
 * by a durable session stream rather than component state.
 *
 * It composes three upstream libraries and adds only the NetScript glue
 * (URL resolution, auth headers, and the projection law below):
 * - `@durable-streams/tanstack-ai-transport` — durable session streams,
 *   `toDurableChatSessionResponse`, snapshot materialization.
 * - `@tanstack/ai-preact` — the `useChat` island hook + MCP app bridge.
 * - `@tanstack/ai` — server-side chat activity, tool definitions, MCP sources.
 *
 * ## StreamDB *shapes* vs Durable *Sessions* — the doctrinal root of #219
 *
 * `@netscript/fresh/streams` and `@netscript/fresh/ai` look adjacent but model
 * two different things. Conflating them is the root confusion behind #219: a
 * chat is **not** a StreamDB shape, and a StreamDB shape is **not** a session.
 *
 * | Axis            | StreamDB *shapes* (`./streams`)          | Durable *Sessions* (`./ai`)                         |
 * | --------------- | ---------------------------------------- | --------------------------------------------------- |
 * | Unit            | A collection/row shape (TanStack DB)     | One chat session stream (append-only chunk log)     |
 * | Identity        | Keyed by row id inside a named shape     | Keyed by `sessionId` (one durable stream per chat)  |
 * | Write model     | CRUD mutations reconciled into the shape | Append-only sanitized chunks                        |
 * | Ordering        | Last-writer-wins per row                 | Total order of chunks == the transcript             |
 * | What survives   | The current materialized rows            | The full replayable event log (messages + tools)    |
 * | Read primitive  | `useLiveQuery` over a shape              | `resolveChatSnapshot` + live `useChat` subscription |
 * | Backing         | `@durable-streams/state`                 | `@durable-streams/tanstack-ai-transport`            |
 *
 * A chat needs the *session* plane because a tool call is a multi-chunk,
 * mid-stream event — it cannot be expressed as a single reconciled row without
 * losing the streaming/tool-card intermediate states. `./streams` stays the
 * right tool for list/board/table live data; `./ai` owns conversational,
 * append-only, replayable sessions.
 *
 * ## THE ONE-PROJECTION LAW (FA1 ↔ FB2)
 *
 * `resolveChatSnapshot` (the **seed/snapshot** projection used for SSR and first
 * paint) MUST run the **same projection code path** as the **live** projection
 * that `useChat` applies to incoming chunks. Seed and live are two entry points
 * into ONE reducer:
 *
 * ```text
 * chunks --> [ single projection reducer ] --> { messages, toolCards, cursor }
 * ```
 *
 * If the seed path and the live path are allowed to diverge (e.g. the server
 * hand-rolls a snapshot while the island reduces chunks differently), then
 * **tool cards drift**: a tool card materialized at seed time renders
 * differently — or vanishes — once the first live chunk arrives, because the two
 * projections disagree about intermediate tool state. The law is therefore a
 * hard invariant, not a nicety: FA1's `resolveChatSnapshot` and FB2's live
 * reducer must be literally the same function applied to the same chunk log.
 * Any downstream slice that adds a projection MUST route both seed and live
 * through it.
 *
 * ## FA-slice map (FA1 + FA2 landed — FA3 still skeleton)
 *
 * - **FA0**: module skeleton, subpath export, transport dep wiring,
 *   task-list registration.
 * - **FA1** (landed): `createNetScriptChatConnection`, `toNetScriptChatResponse`,
 *   `resolveChatSnapshot`, and the one-projection reducer `projectChatSnapshot`.
 *   Bodies live in `./create-chat-connection.ts` and are re-exported below so
 *   FA2's concurrent edits to this file stay conflict-free.
 * - **FA2** (landed): `createNetScriptChatStreamProxy` (the durable chat stream
 *   proxy handler; body in `./stream-proxy.ts`, re-exported below).
 * - **FA3**: MCP sandbox helpers live on `@netscript/fresh/ai/sandbox` so the
 *   chat-session surface stays within the F-5 export cap.
 *
 * @module
 */

// FA1 — durable chat connection, response, and the one-projection snapshot.
// Implemented in `./create-chat-connection.ts`; re-exported here so the `./ai`
// subpath surface stays in one place.
export {
  createNetScriptChatConnection,
  type NetScriptChatAuthorize,
  type NetScriptChatConnection,
  type NetScriptChatConnectionOptions,
  type NetScriptChatMessage,
  type NetScriptChatResponseOptions,
  type NetScriptChatSessionTarget,
  type NetScriptChatSnapshot,
  type NetScriptChatSnapshotOptions,
  projectChatSnapshot,
  type RenderPart,
  resolveChatSnapshot,
  toNetScriptChatResponse,
} from './create-chat-connection.ts';

// ---------------------------------------------------------------------------
// FA2 — durable chat stream proxy (route handler). Real implementation lives in
// `./stream-proxy.ts`; re-exported here so `@netscript/fresh/ai` stays a single
// barrel. See issue #251 / netscript#239 (gzip-mislabel fence).
// ---------------------------------------------------------------------------

export {
  createNetScriptChatStreamProxy,
  type NetScriptChatStreamProxyHandler,
  type NetScriptChatStreamProxyOptions,
} from './stream-proxy.ts';
