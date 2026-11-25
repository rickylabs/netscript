import {
  DEFAULT_STREAM_PROXY_MAX_REFENCE_ATTEMPTS,
  type StreamProxyCloseReason,
  type StreamProxyOptions,
} from '../../domain/stream-proxy-contract.ts';
import type { StreamProxyClockPort } from '../../ports/stream-proxy-ports.ts';
import { createProxyErrorResponse, sanitizeDiagnosticReason } from './headers.ts';
import { isValidRecheckDecision } from './options.ts';
import { type BoundedSetupOutcome, runBoundedSetupStep } from './recheck-coordinator.ts';

/** Maps HTTP failure statuses used by the stream proxy to standard error labels. */
export function statusToErrorLabel(status: number): string {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 410) return 'GONE';
  if (status === 429) return 'TOO_MANY_REQUESTS';
  if (status === 500) return 'INTERNAL_SERVER_ERROR';
  if (status === 502) return 'BAD_GATEWAY';
  if (status === 504) return 'GATEWAY_TIMEOUT';
  return 'SERVICE_UNAVAILABLE';
}

/** Tracks global and per-key active reader slots for one stream proxy instance. */
export class ReaderCapacityTracker {
  readonly #maxActive: number;
  #active = 0;
  readonly #byKey = new Map<string, number>();

  constructor(maxActiveReaders: number) {
    this.#maxActive = maxActiveReaders;
  }

  /** Attempt to reserve a global reader slot before `authorize`. */
  tryReserveGlobal(): {
    readonly tryReserveKey: (key: string, max: number) => boolean;
    readonly releaseOnce: () => void;
  } | null {
    if (this.#active >= this.#maxActive) return null;
    this.#active += 1;
    let globalHeld = true;
    let reservedKey: string | undefined = undefined;

    return {
      tryReserveKey: (key: string, max: number): boolean => {
        const current = this.#byKey.get(key) ?? 0;
        if (current >= max) return false;
        this.#byKey.set(key, current + 1);
        reservedKey = key;
        return true;
      },
      releaseOnce: (): void => {
        if (reservedKey !== undefined) {
          const key = reservedKey;
          reservedKey = undefined;
          const next = (this.#byKey.get(key) ?? 1) - 1;
          if (next <= 0) this.#byKey.delete(key);
          else this.#byKey.set(key, next);
        }
        if (globalHeld) {
          globalHeld = false;
          this.#active = Math.max(0, this.#active - 1);
        }
      },
    };
  }
}

/**
 * Coordinates single-transition `abortSetupOnce(...)` cleanup, `ClockPort` setup timers,
 * abort-signal listeners, revocation disposer idempotency, and fenced setup re-checks.
 */
export class StreamProxySetupLifecycle {
  readonly setupAbortController: AbortController = new AbortController();
  readonly upstreamAbortController: AbortController = new AbortController();

  closed = false;
  terminalStatus = 503;
  terminalReason = 'setup_aborted';
  invalidationEpoch = 0;
  currentExpiresAtMs: number | undefined = undefined;

  readonly #clock: StreamProxyClockPort;
  readonly #requestSignal: AbortSignal;
  readonly #shutdownSignal?: AbortSignal;
  readonly #releaseSlotsOnce: () => void;

  #cancelExpiryTimer: (() => void) | null = null;
  #cancelStepTimer: (() => void) | null = null;
  #unsubscribeFn: (() => void) | null = null;
  #unsubscribed = false;

  readonly #onRequestAbort = (): void => {
    this.abortOnce('client-cancelled', 503, 'client_cancelled');
  };
  readonly #onShutdownAbort = (): void => {
    this.abortOnce('shutdown', 503, 'service_shutdown');
  };

  constructor(
    input: Readonly<{
      readonly clock: StreamProxyClockPort;
      readonly requestSignal: AbortSignal;
      readonly shutdownSignal?: AbortSignal;
      readonly releaseSlotsOnce: () => void;
    }>,
  ) {
    this.#clock = input.clock;
    this.#requestSignal = input.requestSignal;
    this.#shutdownSignal = input.shutdownSignal;
    this.#releaseSlotsOnce = input.releaseSlotsOnce;
    this.#requestSignal.addEventListener('abort', this.#onRequestAbort, { once: true });
    this.#shutdownSignal?.addEventListener('abort', this.#onShutdownAbort, { once: true });
  }

  /** Register a revocation disposer; if setup already closed, invokes it immediately once. */
  setUnsubscribe(fn: () => void): void {
    this.#unsubscribeFn = fn;
    if (this.closed) this.unsubscribeOnce();
  }

  /** Idempotently invoke the registered revocation disposer at most once. */
  readonly unsubscribeOnce = (): void => {
    if (this.#unsubscribed || this.#unsubscribeFn === null) return;
    this.#unsubscribed = true;
    const fn = this.#unsubscribeFn;
    this.#unsubscribeFn = null;
    try {
      fn();
    } catch {
      // Suppress disposer errors during teardown.
    }
  };

  /** Remove setup listeners and timers atomically during setup->streaming handoff. */
  detachForStreamingHandoff(): void {
    this.#requestSignal.removeEventListener('abort', this.#onRequestAbort);
    this.#shutdownSignal?.removeEventListener('abort', this.#onShutdownAbort);
    this.#cancelExpiryTimer?.();
    this.#cancelExpiryTimer = null;
    this.#cancelStepTimer?.();
    this.#cancelStepTimer = null;
  }

  /** Single idempotent terminal setup exit releasing slots, timers, listeners, and subscriptions. */
  abortOnce(
    _reason: StreamProxyCloseReason,
    status: number,
    diagnosticReason = 'setup_aborted',
  ): void {
    if (this.closed) return;
    this.closed = true;
    this.terminalStatus = status;
    this.terminalReason = diagnosticReason;
    this.detachForStreamingHandoff();
    try {
      this.setupAbortController.abort(diagnosticReason);
    } catch {
      // Ignore abort errors.
    }
    try {
      this.upstreamAbortController.abort(diagnosticReason);
    } catch {
      // Ignore abort errors.
    }
    this.#releaseSlotsOnce();
    this.unsubscribeOnce();
  }

  /** Build the redacted HTTP error response for an already-aborted setup. */
  abortResponse(): Response {
    return createProxyErrorResponse(
      this.terminalStatus,
      statusToErrorLabel(this.terminalStatus),
      this.terminalReason,
    );
  }

  /** Arm or re-arm the setup-phase expiry timer via `ClockPort`. */
  armExpiryTimer(): void {
    this.#cancelExpiryTimer?.();
    this.#cancelExpiryTimer = null;
    if (this.closed || this.currentExpiresAtMs === undefined) return;
    const delayMs = Math.max(0, this.currentExpiresAtMs - this.#clock.nowMs());
    this.#cancelExpiryTimer = this.#clock.schedule(delayMs, () => {
      this.#cancelExpiryTimer = null;
      this.abortOnce('expired', 401, 'session_expired');
    });
  }

  /** Run one bounded setup step with late-result disposal on abort/timeout. */
  runStep<T>(
    timeoutMs: number,
    fn: (signal: AbortSignal) => Promise<T> | T,
    onLateResolve?: (value: T) => void,
  ): Promise<BoundedSetupOutcome<T>> {
    return runBoundedSetupStep({
      clock: this.#clock,
      timeoutMs,
      parentSignal: this.setupAbortController.signal,
      isClosed: () => this.closed,
      registerStepTimer: (cancel) => {
        this.#cancelStepTimer = cancel;
      },
      fn,
      onLateResolve,
    });
  }

  /** Execute the bounded fenced `recheck` loop for `'post-subscribe'` or pre-`200` wake refencing. */
  async runFencedRecheckLoop<TGrant>(
    input: Readonly<{
      readonly reason: 'post-subscribe' | 'revocation-signal';
      readonly grant: TGrant;
      readonly streamPath: string;
      readonly policyTimeoutMs: number;
      readonly recheck: StreamProxyOptions<TGrant>['recheck'];
    }>,
  ): Promise<
    | { readonly ok: true; readonly verifiedEpoch: number }
    | { readonly ok: false; readonly response: Response }
  > {
    let attempts = 0;
    while (true) {
      if (this.closed) return { ok: false, response: this.abortResponse() };
      if (this.currentExpiresAtMs !== undefined && this.#clock.nowMs() >= this.currentExpiresAtMs) {
        this.abortOnce('expired', 401, 'session_expired');
        return {
          ok: false,
          response: createProxyErrorResponse(401, 'UNAUTHORIZED', 'session_expired'),
        };
      }

      const startEpoch = this.invalidationEpoch;
      const outcome = await this.runStep(input.policyTimeoutMs, (signal) =>
        input.recheck({
          grant: input.grant,
          streamPath: input.streamPath,
          reason: input.reason,
          signal,
        }));
      if (this.closed) return { ok: false, response: this.abortResponse() };
      if (!outcome.ok || !isValidRecheckDecision(outcome.value)) {
        this.abortOnce('policy-error', 503, 'policy_unavailable');
        return {
          ok: false,
          response: createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable'),
        };
      }

      const decision = outcome.value;
      if (!decision.allow) {
        const safeReason = sanitizeDiagnosticReason(decision.reason, 'session_revoked');
        this.abortOnce('revoked', 401, safeReason);
        return { ok: false, response: createProxyErrorResponse(401, 'UNAUTHORIZED', safeReason) };
      }

      // Epoch check strictly precedes any expiry mutation!
      if (this.invalidationEpoch !== startEpoch) {
        attempts += 1;
        if (attempts > DEFAULT_STREAM_PROXY_MAX_REFENCE_ATTEMPTS) {
          this.abortOnce('policy-error', 503, 'policy_refence_exhausted');
          return {
            ok: false,
            response: createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable'),
          };
        }
        continue;
      }

      if (decision.expiresAtMs !== undefined) {
        if (!Number.isFinite(decision.expiresAtMs)) {
          this.abortOnce('policy-error', 503, 'invalid_expiry');
          return {
            ok: false,
            response: createProxyErrorResponse(503, 'SERVICE_UNAVAILABLE', 'policy_unavailable'),
          };
        }
        this.currentExpiresAtMs = decision.expiresAtMs;
      }
      if (this.currentExpiresAtMs !== undefined && this.#clock.nowMs() >= this.currentExpiresAtMs) {
        this.abortOnce('expired', 401, 'session_expired');
        return {
          ok: false,
          response: createProxyErrorResponse(401, 'UNAUTHORIZED', 'session_expired'),
        };
      }
      if (decision.expiresAtMs !== undefined) this.armExpiryTimer();
      return { ok: true, verifiedEpoch: startEpoch };
    }
  }
}

/** Result of inspecting an upstream SSE HTTP response before returning `200`. */
export type UpstreamResponseFailure = Readonly<{
  readonly status: number;
  readonly reason: string;
  readonly warnMessage?: string;
  readonly warnReason?: string;
}>;

/**
 * Validate an upstream Durable Streams SSE response status, content-type, and body.
 * Returns `null` only for a valid `200 text/event-stream` response with a non-null body.
 */
export function classifyUpstreamSseFailure(upstream: Response): UpstreamResponseFailure | null {
  if (upstream.status === 401 || upstream.status === 403) {
    return {
      status: 502,
      reason: 'upstream_unavailable',
      warnMessage: 'stream proxy upstream auth failure mapped to 502',
      warnReason: 'upstream_auth_failed',
    };
  }
  if (upstream.status === 404) return { status: 404, reason: 'stream_not_found' };
  if (upstream.status === 410) return { status: 410, reason: 'stream_gone' };
  if (upstream.status === 400) return { status: 400, reason: 'invalid_stream_request' };

  const contentType = upstream.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (upstream.status !== 200 || contentType !== 'text/event-stream' || upstream.body === null) {
    return {
      status: 502,
      reason: 'upstream_invalid_response',
      warnMessage: 'stream proxy rejected non-SSE or unexpected upstream status',
      warnReason: 'upstream_invalid_response',
    };
  }
  return null;
}
