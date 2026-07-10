import type { TelemetryQueryOptions, TelemetryQueryPort } from '../../ports/mod.ts';
import type {
  MetricQueryFilter,
  ResourceQueryFilter,
  TelemetryLog,
  TelemetryMetric,
  TelemetryOtlpJson,
  TelemetryResource,
  TelemetrySpan,
  TelemetryTrace,
  TraceQueryFilter,
} from '../../domain/query.ts';
import {
  appendFilterParams,
  groupSpans,
  isObject,
  normalizeLog,
  normalizeMetric,
  normalizeResource,
  normalizeSpan,
  normalizeTrace,
  selectItems,
} from './aspire-telemetry-normalize.ts';

/**
 * Options accepted by the Aspire telemetry query adapter.
 */
export interface AspireTelemetryQueryOptions extends TelemetryQueryOptions {
  /**
   * Base URL for the Aspire dashboard HTTP server.
   *
   * Defaults to `http://localhost:18888`; callers may pass a discovered
   * ephemeral dashboard URL from their AppHost launcher.
   */
  readonly endpoint?: string;
}

function normalizeEndpoint(endpoint: string | undefined): string {
  const base = endpoint ?? 'http://localhost:18888';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

/**
 * Telemetry query adapter backed by Aspire dashboard telemetry HTTP endpoints.
 *
 * The adapter wraps Aspire's `/api/telemetry/*` read endpoints and normalizes
 * JSON or NDJSON responses into the package-owned {@linkcode TelemetryQueryPort}
 * contract. Connection failures degrade to empty results so production or
 * `--no-aspire` runs can keep the read side wired without a local dashboard.
 */
export class AspireTelemetryQuery implements TelemetryQueryPort {
  readonly #endpoint: string;
  readonly #apiKey: string | undefined;
  readonly #fetch: typeof fetch;
  readonly #signal: AbortSignal | undefined;

  /**
   * Construct an Aspire-backed telemetry query adapter.
   *
   * @param options Dashboard endpoint, optional API key, fetch override, and signal.
   */
  constructor(options: AspireTelemetryQueryOptions = {}) {
    this.#endpoint = normalizeEndpoint(options.endpoint);
    this.#apiKey = options.apiKey;
    this.#fetch = options.fetch ?? fetch;
    this.#signal = options.signal;
  }

  /** Return traces matching the supplied filter. */
  async queryTraces(filter?: TraceQueryFilter): Promise<readonly TelemetryTrace[]> {
    const payload = await this.#request('traces', filter);
    const traces = selectItems(payload, ['traces', 'items'])
      .map(normalizeTrace)
      .filter((trace) => trace !== undefined);
    if (traces.length > 0) {
      return traces;
    }
    return groupSpans(
      selectItems(payload, ['spans', 'items'])
        .map(normalizeSpan)
        .filter((span) => span !== undefined),
    );
  }

  /** Return a single trace by identifier, or `undefined` when absent. */
  async getTrace(traceId: string): Promise<TelemetryTrace | undefined> {
    const payload = await this.#request(`traces/${encodeURIComponent(traceId)}`);
    const trace = normalizeTrace(payload);
    if (trace) {
      return trace;
    }
    const spans = selectItems(payload, ['spans', 'items'])
      .map(normalizeSpan)
      .filter((span) => span !== undefined);
    return groupSpans(spans).find((candidate) => candidate.traceId === traceId);
  }

  /** Return spans matching the supplied filter. */
  async querySpans(filter?: TraceQueryFilter): Promise<readonly TelemetrySpan[]> {
    const payload = await this.#request('spans', filter);
    return selectItems(payload, ['spans', 'items'])
      .map(normalizeSpan)
      .filter((span) => span !== undefined);
  }

  /** Return structured logs matching the supplied filter. */
  async queryLogs(filter?: TraceQueryFilter): Promise<readonly TelemetryLog[]> {
    const payload = await this.#request('logs', filter);
    return selectItems(payload, ['logs', 'items'])
      .map(normalizeLog)
      .filter((log) => log !== undefined);
  }

  /** Return metric streams matching the supplied filter. */
  async queryMetrics(filter?: MetricQueryFilter): Promise<readonly TelemetryMetric[]> {
    const payload = await this.#request('metrics', filter);
    return selectItems(payload, ['metrics', 'items'])
      .map(normalizeMetric)
      .filter((metric) => metric !== undefined);
  }

  /** Return resources matching the supplied filter. */
  async queryResources(filter?: ResourceQueryFilter): Promise<readonly TelemetryResource[]> {
    const payload = await this.#request('resources', filter);
    return selectItems(payload, ['resources', 'items'])
      .map(normalizeResource)
      .filter((resource) => resource !== undefined);
  }

  /** Export matching traces as portable OTLP JSON. */
  async exportTraces(filter?: TraceQueryFilter): Promise<TelemetryOtlpJson> {
    const payload = await this.#request('traces/export', filter);
    if (isObject(payload) && Array.isArray(Reflect.get(payload, 'resourceSpans'))) {
      return { resourceSpans: Reflect.get(payload, 'resourceSpans') };
    }
    return { resourceSpans: [] };
  }

  async #request(
    path: string,
    filter?: TraceQueryFilter | MetricQueryFilter | ResourceQueryFilter,
  ): Promise<unknown> {
    const url = new URL(`${this.#endpoint}/api/telemetry/${path}`);
    appendFilterParams(url.searchParams, filter);
    const headers = new Headers({ accept: 'application/json, application/x-ndjson' });
    if (this.#apiKey) {
      headers.set('x-api-key', this.#apiKey);
    }

    try {
      const response = await this.#fetch(url, { headers, signal: this.#signal });
      if (!response.ok) {
        return undefined;
      }
      const text = await response.text();
      if (text.trim().length === 0) {
        return undefined;
      }
      if (
        text.includes('\n') && !text.trimStart().startsWith('{') &&
        !text.trimStart().startsWith('[')
      ) {
        return text.split(/\r?\n/)
          .filter((line) => line.trim().length > 0)
          .map((line) => JSON.parse(line));
      }
      return JSON.parse(text);
    } catch {
      return undefined;
    }
  }
}

/**
 * Create an Aspire-backed telemetry query adapter.
 *
 * @param options Dashboard endpoint, optional API key, fetch override, and signal.
 * @returns A telemetry query port backed by Aspire dashboard telemetry endpoints.
 */
export function createAspireTelemetryQuery(
  options: AspireTelemetryQueryOptions = {},
): AspireTelemetryQuery {
  return new AspireTelemetryQuery(options);
}
