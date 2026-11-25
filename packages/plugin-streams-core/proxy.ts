/**
 * Revocable authorizing Server-Sent Events (SSE) stream proxy runtime.
 *
 * Delegates session identity, admission, re-check, and revocation decisions exclusively to
 * application-supplied policy while enforcing deterministic credential selection, Cookie
 * Origin/Fetch-Metadata guards, bounded incremental SSE delivery-unit framing, monotonic
 * invalidation fencing, finite expiry/idle timers, reader concurrency caps, 3-tier response
 * header ownership, and decoupled downstream teardown.
 *
 * @example
 * ```ts
 * import { createNetScriptStreamProxy } from '@netscript/plugin-streams-core/proxy';
 *
 * const proxy = createNetScriptStreamProxy({
 *   authorize: () => ({ allow: true, grant: { sessionId: 'sess-1', projectId: 'proj-1' } }),
 *   recheck: () => ({ allow: true }),
 *   resolvePath: ({ grant }) => `/projects/${encodeURIComponent(grant.projectId)}/events`,
 *   clientAuth: 'bearer-or-cookie',
 * });
 * void proxy;
 * ```
 *
 * @module
 */
import { createSystemStreamProxyClock } from './src/adapters/system-stream-proxy-clock.ts';
import { buildStreamProxyHandler } from './src/application/proxy/create-stream-proxy.ts';
import type { StreamProxyHandler, StreamProxyOptions } from './src/domain/stream-proxy-contract.ts';

export type { StreamEndpointClientAuthMode } from '@netscript/contracts/streams';
export type { Principal } from '@netscript/service/auth';
export type { ServiceProxyTrust } from '@netscript/service/rate-limit';
export type { StreamSseOffsetV1 } from './src/domain/sse-contract-v1.ts';
export {
  DEFAULT_STREAM_PROXY_MAX_ACTIVE_READERS,
  DEFAULT_STREAM_PROXY_MAX_PENDING_BATCH_BYTES,
  DEFAULT_STREAM_PROXY_MAX_REFENCE_ATTEMPTS,
  DEFAULT_STREAM_PROXY_POLICY_TIMEOUT_MS,
  DEFAULT_STREAM_PROXY_RECHECK_EVERY_MS,
  DEFAULT_STREAM_PROXY_RETRY_AFTER_SECONDS,
  DEFAULT_STREAM_PROXY_UPSTREAM_CONNECT_TIMEOUT_MS,
  STREAM_PROXY_CLOSE_REASONS,
  STREAM_PROXY_CREDENTIAL_MODES,
  STREAM_PROXY_RECHECK_REASONS,
  type StreamProxyAdmissionContext,
  type StreamProxyAuthDecision,
  type StreamProxyCloseEvent,
  type StreamProxyCloseReason,
  type StreamProxyCredentialMode,
  type StreamProxyHandler,
  type StreamProxyKeyLimit,
  type StreamProxyOptions,
  type StreamProxyRecheckContext,
  type StreamProxyRecheckDecision,
  type StreamProxyRecheckReason,
  type StreamProxyRequestContext,
  type StreamProxyRevocationSignal,
} from './src/domain/stream-proxy-contract.ts';
export type {
  StreamProxyClockPort,
  StreamProxyRevocationSource,
} from './src/ports/stream-proxy-ports.ts';

/**
 * Create a revocable authorizing SSE stream proxy handler usable in Fresh 2.x routes
 * and backend HTTP services.
 */
export function createNetScriptStreamProxy<TGrant = unknown>(
  options: StreamProxyOptions<TGrant>,
): StreamProxyHandler {
  return buildStreamProxyHandler(options, createSystemStreamProxyClock());
}
