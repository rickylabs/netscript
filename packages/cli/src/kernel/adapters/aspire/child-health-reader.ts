import type { ChildHealthSnapshot, ChildHealthState } from '@netscript/plugin/health';

const STATES: readonly ChildHealthState[] = [
  'starting',
  'ready',
  'degraded',
  'crash-looping',
  'stopped',
  'failed',
];
const MAX_PAYLOAD_BYTES = 4096;

/** Read one declared child endpoint with bounded time/body; malformed payloads cannot certify readiness. */
export async function readChildHealth(
  url: string,
  fetchFn: typeof fetch,
): Promise<ChildHealthSnapshot | undefined> {
  try {
    const response = await fetchFn(new URL('/health', url), {
      signal: AbortSignal.timeout(2000),
      redirect: 'error',
    });
    if (!response.body) return undefined;
    const reader = response.body.getReader();
    const bytes = new Uint8Array(MAX_PAYLOAD_BYTES);
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        if (size + chunk.value.length > bytes.length) return undefined;
        bytes.set(chunk.value, size);
        size += chunk.value.length;
      }
    } finally {
      await reader.cancel();
    }
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes.subarray(0, size)));
    if (
      !isRecord(value) || !isState(value.state) || typeof value.registryReady !== 'boolean' ||
      typeof value.dependencyReady !== 'boolean' || !Number.isSafeInteger(value.restartCount) ||
      typeof value.restartCount !== 'number' || value.restartCount < 0
    ) return undefined;
    const fatal = value.lastFatalError;
    const lastFatalError = fatal === null
      ? null
      : isRecord(fatal) && typeof fatal.timestamp === 'number' &&
          Number.isFinite(fatal.timestamp) && typeof fatal.message === 'string'
      ? { message: 'Background child failed (details redacted).', timestamp: fatal.timestamp }
      : undefined;
    if (lastFatalError === undefined) return undefined;
    const ready = value.state === 'ready' && value.registryReady && value.dependencyReady;
    if (response.status !== (ready ? 200 : 503)) return undefined;
    return {
      state: value.state,
      registryReady: value.registryReady,
      dependencyReady: value.dependencyReady,
      restartCount: value.restartCount,
      lastFatalError,
    };
  } catch {
    return undefined;
  }
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function isState(value: unknown): value is ChildHealthState {
  return typeof value === 'string' && STATES.some((state) => state === value);
}
