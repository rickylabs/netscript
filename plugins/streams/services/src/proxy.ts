/**
 * Front-proxy request handling for the durable-streams service.
 *
 * The service fronts an internal `DurableStreamTestServer` with a transparent
 * `fetch()` hop. Two runtime hazards are handled here:
 *
 *  1. **Header hygiene** — the upstream mislabels a decoded JSON body with
 *     `content-encoding: gzip`; {@link sanitizeProxyResponse} strips that (and
 *     the hop-by-hop headers) so the response describes the bytes actually sent
 *     (netscript#219 / #239). The same sanitizer also re-streams the upstream
 *     body through an explicit `ReadableStream` so a client disconnect cancels
 *     the upstream reader cleanly instead of tearing the upstream `fetch` down
 *     as an uncaught `AbortError` (netscript#268 / SR1). Every response returned
 *     from this handler passes through that sanitizer.
 *
 *  2. **Fresh-session live-read race** — a brand-new chat session issues its
 *     first live/subscribe poll of a durable stream *before* the producer's
 *     first write has created that stream. The upstream answers a live poll of
 *     a not-yet-created stream with `404 Stream not found`, which the client
 *     surfaces as a terminal error and the UI stalls until a manual refresh
 *     (netscript#267). A live subscription of a stream that does not yet exist
 *     is semantically "the stream is empty and up-to-date" — not an error — so
 *     this handler intercepts that specific 404 and either bridges until the
 *     producer creates the stream (then forwards the real data) or returns an
 *     empty, up-to-date live response so the subscription stays open and
 *     re-polls. Snapshot (non-live) reads of a genuinely missing stream still
 *     404 unchanged.
 *
 * The bug's client-side retry/backoff half (netscript#267 FA1) is a separate
 * change; this module is the runtime/service half only and touches no client
 * code.
 *
 * @module
 */

import type { Context } from 'hono';
import { sanitizeProxyResponse } from './proxy-headers.ts';

/**
 * The `live` query-parameter value used by the durable-streams long-poll
 * subscription mode (`@durable-streams/client`). `live: true` maps to this on
 * the wire; it is the default subscribe transport and the one exercised by the
 * fresh-session race in netscript#267.
 */
const LIVE_LONG_POLL = 'long-poll';

/** Query parameter carrying the read start offset. */
const OFFSET_QUERY_PARAM = 'offset';
/** Query parameter selecting the live transport (`long-poll` / `sse`). */
const LIVE_QUERY_PARAM = 'live';

/** Durable-streams response header: the next offset a reader should resume at. */
const STREAM_OFFSET_HEADER = 'Stream-Next-Offset';
/** Durable-streams response header: present (any value) means "caught up". */
const STREAM_UP_TO_DATE_HEADER = 'Stream-Up-To-Date';

/**
 * Bounds for how long a live poll of a not-yet-created stream is bridged before
 * an empty up-to-date response is returned to keep the subscription open.
 */
export interface LiveCreateWaitConfig {
  /**
   * Total time (ms) a single live poll of a missing stream is held open while
   * waiting for the producer to create it. `0` disables bridging: a live 404 is
   * translated to an empty up-to-date response immediately (client re-polls).
   */
  readonly waitMs: number;
  /** Interval (ms) between upstream existence re-checks while bridging. */
  readonly pollMs: number;
}

/** Default bridging window: one long-poll-like hold, well under the upstream's 30s. */
const DEFAULT_WAIT_MS = 10_000;
/** Default re-check cadence while bridging. */
const DEFAULT_POLL_MS = 100;
/** Hard ceiling so a misconfigured env var can never hang a request unbounded. */
const MAX_WAIT_MS = 60_000;
/** Floor on the poll interval to avoid a hot spin loop. */
const MIN_POLL_MS = 10;

function clampInt(
  raw: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

/**
 * Resolve the live-create bridging window from the environment.
 *
 * - `STREAMS_LIVE_CREATE_WAIT_MS` — total bridge window, clamped `[0, 60000]`,
 *   default `10000`.
 * - `STREAMS_LIVE_CREATE_POLL_MS` — re-check interval, clamped
 *   `[10, max(10, waitMs)]`, default `100`.
 */
export function resolveLiveCreateWaitConfig(
  getEnv: (key: string) => string | undefined = (k) => Deno.env.get(k),
): LiveCreateWaitConfig {
  const waitMs = clampInt(getEnv('STREAMS_LIVE_CREATE_WAIT_MS'), DEFAULT_WAIT_MS, 0, MAX_WAIT_MS);
  const pollMs = clampInt(
    getEnv('STREAMS_LIVE_CREATE_POLL_MS'),
    DEFAULT_POLL_MS,
    MIN_POLL_MS,
    Math.max(MIN_POLL_MS, waitMs),
  );
  return { waitMs, pollMs };
}

/**
 * A GET read carrying `live=long-poll` is a live/subscribe poll. This is the
 * only shape whose "stream not found" is reinterpreted as "empty & up-to-date";
 * non-live reads (no `live` param) are left to 404 as before, preserving
 * snapshot semantics.
 */
export function isLiveLongPollRead(method: string, url: URL): boolean {
  return method.toUpperCase() === 'GET' &&
    url.searchParams.get(LIVE_QUERY_PARAM) === LIVE_LONG_POLL;
}

/**
 * Build the empty, up-to-date live response returned when a stream still does
 * not exist at the end of the bridge window. Mirrors the upstream's own
 * long-poll-timeout reply (`204` + `Stream-Up-To-Date`) so the client treats it
 * as "caught up, nothing new" and re-polls from the same offset — keeping the
 * subscription open instead of tearing it down on a 404.
 */
export function emptyUpToDateResponse(requestOffset: string | null): Response {
  const headers = new Headers();
  headers.set(STREAM_UP_TO_DATE_HEADER, 'true');
  // Echo the request's start offset so the client resumes from the same point
  // (no data was consumed); default to "-1" (from the beginning) when absent.
  headers.set(STREAM_OFFSET_HEADER, requestOffset && requestOffset !== '' ? requestOffset : '-1');
  headers.set('cache-control', 'no-store');
  return new Response(null, { status: 204, statusText: 'No Content', headers });
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });

/** Options for {@link createStreamsProxyHandler}. */
export interface StreamsProxyOptions {
  /** Internal port of the upstream `DurableStreamTestServer`. */
  readonly internalPort: number;
  /**
   * Live-create bridging window. Defaults to {@link resolveLiveCreateWaitConfig}
   * read from the environment; overridable for tests.
   */
  readonly liveCreateWait?: LiveCreateWaitConfig;
}

/**
 * Create the catch-all proxy handler for the durable-streams front service.
 *
 * Extracted from the service entrypoint so it can be unit-tested against a fake
 * upstream without booting a real `DurableStreamTestServer`.
 */
export function createStreamsProxyHandler(
  options: StreamsProxyOptions,
): (c: Context) => Promise<Response> {
  const { internalPort } = options;
  const liveCreateWait = options.liveCreateWait ?? resolveLiveCreateWaitConfig();

  const forward = (c: Context, target: string): Promise<Response> =>
    fetch(
      new Request(target, {
        method: c.req.method,
        headers: c.req.raw.headers,
        body: c.req.raw.body,
        // @ts-ignore Deno supports duplex on Request
        duplex: c.req.raw.body ? 'half' : undefined,
      }),
    );

  return async (c: Context): Promise<Response> => {
    const url = new URL(c.req.url);
    const target = `http://127.0.0.1:${internalPort}${url.pathname}${url.search}`;
    try {
      const first = await forward(c, target);

      // Fast path: anything other than a live-poll 404 is proxied verbatim
      // (header-sanitized). This preserves snapshot 404s, the #239 gzip fix, and
      // every non-error response byte-for-byte.
      if (first.status !== 404 || !isLiveLongPollRead(c.req.method, url)) {
        return sanitizeProxyResponse(first);
      }

      // Live-poll of a not-yet-created stream: the 404 body is discarded and we
      // bridge until the producer creates the stream (then forward the real
      // data) or the bridge window elapses (then an empty up-to-date response
      // keeps the subscription open). Bounded by liveCreateWait.
      await first.body?.cancel();

      const signal: AbortSignal | undefined = c.req.raw.signal;
      const deadline = Date.now() + liveCreateWait.waitMs;
      while (Date.now() < deadline && !signal?.aborted) {
        const remaining = deadline - Date.now();
        await sleep(Math.min(liveCreateWait.pollMs, remaining), signal);
        if (signal?.aborted) break;

        const next = await forward(c, target);
        if (next.status !== 404) {
          // Stream now exists — hand off to the upstream's live machinery.
          return sanitizeProxyResponse(next);
        }
        await next.body?.cancel();
      }

      return emptyUpToDateResponse(url.searchParams.get(OFFSET_QUERY_PARAM));
    } catch {
      return c.json({ error: 'Upstream unavailable' }, 502);
    }
  };
}
