import type {
  StreamProxyCloseReason,
  StreamProxyRecheckDecision,
  StreamProxyRecheckReason,
} from '../../domain/stream-proxy-contract.ts';
import type { StreamProxyClockPort } from '../../ports/stream-proxy-ports.ts';
import { snapshotRecheckDecision } from './options.ts';

/** Outcome of running one serialized `recheck` call against policy. */
export type RecheckCallOutcome =
  | { readonly kind: 'decision'; readonly decision: StreamProxyRecheckDecision }
  | { readonly kind: 'aborted-for-expiry' }
  | { readonly kind: 'closed' }
  | { readonly kind: 'error' };

/** Synchronous verdict produced by {@link evaluateRecheckDecisionSync}. */
export type RecheckVerdict =
  | {
    readonly status: 'commit';
    readonly nextExpiresAtMs: number | undefined;
    readonly expiryUpdated: boolean;
    readonly clearedHardDeadline: boolean;
  }
  | {
    readonly status: 'refence';
    readonly nextReason: StreamProxyRecheckReason;
    readonly armHardDeadline: boolean;
  }
  | { readonly status: 'close'; readonly closeReason: StreamProxyCloseReason };

/**
 * Pure synchronous post-await decision evaluator shared by delivery-unit fencing and
 * background wake/idle/expiry loops. Performs zero awaits and checks `invalidationEpoch`
 * strictly BEFORE validating or mutating `expiresAtMs`.
 */
export function evaluateRecheckDecisionSync(
  input: Readonly<{
    readonly closed: boolean;
    readonly reason: StreamProxyRecheckReason;
    readonly startEpoch: number;
    readonly currentEpoch: number;
    readonly pendingWakeReason: 'revocation-signal' | 'expiry' | null;
    readonly currentExpiresAtMs: number | undefined;
    readonly nowMs: number;
    readonly outcome: RecheckCallOutcome;
  }>,
): RecheckVerdict {
  if (input.closed || input.outcome.kind === 'closed') {
    return { status: 'close', closeReason: 'completed' };
  }
  if (input.outcome.kind === 'aborted-for-expiry') {
    return { status: 'refence', nextReason: 'expiry', armHardDeadline: false };
  }
  if (input.outcome.kind === 'error') {
    return {
      status: 'close',
      closeReason: input.reason === 'expiry' ? 'expired' : 'policy-error',
    };
  }

  const decision = input.outcome.decision;
  if (!decision.allow) {
    return {
      status: 'close',
      closeReason: input.reason === 'expiry' ? 'expired' : 'revoked',
    };
  }

  // Epoch fence MUST execute before any expiry mutation or unit commit.
  if (input.currentEpoch !== input.startEpoch) {
    const nextReason: StreamProxyRecheckReason = input.pendingWakeReason ?? 'revocation-signal';
    return { status: 'refence', nextReason, armHardDeadline: false };
  }

  if (input.reason === 'expiry') {
    if (
      decision.expiresAtMs === undefined ||
      !Number.isFinite(decision.expiresAtMs) ||
      decision.expiresAtMs <= input.nowMs
    ) {
      return { status: 'close', closeReason: 'expired' };
    }
    return {
      status: 'commit',
      nextExpiresAtMs: decision.expiresAtMs,
      expiryUpdated: true,
      clearedHardDeadline: true,
    };
  }

  if (decision.expiresAtMs !== undefined) {
    if (!Number.isFinite(decision.expiresAtMs)) {
      return { status: 'close', closeReason: 'policy-error' };
    }
    if (decision.expiresAtMs <= input.nowMs) {
      return { status: 'close', closeReason: 'expired' };
    }
    return {
      status: 'commit',
      nextExpiresAtMs: decision.expiresAtMs,
      expiryUpdated: true,
      clearedHardDeadline: false,
    };
  }

  if (input.currentExpiresAtMs !== undefined && input.nowMs >= input.currentExpiresAtMs) {
    return { status: 'refence', nextReason: 'expiry', armHardDeadline: true };
  }

  return {
    status: 'commit',
    nextExpiresAtMs: input.currentExpiresAtMs,
    expiryUpdated: false,
    clearedHardDeadline: false,
  };
}

/** Result of racing a bounded setup hook against `ClockPort` timeout and `AbortSignal`. */
export type BoundedSetupOutcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly kind: 'aborted' | 'timeout' | 'error' };

/**
 * Runs one async setup hook bounded by `ClockPort` timeout and a parent `AbortSignal`.
 * Attaches late-settlement disposal so abandoned promises never leak subscriptions, bodies,
 * or unhandled rejections.
 */
export async function runBoundedSetupStep<T>(
  input: Readonly<{
    readonly clock: StreamProxyClockPort;
    readonly timeoutMs: number;
    readonly parentSignal: AbortSignal;
    readonly isClosed: () => boolean;
    readonly registerStepTimer: (cancel: (() => void) | null) => void;
    readonly fn: (signal: AbortSignal) => Promise<T> | T;
    readonly onLateResolve?: (value: T) => void;
  }>,
): Promise<BoundedSetupOutcome<T>> {
  if (input.isClosed() || input.parentSignal.aborted) {
    return { ok: false, kind: 'aborted' };
  }

  const state: {
    abandoned: boolean;
    disposed: boolean;
    resolved: { readonly value: T } | null;
  } = {
    abandoned: false,
    disposed: false,
    resolved: null,
  };
  const disposeOnce = (value: T): void => {
    if (state.disposed || !input.onLateResolve) return;
    state.disposed = true;
    try {
      input.onLateResolve(value);
    } catch {
      // Ignore late disposal errors.
    }
  };

  const stepController = new AbortController();
  let resolveAbortRace: (() => void) | null = null;
  const abortRace = new Promise<'aborted'>((resolve) => {
    resolveAbortRace = () => resolve('aborted');
  });
  const onParentAbort = (): void => {
    state.abandoned = true;
    try {
      stepController.abort('setup-aborted');
    } catch {
      // Ignore abort errors.
    }
    resolveAbortRace?.();
  };
  input.parentSignal.addEventListener('abort', onParentAbort, { once: true });

  let timedOut = false;
  let resolveTimeoutRace: (() => void) | null = null;
  const timeoutRace = new Promise<'timeout'>((resolve) => {
    resolveTimeoutRace = () => resolve('timeout');
  });
  const cancelTimer = input.clock.schedule(Math.max(0, input.timeoutMs), () => {
    input.registerStepTimer(null);
    timedOut = true;
    state.abandoned = true;
    try {
      stepController.abort('timeout');
    } catch {
      // Ignore abort errors.
    }
    resolveTimeoutRace?.();
  });
  input.registerStepTimer(cancelTimer);

  let rawPromise: Promise<T>;
  try {
    rawPromise = Promise.resolve(input.fn(stepController.signal));
  } catch {
    rawPromise = Promise.reject(new Error('setup_step_sync_throw'));
  }

  rawPromise.then(
    (lateValue) => {
      state.resolved = { value: lateValue };
      if (state.abandoned) {
        disposeOnce(lateValue);
      }
    },
    () => {},
  );

  type RaceResult =
    | { readonly tag: 'ok'; readonly value: T }
    | { readonly tag: 'err' }
    | { readonly tag: 'aborted' }
    | { readonly tag: 'timeout' };

  const result = await Promise.race<RaceResult>([
    rawPromise.then(
      (value): RaceResult => ({ tag: 'ok', value }),
      (): RaceResult => ({ tag: 'err' }),
    ),
    abortRace.then((): RaceResult => ({ tag: 'aborted' })),
    timeoutRace.then((): RaceResult => ({ tag: 'timeout' })),
  ]);

  cancelTimer();
  input.registerStepTimer(null);
  input.parentSignal.removeEventListener('abort', onParentAbort);

  if (result.tag === 'ok') {
    if (input.isClosed() || timedOut || state.abandoned) {
      state.abandoned = true;
      disposeOnce(result.value);
      return { ok: false, kind: input.isClosed() ? 'aborted' : 'timeout' };
    }
    return { ok: true, value: result.value };
  }
  state.abandoned = true;
  if (state.resolved !== null) {
    disposeOnce(state.resolved.value);
  }
  if (result.tag === 'aborted' || input.isClosed()) return { ok: false, kind: 'aborted' };
  if (result.tag === 'timeout' || timedOut) return { ok: false, kind: 'timeout' };
  return { ok: false, kind: 'error' };
}

/** Validates and snapshots a raw recheck result into a typed {@link RecheckCallOutcome}. */
export function normalizeRecheckDecision(value: unknown): RecheckCallOutcome {
  const decision = snapshotRecheckDecision(value);
  return decision !== null ? { kind: 'decision', decision } : { kind: 'error' };
}

/** Aborts an `AbortController` without propagating secondary abort listener exceptions. */
export function abortQuietly(controller: AbortController | null, reason: string): void {
  try {
    controller?.abort(reason);
  } catch {
    // Ignore abort errors.
  }
}

/** Closes a `ReadableStreamDefaultController` without propagating already-closed errors. */
export function closeControllerQuietly(
  controller: ReadableStreamDefaultController<Uint8Array> | null,
): void {
  try {
    controller?.close();
  } catch {
    // Already closed.
  }
}
