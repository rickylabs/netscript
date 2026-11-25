import { createLogger } from '@netscript/logger';
import {
  DEFAULT_STREAM_PROXY_RETRY_AFTER_SECONDS,
  type StreamProxyCloseReason,
  type StreamProxyCredentialMode,
  type StreamProxyHandler,
  type StreamProxyOptions,
  type StreamProxyRequestContext,
  type StreamProxyRevocationSignal,
} from '../../domain/stream-proxy-contract.ts';
import type { StreamProxyClockPort } from '../../ports/stream-proxy-ports.ts';
import { buildStreamUrl, getStreamsAuth, getStreamsUrl } from '../stream-url-resolver.ts';
import { selectCredentialAndGuard } from './credentials.ts';
import {
  buildStreamProxySseResponseHeaders,
  buildUpstreamRequestHeaders,
  createProxyErrorResponse,
  sanitizeDiagnosticReason,
  validateAppOverlayHeaders,
} from './headers.ts';
import {
  isValidAuthDecision,
  isValidResolvedStreamPath,
  validateProtocolQueryParams,
  validateStreamProxyOptions,
} from './options.ts';
import { createStreamingReaderSession } from './reader-session.ts';
import {
  classifyUpstreamSseFailure,
  ReaderCapacityTracker,
  statusToErrorLabel,
  StreamProxySetupLifecycle,
} from './setup-lifecycle.ts';

const PROXY_LOGGER = createLogger(['netscript', 'streams', 'proxy']);
const RESERVED_PROTOCOL_QUERY_KEYS: ReadonlySet<string> = new Set(['offset', 'live', 'cursor']);

/** Internal hook allowing `bindStreamProxy` (Stage 2) to inject contract param/query validation. */
export interface StreamProxyInputValidator<TParams, TQuery> {
  readonly validate: (
    rawParams: Readonly<Record<string, string>>,
    rawQuery: URLSearchParams,
  ) =>
    | { readonly ok: true; readonly params: TParams; readonly query: TQuery }
    | { readonly ok: false; readonly reason: string };
}

function toRequest(input: Request | { readonly req: Request }): Request {
  return input instanceof Request ? input : input.req;
}

function extractDefaultQueryRecord(
  searchParams: URLSearchParams,
): Readonly<Record<string, string>> {
  const record: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (RESERVED_PROTOCOL_QUERY_KEYS.has(key)) continue;
    if (!Object.hasOwn(record, key)) record[key] = value;
  }
  return record;
}

/**
 * Internal builder accepting a composed default clock and optional schema input validator
 * (used by `createNetScriptStreamProxy` and Stage 2's `bindStreamProxy`).
 */
export function buildStreamProxyHandler<
  TGrant,
  TParams = Readonly<Record<string, string>>,
  TQuery = Readonly<Record<string, string>>,
>(
  options: StreamProxyOptions<TGrant, TParams, TQuery>,
  defaultClock: StreamProxyClockPort,
  inputValidator?: StreamProxyInputValidator<TParams, TQuery>,
): StreamProxyHandler {
  const config = validateStreamProxyOptions(options);
  const clock = options.clock ?? defaultClock;
  const doFetch = options.fetch ?? fetch;
  const resolveUpstreamAuth = options.upstreamAuth ?? (() => getStreamsAuth());
  const capacity = new ReaderCapacityTracker(config.maxActiveReaders);

  return async (
    input: Request | { readonly req: Request },
    context?: StreamProxyRequestContext,
  ): Promise<Response> => {
    const request = toRequest(input);
    const shutdownSignal = context?.shutdownSignal;

    // Step 1: Method check, pre-aborted check, and global maxActiveReaders reservation.
    if (request.method !== 'GET') {
      return createProxyErrorResponse(405, 'METHOD_NOT_ALLOWED', 'method_not_allowed', {
        allow: 'GET',
      });
    }
    if (request.signal.aborted) {
      return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'client_cancelled');
    }
    if (shutdownSignal?.aborted) {
      return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'service_shutdown');
    }
    const slot = capacity.tryReserveGlobal();
    if (!slot) {
      PROXY_LOGGER.warn('stream proxy rejected admission: global reader cap reached', {
        status: 503,
        reason: 'max_active_readers_exceeded',
      });
      return createProxyErrorResponse(
        503,
        'SERVICE_UNAVAILABLE',
        'max_active_readers_exceeded',
        { 'retry-after': DEFAULT_STREAM_PROXY_RETRY_AFTER_SECONDS },
      );
    }

    const setup = new StreamProxySetupLifecycle({
      clock,
      requestSignal: request.signal,
      shutdownSignal,
      releaseSlotsOnce: slot.releaseOnce,
    });
    let activeRevocationDelegate: ((signal?: StreamProxyRevocationSignal) => void) | null = null;

    // Step 2: Deterministic credential selection & Cookie Origin/Fetch-Metadata guard.
    let credentialMode: StreamProxyCredentialMode;
    if (context?.credentialMode !== undefined) {
      credentialMode = context.credentialMode;
    } else {
      const guard = selectCredentialAndGuard(request, context?.remoteAddr, {
        clientAuth: config.clientAuth,
        allowedOrigins: config.allowedOrigins,
        trustProxy: config.trustProxy,
        allowDirectNavigation: config.allowDirectNavigation,
      });
      if (!guard.ok) {
        setup.abortOnce('revoked', guard.status, guard.reason);
        PROXY_LOGGER.warn('stream proxy rejected admission at credential/origin guard', {
          status: guard.status,
          reason: guard.reason,
        });
        return createProxyErrorResponse(
          guard.status,
          statusToErrorLabel(guard.status),
          guard.reason,
        );
      }
      credentialMode = guard.credentialMode;
    }

    // Step 3: Parameter, query, `?live=`, and canonical offset/cursor validation.
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(request.url);
    } catch {
      setup.abortOnce('policy-error', 400, 'invalid_url');
      return createProxyErrorResponse(400, 'BAD_REQUEST', 'invalid_url');
    }

    const protocolQuery = validateProtocolQueryParams(parsedUrl.searchParams, config.defaultOffset);
    if (!protocolQuery.ok) {
      setup.abortOnce('policy-error', 400, protocolQuery.reason);
      return createProxyErrorResponse(400, 'BAD_REQUEST', protocolQuery.reason);
    }
    const effectiveOffset = protocolQuery.offset;
    const effectiveCursor = protocolQuery.cursor;

    const rawParams = context?.params ?? Object.freeze({});
    let validatedParams: TParams;
    let validatedQuery: TQuery;
    if (inputValidator) {
      const validated = inputValidator.validate(rawParams, parsedUrl.searchParams);
      if (!validated.ok) {
        setup.abortOnce('policy-error', 400, validated.reason);
        return createProxyErrorResponse(400, 'BAD_REQUEST', validated.reason);
      }
      validatedParams = validated.params;
      validatedQuery = validated.query;
    } else {
      validatedParams = rawParams as TParams;
      validatedQuery = extractDefaultQueryRecord(parsedUrl.searchParams) as TQuery;
    }

    // Step 4: Application admission (`authorize`), per-key cap, header validation, immediate expiry.
    const authOutcome = await setup.runStep(config.policyTimeoutMs, (signal) =>
      options.authorize({
        request,
        params: validatedParams,
        query: validatedQuery,
        credentialMode,
        principal: context?.principal,
        signal,
      }));
    if (!authOutcome.ok) {
      if (setup.closed) return setup.abortResponse();
      setup.abortOnce('policy-error', 503, 'policy_unavailable');
      PROXY_LOGGER.warn('stream proxy authorize failed closed', {
        status: 503,
        reason: authOutcome.kind === 'timeout' ? 'policy_timeout' : 'policy_error',
      });
      return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable');
    }

    const authDecision = authOutcome.value;
    if (!isValidAuthDecision<TGrant>(authDecision)) {
      setup.abortOnce('policy-error', 503, 'policy_invalid_decision');
      return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable');
    }
    if (!authDecision.allow) {
      const safeReason = sanitizeDiagnosticReason(authDecision.reason, 'access_denied');
      setup.abortOnce('revoked', authDecision.status, safeReason);
      PROXY_LOGGER.warn('stream proxy admission denied by policy', {
        status: authDecision.status,
        reason: safeReason,
      });
      return createProxyErrorResponse(
        authDecision.status,
        statusToErrorLabel(authDecision.status),
        safeReason,
      );
    }

    const grant = authDecision.grant;

    if (options.maxReadersPerKey !== undefined) {
      let key: unknown;
      try {
        key = options.maxReadersPerKey.key(grant);
      } catch {
        setup.abortOnce('policy-error', 503, 'policy_unavailable');
        return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable');
      }
      if (typeof key !== 'string') {
        setup.abortOnce('policy-error', 503, 'policy_unavailable');
        return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable');
      }
      if (!slot.tryReserveKey(key, options.maxReadersPerKey.max)) {
        setup.abortOnce('policy-error', 429, 'reader_limit_exceeded');
        PROXY_LOGGER.warn('stream proxy rejected admission: per-key reader cap reached', {
          status: 429,
          reason: 'reader_limit_exceeded',
        });
        return createProxyErrorResponse(429, 'TOO_MANY_REQUESTS', 'reader_limit_exceeded', {
          'retry-after': DEFAULT_STREAM_PROXY_RETRY_AFTER_SECONDS,
        });
      }
    }

    const validatedHeaders = validateAppOverlayHeaders(
      authDecision.responseHeaders,
      authDecision.setCookies,
    );
    if (!validatedHeaders.ok) {
      setup.abortOnce('policy-error', 503, validatedHeaders.reason);
      PROXY_LOGGER.warn('stream proxy rejected reserved or invalid policy headers', {
        status: 503,
        reason: validatedHeaders.reason,
      });
      return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'invalid_policy_headers');
    }

    if (authDecision.expiresAtMs !== undefined) {
      if (!Number.isFinite(authDecision.expiresAtMs)) {
        setup.abortOnce('policy-error', 503, 'invalid_expiry');
        return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable');
      }
      if (authDecision.expiresAtMs <= clock.nowMs()) {
        setup.abortOnce('expired', 401, 'session_expired');
        return createProxyErrorResponse(401, 'UNAUTHORIZED', 'session_expired');
      }
      setup.currentExpiresAtMs = authDecision.expiresAtMs;
      setup.armExpiryTimer();
    }

    // Step 5: Path resolution (`resolvePath`).
    const pathOutcome = await setup.runStep(
      config.policyTimeoutMs,
      (signal) =>
        options.resolvePath({
          request,
          params: validatedParams,
          query: validatedQuery,
          grant,
          signal,
        }),
    );
    if (!pathOutcome.ok) {
      if (setup.closed) return setup.abortResponse();
      setup.abortOnce('policy-error', 503, 'policy_unavailable');
      return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable');
    }
    const streamPath = pathOutcome.value;
    if (!isValidResolvedStreamPath(streamPath)) {
      setup.abortOnce('policy-error', 500, 'invalid_stream_path');
      PROXY_LOGGER.warn('stream proxy rejected invalid resolved streamPath', {
        status: 500,
        reason: 'invalid_stream_path',
      });
      return createProxyErrorResponse(500, 'INTERNAL_SERVER_ERROR', 'invalid_stream_path');
    }

    // Step 6: Revocation subscription + mandatory 'post-subscribe' catch-up recheck.
    let setupEpoch = setup.invalidationEpoch;
    if (options.revocationSource !== undefined) {
      const onRevocationSignal = (signal?: StreamProxyRevocationSignal): void => {
        if (activeRevocationDelegate !== null) {
          activeRevocationDelegate(signal);
          return;
        }
        if (setup.closed) return;
        if ((signal?.action ?? 'recheck') === 'revoked') {
          setup.abortOnce(
            'revoked',
            401,
            sanitizeDiagnosticReason(signal?.reason, 'session_revoked'),
          );
          return;
        }
        setup.invalidationEpoch += 1;
      };

      const subOutcome = await setup.runStep(
        config.policyTimeoutMs,
        (signal) => options.revocationSource!.subscribe(grant, onRevocationSignal, { signal }),
        (lateUnsub) => {
          if (typeof lateUnsub === 'function') setup.setUnsubscribe(lateUnsub);
        },
      );
      if (!subOutcome.ok) {
        if (setup.closed) return setup.abortResponse();
        setup.abortOnce('policy-error', 503, 'revocation_subscribe_failed');
        return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable');
      }
      if (typeof subOutcome.value !== 'function') {
        setup.abortOnce('policy-error', 503, 'revocation_subscribe_invalid');
        return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable');
      }
      setup.setUnsubscribe(subOutcome.value);
      if (setup.closed) return setup.abortResponse();

      const catchup = await setup.runFencedRecheckLoop({
        reason: 'post-subscribe',
        grant,
        streamPath,
        policyTimeoutMs: config.policyTimeoutMs,
        recheck: options.recheck,
      });
      if (!catchup.ok) return catchup.response;
      setupEpoch = catchup.verifiedEpoch;
    }

    // Step 7: Upstream auth & connect (with pre-200 epoch/expiry fence & late-body disposal).
    const upstreamAuthOutcome = await setup.runStep(
      config.policyTimeoutMs,
      (signal) => resolveUpstreamAuth({ signal }),
    );
    if (!upstreamAuthOutcome.ok) {
      if (setup.closed) return setup.abortResponse();
      setup.abortOnce('policy-error', 503, 'upstream_auth_unavailable');
      return createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'upstream_unavailable');
    }

    let upstreamUrl: URL;
    let upstreamHeaders: Headers;
    try {
      const resolvedBaseUrl = typeof options.baseUrl === 'function'
        ? options.baseUrl()
        : options.baseUrl ?? getStreamsUrl();
      upstreamUrl = new URL(buildStreamUrl(streamPath, resolvedBaseUrl));
      upstreamUrl.searchParams.set('offset', effectiveOffset);
      upstreamUrl.searchParams.set('live', 'sse');
      if (effectiveCursor !== undefined) upstreamUrl.searchParams.set('cursor', effectiveCursor);
      upstreamHeaders = buildUpstreamRequestHeaders(request, upstreamAuthOutcome.value ?? {});
    } catch {
      setup.abortOnce('upstream-error', 502, 'upstream_config_error');
      return createProxyErrorResponse(502, 'BAD_GATEWAY', 'upstream_unavailable');
    }

    const fetchOutcome = await setup.runStep(
      config.upstreamConnectTimeoutMs,
      (stepSignal) => {
        const onStepAbort = (): void => {
          try {
            setup.upstreamAbortController.abort('setup-step-aborted');
          } catch {
            // Ignore.
          }
        };
        stepSignal.addEventListener('abort', onStepAbort, { once: true });
        return Promise.resolve(
          doFetch(upstreamUrl.href, {
            method: 'GET',
            headers: upstreamHeaders,
            redirect: 'manual',
            signal: setup.upstreamAbortController.signal,
          }),
        ).finally(() => stepSignal.removeEventListener('abort', onStepAbort));
      },
      (lateResponse) => {
        void lateResponse.body?.cancel('setup-aborted').catch(() => {});
      },
    );

    if (!fetchOutcome.ok) {
      if (setup.closed) return setup.abortResponse();
      const status = fetchOutcome.kind === 'timeout' ? 504 : 502;
      const reason = fetchOutcome.kind === 'timeout' ? 'upstream_timeout' : 'upstream_unavailable';
      setup.abortOnce('upstream-error', status, reason);
      return createProxyErrorResponse(status, statusToErrorLabel(status), reason);
    }

    const upstream = fetchOutcome.value;
    const cancelUpstreamAndAbort = (
      reason: StreamProxyCloseReason,
      status: number,
      diagnosticReason: string,
    ): Response => {
      void upstream.body?.cancel(diagnosticReason).catch(() => {});
      setup.abortOnce(reason, status, diagnosticReason);
      return createProxyErrorResponse(status, statusToErrorLabel(status), diagnosticReason);
    };

    if (setup.closed) {
      void upstream.body?.cancel('setup-aborted').catch(() => {});
      return setup.abortResponse();
    }
    if (setup.currentExpiresAtMs !== undefined && clock.nowMs() >= setup.currentExpiresAtMs) {
      return cancelUpstreamAndAbort('expired', 401, 'session_expired');
    }
    if (setup.invalidationEpoch !== setupEpoch) {
      const refence = await setup.runFencedRecheckLoop({
        reason: 'revocation-signal',
        grant,
        streamPath,
        policyTimeoutMs: config.policyTimeoutMs,
        recheck: options.recheck,
      });
      if (!refence.ok) {
        void upstream.body?.cancel('pre-200-revoked').catch(() => {});
        return refence.response;
      }
      setupEpoch = refence.verifiedEpoch;
    }

    const upstreamFailure = classifyUpstreamSseFailure(upstream);
    if (upstreamFailure !== null) {
      if (upstreamFailure.warnMessage !== undefined) {
        PROXY_LOGGER.warn(upstreamFailure.warnMessage, {
          streamPath,
          status: upstreamFailure.status,
          reason: upstreamFailure.warnReason ?? upstreamFailure.reason,
        });
      }
      return cancelUpstreamAndAbort(
        'upstream-error',
        upstreamFailure.status,
        upstreamFailure.reason,
      );
    }

    setup.detachForStreamingHandoff();
    const session = createStreamingReaderSession({
      grant,
      streamPath,
      upstreamBody: upstream.body!,
      upstreamAbortController: setup.upstreamAbortController,
      requestSignal: request.signal,
      shutdownSignal,
      clock,
      recheck: options.recheck,
      recheckEveryMs: config.recheckEveryMs,
      policyTimeoutMs: config.policyTimeoutMs,
      maxPendingBatchBytes: config.maxPendingBatchBytes,
      initialInvalidationEpoch: setup.invalidationEpoch,
      initialExpiresAtMs: setup.currentExpiresAtMs,
      unsubscribeOnce: setup.unsubscribeOnce,
      releaseSlotsOnce: slot.releaseOnce,
      onClose: options.onClose,
    });
    activeRevocationDelegate = session.handleRevocationSignal;

    const responseHeaders = buildStreamProxySseResponseHeaders(
      upstream.headers,
      validatedHeaders.headers,
      validatedHeaders.setCookies,
    );
    return new Response(session.stream, { status: 200, headers: responseHeaders });
  };
}
