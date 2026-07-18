import { os } from '@orpc/server';
import { FIXTURE_VERSION, REMOTE_SERVICE_ENV, RENDERER_EVIDENCE_ENV } from './constants.ts';

/** Response crossing remote HTTP, native RPC, and the renderer acknowledgement. */
export interface RemoteProbeEvidence {
  readonly source: string;
  readonly value: string;
  readonly version: string;
}

function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Required desktop fixture environment ${name} is missing.`);
  return value;
}

function parseProbeEvidence(value: unknown): RemoteProbeEvidence {
  if (value === null || typeof value !== 'object') {
    throw new TypeError('Renderer acknowledgement must be an object.');
  }
  const record = value as Readonly<Record<string, unknown>>;
  if (
    typeof record.source !== 'string' || typeof record.value !== 'string' ||
    typeof record.version !== 'string'
  ) {
    throw new TypeError('Renderer acknowledgement has an invalid evidence shape.');
  }
  return { source: record.source, value: record.value, version: record.version };
}

/** Shared fixture router used by the native runtime and typed renderer client. */
export const desktopFixtureRouter = os.router({
  remote: {
    probe: os.handler(async (): Promise<RemoteProbeEvidence> => {
      const baseUrl = new URL(requiredEnvironment(REMOTE_SERVICE_ENV));
      const response = await fetch(new URL('/probe', baseUrl));
      if (!response.ok) throw new Error(`Remote fixture returned HTTP ${response.status}.`);
      const payload: unknown = await response.json();
      if (payload === null || typeof payload !== 'object') {
        throw new TypeError('Remote fixture returned invalid JSON.');
      }
      const value = Reflect.get(payload, 'value');
      if (typeof value !== 'string') throw new TypeError('Remote fixture value is missing.');
      return { source: baseUrl.origin, value, version: FIXTURE_VERSION };
    }),
    acknowledge: os.handler(async ({ input }): Promise<RemoteProbeEvidence> => {
      const evidence = parseProbeEvidence(input);
      await Deno.writeTextFile(
        requiredEnvironment(RENDERER_EVIDENCE_ENV),
        `${JSON.stringify(evidence)}\n`,
      );
      return evidence;
    }),
  },
});
