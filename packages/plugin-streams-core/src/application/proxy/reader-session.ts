import { createLogger } from '@netscript/logger';
import {
  DEFAULT_STREAM_PROXY_MAX_REFENCE_ATTEMPTS,
  type StreamProxyCloseEvent,
  type StreamProxyCloseReason,
  type StreamProxyOptions,
  type StreamProxyRecheckDecision,
  type StreamProxyRecheckReason,
  type StreamProxyRevocationSignal,
} from '../../domain/stream-proxy-contract.ts';
import type { StreamProxyClockPort } from '../../ports/stream-proxy-ports.ts';
import {
  evaluateRecheckDecisionSync,
  normalizeRecheckDecision,
  type RecheckCallOutcome,
} from './recheck-coordinator.ts';
import { BoundedSseDeliveryUnitParser, type SseDeliveryUnit } from './sse-parser.ts';

const PROXY_LOGGER = createLogger(['netscript', 'streams', 'proxy']);

function abortQuietly(controller: AbortController | null, reason: string): void {
  try {
    controller?.abort(reason);
  } catch {
    // Ignore abort errors.
  }
}

function closeControllerQuietly(
  controller: ReadableStreamDefaultController<Uint8Array> | null,
): void {
  try {
    controller?.close();
  } catch {
    // Already closed.
  }
}

/** Parameters transferred atomically from setup into a streaming reader session. */
export interface StreamingReaderSessionInit<TGrant> {
  readonly grant: TGrant;
  readonly streamPath: string;
  readonly upstreamBody: ReadableStream<Uint8Array>;
  readonly upstreamAbortController: AbortController;
  readonly requestSignal: AbortSignal;
  readonly shutdownSignal?: AbortSignal;
  readonly clock: StreamProxyClockPort;
  readonly recheck: StreamProxyOptions<TGrant>['recheck'];
  readonly recheckEveryMs: number | null;
  readonly policyTimeoutMs: number;
  readonly maxPendingBatchBytes: number;
  readonly initialInvalidationEpoch: number;
  readonly initialExpiresAtMs: number | undefined;
  readonly unsubscribeOnce: () => void;
  readonly releaseSlotsOnce: () => void;
  readonly onClose?: (event: StreamProxyCloseEvent) => void;
}

/** Active streaming session handle returned synchronously during setup->streaming handoff. */
export interface StreamingReaderSession {
  /** Pull-driven (`highWaterMark: 0`) SSE byte stream. */
  readonly stream: ReadableStream<Uint8Array>;
  /** Revocation signal delegate wired from the active `revocationSource` subscription. */
  readonly handleRevocationSignal: (signal?: StreamProxyRevocationSignal) => void;
}

/**
 * Create a streaming SSE reader session with bounded incremental SSE parsing, monotonic
 * `invalidationEpoch` fencing, single-budget `expiresAtMs + policyTimeoutMs` expiry contention,
 * periodic `recheckEveryMs` idle checks, `highWaterMark: 0` backpressure, and decoupled
 * synchronous downstream EOF.
 */
export function createStreamingReaderSession<TGrant>(
  init: StreamingReaderSessionInit<TGrant>,
): StreamingReaderSession {
  const parser = new BoundedSseDeliveryUnitParser(init.maxPendingBatchBytes);
  const upstreamReader = init.upstreamBody.getReader();

  let closed = false;
  let deliveredUnits = 0;
  let invalidationEpoch = init.initialInvalidationEpoch;
  let pendingWakeReason: 'revocation-signal' | 'expiry' | null = null;
  let currentExpiresAtMs = init.initialExpiresAtMs;
  let expiryHardDeadlineMs: number | undefined = undefined;

  let activeRecheck: Promise<void> | null = null;
  let activeRecheckAbort: AbortController | null = null;
  let activeRecheckIsExpiry = false;
  let activeRecheckAbortedForExpiry = false;
  let cancelActiveRecheckTimer: (() => void) | null = null;

  let cancelExpiryTimer: (() => void) | null = null;
  let cancelExpiryHardDeadlineTimer: (() => void) | null = null;
  let cancelIdleTimer: (() => void) | null = null;
  let downstreamController: ReadableStreamDefaultController<Uint8Array> | null = null;

  let resolveClosedSignal: (() => void) | null = null;
  const closedSignalPromise = new Promise<void>((resolve) => {
    resolveClosedSignal = resolve;
  });

  const onRequestAbort = (): void => closeOnce('client-cancelled');
  const onShutdownAbort = (): void => closeOnce('shutdown');

  function clearExpiryTimers(): void {
    cancelExpiryTimer?.();
    cancelExpiryTimer = null;
    cancelExpiryHardDeadlineTimer?.();
    cancelExpiryHardDeadlineTimer = null;
    expiryHardDeadlineMs = undefined;
  }

  function clearIdleTimer(): void {
    cancelIdleTimer?.();
    cancelIdleTimer = null;
  }

  function closeOnce(reason: StreamProxyCloseReason): void {
    if (closed) return;
    closed = true;

    init.releaseSlotsOnce();
    parser.clear();
    clearExpiryTimers();
    clearIdleTimer();
    cancelActiveRecheckTimer?.();
    cancelActiveRecheckTimer = null;

    init.requestSignal.removeEventListener('abort', onRequestAbort);
    init.shutdownSignal?.removeEventListener('abort', onShutdownAbort);

    // Close downstream controller synchronously FIRST so EOF never waits on upstream cancel.
    const controller = downstreamController;
    downstreamController = null;
    closeControllerQuietly(controller);

    resolveClosedSignal?.();
    resolveClosedSignal = null;
    abortQuietly(activeRecheckAbort, reason);
    abortQuietly(init.upstreamAbortController, reason);

    init.unsubscribeOnce();

    void upstreamReader.cancel(reason).catch(() => {}).finally(() => {
      try {
        upstreamReader.releaseLock();
      } catch { /* already released */ }
    });

    PROXY_LOGGER.info('stream proxy reader closed', {
      streamPath: init.streamPath,
      reason,
      deliveredUnits,
    });
    if (init.onClose) {
      try {
        init.onClose({ streamPath: init.streamPath, reason, deliveredUnits });
      } catch { /* ignore */ }
    }
  }

  function armExpiryTimer(): void {
    cancelExpiryTimer?.();
    cancelExpiryTimer = null;
    if (closed || currentExpiresAtMs === undefined) return;
    const delayMs = Math.max(0, currentExpiresAtMs - init.clock.nowMs());
    cancelExpiryTimer = init.clock.schedule(delayMs, () => {
      cancelExpiryTimer = null;
      onExpiryTick();
    });
  }

  function armIdleTimer(): void {
    clearIdleTimer();
    if (closed || init.recheckEveryMs === null) return;
    cancelIdleTimer = init.clock.schedule(init.recheckEveryMs, () => {
      cancelIdleTimer = null;
      if (closed || activeRecheck !== null) return;
      invalidationEpoch += 1;
      void runBackgroundWakeLoop('idle-interval');
    });
  }

  function ensureExpiryHardDeadlineArmed(): number {
    if (expiryHardDeadlineMs === undefined) {
      const base = currentExpiresAtMs ?? init.clock.nowMs();
      expiryHardDeadlineMs = base + init.policyTimeoutMs;
      const remaining = Math.max(0, expiryHardDeadlineMs - init.clock.nowMs());
      cancelExpiryHardDeadlineTimer?.();
      cancelExpiryHardDeadlineTimer = init.clock.schedule(remaining, () => {
        cancelExpiryHardDeadlineTimer = null;
        closeOnce('expired');
      });
    }
    return expiryHardDeadlineMs;
  }

  function onExpiryTick(): void {
    if (closed) return;
    invalidationEpoch += 1;
    pendingWakeReason = 'expiry';
    ensureExpiryHardDeadlineArmed();

    if (activeRecheck !== null) {
      if (!activeRecheckIsExpiry) {
        cancelActiveRecheckTimer?.();
        cancelActiveRecheckTimer = null;
        activeRecheckAbortedForExpiry = true;
        abortQuietly(activeRecheckAbort, 'expiry');
      }
      return;
    }

    void runBackgroundWakeLoop('expiry');
  }

  function handleRevocationSignal(signal?: StreamProxyRevocationSignal): void {
    if (closed) return;
    if ((signal?.action ?? 'recheck') === 'revoked') {
      closeOnce('revoked');
      return;
    }
    invalidationEpoch += 1;
    if (pendingWakeReason !== 'expiry') {
      pendingWakeReason = 'revocation-signal';
    }
    if (activeRecheck === null) {
      void runBackgroundWakeLoop('revocation-signal');
    }
  }

  async function invokeSingleRecheck(
    reason: StreamProxyRecheckReason,
    timeoutMs: number,
  ): Promise<RecheckCallOutcome> {
    if (closed) return { kind: 'closed' };
    clearIdleTimer();

    const perCheckAbort = new AbortController();
    activeRecheckAbort = perCheckAbort;
    activeRecheckIsExpiry = reason === 'expiry';
    activeRecheckAbortedForExpiry = false;

    let releaseSlot!: () => void;
    activeRecheck = new Promise<void>((resolve) => {
      releaseSlot = resolve;
    });

    let timedOut = false;
    let resolveTimeout: (() => void) | null = null;
    const timeoutPromise = new Promise<'timeout'>((resolve) => {
      resolveTimeout = () => resolve('timeout');
    });

    cancelActiveRecheckTimer?.();
    cancelActiveRecheckTimer = init.clock.schedule(Math.max(0, timeoutMs), () => {
      cancelActiveRecheckTimer = null;
      timedOut = true;
      abortQuietly(perCheckAbort, 'timeout');
      resolveTimeout?.();
    });

    let rawPromise: Promise<StreamProxyRecheckDecision>;
    try {
      rawPromise = Promise.resolve(
        init.recheck({
          grant: init.grant,
          streamPath: init.streamPath,
          reason,
          signal: perCheckAbort.signal,
        }),
      );
    } catch {
      rawPromise = Promise.reject(new Error('recheck_sync_throw'));
    }
    void rawPromise.catch(() => {});

    type RaceValue =
      | { readonly tag: 'ok'; readonly value: StreamProxyRecheckDecision }
      | { readonly tag: 'err' }
      | { readonly tag: 'timeout' }
      | { readonly tag: 'closed' };

    const settled: RaceValue = await Promise.race<RaceValue>([
      rawPromise.then(
        (value): RaceValue => ({ tag: 'ok', value }),
        (): RaceValue => ({ tag: 'err' }),
      ),
      timeoutPromise.then((): RaceValue => ({ tag: 'timeout' })),
      closedSignalPromise.then((): RaceValue => ({ tag: 'closed' })),
    ]);

    const wasAbortedForExpiry = activeRecheckAbortedForExpiry;
    cancelActiveRecheckTimer?.();
    cancelActiveRecheckTimer = null;
    activeRecheckAbort = null;
    activeRecheckIsExpiry = false;
    activeRecheckAbortedForExpiry = false;
    activeRecheck = null;
    releaseSlot();

    if (closed || settled.tag === 'closed') return { kind: 'closed' };
    if (wasAbortedForExpiry) return { kind: 'aborted-for-expiry' };
    if (timedOut || settled.tag === 'timeout' || settled.tag === 'err') return { kind: 'error' };
    return normalizeRecheckDecision(settled.value);
  }

  function applyVerdictSync(
    reason: StreamProxyRecheckReason,
    startEpoch: number,
    outcome: RecheckCallOutcome,
  ): 'commit' | { readonly refence: StreamProxyRecheckReason } | 'closed' {
    const verdict = evaluateRecheckDecisionSync({
      closed,
      reason,
      startEpoch,
      currentEpoch: invalidationEpoch,
      pendingWakeReason,
      currentExpiresAtMs,
      nowMs: init.clock.nowMs(),
      outcome,
    });
    if (verdict.status === 'close') {
      if (!closed) closeOnce(verdict.closeReason);
      return 'closed';
    }
    if (verdict.status === 'refence') {
      pendingWakeReason = null;
      if (verdict.armHardDeadline) ensureExpiryHardDeadlineArmed();
      return { refence: verdict.nextReason };
    }
    if (verdict.clearedHardDeadline) clearExpiryTimers();
    if (verdict.expiryUpdated) {
      currentExpiresAtMs = verdict.nextExpiresAtMs;
      armExpiryTimer();
    }
    pendingWakeReason = null;
    armIdleTimer();
    return 'commit';
  }

  function computeTimeoutForReason(reason: StreamProxyRecheckReason): number | null {
    if (reason === 'expiry') {
      const remaining = Math.max(0, ensureExpiryHardDeadlineArmed() - init.clock.nowMs());
      return remaining === 0 ? null : remaining;
    }
    return init.policyTimeoutMs;
  }

  async function runRecheckFenceLoop(
    initialReason: StreamProxyRecheckReason,
    onCommitSync?: () => void,
  ): Promise<void> {
    let reason = initialReason;
    let attempts = 0;

    while (!closed) {
      while (activeRecheck !== null && !closed) {
        await activeRecheck;
      }
      if (closed) return;

      if (
        reason !== 'expiry' &&
        currentExpiresAtMs !== undefined &&
        init.clock.nowMs() >= currentExpiresAtMs
      ) {
        reason = 'expiry';
      }
      const timeoutMs = computeTimeoutForReason(reason);
      if (timeoutMs === null) {
        closeOnce('expired');
        return;
      }

      const startEpoch = invalidationEpoch;
      const outcome = await invokeSingleRecheck(reason, timeoutMs);

      // SYNCHRONOUS CRITICAL SECTION: zero awaits between verdict and optional enqueue!
      const applied = applyVerdictSync(reason, startEpoch, outcome);
      if (applied === 'closed') return;
      if (applied === 'commit') {
        onCommitSync?.();
        return;
      }

      attempts += 1;
      if (attempts > DEFAULT_STREAM_PROXY_MAX_REFENCE_ATTEMPTS) {
        closeOnce(applied.refence === 'expiry' ? 'expired' : 'policy-error');
        return;
      }
      reason = applied.refence;
    }
  }

  function runBackgroundWakeLoop(reason: StreamProxyRecheckReason): Promise<void> {
    return runRecheckFenceLoop(reason);
  }

  async function readNextDeliveryUnit(): Promise<SseDeliveryUnit | null> {
    while (!closed) {
      if (parser.hasBufferedChunkBytes) {
        const step = parser.step();
        if (step.kind === 'unit') return step.unit;
        if (step.kind === 'error') {
          closeOnce(step.reason);
          return null;
        }
      }

      type ReadResult =
        | { readonly tag: 'read'; readonly result: ReadableStreamReadResult<Uint8Array> }
        | { readonly tag: 'err' }
        | { readonly tag: 'closed' };

      const readPromise = upstreamReader.read();
      void readPromise.catch(() => {});

      const settled = await Promise.race<ReadResult>([
        readPromise.then(
          (result): ReadResult => ({ tag: 'read', result }),
          (): ReadResult => ({ tag: 'err' }),
        ),
        closedSignalPromise.then((): ReadResult => ({ tag: 'closed' })),
      ]);

      if (closed || settled.tag === 'closed') return null;
      if (settled.tag === 'err') {
        closeOnce('upstream-error');
        return null;
      }

      if (settled.result.done) {
        const finalStep = parser.finish();
        if (finalStep.kind === 'unit') return finalStep.unit;
        if (finalStep.kind === 'eof') {
          closeOnce('completed');
          return null;
        }
        closeOnce(finalStep.kind === 'error' ? finalStep.reason : 'upstream-error');
        return null;
      }

      if (settled.result.value.byteLength === 0) continue;
      parser.pushChunk(settled.result.value);
      const step = parser.step();
      if (step.kind === 'unit') return step.unit;
      if (step.kind === 'error') {
        closeOnce(step.reason);
        return null;
      }
    }
    return null;
  }

  if (init.requestSignal.aborted) {
    closeOnce('client-cancelled');
  } else if (init.shutdownSignal?.aborted) {
    closeOnce('shutdown');
  } else {
    init.requestSignal.addEventListener('abort', onRequestAbort, { once: true });
    init.shutdownSignal?.addEventListener('abort', onShutdownAbort, { once: true });
    armExpiryTimer();
    armIdleTimer();
  }

  const stream = new ReadableStream<Uint8Array>(
    {
      start(controller) {
        downstreamController = controller;
        if (closed) {
          downstreamController = null;
          closeControllerQuietly(controller);
        }
      },
      async pull(controller) {
        if (closed) return;
        const unit = await readNextDeliveryUnit();
        if (closed || unit === null) return;
        await runRecheckFenceLoop('before-delivery', () => {
          if (closed) return;
          try {
            controller.enqueue(unit.bytes);
            deliveredUnits += 1;
          } catch {
            closeOnce('client-cancelled');
          }
        });
      },
      cancel() {
        closeOnce('client-cancelled');
      },
    },
    { highWaterMark: 0 },
  );

  return { stream, handleRevocationSignal };
}
