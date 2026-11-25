import type { StreamProxyClockPort } from '../ports/stream-proxy-ports.ts';

const MAX_TIMEOUT_MS = 2_147_483_647;

/** Default wall-clock implementation of {@link StreamProxyClockPort}. */
export function createSystemStreamProxyClock(): StreamProxyClockPort {
  return {
    nowMs: (): number => Date.now(),
    schedule(delayMs: number, onFire: () => void): () => void {
      const boundedDelay = Number.isFinite(delayMs)
        ? Math.min(Math.max(0, Math.ceil(delayMs)), MAX_TIMEOUT_MS)
        : 0;
      let cleared = false;
      const timer = setTimeout(() => {
        if (cleared) return;
        cleared = true;
        onFire();
      }, boundedDelay);
      return (): void => {
        if (cleared) return;
        cleared = true;
        clearTimeout(timer);
      };
    },
  };
}
