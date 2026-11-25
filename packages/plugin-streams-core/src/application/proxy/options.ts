import { isValidStreamOffset } from '@netscript/contracts/streams';
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

/** Structural runtime guard for an admission `authorize` decision. */
export function isValidAuthDecision<TGrant>(
  value: unknown,
): value is StreamProxyAuthDecision<TGrant> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const allow = Reflect.get(value, 'allow');
  if (allow === true) {
    return Object.hasOwn(value, 'grant');
  }
  if (allow === false) {
    const status = Reflect.get(value, 'status');
    return (status === 401 || status === 403) && typeof Reflect.get(value, 'reason') === 'string';
  }
  return false;
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

/** Structural runtime guard for a `recheck` decision. */
export function isValidRecheckDecision(value: unknown): value is StreamProxyRecheckDecision {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const allow = Reflect.get(value, 'allow');
  if (allow === true) {
    const expiresAtMs = Reflect.get(value, 'expiresAtMs');
    return expiresAtMs === undefined || typeof expiresAtMs === 'number';
  }
  if (allow === false) {
    return typeof Reflect.get(value, 'reason') === 'string';
  }
  return false;
}
