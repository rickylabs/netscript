import type { StreamProxyClockPort } from '../ports/stream-proxy-ports.ts';

const MAX_TIMEOUT_MS = 2_147_483_647;

/** Timer primitives injected for testing chunked long-delay scheduling. */
export interface ChunkedDelayDeps {
  readonly nowMs: () => number;
  readonly setTimer: (callback: () => void, ms: number) => ReturnType<typeof setTimeout>;
  readonly clearTimer: (id: ReturnType<typeof setTimeout>) => void;
  readonly maxChunkMs: number;
}

/**
 * Schedules a delay that may exceed the 32-bit `setTimeout` cap (`2_147_483_647 ms`) by
 * re-arming bounded chunks until `nowMs() >= deadlineMs`, never firing early.
 */
export function scheduleChunkedDelay(
  delayMs: number,
  onFire: () => void,
  deps: ChunkedDelayDeps,
): () => void {
  const normalized = Number.isFinite(delayMs) ? Math.max(0, Math.ceil(delayMs)) : 0;
  const deadlineMs = deps.nowMs() + normalized;
  let cleared = false;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const armNext = (): void => {
    if (cleared) return;
    const remaining = deadlineMs - deps.nowMs();
    if (remaining <= 0) {
      cleared = true;
      timerId = null;
      onFire();
      return;
    }
    const chunk = Math.min(remaining, deps.maxChunkMs);
    timerId = deps.setTimer(() => {
      timerId = null;
      if (cleared) return;
      if (deps.nowMs() < deadlineMs) {
        armNext();
        return;
      }
      cleared = true;
      onFire();
    }, chunk);
  };

  if (normalized === 0) {
    timerId = deps.setTimer(() => {
      timerId = null;
      if (cleared) return;
      cleared = true;
      onFire();
    }, 0);
  } else {
    armNext();
  }

  return (): void => {
    if (cleared) return;
    cleared = true;
    if (timerId !== null) {
      deps.clearTimer(timerId);
      timerId = null;
    }
  };
}

/** Default wall-clock implementation of {@link StreamProxyClockPort}. */
export function createSystemStreamProxyClock(): StreamProxyClockPort {
  const deps: ChunkedDelayDeps = {
    nowMs: (): number => Date.now(),
    setTimer: (callback, ms) => setTimeout(callback, ms),
    clearTimer: (id) => clearTimeout(id),
    maxChunkMs: MAX_TIMEOUT_MS,
  };
  return {
    nowMs: deps.nowMs,
    schedule(delayMs: number, onFire: () => void): () => void {
      return scheduleChunkedDelay(delayMs, onFire, deps);
    },
  };
}
