import type { StreamPayloadSchema } from '../../public/stream-api.ts';

/** Resolve the streams service URL used by E2E probes. */
export function resolveStreamsProbeUrl(): string {
  const value = Deno.env.get('services__streams__https__0') ??
    Deno.env.get('services__streams__http__0') ??
    Deno.env.get('DURABLE_STREAMS_URL') ??
    Deno.env.get('STREAMS_URL');
  if (value === undefined) {
    throw new Error(
      'Streams probe endpoint was not discovered. Configure an Aspire service reference or DURABLE_STREAMS_URL.',
    );
  }
  return value.replace(/\/$/, '');
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
