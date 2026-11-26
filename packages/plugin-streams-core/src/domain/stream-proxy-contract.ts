import type { StreamEndpointClientAuthMode } from '@netscript/contracts/streams';
import type { Principal } from '@netscript/service/auth';
import type { ServiceProxyTrust } from '@netscript/service/rate-limit';
import type { StreamSseOffsetV1 } from './sse-contract-v1.ts';
import type {
  StreamProxyClockPort,
  StreamProxyRevocationSource,
} from '../ports/stream-proxy-ports.ts';

/** Supported client credential modes selected by the stream proxy pre-admission guard. */
export const STREAM_PROXY_CREDENTIAL_MODES: readonly ['bearer', 'cookie'] = Object.freeze([
  'bearer',
  'cookie',
]);

/** Selected client credential transport handed to admission policy. */
export type StreamProxyCredentialMode = (typeof STREAM_PROXY_CREDENTIAL_MODES)[number];

/** Exhaustive reasons why an admitted reader's `recheck` policy hook is invoked. */
export const STREAM_PROXY_RECHECK_REASONS: readonly [
  'post-subscribe',
  'before-delivery',
  'idle-interval',
  'expiry',
  'revocation-signal',
] = Object.freeze([
  'post-subscribe',
  'before-delivery',
  'idle-interval',
  'expiry',
  'revocation-signal',
]);

/** Trigger category passed to {@link StreamProxyRecheckContext}. */
export type StreamProxyRecheckReason = (typeof STREAM_PROXY_RECHECK_REASONS)[number];

/** Exhaustive terminal close reasons for an active stream proxy reader. */
export const STREAM_PROXY_CLOSE_REASONS: readonly [
  'completed',
  'revoked',
  'expired',
  'client-cancelled',
  'shutdown',
  'upstream-error',
  'policy-error',
  'frame-limit-exceeded',
] = Object.freeze([
  'completed',
  'revoked',
  'expired',
  'client-cancelled',
  'shutdown',
  'upstream-error',
  'policy-error',
  'frame-limit-exceeded',
]);

/** Terminal close reason reported to lifecycle observers. */
export type StreamProxyCloseReason = (typeof STREAM_PROXY_CLOSE_REASONS)[number];

/** Default periodic idle re-check interval in milliseconds (`30_000`). */
export const DEFAULT_STREAM_PROXY_RECHECK_EVERY_MS = 30_000;

/** Default per-policy-hook timeout in milliseconds (`5_000`). */
export const DEFAULT_STREAM_PROXY_POLICY_TIMEOUT_MS = 5_000;

/** Default upstream connection open timeout in milliseconds (`15_000`). */
export const DEFAULT_STREAM_PROXY_UPSTREAM_CONNECT_TIMEOUT_MS = 15_000;

/** Default maximum buffered UTF-8 bytes across pending data and partial blocks (`4 MiB`). */
export const DEFAULT_STREAM_PROXY_MAX_PENDING_BATCH_BYTES: number = 4 * 1024 * 1024;

/** Default maximum concurrent active readers per proxy instance (`1_000`). */
export const DEFAULT_STREAM_PROXY_MAX_ACTIVE_READERS = 1_000;

/** Default maximum invalidation re-fence cycles before failing closed (`8`). */
export const DEFAULT_STREAM_PROXY_MAX_REFENCE_ATTEMPTS = 8;

/** Default `Retry-After` header value in seconds for capacity rejections (`5`). */
export const DEFAULT_STREAM_PROXY_RETRY_AFTER_SECONDS = '5';

/** Admission decision returned by the application's `authorize` hook. */
export type StreamProxyAuthDecision<TGrant = unknown> =
  | {
    /** Admission granted. */
    readonly allow: true;
    /** Opaque grant handed to `resolvePath`, `recheck`, and `revocationSource.subscribe`. */
    readonly grant: TGrant;
    /** Optional finite absolute expiry instant in epoch milliseconds (`Number.isFinite`). */
    readonly expiresAtMs?: number;
    /**
     * Optional non-reserved headers to attach to the 200 admission response.
     * Reserved framing, cache, CORS, auth, protocol replay metadata, and `Set-Cookie` headers fail closed.
     */
    readonly responseHeaders?: Readonly<Record<string, string>>;
    /** Optional app-owned `Set-Cookie` values for refresh-on-read session authenticators. */
    readonly setCookies?: readonly string[];
  }
  | {
    /** Admission denied. */
    readonly allow: false;
    /** HTTP refusal status (`401` or `403`). */
    readonly status: 401 | 403;
    /** Stable non-secret diagnostic code. */
    readonly reason: string;
  };

/** Re-authorization decision returned by the application's `recheck` hook. */
export type StreamProxyRecheckDecision =
  | {
    /** Grant remains active. */
    readonly allow: true;
    /**
     * Updated finite expiry instant in epoch milliseconds.
     * Required and strictly `> clock.nowMs()` when `reason === 'expiry'`.
     * When omitted on other reasons, preserves the existing deadline unchanged.
     */
    readonly expiresAtMs?: number;
  }
  | {
    /** Grant is no longer authorized. */
    readonly allow: false;
    /** Stable non-secret diagnostic code. */
    readonly reason: string;
  };

/** Admission context passed to the application's `authorize` callback. */
export interface StreamProxyAdmissionContext<
  TParams = Readonly<Record<string, string>>,
  TQuery = Readonly<Record<string, string>>,
> {
  /** Incoming HTTP `GET` request. */
  readonly request: Request;
  /** Route parameters (validated schema output when bound via `bindStreamProxy`). */
  readonly params: TParams;
  /** Application query parameters (excluding reserved protocol keys). */
  readonly query: TQuery;
  /** Exact credential transport selected by the proxy's pre-admission guard. */
  readonly credentialMode: StreamProxyCredentialMode;
  /** Principal injected by `@netscript/service` `withAuthn`, when mounted in a service. */
  readonly principal?: Principal;
  /** Cooperative cancellation signal aborted on disconnect, shutdown, expiry, or timeout. */
  readonly signal: AbortSignal;
}

/** Re-check context passed to the application's `recheck` callback. */
export interface StreamProxyRecheckContext<TGrant = unknown> {
  /** Opaque grant returned by `authorize`. */
  readonly grant: TGrant;
  /** Resolved relative Durable Streams path. */
  readonly streamPath: string;
  /** Reason triggering this re-check. */
  readonly reason: StreamProxyRecheckReason;
  /** Cooperative cancellation signal aborted on close, shutdown, expiry contention, or timeout. */
  readonly signal: AbortSignal;
}

/** Push notification payload delivered by an application-supplied revocation source. */
export interface StreamProxyRevocationSignal {
  /**
   * When `'revoked'`, the proxy terminates immediately without awaiting another round-trip.
   * When `'recheck'` (default), the proxy bumps `invalidationEpoch` (fencing any in-flight allow)
   * and triggers a fresh serialized `recheck` against shared policy.
   */
  readonly action?: 'recheck' | 'revoked';
  /** Optional non-secret diagnostic reason. */
  readonly reason?: string;
}

/** Non-secret lifecycle summary emitted to {@link StreamProxyOptions.onClose}. */
export interface StreamProxyCloseEvent {
  /** Resolved relative Durable Streams path. */
  readonly streamPath: string;
  /** Terminal close reason. */
  readonly reason: StreamProxyCloseReason;
  /** Number of delivery units successfully enqueued downstream before closing. */
  readonly deliveredUnits: number;
}

/** Per-key concurrent reader cap enforced immediately after admission. */
export interface StreamProxyKeyLimit<TGrant = unknown> {
  /** Derive a stable non-secret concurrency bucket key from an admitted grant. */
  readonly key: (grant: TGrant) => string;
  /** Maximum concurrent active readers allowed for one key (`>= 1`). */
  readonly max: number;
}

/**
 * Host context supplied when invoking a {@link StreamProxyHandler}.
 * Structurally compatible with `@netscript/service`'s `StreamProxyMountContext`.
 */
export interface StreamProxyRequestContext {
  /** Decoded route parameters matched by the host router. */
  readonly params?: Readonly<Record<string, string>>;
  /** Credential transport pre-selected by mounted service pre-authn middleware. */
  readonly credentialMode?: StreamProxyCredentialMode;
  /** Principal authenticated by mounted service `withAuthn`, when present. */
  readonly principal?: Principal;
  /** Socket peer address used for trusted reverse-proxy origin resolution. */
  readonly remoteAddr?: Deno.Addr;
  /** Service-owned pre-drain shutdown signal. */
  readonly shutdownSignal?: AbortSignal;
}

/** Configuration options for {@link createNetScriptStreamProxy}. */
export interface StreamProxyOptions<
  TGrant = unknown,
  TParams = Readonly<Record<string, string>>,
  TQuery = Readonly<Record<string, string>>,
> {
  /** Admission policy running before path resolution, subscription, and upstream connect. */
  readonly authorize: (
    context: StreamProxyAdmissionContext<TParams, TQuery>,
  ) => StreamProxyAuthDecision<TGrant> | Promise<StreamProxyAuthDecision<TGrant>>;
  /** Re-authorization policy invoked post-subscribe, pre-delivery, on expiry, on idle, and on wake. */
  readonly recheck: (
    context: StreamProxyRecheckContext<TGrant>,
  ) => StreamProxyRecheckDecision | Promise<StreamProxyRecheckDecision>;
  /** Resolves the normalized relative Durable Streams path for an admitted grant. */
  readonly resolvePath: (
    context: Readonly<{
      readonly request: Request;
      readonly params: TParams;
      readonly query: TQuery;
      readonly grant: TGrant;
      readonly signal: AbortSignal;
    }>,
  ) => string | Promise<string>;
  /** Accepted client credential transport mode. Defaults to `'bearer-or-cookie'`. */
  readonly clientAuth?: StreamEndpointClientAuthMode;
  /** Exact cross-origin allowlist for cookie clients (`*` and `null` are rejected). */
  readonly allowedOrigins?: readonly string[];
  /** Explicit trusted reverse-proxy peer predicate for forwarded origin resolution. */
  readonly trustProxy?: ServiceProxyTrust;
  /** Whether direct navigation (`Sec-Fetch-Site: none`) is allowed for cookie streams. Defaults to `false`. */
  readonly allowDirectNavigation?: boolean;
  /** Periodic idle re-check interval in milliseconds, or `null` to disable periodic polling. Defaults to `30_000`. */
  readonly recheckEveryMs?: number | null;
  /** Optional shared application revocation source for immediate cross-gateway wakeups. */
  readonly revocationSource?: StreamProxyRevocationSource<TGrant>;
  /** Maximum milliseconds for any single policy, path, subscribe, or upstreamAuth call. Defaults to `5_000`. */
  readonly policyTimeoutMs?: number;
  /** Maximum milliseconds for the upstream `fetch` open. Defaults to `15_000`. */
  readonly upstreamConnectTimeoutMs?: number;
  /** Default opaque offset used when `?offset=` is omitted. Defaults to `'-1'`. */
  readonly defaultOffset?: StreamSseOffsetV1;
  /** Maximum total buffered UTF-8 bytes held across pending `data` frames and partial blocks. Defaults to 4 MiB. */
  readonly maxPendingBatchBytes?: number;
  /** Maximum concurrent active readers permitted on this proxy instance. Defaults to `1_000`. */
  readonly maxActiveReaders?: number;
  /** Optional per-grant concurrent reader cap enforced immediately after `authorize`. */
  readonly maxReadersPerKey?: StreamProxyKeyLimit<TGrant>;
  /** Optional Durable Streams base URL override (defaults to `getStreamsUrl()`). */
  readonly baseUrl?: string | (() => string);
  /** Server-side upstream auth header provider (defaults to `getStreamsAuth()`). */
  readonly upstreamAuth?: (
    context?: Readonly<{ readonly signal: AbortSignal }>,
  ) =>
    | Readonly<Record<string, string>>
    | Promise<Readonly<Record<string, string>>>;
  /** Optional clock port for deterministic expiry, idle, and timeout scheduling. */
  readonly clock?: StreamProxyClockPort;
  /** Optional fetch implementation for upstream connection injection/testing. */
  readonly fetch?: typeof fetch;
  /** Optional non-secret lifecycle observer invoked once when an active streaming reader closes. */
  readonly onClose?: (event: StreamProxyCloseEvent) => void;
}

/** HTTP handler accepting either a bare `Request` or a Fresh-style `{ req: Request }` context. */
export type StreamProxyHandler = (
  input: Request | { readonly req: Request },
  context?: StreamProxyRequestContext,
) => Promise<Response>;
