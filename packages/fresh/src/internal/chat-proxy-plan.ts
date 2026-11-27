/**
 * Package-internal option validation, immutable port snapshotting, and per-request chat
 * session/URL/query planning for opt-in authorized `createNetScriptChatStreamProxy`.
 */

import type {
  ServiceProxyTrust,
  StreamEndpointClientAuthMode,
  StreamProxyAuthDecision,
  StreamProxyClockPort,
  StreamProxyRecheckContext,
  StreamProxyRecheckDecision,
  StreamProxyRevocationSource,
} from '@netscript/plugin-streams-core/proxy';
import {
  NETSCRIPT_CHAT_STREAM_SUBPATH,
  type NetScriptChatSessionTarget,
  resolveChatSessionUrl,
} from '../runtime/ai/create-chat-connection.ts';
import { extractSanitizedTargetHeaders } from './chat-proxy-headers.ts';

const UNSAFE_RESOLVED_PATH_CHARS = /[?#\r\n\0\\]/;
const ENCODED_SEPARATOR_PATTERN = /%(?:2f|5c)/i;
const RESERVED_PROTOCOL_QUERY_KEYS: ReadonlySet<string> = new Set(['offset', 'live', 'cursor']);

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

/** Resolved, validated per-request chat proxy upstream plan. */
export interface ResolvedChatPlan {
  readonly targetHeaders: readonly (readonly [string, string])[];
  readonly upstreamUrl: URL;
  readonly cleanStreamPath: string;
}

/** Extracts first-value non-protocol query parameters for admission policy context. */
export function extractDefaultChatQuery(
  searchParams: URLSearchParams,
): Readonly<Record<string, string>> {
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

/** Validates and freezes a bound `ClockPort` adapter at construction so mutations cannot tamper. */
export function snapshotClockPort(rawClock: unknown): StreamProxyClockPort | undefined {
  if (rawClock === undefined) return undefined;
  if (
    typeof rawClock !== 'object' ||
    rawClock === null ||
    typeof (rawClock as StreamProxyClockPort).nowMs !== 'function' ||
    typeof (rawClock as StreamProxyClockPort).schedule !== 'function'
  ) {
    throw new TypeError('[netscript.fresh.ai] clock must implement nowMs() and schedule()');
  }
  const port = rawClock as StreamProxyClockPort;
  const boundNowMs = port.nowMs.bind(port);
  const boundSchedule = port.schedule.bind(port);
  return Object.freeze({
    nowMs: boundNowMs,
    schedule: boundSchedule,
  });
}

/** Validates and freezes a bound `RevocationSource` adapter at construction. */
export function snapshotRevocationSource<TGrant>(
  rawSource: unknown,
): StreamProxyRevocationSource<TGrant> | undefined {
  if (rawSource === undefined) return undefined;
  if (
    typeof rawSource !== 'object' ||
    rawSource === null ||
    typeof (rawSource as StreamProxyRevocationSource<TGrant>).subscribe !== 'function'
  ) {
    throw new TypeError('[netscript.fresh.ai] revocationSource must implement subscribe()');
  }
  const source = rawSource as StreamProxyRevocationSource<TGrant>;
  const boundSubscribe = source.subscribe.bind(source);
  return Object.freeze({
    subscribe: boundSubscribe,
  });
}

/** Validates and snapshots a static or functional `target` option at construction. */
export function snapshotTargetOption(
  rawTarget: unknown,
): NetScriptChatSessionTarget | ((request: Request) => NetScriptChatSessionTarget) {
  if (typeof rawTarget === 'function') {
    return rawTarget as (request: Request) => NetScriptChatSessionTarget;
  }
  if (typeof rawTarget !== 'object' || rawTarget === null || Array.isArray(rawTarget)) {
    throw new TypeError('[netscript.fresh.ai] target must be a session target object or function');
  }
  const target = rawTarget as NetScriptChatSessionTarget;
  if (
    target.headers !== undefined &&
    (typeof target.headers !== 'object' || target.headers === null || Array.isArray(target.headers))
  ) {
    throw new TypeError('[netscript.fresh.ai] target.headers must be a plain object when provided');
  }
  return {
    sessionId: target.sessionId,
    ...(target.baseUrl !== undefined ? { baseUrl: target.baseUrl } : {}),
    ...(target.headers !== undefined ? { headers: { ...target.headers } } : {}),
  };
}

/** Resolves and validates per-request target, clean streamPath, merged query, and safe target headers. */
export function resolveChatPlan<TGrant>(
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

    const targetHeaders = extractSanitizedTargetHeaders(target.headers);
    if (targetHeaders === null) return null;

    return { targetHeaders, upstreamUrl, cleanStreamPath };
  } catch {
    return null;
  }
}
