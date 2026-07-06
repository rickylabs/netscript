/**
 * FA1 — the client-facing durable chat connection layer for
 * `@netscript/fresh/ai`.
 *
 * This module wraps `@durable-streams/tanstack-ai-transport` with NetScript's
 * durable-streams URL resolution and auth injection (the exact same
 * `@netscript/plugin-streams-core` seam — `getStreamsUrl`, `getStreamsAuth`,
 * `buildStreamUrl` — that `@netscript/fresh/streams` uses for StreamDB shapes).
 * It owns three things:
 *
 * - `createNetScriptChatConnection` — a live handle over one durable chat
 *   session stream (subscribe / send) with `stop()`/`dispose()` parity to
 *   `NetScriptStreamDB` (F-13) and an SR2-tolerant subscribe path.
 * - `toNetScriptChatResponse` — turns a server chat stream into a durable
 *   session `Response`, gated by the (required-in-production) `authorize` hook.
 * - `resolveChatSnapshot` + `projectChatSnapshot` — the seed snapshot and the
 *   single projection reducer that satisfies the ONE-PROJECTION LAW (see the
 *   `./mod.ts` `@module` doc): seed and live MUST route through
 *   `projectChatSnapshot` so tool cards never drift between first paint and the
 *   first live chunk.
 *
 * @module
 */

import {
  durableStreamConnection,
  materializeSnapshotFromDurableStream,
  toDurableChatSessionResponse,
} from '@durable-streams/tanstack-ai-transport';
import { buildStreamUrl, getStreamsAuth, getStreamsUrl } from '@netscript/plugin-streams-core';

// ---------------------------------------------------------------------------
// Session addressing (internal — not part of the public `./ai` surface).
// ---------------------------------------------------------------------------

/**
 * Path (under the durable-streams State Protocol prefix) that every NetScript
 * chat session stream lives beneath. FA2's stream proxy resolves the same
 * convention via {@link resolveChatSessionUrl}.
 */
export const NETSCRIPT_CHAT_STREAM_SUBPATH = '/ai/chat';

/**
 * Resolves the durable-stream subpath for one chat session.
 *
 * A string value is treated as the static prefix before `/{sessionId}`; a
 * function value returns the full per-session subpath. Use the function form for
 * app conventions such as `/eischat/sessions/{id}/messages`.
 */
export type NetScriptChatStreamPath =
  | string
  | ((target: NetScriptChatSessionTarget) => string);

/**
 * Resolve the fully-qualified durable-stream URL for a chat session, applying
 * NetScript URL resolution (`getStreamsUrl` + `buildStreamUrl`). Not re-exported
 * from `./mod.ts`; FA2 imports it directly to keep the two slices on one
 * addressing convention.
 */
export function resolveChatSessionUrl(
  target: NetScriptChatSessionTarget,
  options: { readonly streamPath?: NetScriptChatStreamPath } = {},
): string {
  const baseUrl = target.baseUrl ?? getStreamsUrl();
  return buildStreamUrl(resolveChatStreamSubpath(target, options.streamPath), baseUrl);
}

/** Merge NetScript streams auth headers with any per-target correlation headers. */
export function resolveChatHeaders(target: NetScriptChatSessionTarget): Record<string, string> {
  return withIdentityEncoding({ ...getStreamsAuth(), ...(target.headers ?? {}) });
}

// ---------------------------------------------------------------------------
// Public NetScript-owned surface types (no upstream types leak here).
// ---------------------------------------------------------------------------

/**
 * Addresses one durable chat session stream. NetScript-owned target that FA1
 * resolves into a durable-stream URL with auth applied.
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

/**
 * A minimal, NetScript-owned renderable unit emitted by the one-projection
 * reducer ({@link projectChatSnapshot}).
 *
 * The rich `RenderPart` used by the chat UI is owned by fresh-ui / FB2; this is
 * the self-contained local shape that keeps `@netscript/fresh/ai` doc-lint clean
 * and gives FB2 a stable contract to widen. A part is either reduced message
 * `text` or a `tool` card reduced from the same chunk log.
 */
export interface RenderPart {
  /** Whether this part renders message text or a tool card. */
  readonly kind: 'text' | 'tool';
  /** Stable id of this part within the transcript. */
  readonly id: string;
  /** Author role the part belongs to. */
  readonly role: 'system' | 'user' | 'assistant' | 'tool';
  /** Reduced text (present when `kind === 'text'`). */
  readonly text?: string;
  /** Invoked tool name (present when `kind === 'tool'`). */
  readonly toolName?: string;
  /** Lifecycle state of the tool card as reduced from the chunk log. */
  readonly toolState?: 'pending' | 'streaming' | 'complete' | 'error';
  /** Reduced tool input (may be partial while `streaming`). */
  readonly input?: unknown;
  /** Reduced tool output, present once `complete`. */
  readonly output?: unknown;
}

/**
 * Authorization hook for a durable chat session.
 *
 * **REQUIRED for production.** Per the ratified chat-authz decision this hook is
 * intentionally optional at the type level (there is no way for the framework to
 * prove a caller is production), but the factory NEVER bakes in a default
 * allow-all. Ship a real `authorize` before exposing a chat route publicly:
 * without one, {@link toNetScriptChatResponse} cannot gate access to the session
 * stream. Return `false` to deny (the response becomes `403 Forbidden`).
 */
export type NetScriptChatAuthorize = (
  request: Request,
  sessionId: string,
) => boolean | Promise<boolean>;

/** Options for opening a durable chat session connection. */
export interface NetScriptChatConnectionOptions {
  /** The durable chat session to connect to. */
  readonly target: NetScriptChatSessionTarget;
  /**
   * Durable-stream subpath override. A string is used as the prefix before the
   * encoded `sessionId`; a function returns the full per-session subpath.
   */
  readonly streamPath?: NetScriptChatStreamPath;
  /**
   * REQUIRED for production — see {@link NetScriptChatAuthorize}. Threaded onto
   * the returned connection so the server route that owns it can enforce access
   * on the response path. The factory applies NO default; leaving it unset means
   * the session is unauthenticated.
   */
  readonly authorize?: NetScriptChatAuthorize;
  /** Replay offset to begin the live subscription from (default: from start). */
  readonly initialOffset?: string;
  /**
   * SR2 tuning: how the subscribe path tolerates a first-subscribe that races a
   * not-yet-created session stream (transient empty / up-to-date live poll). The
   * subscribe re-polls with exponential backoff instead of surfacing a terminal
   * error, up to `maxAttempts` before returning an empty stream.
   */
  readonly subscribeRetry?: {
    /** Max consecutive pre-data re-poll attempts (default `5`). */
    readonly maxAttempts?: number;
    /** Initial backoff delay in ms (default `250`). */
    readonly initialDelayMs?: number;
    /** Backoff ceiling in ms (default `5000`). */
    readonly maxDelayMs?: number;
  };
  /**
   * Test/adapter seam: build the underlying durable-stream connection. Defaults
   * to `durableStreamConnection` from the transport.
   */
  readonly createConnection?: (input: {
    readonly sendUrl: string;
    readonly readUrl: string;
    readonly headers: Record<string, string>;
    readonly initialOffset?: string;
  }) => {
    readonly subscribe: (signal?: AbortSignal) => AsyncIterable<unknown>;
    readonly send: (
      messages: readonly unknown[],
      data?: unknown,
      signal?: AbortSignal,
    ) => Promise<void>;
  };
}

/**
 * A live handle to a durable chat session connection. Mirrors
 * `NetScriptStreamDB`'s disposable lifecycle (F-13): `close`, `stop`, and
 * `dispose` are the same idempotent teardown so no connection leaks.
 */
export interface NetScriptChatConnection {
  /** Session id this connection is bound to. */
  readonly sessionId: string;
  /** The authorize hook this connection was configured with (if any). */
  readonly authorize?: NetScriptChatAuthorize;
  /**
   * Subscribe to live chunks for the session. SR2-tolerant: a first-subscribe
   * that races a not-yet-created stream is re-polled with backoff rather than
   * throwing. The stream ends when the caller aborts `signal`, the connection is
   * disposed, or (post-establishment) the upstream subscription completes.
   */
  readonly subscribe: (signal?: AbortSignal) => AsyncIterable<unknown>;
  /** Append client messages to the durable session stream. */
  readonly send: (
    messages: readonly NetScriptChatMessage[],
    data?: unknown,
    signal?: AbortSignal,
  ) => Promise<void>;
  /** Tear down the underlying durable-stream subscription (idempotent). */
  readonly close: () => void;
  /** Alias of {@link NetScriptChatConnection.close} for `NetScriptStreamDB` parity (F-13). */
  readonly stop: () => void;
  /** Alias of {@link NetScriptChatConnection.close} for `NetScriptStreamDB` parity (F-13). */
  readonly dispose: () => void;
}

/** Options for turning a server chat activity into a durable session `Response`. */
export interface NetScriptChatResponseOptions {
  /** The durable session stream to append the assistant turn into. */
  readonly target: NetScriptChatSessionTarget;
  /**
   * Durable-stream subpath override. A string is used as the prefix before the
   * encoded `sessionId`; a function returns the full per-session subpath.
   */
  readonly streamPath?: NetScriptChatStreamPath;
  /** The server-side chat stream to sanitize and persist as chunks. */
  readonly source: AsyncIterable<unknown>;
  /** New client messages to persist before the assistant turn (optional). */
  readonly newMessages?: readonly NetScriptChatMessage[];
  /** The inbound request, required whenever `authorize` is supplied. */
  readonly request?: Request;
  /**
   * REQUIRED for production — see {@link NetScriptChatAuthorize}. When supplied,
   * a `request` MUST also be supplied and the turn is denied (`403`) unless the
   * hook returns `true`. No default is applied.
   */
  readonly authorize?: NetScriptChatAuthorize;
  /**
   * Test/adapter seam: build the durable session `Response`. Defaults to
   * `toDurableChatSessionResponse` from the transport.
   */
  readonly toResponse?: (input: {
    readonly writeUrl: string;
    readonly headers: Record<string, string>;
    readonly newMessages: readonly unknown[];
    readonly source: AsyncIterable<unknown>;
  }) => Promise<Response>;
}

/**
 * The projected chat state returned by {@link resolveChatSnapshot}. `messages`
 * and `renderParts` come from the single projection reducer
 * ({@link projectChatSnapshot}); `offset` is the replay cursor to hand to the
 * live subscription so seed and live share one continuous chunk log.
 */
export interface NetScriptChatSnapshot {
  /** Ordered chat messages reduced from the durable session chunk log. */
  readonly messages: ReadonlyArray<NetScriptChatMessage>;
  /** Render parts (text + tool cards) reduced from the same chunk log. */
  readonly renderParts: ReadonlyArray<RenderPart>;
  /** Replay offset the snapshot was materialized up to, or `null` if empty. */
  readonly offset: string | null;
}

/** Options for resolving a seed chat snapshot from a durable session. */
export interface NetScriptChatSnapshotOptions {
  /** The durable session stream to project. */
  readonly target: NetScriptChatSessionTarget;
  /**
   * Durable-stream subpath override. A string is used as the prefix before the
   * encoded `sessionId`; a function returns the full per-session subpath.
   */
  readonly streamPath?: NetScriptChatStreamPath;
  /** Replay offset to materialize up to (default: full log). */
  readonly offset?: string;
  /**
   * Test/adapter seam: materialize the raw session messages. Defaults to
   * `materializeSnapshotFromDurableStream` from the transport.
   */
  readonly materialize?: (input: {
    readonly readUrl: string;
    readonly headers: Record<string, string>;
    readonly offset?: string;
  }) => Promise<{ readonly messages: readonly unknown[]; readonly offset?: string }>;
}

// ---------------------------------------------------------------------------
// The ONE projection reducer (seed + live share this — see mod.ts @module doc).
// ---------------------------------------------------------------------------

/**
 * The single chat projection reducer. Both the seed snapshot
 * ({@link resolveChatSnapshot}) and the live island projection (FB2) MUST route
 * through this function so tool cards and message text never diverge between
 * first paint and the first live chunk (the ONE-PROJECTION LAW). It reduces the
 * materialized session `messages` into NetScript-owned messages plus renderable
 * parts; it is deterministic and side-effect free.
 */
export function projectChatSnapshot(
  messages: readonly unknown[],
): Pick<NetScriptChatSnapshot, 'messages' | 'renderParts'> {
  const outMessages: NetScriptChatMessage[] = [];
  const renderParts: RenderPart[] = [];

  messages.forEach((raw, index) => {
    const record = asRecord(raw);
    const id = asString(record.id) ?? `message-${index}`;
    const role = normalizeRole(record.role);
    const parts = Array.isArray(record.parts) ? record.parts : [];

    const textSegments: string[] = [];
    parts.forEach((rawPart, partIndex) => {
      const part = asRecord(rawPart);
      const type = asString(part.type) ?? 'text';
      if (type.includes('tool')) {
        renderParts.push({
          kind: 'tool',
          id: asString(part.toolCallId) ?? `${id}:tool:${partIndex}`,
          role,
          toolName: asString(part.toolName) ?? asString(part.name) ?? 'tool',
          toolState: normalizeToolState(part.state),
          input: part.input,
          output: part.output,
        });
        return;
      }
      const text = asString(part.text) ?? asString(part.content);
      if (text) textSegments.push(text);
    });

    const content = textSegments.join('') || asString(record.content) || '';
    outMessages.push({ id, role, content });
    if (content) {
      renderParts.push({ kind: 'text', id: `${id}:text`, role, text: content });
    }
  });

  return { messages: outMessages, renderParts };
}

// ---------------------------------------------------------------------------
// FA1 factory functions.
// ---------------------------------------------------------------------------

/**
 * Open a durable chat session connection.
 *
 * Wraps `durableStreamConnection` from `@durable-streams/tanstack-ai-transport`
 * with NetScript URL resolution + auth. The returned handle exposes an
 * SR2-tolerant `subscribe`, a `send` that persists client messages, and a
 * single idempotent teardown surfaced as `close`/`stop`/`dispose` (F-13).
 *
 * @example
 * ```ts
 * const chat = createNetScriptChatConnection({
 *   target: { sessionId },
 *   streamPath: ({ sessionId }) => `/eischat/sessions/${sessionId}/messages`,
 *   authorize: (req, id) => sessionBelongsToUser(req, id), // REQUIRED in prod
 * });
 * try {
 *   for await (const chunk of chat.subscribe(signal)) render(chunk);
 * } finally {
 *   chat.dispose();
 * }
 * ```
 */
export function createNetScriptChatConnection(
  options: NetScriptChatConnectionOptions,
): NetScriptChatConnection {
  const { target } = options;
  const sessionUrl = resolveChatSessionUrl(target, { streamPath: options.streamPath });
  const headers = resolveChatHeaders(target);
  const retry = resolveRetryConfig(options.subscribeRetry);
  const controller = new AbortController();
  let disposed = false;

  const upstream = (options.createConnection ?? defaultCreateConnection)({
    sendUrl: sessionUrl,
    readUrl: sessionUrl,
    headers,
    initialOffset: options.initialOffset,
  });

  const linkSignal = (caller?: AbortSignal): AbortSignal =>
    caller ? AbortSignal.any([controller.signal, caller]) : controller.signal;

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    controller.abort();
  };

  return {
    sessionId: target.sessionId,
    authorize: options.authorize,
    subscribe: (signal?: AbortSignal): AsyncIterable<unknown> =>
      subscribeWithRetry(upstream, retry, linkSignal(signal)),
    send: (
      messages: readonly NetScriptChatMessage[],
      data?: unknown,
      signal?: AbortSignal,
    ): Promise<void> => {
      if (disposed) {
        return Promise.reject(
          new Error('createNetScriptChatConnection: connection already disposed'),
        );
      }
      return upstream.send(messages.map(toDurableMessage), data, linkSignal(signal));
    },
    close: dispose,
    stop: dispose,
    dispose,
  };
}

/**
 * Produce a durable chat session `Response` from a server chat stream.
 *
 * Wraps `toDurableChatSessionResponse`. When an `authorize` hook is supplied it
 * is enforced against `request` (see {@link NetScriptChatAuthorize}); a denial
 * yields `403 Forbidden` and the session stream is never touched. Supplying
 * `authorize` without `request` is a programming error and throws.
 */
export async function toNetScriptChatResponse(
  options: NetScriptChatResponseOptions,
): Promise<Response> {
  const { target, source, newMessages, request, authorize } = options;

  if (authorize) {
    if (!request) {
      throw new Error(
        'toNetScriptChatResponse: `authorize` was provided without a `request` to authorize against.',
      );
    }
    const allowed = await authorize(request, target.sessionId);
    if (!allowed) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const toResponse = options.toResponse ?? defaultToResponse;
  return toResponse({
    writeUrl: resolveChatSessionUrl(target, { streamPath: options.streamPath }),
    headers: resolveChatHeaders(target),
    newMessages: (newMessages ?? []).map(toDurableMessage),
    source,
  });
}

/**
 * Resolve the seed chat snapshot for SSR / first paint.
 *
 * Materializes the durable session (via `materializeSnapshotFromDurableStream`)
 * and reduces it through {@link projectChatSnapshot} — the SAME reducer the live
 * island path uses (ONE-PROJECTION LAW) — so tool cards rendered at seed time
 * survive the first live chunk unchanged. The returned `offset` seeds the live
 * subscription so seed and live read one continuous chunk log.
 */
export async function resolveChatSnapshot(
  options: NetScriptChatSnapshotOptions,
): Promise<NetScriptChatSnapshot> {
  const materialize = options.materialize ?? defaultMaterialize;
  const raw = await materialize({
    readUrl: resolveChatSessionUrl(options.target, { streamPath: options.streamPath }),
    headers: resolveChatHeaders(options.target),
    offset: options.offset,
  });
  const projected = projectChatSnapshot(raw.messages);
  return {
    messages: projected.messages,
    renderParts: projected.renderParts,
    offset: raw.offset ?? null,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers.
// ---------------------------------------------------------------------------

interface UpstreamChatConnection {
  readonly subscribe: (signal?: AbortSignal) => AsyncIterable<unknown>;
  readonly send: (
    messages: readonly unknown[],
    data?: unknown,
    signal?: AbortSignal,
  ) => Promise<void>;
}

interface ResolvedRetryConfig {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
}

function defaultCreateConnection(input: {
  readonly sendUrl: string;
  readonly readUrl: string;
  readonly headers: Record<string, string>;
  readonly initialOffset?: string;
}): UpstreamChatConnection {
  const connection = durableStreamConnection({
    sendUrl: input.sendUrl,
    readUrl: input.readUrl,
    headers: input.headers,
    initialOffset: input.initialOffset,
  });
  return {
    subscribe: (signal?: AbortSignal): AsyncIterable<unknown> => connection.subscribe(signal),
    // Adapt the upstream mutable-array `send` to our readonly contract.
    send: (messages: readonly unknown[], data?: unknown, signal?: AbortSignal): Promise<void> =>
      connection.send([...messages], data, signal),
  };
}

function defaultMaterialize(input: {
  readonly readUrl: string;
  readonly headers: Record<string, string>;
  readonly offset?: string;
}): Promise<{ readonly messages: readonly unknown[]; readonly offset?: string }> {
  return materializeSnapshotFromDurableStream({
    readUrl: input.readUrl,
    headers: input.headers,
    offset: input.offset,
  });
}

function defaultToResponse(input: {
  readonly writeUrl: string;
  readonly headers: Record<string, string>;
  readonly newMessages: readonly unknown[];
  readonly source: AsyncIterable<unknown>;
}): Promise<Response> {
  return toDurableChatSessionResponse({
    stream: { writeUrl: input.writeUrl, headers: input.headers, createIfMissing: true },
    newMessages: input.newMessages as Parameters<
      typeof toDurableChatSessionResponse
    >[0]['newMessages'],
    responseStream: input.source,
  });
}

function resolveRetryConfig(
  overrides: NetScriptChatConnectionOptions['subscribeRetry'],
): ResolvedRetryConfig {
  return {
    maxAttempts: overrides?.maxAttempts ?? 5,
    initialDelayMs: overrides?.initialDelayMs ?? 250,
    maxDelayMs: overrides?.maxDelayMs ?? 5000,
  };
}

function resolveChatStreamSubpath(
  target: NetScriptChatSessionTarget,
  streamPath: NetScriptChatStreamPath | undefined,
): string {
  if (typeof streamPath === 'function') {
    return normalizeStreamPath(streamPath(target));
  }
  const prefix = normalizeStreamPath(streamPath ?? NETSCRIPT_CHAT_STREAM_SUBPATH);
  return `${prefix.replace(/\/+$/, '')}/${encodeURIComponent(target.sessionId)}`;
}

function normalizeStreamPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function withIdentityEncoding(headers: Record<string, string>): Record<string, string> {
  const normalized = { ...headers };
  for (const key of Object.keys(normalized)) {
    if (key.toLowerCase() === 'accept-encoding') {
      delete normalized[key];
    }
  }
  normalized['accept-encoding'] = 'identity';
  return normalized;
}

/**
 * SR2-tolerant subscribe. Complements the service-side SR2 fix (204/bridge): a
 * first-subscribe that races a not-yet-created session stream sees a transient
 * empty result or a transient error. Rather than surfacing that as terminal, we
 * re-poll with exponential backoff up to `maxAttempts`. Once real chunks flow,
 * the retry budget is spent and normal completion ends the stream.
 */
async function* subscribeWithRetry(
  connection: UpstreamChatConnection,
  retry: ResolvedRetryConfig,
  signal: AbortSignal,
): AsyncGenerator<unknown, void, unknown> {
  let attempt = 0;

  while (!signal.aborted) {
    let yielded = false;
    try {
      for await (const chunk of connection.subscribe(signal)) {
        yielded = true;
        yield chunk;
      }
    } catch (error) {
      if (signal.aborted) return;
      // A transient pre-data error (not-yet-created / premature close) is
      // re-polled; anything after data, or a hard error (401/403), propagates.
      if (yielded || !isTransientSubscribeError(error)) throw error;
    }

    if (signal.aborted || yielded) return;

    attempt += 1;
    if (attempt > retry.maxAttempts) return;
    await sleep(backoffDelay(attempt, retry), signal);
  }
}

function isTransientSubscribeError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  if (
    message.includes('401') || message.includes('403') ||
    message.includes('unauthorized') || message.includes('forbidden')
  ) {
    return false;
  }
  return (
    error instanceof TypeError || // fetch network error
    message.includes('404') || message.includes('not found') ||
    message.includes('204') || message.includes('no content') ||
    message.includes('up to date') || message.includes('up-to-date') ||
    message.includes('premature close') || message.includes('err_stream_premature_close') ||
    message.includes('econnrefused') || message.includes('connection refused')
  );
}

function backoffDelay(attempt: number, retry: ResolvedRetryConfig): number {
  return Math.min(retry.initialDelayMs * 2 ** (attempt - 1), retry.maxDelayMs);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0 || signal.aborted) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}

function toDurableMessage(message: NetScriptChatMessage): {
  readonly id: string;
  readonly role: string;
  readonly parts: ReadonlyArray<{ readonly type: 'text'; readonly text: string }>;
} {
  return {
    id: message.id,
    role: message.role,
    parts: [{ type: 'text', text: message.content }],
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function normalizeRole(value: unknown): NetScriptChatMessage['role'] {
  return value === 'system' || value === 'user' || value === 'tool' ? value : 'assistant';
}

function normalizeToolState(value: unknown): RenderPart['toolState'] {
  return value === 'pending' || value === 'streaming' || value === 'error' ? value : 'complete';
}
