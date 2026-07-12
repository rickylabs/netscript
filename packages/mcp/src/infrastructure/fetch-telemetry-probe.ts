import type { TelemetryProbePort, TelemetryProbeResult } from '../domain/telemetry-probe-port.ts';

/** Fetch-backed short-timeout telemetry reachability adapter. */
export class FetchTelemetryProbe implements TelemetryProbePort {
  readonly #fetch: typeof fetch;
  readonly #timeoutMs: number;
  constructor(fetcher: typeof fetch = fetch, timeoutMs = 1500) {
    this.#fetch = fetcher;
    this.#timeoutMs = timeoutMs;
  }
  async probe(endpoint: string): Promise<TelemetryProbeResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);
    try {
      const response = await this.#fetch(endpoint, { method: 'HEAD', signal: controller.signal });
      return {
        reachable: true,
        status: response.status,
        message: `Telemetry endpoint responded with HTTP ${response.status}.`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { reachable: false, message: `Telemetry endpoint is unreachable: ${message}` };
    } finally {
      clearTimeout(timeout);
    }
  }
}

/** Resolve telemetry endpoint precedence without exposing environment values in results. */
export function readTelemetryEndpointEnvironment(): string | undefined {
  return Deno.env.get('NETSCRIPT_TELEMETRY_ENDPOINT');
}
