import type { TelemetryProbePort, TelemetryProbeResult } from '../domain/telemetry-probe-port.ts';

/** Fetch-backed short-timeout telemetry reachability adapter. */
export class FetchTelemetryProbe implements TelemetryProbePort {
  readonly #resolveFetch: (endpoint: string) => typeof fetch;
  readonly #timeoutMs: number;
  constructor(
    resolveFetch: (endpoint: string) => typeof fetch = () => fetch,
    timeoutMs = 1500,
  ) {
    this.#resolveFetch = resolveFetch;
    this.#timeoutMs = timeoutMs;
  }
  async probe(endpoint: string): Promise<TelemetryProbeResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);
    try {
      const response = await this.#resolveFetch(endpoint)(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
      });
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
