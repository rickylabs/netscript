/**
 * Opt-in revocable authorization delegation for `createNetScriptChatStreamProxy`.
 *
 * Delegates `GET` `live=sse` requests to `@netscript/plugin-streams-core/proxy` while preserving
 * `target`, `streamPath`, `query`, `auth`, and `fetch` overrides, and guards `POST` and non-SSE
 * `GET` behind deterministic credential selection, Cookie Origin/Fetch-Metadata checks, and
 * bounded admission `authorize`.
 */

import { getStreamsAuth } from '@netscript/plugin-streams-core';
import {
  createNetScriptStreamProxy,
  DEFAULT_STREAM_PROXY_POLICY_TIMEOUT_MS,
  type ServiceProxyTrust,
  type StreamEndpointClientAuthMode,
  type StreamProxyAuthDecision,
  type StreamProxyClockPort,
  type StreamProxyRecheckContext,
  type StreamProxyRecheckDecision,
  type StreamProxyRevocationSource,
} from '@netscript/plugin-streams-core/proxy';
import {
  NETSCRIPT_CHAT_STREAM_SUBPATH,
  type NetScriptChatSessionTarget,
  resolveChatSessionUrl,
} from '../runtime/ai/create-chat-connection.ts';
import {
  createChatProxyErrorResponse,
  runBoundedChatAuthorize,
  sanitizeDiagnosticReason,
  selectChatCredentialAndGuard,
  snapshotChatAuthDecision,
} from './chat-proxy-guard.ts';
import {
  buildNonSseUpstreamHeaders,
  isSafeHeaderValue,
  isValidHeaderName,
  mergeChatServerHeaders,
  sanitizeAuthorizedNonSseResponse,
  validateChatPolicyHeaders,
} from './chat-proxy-headers.ts';

const UNSAFE_RESOLVED_PATH_CHARS = /[?#\r\n\0\\]/;
const ENCODED_SEPARATOR_PATTERN = /%(?:2f|5c)/i;
const RESERVED_PROTOCOL_QUERY_KEYS: ReadonlySet<string> = new Set(['offset', 'live', 'cursor']);

const SYSTEM_CLOCK: StreamProxyClockPort = {
  nowMs: () => Date.now(),
  schedule: (delayMs, onFire) => {
    const timer = setTimeout(onFire, Math.max(0, delayMs));
    return () => clearTimeout(timer);
  },
};

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

/** Internal snapshotted options passed into `createAuthorizedChatStreamProxy`. */
export interface AuthorizedChatProxyInit<TGrant = unknown> {
  readonly target:
    | NetScriptChatSessionTarget
    | ((request: Request) => NetScriptChatSessionTarget);
  readonly streamPath?:
    | string
    | ((input: {
      readonly request: Request;
      readonly target: NetScriptChatSessionTarget;
    }) => string);
  readonly query?: (query: URLSearchParams) => URLSearchParams;
  readonly auth?: () => Record<string, string>;
  readonly fetch?: typeof fetch;
  readonly authorize: (
    context: Readonly<{
      readonly request: Request;
      readonly params: Readonly<Record<string, string>>;
      readonly query: Readonly<Record<string, string>>;
      readonly credentialMode: 'bearer' | 'cookie';
      readonly principal?: undefined;
      readonly signal: AbortSignal;
    }>,
  ) => StreamProxyAuthDecision<TGrant> | Promise<StreamProxyAuthDecision<TGrant>>;
  readonly recheck: (
    context: StreamProxyRecheckContext<TGrant>,
  ) => StreamProxyRecheckDecision | Promise<StreamProxyRecheckDecision>;
  readonly clientAuth?: StreamEndpointClientAuthMode;
  readonly allowedOrigins?: readonly string[];
  readonly trustProxy?: ServiceProxyTrust;
  readonly recheckEveryMs?: number | null;
  readonly revocationSource?: StreamProxyRevocationSource<TGrant>;
  readonly policyTimeoutMs?: number;
  readonly clock?: StreamProxyClockPort;
}

interface ResolvedChatPlan {
  readonly targetHeaders: readonly (readonly [string, string])[];
  readonly upstreamUrl: URL;
  readonly cleanStreamPath: string;
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

function extractDefaultQuery(searchParams: URLSearchParams): Readonly<Record<string, string>> {
  const record: Record<string, string> = Object.create(null);
  for (const [key, value] of searchParams.entries()) {
    if (RESERVED_PROTOCOL_QUERY_KEYS.has(key)) continue;
    if (!Object.hasOwn(record, key)) {
      Object.defineProperty(record, key, {
        value,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
  }
  return record;
}

function isValidCleanStreamPath(value: string): boolean {
  if (!value.startsWith('/') || value.length < 2) return false;
  if (UNSAFE_RESOLVED_PATH_CHARS.test(value) || ENCODED_SEPARATOR_PATTERN.test(value)) return false;
  const segments = value.slice(1).split('/');
  if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) {
    return false;
  }
  const normalized = URL.parse(`http://stream.internal${value}`);
  return normalized !== null && normalized.pathname === value;
}

function normalizePathPrefix(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

async function cancelBodySafely(
  body: ReadableStream<Uint8Array> | null,
  signal: AbortSignal,
): Promise<void> {
  if (!body) return;
  const cancel = body.cancel().catch(() => {});
  if (signal.aborted) return;
  let onAbort: (() => void) | undefined;
  try {
    await Promise.race([
      cancel,
      new Promise<void>((resolve) => {
        onAbort = () => resolve();
        signal.addEventListener('abort', onAbort, { once: true });
      }),
    ]);
  } finally {
    if (onAbort) signal.removeEventListener('abort', onAbort);
  }
}

function resolveChatPlan<TGrant>(
  request: Request,
  config: AuthorizedChatProxyInit<TGrant>,
): ResolvedChatPlan | null {
  try {
    const target = typeof config.target === 'function' ? config.target(request) : config.target;
    if (!target || typeof target.sessionId !== 'string' || target.sessionId.length === 0) {
      return null;
    }
    if (target.baseUrl !== undefined) {
      if (
        typeof target.baseUrl !== 'string' ||
        target.baseUrl.length === 0 ||
        target.baseUrl.includes('?') ||
        target.baseUrl.includes('#')
      ) {
        return null;
      }
      const parsedBase = URL.parse(target.baseUrl);
      if (
        !parsedBase ||
        (parsedBase.protocol !== 'http:' && parsedBase.protocol !== 'https:') ||
        parsedBase.username !== '' ||
        parsedBase.password !== ''
      ) {
        return null;
      }
    }

    const rawSubpath = typeof config.streamPath === 'function'
      ? normalizePathPrefix(config.streamPath({ request, target }))
      : `${
        normalizePathPrefix(config.streamPath ?? NETSCRIPT_CHAT_STREAM_SUBPATH).replace(/\/+$/, '')
      }/${encodeURIComponent(target.sessionId)}`;

    if (rawSubpath.includes('#')) return null;
    const queryIdx = rawSubpath.indexOf('?');
    const cleanStreamPath = queryIdx >= 0 ? rawSubpath.slice(0, queryIdx) : rawSubpath;
    if (!isValidCleanStreamPath(cleanStreamPath)) return null;

    const upstreamUrl = new URL(resolveChatSessionUrl(target, { streamPath: () => rawSubpath }));
    if (
      (upstreamUrl.protocol !== 'http:' && upstreamUrl.protocol !== 'https:') ||
      upstreamUrl.username !== '' ||
      upstreamUrl.password !== '' ||
      upstreamUrl.hash !== ''
    ) {
      return null;
    }

    const incomingQuery = new URL(request.url).searchParams;
    const forwardedQuery = config.query ? config.query(incomingQuery) : new URLSearchParams(
      [...incomingQuery].filter(([name]) => name !== 'id'),
    );
    const resolvedQueryNames = new Set(upstreamUrl.searchParams.keys());
    for (const [name, value] of forwardedQuery) {
      if (!resolvedQueryNames.has(name)) {
        upstreamUrl.searchParams.append(name, value);
      }
    }

    const targetHeaders: Array<readonly [string, string]> = [];
    if (target.headers !== undefined) {
      for (const [name, value] of Object.entries(target.headers)) {
        if (!isValidHeaderName(name) || !isSafeHeaderValue(value)) return null;
        targetHeaders.push([name, value]);
      }
    }

    return { targetHeaders, upstreamUrl, cleanStreamPath };
  } catch {
    return null;
  }
}

/** Validate options eagerly at construction and return the opt-in authorized chat proxy handler. */
export function createAuthorizedChatStreamProxy<TGrant = unknown>(
  rawOptions: AuthorizedChatProxyInit<TGrant>,
): (input: ChatProxyInput, context?: ChatProxyRequestContext) => Promise<Response> {
  if (rawOptions.clock !== undefined) {
    if (
      typeof rawOptions.clock !== 'object' ||
      rawOptions.clock === null ||
      typeof rawOptions.clock.nowMs !== 'function' ||
      typeof rawOptions.clock.schedule !== 'function'
    ) {
      throw new TypeError('[netscript.fresh.ai] clock must implement nowMs() and schedule()');
    }
  }

  // Snapshot all options at construction so post-construction mutations cannot tamper with policy.
  const allowedOriginsList = rawOptions.allowedOrigins !== undefined
    ? [...rawOptions.allowedOrigins]
    : undefined;
  const snapshottedTarget = typeof rawOptions.target === 'function' ? rawOptions.target : {
    sessionId: rawOptions.target.sessionId,
    ...(rawOptions.target.baseUrl !== undefined ? { baseUrl: rawOptions.target.baseUrl } : {}),
    ...(rawOptions.target.headers !== undefined
      ? { headers: { ...rawOptions.target.headers } }
      : {}),
  };
  const config: AuthorizedChatProxyInit<TGrant> = {
    target: snapshottedTarget,
    streamPath: rawOptions.streamPath,
    query: rawOptions.query,
    auth: rawOptions.auth,
    fetch: rawOptions.fetch,
    authorize: rawOptions.authorize,
    recheck: rawOptions.recheck,
    clientAuth: rawOptions.clientAuth ?? 'bearer-or-cookie',
    allowedOrigins: allowedOriginsList,
    trustProxy: rawOptions.trustProxy ?? false,
    recheckEveryMs: rawOptions.recheckEveryMs,
    revocationSource: rawOptions.revocationSource,
    policyTimeoutMs: rawOptions.policyTimeoutMs ?? DEFAULT_STREAM_PROXY_POLICY_TIMEOUT_MS,
    clock: rawOptions.clock,
  };

  // Validate all proxy options synchronously at construction through the canonical proxy authority.
  createNetScriptStreamProxy<TGrant>({
    authorize: (ctx) => config.authorize({ ...ctx, principal: undefined }),
    recheck: config.recheck,
    resolvePath: () => '/chat',
    clientAuth: config.clientAuth,
    allowedOrigins: config.allowedOrigins,
    trustProxy: config.trustProxy,
    recheckEveryMs: config.recheckEveryMs,
    revocationSource: config.revocationSource,
    policyTimeoutMs: config.policyTimeoutMs,
    clock: config.clock,
  });

  const clientAuth = config.clientAuth!;
  const allowedOrigins = new Set<string>(allowedOriginsList ?? []);
  const trustProxy = config.trustProxy!;
  const policyTimeoutMs = config.policyTimeoutMs!;
  const clock = config.clock ?? SYSTEM_CLOCK;
  const resolveAuth = config.auth ?? getStreamsAuth;
  const doFetch = config.fetch ?? fetch;

  return async (
    input: ChatProxyInput,
    context?: ChatProxyRequestContext,
  ): Promise<Response> => {
    const request = extractRequest(input);
    const remoteAddr = extractRemoteAddr(input, context);
    const shutdownSignal = context?.shutdownSignal;

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
    if (!plan) return createChatProxyErrorResponse(500, 'invalid_stream_path');

    const incomingQueryRecord = extractDefaultQuery(new URL(request.url).searchParams);
    const liveValues = plan.upstreamUrl.searchParams.getAll('live');
    const isSseGet = request.method === 'GET' &&
      liveValues.some((value) => value.toLowerCase() === 'sse');

    // GET live=sse -> delegate to @netscript/plugin-streams-core/proxy revocable SSE runtime.
    if (isSseGet) {
      const delegatedUrl = new URL(request.url);
      delegatedUrl.search = plan.upstreamUrl.search;
      const delegatedRequest = new Request(delegatedUrl, {
        method: 'GET',
        headers: request.headers,
        signal: request.signal,
      });

      const sseProxy = createNetScriptStreamProxy<TGrant>({
        authorize: (ctx) =>
          config.authorize({ ...ctx, request, query: incomingQueryRecord, principal: undefined }),
        recheck: config.recheck,
        resolvePath: () => plan.cleanStreamPath,
        baseUrl: 'http://chat-proxy.internal',
        upstreamAuth: () => mergeChatServerHeaders(plan.targetHeaders, resolveAuth()),
        fetch: (proxyInput, init) => {
          const proxyUrlStr = typeof proxyInput === 'string'
            ? proxyInput
            : proxyInput instanceof URL
            ? proxyInput.href
            : proxyInput.url;
          const proxyUrl = new URL(proxyUrlStr);
          const finalUrl = new URL(plan.upstreamUrl.href);
          if (!finalUrl.searchParams.has('offset')) {
            const effectiveOffset = proxyUrl.searchParams.get('offset');
            if (effectiveOffset !== null) finalUrl.searchParams.set('offset', effectiveOffset);
          }
          return doFetch(
            new Request(finalUrl, {
              method: 'GET',
              headers: init?.headers,
              redirect: 'manual',
              signal: init?.signal,
            }),
          );
        },
        clientAuth,
        allowedOrigins: allowedOriginsList,
        trustProxy,
        recheckEveryMs: config.recheckEveryMs,
        revocationSource: config.revocationSource,
        policyTimeoutMs,
        clock: config.clock,
      });

      return await sseProxy(delegatedRequest, { credentialMode, remoteAddr, shutdownSignal });
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

    let upstreamHeaders: Headers;
    try {
      upstreamHeaders = buildNonSseUpstreamHeaders(request, plan.targetHeaders, resolveAuth());
    } catch {
      return createChatProxyErrorResponse(503, 'upstream_unavailable');
    }

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

    if (upstream.status === 401 || upstream.status === 403) {
      await cancelBodySafely(upstream.body, fetchSignal);
      return createChatProxyErrorResponse(502, 'upstream_auth_failed');
    }
    if (upstream.status >= 300 && upstream.status < 400) {
      await cancelBodySafely(upstream.body, fetchSignal);
      return createChatProxyErrorResponse(502, 'upstream_redirect_blocked');
    }
    if (
      request.method === 'GET' &&
      upstream.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ===
        'text/event-stream'
    ) {
      await cancelBodySafely(upstream.body, fetchSignal);
      return createChatProxyErrorResponse(502, 'unexpected_sse_response');
    }

    return sanitizeAuthorizedNonSseResponse(
      upstream,
      validatedHeaders.headers,
      validatedHeaders.setCookies,
    );
  };
}
