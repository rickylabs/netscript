import { resolveProbeUrl } from '@netscript/plugin';
import type { StreamPayloadSchema } from '../../public/stream-api.ts';

const DEFAULT_STREAMS_URL = 'http://127.0.0.1:4437';

/** Resolve the streams service URL used by E2E probes. */
export function resolveStreamsProbeUrl(): string {
  return resolveProbeUrl(['DURABLE_STREAMS_URL', 'STREAMS_URL'], DEFAULT_STREAMS_URL);
}

/** Return a unique E2E stream path for an isolated probe run. */
export function createProbeStreamPath(kind: string): string {
  return `/e2e/${kind}/${crypto.randomUUID()}`;
}

/** Ignore expected stream cleanup aborts while surfacing unexpected probe failures. */
export function ignoreExpectedProbeCleanupError(error: unknown): void {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return;
  }
  throw error instanceof Error ? error : new Error(String(error));
}

/** Pass-through Standard Schema-compatible validator for probe payloads. */
export const probePayloadSchema: StreamPayloadSchema<unknown> = {
  '~standard': {
    version: 1,
    vendor: 'netscript',
    validate: (value: unknown) => ({ value }),
  },
} as const;
