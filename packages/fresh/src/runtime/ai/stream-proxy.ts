/**
 * FA2 — the single, correct durable **chat stream proxy** for NetScript Fresh
 * routes.
 *
 * `createNetScriptChatStreamProxy` replaces the per-route, hand-rolled chat
 * proxies that each re-forwarded the durable-streams response verbatim. Those
 * hand-rolled proxies re-emitted the upstream `content-encoding`/`content-length`
 * headers on a body that Deno's `fetch` had already transparently decoded and
 * re-framed — mislabeling the bytes on the wire and breaking every
 * standards-compliant reader (browser `fetch`/`DecompressionStream`, Deno
 * `fetch` auto-decompress, `curl --compressed`) and, worse, truncating a
 * re-streamed chunked body against a stale `content-length`. That defect is
 * netscript#239.
 *
 * This handler fences #239 in the Fresh layer by upholding one invariant:
 * **every response header must describe the bytes actually sent.** Since the
 * re-streamed body is decoded and re-framed by `Deno.serve`, the honest thing is
 * to drop `content-encoding` and `content-length`, plus the RFC 9110 §7.6.1
 * hop-by-hop headers (which describe the upstream connection, not the proxied
 * one). The header-hygiene set below mirrors the proven
 * `sanitizeProxyResponse` in `plugins/streams/services`; it is replicated here
 * (not imported) because the Fresh runtime plane may not depend on plugin
 * service internals.
 *
 * Auth is attached **server-side only**: `getStreamsAuth()` from
 * `@netscript/plugin-streams-core` runs inside the handler, overlays the
 * durable-streams `Authorization` header onto the upstream request, and is never
 * echoed back to the browser (the response returned to the client is the
 * sanitized proxy response, which carries no request auth). The upstream body is
 * passed through **unbuffered** — the inner `fetch`'s `ReadableStream` is handed
 * straight to the outbound `Response` with no re-encoding.
 *
 * The incoming request's `AbortSignal` is propagated into the inner `fetch`, so
 * a client disconnect aborts the upstream fetch and tears down the stream with
 * no dangling connection (fitness function F-13, SR1 cancel-aware client half).
 *
 * @module
 */

import { getStreamsAuth } from '@netscript/plugin-streams-core';
import {
  type NetScriptChatSessionTarget,
  resolveChatSessionUrl,
} from './create-chat-connection.ts';

/**
 * Response headers stripped before a proxied durable-stream response is returned
 * to the client.
 *
 * - `content-encoding` / `content-length` — no longer describe the decoded,
 *   re-framed body once it crosses the `fetch` hop (netscript#239).
 * - the RFC 9110 §7.6.1 hop-by-hop headers — describe the upstream connection,
 *   not the re-streamed one, so they must not survive a proxy hop.
 */
const STRIPPED_RESPONSE_HEADERS: readonly string[] = [
  'content-encoding',
  'content-length',
  // hop-by-hop (RFC 9110 §7.6.1)
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

/**
 * Re-wrap an upstream durable-stream response so its headers describe the bytes
 * on the wire. The body `ReadableStream` is passed through unbuffered; only the
 * headers listed in {@link STRIPPED_RESPONSE_HEADERS} are removed.
 */
function sanitizeUpstreamResponse(upstream: Response): Response {
  const headers = new Headers(upstream.headers);
  for (const name of STRIPPED_RESPONSE_HEADERS) {
    headers.delete(name);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

/**
 * A Fresh-compatible chat-stream proxy handler. Accepts either a bare `Request`
 * or a Fresh route context (anything with a `.req` `Request`), so it can be used
 * directly as a `Handler`/`Handlers` entry (`{ POST: handler }`) or called with
 * a `Request` in tests.
 */
export type NetScriptChatStreamProxyHandler = (
  input: Request | { readonly req: Request },
) => Promise<Response>;

/** Options for {@link createNetScriptChatStreamProxy}. */
export interface NetScriptChatStreamProxyOptions {
  /** The chat session to proxy, or a resolver deriving it from the request. */
  readonly target:
    | NetScriptChatSessionTarget
    | ((request: Request) => NetScriptChatSessionTarget);
  /**
   * Durable-stream subpath override for the upstream stream. A string is used as
   * the prefix before the encoded `sessionId`; a function returns the full
   * per-request subpath, e.g. `/eischat/sessions/{id}/messages`.
   */
  readonly streamPath?:
    | string
    | ((input: {
      readonly request: Request;
      readonly target: NetScriptChatSessionTarget;
    }) => string);
  /**
   * Server-side auth header provider. Defaults to `getStreamsAuth` from
   * `@netscript/plugin-streams-core`. Invoked per request; the result is
   * overlaid onto the upstream request headers and never returned to the client.
   */
  readonly auth?: () => Record<string, string>;
  /**
   * `fetch` implementation used for the upstream hop. Defaults to the global
   * `fetch`. Injectable so tests can drive body/header/abort behavior.
   */
  readonly fetch?: typeof fetch;
}

/** Narrow a bare `Request` or a Fresh-style context to its `Request`. */
function toRequest(input: Request | { readonly req: Request }): Request {
  return input instanceof Request ? input : input.req;
}

/**
 * Build the single durable chat-stream proxy handler.
 *
 * The returned handler resolves the chat session target (static or per-request),
 * proxies the incoming request to that session's durable-stream URL, attaches
 * server-side streams auth, passes the upstream body through unbuffered, strips
 * headers that would misdescribe the re-framed bytes (fencing netscript#239),
 * and propagates the client `AbortSignal` so a disconnect tears the upstream
 * fetch down (F-13).
 *
 * @param options Chat session `target` plus optional `auth`/`fetch` overrides.
 * @returns A Fresh `Handler`/`Handlers`-compatible chat-stream proxy function.
 *
 * @example
 * ```ts
 * // routes/api/chat/[sessionId].ts
 * import { createNetScriptChatStreamProxy } from '@netscript/fresh/ai';
 *
 * const proxy = createNetScriptChatStreamProxy({
 *   target: (req) => ({
 *     sessionId: new URL(req.url).pathname.split('/').pop()!,
 *   }),
 *   streamPath: ({ target }) => `/eischat/sessions/${target.sessionId}/messages`,
 * });
 *
 * export const handler = { POST: proxy, GET: proxy };
 * ```
 */
export function createNetScriptChatStreamProxy(
  options: NetScriptChatStreamProxyOptions,
): NetScriptChatStreamProxyHandler {
  const resolveAuth = options.auth ?? getStreamsAuth;
  const doFetch = options.fetch ?? fetch;

  return async (input: Request | { readonly req: Request }): Promise<Response> => {
    const request = toRequest(input);
    const target = typeof options.target === 'function' ? options.target(request) : options.target;
    const configuredStreamPath = options.streamPath;
    const streamPath = typeof configuredStreamPath === 'function'
      ? () => configuredStreamPath({ request, target })
      : configuredStreamPath;
    const upstreamUrl = resolveChatSessionUrl(target, { streamPath });

    // Forward the client request headers, then overlay the target's session
    // headers (if any) and the server-side streams auth. `host` is dropped so
    // the inner fetch sets it for the upstream. The auth header lives only on
    // this server→streams hop; it is never surfaced to the browser (the
    // sanitized response below carries no request auth).
    const upstreamHeaders = new Headers(request.headers);
    upstreamHeaders.delete('host');
    if (target.headers) {
      for (const [name, value] of Object.entries(target.headers)) {
        upstreamHeaders.set(name, value);
      }
    }
    for (const [name, value] of Object.entries(resolveAuth())) {
      upstreamHeaders.set(name, value);
    }
    // Prevent Deno's fetch decoder from failing before FA2 can sanitize a
    // mislabeled durable-stream response (netscript#219 gzip flavor).
    upstreamHeaders.set('accept-encoding', 'identity');

    const hasBody = request.body !== null;
    const requestInit: RequestInit & { duplex?: 'half' } = {
      method: request.method,
      headers: upstreamHeaders,
      body: request.body,
      // Deno requires `duplex: 'half'` to stream a request body.
      duplex: hasBody ? 'half' : undefined,
      redirect: 'manual',
      // Propagate client disconnect into the inner fetch: on abort the upstream
      // fetch is cancelled and its ReadableStream torn down — no dangling
      // stream (F-13, SR1 cancel-aware client half).
      signal: request.signal,
    };
    const upstreamRequest = new Request(upstreamUrl, requestInit);

    const upstream = await doFetch(upstreamRequest);
    // Unbuffered passthrough of the inner fetch's ReadableStream body.
    return sanitizeUpstreamResponse(upstream);
  };
}
