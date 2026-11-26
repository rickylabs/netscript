import { isValidStreamOffset } from '@netscript/contracts/streams';
import { STREAMS_URL_PREFIX } from '../../domain/constants.ts';
import {
  DEFAULT_STREAM_PROXY_MAX_ACTIVE_READERS,
  DEFAULT_STREAM_PROXY_MAX_PENDING_BATCH_BYTES,
  DEFAULT_STREAM_PROXY_POLICY_TIMEOUT_MS,
  DEFAULT_STREAM_PROXY_RECHECK_EVERY_MS,
  DEFAULT_STREAM_PROXY_UPSTREAM_CONNECT_TIMEOUT_MS,
  type StreamProxyAuthDecision,
  type StreamProxyOptions,
  type StreamProxyRecheckDecision,
} from '../../domain/stream-proxy-contract.ts';
import { validateAllowedOrigins } from './credentials.ts';

const MAX_SAFE_TIMER_MS = 2_147_483_647;
const UNSAFE_RESOLVED_PATH_CHARS = /[?#\r\n\0\\]/;
const ENCODED_SEPARATOR_PATTERN = /%(?:2f|5c)/i;
const RESERVED_PROTOCOL_QUERY_KEYS: ReadonlySet<string> = new Set(['offset', 'live', 'cursor']);

/** Unwraps either a raw `Request` or a Fresh route `{ req: Request }` context. */
export function unwrapProxyRequest(input: Request | { readonly req: Request }): Request {
  return input instanceof Request ? input : input.req;
}

/** Extracts first-value non-protocol query parameters for schema-less proxy handlers. */
export function extractDefaultProxyQuery(
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

/** Validated, normalized runtime configuration for a stream proxy instance. */
export interface NormalizedStreamProxyConfig {
  readonly clientAuth: 'bearer' | 'cookie' | 'bearer-or-cookie';
  readonly allowedOrigins: ReadonlySet<string>;
  readonly trustProxy: false | ((address: string) => boolean);
  readonly allowDirectNavigation: boolean;
  readonly recheckEveryMs: number | null;
  readonly policyTimeoutMs: number;
  readonly upstreamConnectTimeoutMs: number;
  readonly defaultOffset: string;
  readonly maxPendingBatchBytes: number;
  readonly maxActiveReaders: number;
}

function isPositiveSafeInt(
  value: unknown,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
}

/** Validates and normalizes `createNetScriptStreamProxy` options synchronously at construction. */
export function validateStreamProxyOptions<TGrant, TParams, TQuery>(
  options: StreamProxyOptions<TGrant, TParams, TQuery>,
): NormalizedStreamProxyConfig {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError('[netscript.streams.proxy] options must be an object');
  }
  if (typeof options.authorize !== 'function') {
    throw new TypeError('[netscript.streams.proxy] authorize hook is required');
  }
  if (typeof options.recheck !== 'function') {
    throw new TypeError('[netscript.streams.proxy] recheck hook is required');
  }
  if (typeof options.resolvePath !== 'function') {
    throw new TypeError('[netscript.streams.proxy] resolvePath hook is required');
  }

  const clientAuth = options.clientAuth ?? 'bearer-or-cookie';
  if (clientAuth !== 'bearer' && clientAuth !== 'cookie' && clientAuth !== 'bearer-or-cookie') {
    throw new TypeError(`[netscript.streams.proxy] invalid clientAuth: ${String(clientAuth)}`);
  }

  const allowedOrigins = validateAllowedOrigins(options.allowedOrigins);
  const trustProxy = options.trustProxy ?? false;
  if (trustProxy !== false && typeof trustProxy !== 'function') {
    throw new TypeError(
      '[netscript.streams.proxy] trustProxy must be false or a predicate function',
    );
  }

  const recheckMin = options.clock ? 1 : 100;
  let recheckEveryMs: number | null = DEFAULT_STREAM_PROXY_RECHECK_EVERY_MS;
  if (options.recheckEveryMs !== undefined) {
    if (options.recheckEveryMs === null) {
      recheckEveryMs = null;
    } else if (!isPositiveSafeInt(options.recheckEveryMs, recheckMin, MAX_SAFE_TIMER_MS)) {
      throw new TypeError(
        `[netscript.streams.proxy] recheckEveryMs must be null or an integer in ${recheckMin}..${MAX_SAFE_TIMER_MS}`,
      );
    } else {
      recheckEveryMs = options.recheckEveryMs;
    }
  }

  const policyTimeoutMs = options.policyTimeoutMs ?? DEFAULT_STREAM_PROXY_POLICY_TIMEOUT_MS;
  if (!isPositiveSafeInt(policyTimeoutMs, 1, MAX_SAFE_TIMER_MS)) {
    throw new TypeError(
      `[netscript.streams.proxy] policyTimeoutMs must be an integer in 1..${MAX_SAFE_TIMER_MS}`,
    );
  }

  const upstreamConnectTimeoutMs = options.upstreamConnectTimeoutMs ??
    DEFAULT_STREAM_PROXY_UPSTREAM_CONNECT_TIMEOUT_MS;
  if (!isPositiveSafeInt(upstreamConnectTimeoutMs, 1, MAX_SAFE_TIMER_MS)) {
    throw new TypeError(
      `[netscript.streams.proxy] upstreamConnectTimeoutMs must be an integer in 1..${MAX_SAFE_TIMER_MS}`,
    );
  }

  const maxPendingBatchBytes = options.maxPendingBatchBytes ??
    DEFAULT_STREAM_PROXY_MAX_PENDING_BATCH_BYTES;
  if (!isPositiveSafeInt(maxPendingBatchBytes, 1024)) {
    throw new TypeError(
      '[netscript.streams.proxy] maxPendingBatchBytes must be an integer >= 1024',
    );
  }

  const maxActiveReaders = options.maxActiveReaders ?? DEFAULT_STREAM_PROXY_MAX_ACTIVE_READERS;
  if (!isPositiveSafeInt(maxActiveReaders, 1)) {
    throw new TypeError('[netscript.streams.proxy] maxActiveReaders must be an integer >= 1');
  }

  if (options.maxReadersPerKey !== undefined) {
    if (
      typeof options.maxReadersPerKey !== 'object' ||
      options.maxReadersPerKey === null ||
      typeof options.maxReadersPerKey.key !== 'function' ||
      !isPositiveSafeInt(options.maxReadersPerKey.max, 1)
    ) {
      throw new TypeError(
        '[netscript.streams.proxy] maxReadersPerKey requires a key function and integer max >= 1',
      );
    }
  }

  const defaultOffset = options.defaultOffset ?? '-1';
  if (!isValidStreamOffset(defaultOffset)) {
    throw new TypeError('[netscript.streams.proxy] defaultOffset fails canonical offset grammar');
  }

  return {
    clientAuth,
    allowedOrigins,
    trustProxy,
    allowDirectNavigation: options.allowDirectNavigation === true,
    recheckEveryMs,
    policyTimeoutMs,
    upstreamConnectTimeoutMs,
    defaultOffset,
    maxPendingBatchBytes,
    maxActiveReaders,
  };
}

/** Validates a stream path returned by `resolvePath` against traversal and injection hazards. */
export function isValidResolvedStreamPath(value: unknown): value is string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.length < 2) return false;
  if (UNSAFE_RESOLVED_PATH_CHARS.test(value) || ENCODED_SEPARATOR_PATTERN.test(value)) {
    return false;
  }
  const segments = value.slice(1).split('/');
  if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) {
    return false;
  }
  const normalized = URL.parse(`http://stream.internal${value}`);
  return normalized !== null && normalized.pathname === value;
}

/**
 * Parse and validate an upstream `http:`/`https:` base URL with no userinfo, query, or fragment,
 * then compose the full Durable Streams SSE upstream URL safely without raw string concatenation.
 */
export function composeValidatedUpstreamUrl(
  rawBaseUrl: unknown,
  streamPath: string,
  offset: string,
  cursor: string | undefined,
): URL {
  if (
    typeof rawBaseUrl !== 'string' ||
    rawBaseUrl.length === 0 ||
    rawBaseUrl.includes('?') ||
    rawBaseUrl.includes('#')
  ) {
    throw new TypeError('invalid_upstream_base_url');
  }
  const base = URL.parse(rawBaseUrl);
  if (
    !base ||
    (base.protocol !== 'http:' && base.protocol !== 'https:') ||
    base.username !== '' ||
    base.password !== '' ||
    base.search !== '' ||
    base.hash !== ''
  ) {
    throw new TypeError('invalid_upstream_base_url');
  }
  const normalizedBasePath = base.pathname.replace(/\/+$/, '');
  const composed = new URL(base.origin);
  composed.pathname = `${normalizedBasePath}${STREAMS_URL_PREFIX}${streamPath}`;
  composed.searchParams.set('offset', offset);
  composed.searchParams.set('live', 'sse');
  if (cursor !== undefined) composed.searchParams.set('cursor', cursor);
  return composed;
}

/**
 * Exception-safe single-read snapshot of an admission `authorize` decision.
 * Reads every decision property at most once inside `try/catch` so throwing or mutating getters
 * cannot escape the bounded hook boundary.
 */
export function snapshotAuthDecision<TGrant>(
  value: unknown,
): StreamProxyAuthDecision<TGrant> | null {
  try {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const allow = Reflect.get(value, 'allow');
    if (allow === true) {
      if (!Object.hasOwn(value, 'grant')) return null;
      const grant = Reflect.get(value, 'grant') as TGrant;
      const expiresAtMs = Reflect.get(value, 'expiresAtMs');
      if (expiresAtMs !== undefined && typeof expiresAtMs !== 'number') return null;
      const responseHeaders = Reflect.get(value, 'responseHeaders') as
        | Readonly<Record<string, string>>
        | undefined;
      const setCookies = Reflect.get(value, 'setCookies') as readonly string[] | undefined;
      return {
        allow: true,
        grant,
        ...(expiresAtMs !== undefined ? { expiresAtMs } : {}),
        ...(responseHeaders !== undefined ? { responseHeaders } : {}),
        ...(setCookies !== undefined ? { setCookies } : {}),
      };
    }
    if (allow === false) {
      const status = Reflect.get(value, 'status');
      const reason = Reflect.get(value, 'reason');
      if ((status === 401 || status === 403) && typeof reason === 'string') {
        return { allow: false, status, reason };
      }
      return null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Validated Durable Streams SSE protocol query parameters (`live`, `offset`, `cursor`). */
export type ProtocolQueryValidation =
  | { readonly ok: true; readonly offset: string; readonly cursor: string | undefined }
  | { readonly ok: false; readonly reason: string };

/** Validate reserved `?live=`, `?offset=`, and `?cursor=` query parameters against RFC 0009. */
export function validateProtocolQueryParams(
  searchParams: URLSearchParams,
  defaultOffset: string,
): ProtocolQueryValidation {
  const liveValues = searchParams.getAll('live');
  if (liveValues.length > 1 || (liveValues.length === 1 && liveValues[0] !== 'sse')) {
    return { ok: false, reason: 'unsupported_live_mode' };
  }
  const offsetValues = searchParams.getAll('offset');
  const offset = offsetValues.length === 1 ? offsetValues[0]! : defaultOffset;
  if (offsetValues.length > 1 || !isValidStreamOffset(offset)) {
    return { ok: false, reason: 'invalid_offset' };
  }
  const cursorValues = searchParams.getAll('cursor');
  const cursor = cursorValues.length === 1 ? cursorValues[0]! : undefined;
  if (cursorValues.length > 1 || (cursor !== undefined && !isValidStreamOffset(cursor))) {
    return { ok: false, reason: 'invalid_cursor' };
  }
  return { ok: true, offset, cursor };
}

/**
 * Exception-safe single-read snapshot of a `recheck` decision.
 * Reads every property at most once inside `try/catch` so throwing getters fail closed.
 */
export function snapshotRecheckDecision(value: unknown): StreamProxyRecheckDecision | null {
  try {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
    const allow = Reflect.get(value, 'allow');
    if (allow === true) {
      const expiresAtMs = Reflect.get(value, 'expiresAtMs');
      if (expiresAtMs !== undefined && typeof expiresAtMs !== 'number') return null;
      return expiresAtMs !== undefined ? { allow: true, expiresAtMs } : { allow: true };
    }
    if (allow === false) {
      const reason = Reflect.get(value, 'reason');
      return typeof reason === 'string' ? { allow: false, reason } : null;
    }
    return null;
  } catch {
    return null;
  }
}
