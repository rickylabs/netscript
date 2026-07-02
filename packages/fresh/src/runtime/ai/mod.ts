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
 * ## FA-slice map (this file is FA0 — skeleton only)
 *
 * - **FA0** (this slice): module skeleton, subpath export, transport dep wiring,
 *   task-list registration. NO handler bodies.
 * - **FA1**: `createNetScriptChatConnection`, `toNetScriptChatResponse`,
 *   `resolveChatSnapshot` (owns the one-projection reducer).
 * - **FA2**: `createNetScriptChatStreamProxy` (the durable chat stream proxy
 *   handler; implemented in `./stream-proxy.ts`, fences netscript#239).
 * - **FA3**: `createNetScriptMcpSandbox` (the MCP tool sandbox).
 *
 * Every function below is a typed stub that throws `not implemented (FA0
 * skeleton)`. The signatures are the contract downstream slices implement, and
 * each stub names the upstream value it will wrap.
 *
 * @module
 */

// Upstream wrap targets. These value imports keep the three transport deps in
// the module graph (so `@netscript/fresh/ai` resolves and locks) while each FA0
// stub declares — via `notImplemented(..., <target>)` — exactly which upstream
// primitive its FA1/FA2/FA3 body will wrap. The public API below stays
// self-contained (local types only) so the JSR doc gate never sees an external
// private type reference.
import {
  durableStreamConnection,
  materializeSnapshotFromDurableStream,
  toDurableChatSessionResponse,
} from '@durable-streams/tanstack-ai-transport';
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
// Shared local surface types (NetScript-owned; no upstream types leak here).
// ---------------------------------------------------------------------------

/**
 * Addresses one durable chat session stream. NetScript-owned target that FA1+
 * resolves into an upstream `DurableStreamTarget` with auth applied.
 */
export interface NetScriptChatSessionTarget {
  /** Stable id of the chat session; one durable stream per `sessionId`. */
  readonly sessionId: string;
  /** Base URL of the NetScript durable-stream endpoint (resolved if omitted). */
  readonly baseUrl?: string;
  /** Auth / correlation headers applied to every durable-stream request. */
  readonly headers?: Readonly<Record<string, string>>;
}

/**
 * A single chat message projected from the durable session chunk log. Local
 * shape so seed and live projections agree on a NetScript-owned message type.
 */
export interface NetScriptChatMessage {
  /** Stable message id within the session. */
  readonly id: string;
  /** Author role of the message. */
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  /** Reduced text content of the message. */
  readonly content: string;
}

// ---------------------------------------------------------------------------
// FA1 — durable chat connection, response, and the one-projection snapshot.
// ---------------------------------------------------------------------------

/** Options for opening a durable chat session connection. */
export interface NetScriptChatConnectionOptions {
  /** The durable chat session to connect to. */
  readonly target: NetScriptChatSessionTarget;
}

/** A live handle to a durable chat session connection. */
export interface NetScriptChatConnection {
  /** Session id this connection is bound to. */
  readonly sessionId: string;
  /** Tear down the underlying durable-stream subscription. */
  readonly close: () => void;
}

/**
 * FA1 — open a durable chat session connection.
 *
 * Wraps `durableStreamConnection` from the transport with NetScript URL
 * resolution + auth. FA0 stub.
 */
export function createNetScriptChatConnection(
  options: NetScriptChatConnectionOptions,
): NetScriptChatConnection {
  void options;
  return notImplemented('createNetScriptChatConnection', durableStreamConnection);
}

/** Options for turning a server chat activity into a durable session `Response`. */
export interface NetScriptChatResponseOptions {
  /** The durable session stream to append the assistant turn into. */
  readonly target: NetScriptChatSessionTarget;
  /** The server-side chat stream to sanitize and persist as chunks. */
  readonly source: AsyncIterable<unknown>;
}

/**
 * FA1 — produce a durable chat session `Response` from a server chat stream.
 *
 * Wraps `toDurableChatSessionResponse`. FA0 stub.
 */
export function toNetScriptChatResponse(
  options: NetScriptChatResponseOptions,
): Promise<Response> {
  void options;
  return notImplemented('toNetScriptChatResponse', toDurableChatSessionResponse);
}

/**
 * A single tool card as materialized by the one-projection reducer. Both the
 * seed snapshot and the live projection MUST emit these identically.
 */
export interface NetScriptChatToolCard {
  /** Upstream tool-call id that ties chunks to this card. */
  readonly toolCallId: string;
  /** Name of the invoked tool. */
  readonly toolName: string;
  /** Lifecycle state of the card as reduced from the chunk log. */
  readonly state: 'pending' | 'streaming' | 'complete' | 'error';
  /** Reduced tool input (may be partial while `streaming`). */
  readonly input: unknown;
  /** Reduced tool output, present once `complete`. */
  readonly output?: unknown;
}

/**
 * The projected chat state — the SINGLE output type of the one-projection
 * reducer. Returned by `resolveChatSnapshot` (seed) and by the live island
 * projection (FB2): same type, same code path (see ONE-PROJECTION LAW above).
 */
export interface NetScriptChatSnapshot {
  /** Ordered chat messages reduced from the durable session chunk log. */
  readonly messages: ReadonlyArray<NetScriptChatMessage>;
  /** Tool cards reduced from the same chunk log. */
  readonly toolCards: ReadonlyArray<NetScriptChatToolCard>;
  /** Replay cursor: the last chunk offset folded into this snapshot. */
  readonly cursor: string | null;
}

/** Options for resolving a seed chat snapshot from a durable session. */
export interface NetScriptChatSnapshotOptions {
  /** The durable session stream to project. */
  readonly target: NetScriptChatSessionTarget;
}

/**
 * FA1 — resolve the seed chat snapshot for SSR / first paint.
 *
 * MUST delegate to the same projection reducer as the live island path
 * (ONE-PROJECTION LAW). Wraps `materializeSnapshotFromDurableStream`. FA0 stub.
 */
export function resolveChatSnapshot(
  options: NetScriptChatSnapshotOptions,
): Promise<NetScriptChatSnapshot> {
  void options;
  return notImplemented('resolveChatSnapshot', materializeSnapshotFromDurableStream);
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
