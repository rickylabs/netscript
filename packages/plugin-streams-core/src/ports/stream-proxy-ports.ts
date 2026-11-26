import type { StreamProxyRevocationSignal } from '../domain/stream-proxy-contract.ts';

/** Deterministic clock and cancelable timer port for stream proxy scheduling. */
export interface StreamProxyClockPort {
  /** Current epoch time in milliseconds. */
  nowMs(): number;
  /**
   * Schedule `onFire` after `delayMs` (clamped `>= 0`).
   * Returns an idempotent cancel function that must not hold timers open after cancellation.
   */
  schedule(delayMs: number, onFire: () => void): () => void;
}

/** Application-owned shared revocation channel for immediate cross-gateway reader wakeups. */
export interface StreamProxyRevocationSource<TGrant = unknown> {
  /**
   * Register a wake callback for one admitted reader grant.
   * Must return an idempotent disposer invoked when the reader closes or setup aborts.
   */
  subscribe(
    grant: TGrant,
    notify: (signal?: StreamProxyRevocationSignal) => void,
    options?: Readonly<{ readonly signal: AbortSignal }>,
  ): (() => void) | Promise<() => void>;
}
