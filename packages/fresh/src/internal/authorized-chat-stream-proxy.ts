/**
 * Opt-in revocable authorization delegation for `createNetScriptChatStreamProxy`.
 *
 * Instantiates one shared `@netscript/plugin-streams-core/proxy` instance per proxy so all
 * delegated `GET` `live=sse` requests enforce the shared global reader capacity cap while
 * preserving `target`, `streamPath`, `query`, `auth`, and `fetch` overrides, and guards `POST`
 * and non-SSE `GET` behind HTTP method checks, deterministic credential selection, Cookie
 * Origin/Fetch-Metadata checks, bounded admission `authorize`, and fail-closed MIME/status fencing.
 */

import { getStreamsAuth } from '@netscript/plugin-streams-core';
import {
  createNetScriptStreamProxy,
  DEFAULT_STREAM_PROXY_POLICY_TIMEOUT_MS,
  type StreamProxyClockPort,
} from '@netscript/plugin-streams-core/proxy';
import {
  createChatProxyErrorResponse,
  runBoundedChatAuthorize,
  sanitizeDiagnosticReason,
  selectChatCredentialAndGuard,
  snapshotChatAuthDecision,
} from './chat-proxy-guard.ts';
import {
  buildNonSseUpstreamHeaders,
  buildSseDelegatedUpstreamHeaders,
  extractClientTraceContext,
  isDisallowedNonSseContentType,
  sanitizeAuthorizedNonSseResponse,
  validateChatPolicyHeaders,
} from './chat-proxy-headers.ts';
import {
  type AuthorizedChatProxyInit,
  extractDefaultChatQuery,
  resolveChatPlan,
  type ResolvedChatPlan,
  snapshotClockPort,
  snapshotRevocationSource,
  snapshotTargetOption,
} from './chat-proxy-plan.ts';

export type { AuthorizedChatProxyInit } from './chat-proxy-plan.ts';

const SYSTEM_CLOCK: StreamProxyClockPort = Object.freeze({
  nowMs: (): number => Date.now(),
  schedule: (delayMs: number, onFire: () => void): () => void => {
    const timer = setTimeout(onFire, Math.max(0, delayMs));
    return () => clearTimeout(timer);
  },
});

/** Request input accepted by `createNetScriptChatStreamProxy` (bare Request or Fresh Context). */
export type ChatProxyInput =
  | Request
  | {
    readonly req: Request;
    readonly info?: { readonly remoteAddr?: Deno.Addr };
  };

/** Optional request-scoped transport context for authorized chat stream proxying. */
export interface ChatProxyRequestContext {
  /** Peer socket address used with `trustProxy` for forwarded-origin resolution. */
  readonly remoteAddr?: Deno.Addr;
  /** Optional server shutdown signal; aborts active SSE/non-SSE requests promptly. */
  readonly shutdownSignal?: AbortSignal;
}

interface SseDelegationPlan {
  readonly originalRequest: Request;
  readonly incomingQuery: Readonly<Record<string, string>>;
  readonly plan: ResolvedChatPlan;
  readonly clientTraceparent: string | null;
  readonly clientTracestate: string | null;
}

function extractRequest(input: ChatProxyInput): Request {
  return input instanceof Request ? input : input.req;
}

function extractRemoteAddr(
  input: ChatProxyInput,
  context?: ChatProxyRequestContext,
): Deno.Addr | undefined {
  if (context?.remoteAddr !== undefined) return context.remoteAddr;
  if (input instanceof Request) return undefined;
  return input.info?.remoteAddr;
}

function cancelBodyNonBlocking(body: ReadableStream<Uint8Array> | null, reason: string): void {
  if (!body) return;
  try {
    void body.cancel(reason).catch(() => {});
  } catch {
    // Suppress synchronous cancellation errors on hostile/locked streams.
  }
}

/** Validate options eagerly at construction and return the opt-in authorized chat proxy handler. */
export function createAuthorizedChatStreamProxy<TGrant = unknown>(
  rawOptions: AuthorizedChatProxyInit<TGrant>,
): (input: ChatProxyInput, context?: ChatProxyRequestContext) => Promise<Response> {
  if (
    rawOptions.streamPath !== undefined &&
    typeof rawOptions.streamPath !== 'string' &&
    typeof rawOptions.streamPath !== 'function'
  ) {
    throw new TypeError('[netscript.fresh.ai] streamPath must be a string or function');
  }
  if (rawOptions.query !== undefined && typeof rawOptions.query !== 'function') {
    throw new TypeError('[netscript.fresh.ai] query must be a function');
  }
  if (rawOptions.auth !== undefined && typeof rawOptions.auth !== 'function') {
    throw new TypeError('[netscript.fresh.ai] auth must be a function');
  }
  if (rawOptions.fetch !== undefined && typeof rawOptions.fetch !== 'function') {
    throw new TypeError('[netscript.fresh.ai] fetch must be a function');
  }
  if (rawOptions.allowedOrigins !== undefined && !Array.isArray(rawOptions.allowedOrigins)) {
    throw new TypeError('[netscript.fresh.ai] allowedOrigins must be an array');
  }
  if (
    rawOptions.clientAuth !== undefined &&
    rawOptions.clientAuth !== 'bearer' &&
    rawOptions.clientAuth !== 'cookie' &&
    rawOptions.clientAuth !== 'bearer-or-cookie'
  ) {
    throw new TypeError(
      `[netscript.fresh.ai] invalid clientAuth: ${String(rawOptions.clientAuth)}`,
    );
  }
  if (
    rawOptions.trustProxy !== undefined &&
    rawOptions.trustProxy !== false &&
    typeof rawOptions.trustProxy !== 'function'
  ) {
    throw new TypeError('[netscript.fresh.ai] trustProxy must be false or a predicate function');
  }
  if (rawOptions.policyTimeoutMs !== undefined && typeof rawOptions.policyTimeoutMs !== 'number') {
    throw new TypeError('[netscript.fresh.ai] policyTimeoutMs must be a positive integer');
  }

  // Snapshot all options and bind port methods at construction so post-construction mutations
  // cannot weaken policy or replace active hooks.
  const allowedOriginsList = rawOptions.allowedOrigins !== undefined
    ? Array.from(rawOptions.allowedOrigins)
    : undefined;
  const snapshottedTarget = snapshotTargetOption(rawOptions.target);
  const snapshottedClock = snapshotClockPort(rawOptions.clock);
  const snapshottedRevocationSource = snapshotRevocationSource<TGrant>(rawOptions.revocationSource);

  const config: AuthorizedChatProxyInit<TGrant> = {
    target: snapshottedTarget,
    streamPath: rawOptions.streamPath,
    query: rawOptions.query,
    auth: rawOptions.auth,
    fetch: rawOptions.fetch,
    authorize: rawOptions.authorize,
    recheck: rawOptions.recheck,
    clientAuth: rawOptions.clientAuth === undefined ? 'bearer-or-cookie' : rawOptions.clientAuth,
    allowedOrigins: allowedOriginsList,
    trustProxy: rawOptions.trustProxy === undefined ? false : rawOptions.trustProxy,
    recheckEveryMs: rawOptions.recheckEveryMs,
    revocationSource: snapshottedRevocationSource,
    policyTimeoutMs: rawOptions.policyTimeoutMs === undefined
      ? DEFAULT_STREAM_PROXY_POLICY_TIMEOUT_MS
      : rawOptions.policyTimeoutMs,
    clock: snapshottedClock,
  };

  const clientAuth = config.clientAuth!;
  const allowedOrigins = new Set<string>(allowedOriginsList ?? []);
  const trustProxy = config.trustProxy!;
  const policyTimeoutMs = config.policyTimeoutMs!;
  const clock = snapshottedClock ?? SYSTEM_CLOCK;
  const resolveAuth = config.auth ?? getStreamsAuth;
  const doFetch = config.fetch ?? fetch;

  // Per-request SSE delegation state keyed by delegated Request and unique correlation traceparent
  // so ONE shared `createNetScriptStreamProxy` enforces the global reader cap across all SSE reads.
  const ssePlansByRequest = new WeakMap<Request, SseDelegationPlan>();
  const ssePlansByCorrelation = new Map<string, SseDelegationPlan>();
  let nextCorrelationSeq = 0;

  const allocateCorrelationTraceparent = (): string => {
    nextCorrelationSeq += 1;
    const traceId = nextCorrelationSeq.toString(16).padStart(32, '0');
    const parentId = nextCorrelationSeq.toString(16).padStart(16, '0');
    return `00-${traceId}-${parentId}-01`;
  };

  const sharedSseProxy = createNetScriptStreamProxy<TGrant>({
    authorize: (ctx) => {
      const entry = ssePlansByRequest.get(ctx.request);
      if (!entry) throw new Error('missing_sse_delegation_plan');
      return config.authorize({
        ...ctx,
        request: entry.originalRequest,
        query: entry.incomingQuery,
        principal: undefined,
      });
    },
    recheck: config.recheck,
    resolvePath: (ctx) => {
      const entry = ssePlansByRequest.get(ctx.request);
      if (!entry) throw new Error('missing_sse_delegation_plan');
      return entry.plan.cleanStreamPath;
    },
    baseUrl: 'http://chat-proxy.internal',
    upstreamAuth: (ctx) => {
      if (ctx?.signal.aborted) throw new Error('client_cancelled');
      const authHeaders = resolveAuth();
      if (ctx?.signal.aborted) throw new Error('client_cancelled');
      return authHeaders;
    },
    fetch: (proxyInput, init) => {
      const proxyHeaders = new Headers(init?.headers);
      const correlationId = proxyHeaders.get('traceparent');
      const entry = correlationId ? ssePlansByCorrelation.get(correlationId) : undefined;
      if (!entry) return Promise.reject(new Error('missing_sse_delegation_plan'));

      const proxyUrlStr = typeof proxyInput === 'string'
        ? proxyInput
        : proxyInput instanceof URL
        ? proxyInput.href
        : proxyInput.url;
      const proxyUrl = new URL(proxyUrlStr);
      const finalUrl = new URL(entry.plan.upstreamUrl.href);
      if (!finalUrl.searchParams.has('offset')) {
        const effectiveOffset = proxyUrl.searchParams.get('offset');
        if (effectiveOffset !== null) finalUrl.searchParams.set('offset', effectiveOffset);
      }

      const finalHeaders = buildSseDelegatedUpstreamHeaders(
        entry.plan.targetHeaders,
        proxyHeaders,
        entry.clientTraceparent,
        entry.clientTracestate,
      );
      return doFetch(
        new Request(finalUrl, {
          method: 'GET',
          headers: finalHeaders,
          redirect: 'manual',
          signal: init?.signal,
        }),
      );
    },
    clientAuth,
    allowedOrigins: allowedOriginsList,
    trustProxy,
    recheckEveryMs: config.recheckEveryMs,
    revocationSource: snapshottedRevocationSource,
    policyTimeoutMs,
    clock: snapshottedClock,
  });

  return async (
    input: ChatProxyInput,
    context?: ChatProxyRequestContext,
  ): Promise<Response> => {
    const request = extractRequest(input);
    const remoteAddr = extractRemoteAddr(input, context);
    const shutdownSignal = context?.shutdownSignal;

    // Enforce the HTTP method boundary up front so unsupported methods never invoke policy/upstream.
    if (request.method !== 'GET' && request.method !== 'POST') {
      return createChatProxyErrorResponse(405, 'method_not_allowed', { allow: 'GET, POST' });
    }
    if (request.signal.aborted) return createChatProxyErrorResponse(503, 'client_cancelled');
    if (shutdownSignal?.aborted) return createChatProxyErrorResponse(503, 'service_shutdown');

    const guard = selectChatCredentialAndGuard(
      request,
      remoteAddr,
      clientAuth,
      allowedOrigins,
      trustProxy,
    );
    if (!guard.ok) return createChatProxyErrorResponse(guard.status, guard.reason);
    const credentialMode = guard.credentialMode;

    const plan = resolveChatPlan(request, config);
    if (request.signal.aborted) return createChatProxyErrorResponse(503, 'client_cancelled');
    if (shutdownSignal?.aborted) return createChatProxyErrorResponse(503, 'service_shutdown');
    if (!plan) return createChatProxyErrorResponse(500, 'invalid_stream_path');

    const incomingQueryRecord = extractDefaultChatQuery(new URL(request.url).searchParams);
    const liveValues = plan.upstreamUrl.searchParams.getAll('live');
    const isSseGet = request.method === 'GET' &&
      liveValues.some((value) => value.toLowerCase() === 'sse');

    // GET live=sse -> delegate to the ONE shared `@netscript/plugin-streams-core/proxy` runtime.
    if (isSseGet) {
      const trace = extractClientTraceContext(request.headers);
      const correlationId = allocateCorrelationTraceparent();
      const delegatedUrl = new URL(request.url);
      delegatedUrl.search = plan.upstreamUrl.search;
      const delegatedHeaders = new Headers(request.headers);
      delegatedHeaders.set('traceparent', correlationId);
      delegatedHeaders.delete('tracestate');
      const delegatedRequest = new Request(delegatedUrl, {
        method: 'GET',
        headers: delegatedHeaders,
        signal: request.signal,
      });

      const entry: SseDelegationPlan = {
        originalRequest: request,
        incomingQuery: incomingQueryRecord,
        plan,
        clientTraceparent: trace.traceparent,
        clientTracestate: trace.tracestate,
      };
      ssePlansByRequest.set(delegatedRequest, entry);
      ssePlansByCorrelation.set(correlationId, entry);
      try {
        return await sharedSseProxy(delegatedRequest, {
          credentialMode,
          remoteAddr,
          shutdownSignal,
        });
      } finally {
        ssePlansByCorrelation.delete(correlationId);
      }
    }

    // POST and non-SSE GET -> bounded admission authorize + sanitized non-SSE proxy.
    const authOutcome = await runBoundedChatAuthorize(
      clock,
      policyTimeoutMs,
      request.signal,
      shutdownSignal,
      (signal) =>
        config.authorize({
          request,
          params: Object.freeze({}),
          query: incomingQueryRecord,
          credentialMode,
          principal: undefined,
          signal,
        }),
    );
    if (!authOutcome.ok) {
      if (request.signal.aborted) return createChatProxyErrorResponse(503, 'client_cancelled');
      if (shutdownSignal?.aborted) return createChatProxyErrorResponse(503, 'service_shutdown');
      return createChatProxyErrorResponse(503, 'policy_unavailable');
    }

    const decision = snapshotChatAuthDecision<TGrant>(authOutcome.value);
    if (!decision) return createChatProxyErrorResponse(503, 'policy_unavailable');
    if (!decision.allow) {
      return createChatProxyErrorResponse(
        decision.status,
        sanitizeDiagnosticReason(decision.reason, 'access_denied'),
      );
    }

    if (decision.expiresAtMs !== undefined) {
      if (!Number.isFinite(decision.expiresAtMs)) {
        return createChatProxyErrorResponse(503, 'policy_unavailable');
      }
      if (decision.expiresAtMs <= clock.nowMs()) {
        return createChatProxyErrorResponse(401, 'session_expired');
      }
    }

    const validatedHeaders = validateChatPolicyHeaders(
      decision.responseHeaders,
      decision.setCookies,
    );
    if (!validatedHeaders.ok) {
      return createChatProxyErrorResponse(503, 'invalid_policy_headers');
    }

    if (request.signal.aborted) return createChatProxyErrorResponse(503, 'client_cancelled');
    if (shutdownSignal?.aborted) return createChatProxyErrorResponse(503, 'service_shutdown');

    let upstreamHeaders: Headers;
    try {
      upstreamHeaders = buildNonSseUpstreamHeaders(request, plan.targetHeaders, resolveAuth());
    } catch {
      if (request.signal.aborted) return createChatProxyErrorResponse(503, 'client_cancelled');
      if (shutdownSignal?.aborted) return createChatProxyErrorResponse(503, 'service_shutdown');
      return createChatProxyErrorResponse(503, 'upstream_unavailable');
    }

    // Re-check abort right at the upstream boundary (e.g. if auth() synchronously aborted signal).
    if (request.signal.aborted) return createChatProxyErrorResponse(503, 'client_cancelled');
    if (shutdownSignal?.aborted) return createChatProxyErrorResponse(503, 'service_shutdown');

    const fetchSignal = shutdownSignal
      ? AbortSignal.any([request.signal, shutdownSignal])
      : request.signal;
    const hasBody = request.body !== null;
    const requestInit: RequestInit & { duplex?: 'half' } = {
      method: request.method,
      headers: upstreamHeaders,
      body: request.body,
      duplex: hasBody ? 'half' : undefined,
      redirect: 'manual',
      signal: fetchSignal,
    };

    let upstream: Response;
    try {
      upstream = await doFetch(new Request(plan.upstreamUrl, requestInit));
    } catch {
      if (request.signal.aborted) return createChatProxyErrorResponse(503, 'client_cancelled');
      if (shutdownSignal?.aborted) return createChatProxyErrorResponse(503, 'service_shutdown');
      return createChatProxyErrorResponse(502, 'upstream_unavailable');
    }

    if (request.signal.aborted) {
      cancelBodyNonBlocking(upstream.body, 'client_cancelled');
      return createChatProxyErrorResponse(503, 'client_cancelled');
    }
    if (shutdownSignal?.aborted) {
      cancelBodyNonBlocking(upstream.body, 'service_shutdown');
      return createChatProxyErrorResponse(503, 'service_shutdown');
    }

    if (upstream.status === 401 || upstream.status === 403) {
      cancelBodyNonBlocking(upstream.body, 'upstream_auth_failed');
      return createChatProxyErrorResponse(502, 'upstream_auth_failed');
    }
    if (upstream.status >= 300 && upstream.status < 400) {
      cancelBodyNonBlocking(upstream.body, 'upstream_redirect_blocked');
      return createChatProxyErrorResponse(502, 'upstream_redirect_blocked');
    }
    if (isDisallowedNonSseContentType(upstream.headers.get('content-type'))) {
      cancelBodyNonBlocking(upstream.body, 'unexpected_sse_response');
      return createChatProxyErrorResponse(502, 'unexpected_sse_response');
    }

    return sanitizeAuthorizedNonSseResponse(
      upstream,
      validatedHeaders.headers,
      validatedHeaders.setCookies,
    );
  };
}
