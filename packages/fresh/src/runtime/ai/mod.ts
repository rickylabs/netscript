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
 * - **FA3**: `createNetScriptMcpSandbox` (the MCP tool sandbox).
 *
 * The FA3 function below remains a typed stub that throws `not implemented
 * (FA0 skeleton)`; it names the upstream value its body will wrap.
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

// Upstream wrap target for the FA3 stub. This value import keeps the remaining
// transport dep in the module graph while the stub declares — via
// `notImplemented(..., <target>)` — exactly which upstream primitive its body
// will wrap. The public API below stays self-contained (local types only) so
// the JSR doc gate never sees an external private type reference.
import { createMcpAppBridge } from '@tanstack/ai-preact';
import { mergeAgentTools } from '@tanstack/ai';

/** Human-readable marker every FA0 skeleton stub throws with. */
const FA0_SKELETON = 'not implemented (FA0 skeleton)';

/**
 * Throw the shared FA0 skeleton error, recording which upstream value the real
 * FA1/FA2/FA3 body will wrap. Returns `never`, so callers can `return` it and
 * still satisfy their declared return type.
 */
function notImplemented(symbol: string, wrapTarget: unknown): never {
  void wrapTarget;
  throw new Error(`${symbol}: ${FA0_SKELETON}`);
}

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

// ---------------------------------------------------------------------------
// FA3 — MCP tool sandbox.
// ---------------------------------------------------------------------------

/** A NetScript-owned reference to an MCP tool source exposed to a chat activity. */
export interface NetScriptMcpToolSource {
  /** Stable identifier for the MCP source. */
  readonly id: string;
  /** Endpoint URL the MCP source is served from. */
  readonly url: string;
  /** Whether the connection is held open between turns. */
  readonly keepAlive?: boolean;
}

/** Options for wiring an MCP tool sandbox into a NetScript chat activity. */
export interface NetScriptMcpSandboxOptions {
  /** MCP tool sources exposed to the chat activity. */
  readonly sources: ReadonlyArray<NetScriptMcpToolSource>;
}

/**
 * A resolved MCP sandbox: the tool surface plus the runtime handle downstream
 * slices connect the island `useChat` bridge to.
 */
export interface NetScriptMcpSandbox {
  /** MCP tool sources active in this sandbox. */
  readonly sources: ReadonlyArray<NetScriptMcpToolSource>;
}

/**
 * FA3 — construct the MCP tool sandbox for a NetScript chat activity. Wraps
 * `mergeAgentTools` (server) and `createMcpAppBridge` (island). FA0 stub.
 */
export function createNetScriptMcpSandbox(
  options: NetScriptMcpSandboxOptions,
): NetScriptMcpSandbox {
  void options;
  void createMcpAppBridge;
  return notImplemented('createNetScriptMcpSandbox', mergeAgentTools);
}
