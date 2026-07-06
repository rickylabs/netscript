/**
 * Telemetry query read-model for {@linkcode @netscript/telemetry}.
 *
 * Backs the `@netscript/telemetry/query` subpath. The concrete reader that
 * talks to a telemetry backend (the Aspire dashboard's structured store over
 * HTTP) lands in a later slice; this module ships the stable query contract and
 * a scaffold factory so consumers can code against the surface now.
 *
 * @module
 */

import type {
  ResourceQueryFilter,
  TelemetryResource,
  TelemetryTrace,
  TraceQueryFilter,
} from './types.ts';

export * from './types.ts';

/**
 * Error thrown when a scaffold telemetry query is invoked before a backend
 * reader has been wired.
 */
export class TelemetryQueryNotConfiguredError extends Error {
  constructor() {
    super(
      'Telemetry query backend is not configured; the query reader is a ' +
        'scaffold and lands in a later telemetry slice.',
    );
    this.name = 'TelemetryQueryNotConfiguredError';
  }
}

/**
 * Read-side contract for querying emitted telemetry from a backend.
 */
export interface TelemetryQuery {
  /**
   * Return traces matching the supplied filter.
   *
   * @param filter Optional trace-query filter.
   */
  queryTraces(filter?: TraceQueryFilter): Promise<readonly TelemetryTrace[]>;
  /**
   * Return a single trace by identifier, or `undefined` when absent.
   *
   * @param traceId Trace identifier to look up.
   */
  getTrace(traceId: string): Promise<TelemetryTrace | undefined>;
  /**
   * Return resources (service instances) matching the supplied filter.
   *
   * @param filter Optional resource-query filter.
   */
  queryResources(filter?: ResourceQueryFilter): Promise<readonly TelemetryResource[]>;
}

/**
 * Options for constructing a {@linkcode TelemetryQuery}.
 */
export interface TelemetryQueryOptions {
  /** Base URL of the telemetry backend's query API. */
  readonly endpoint?: string;
}

/**
 * Create a telemetry query reader.
 *
 * This is a scaffold: until the backend reader lands, every method rejects with
 * {@linkcode TelemetryQueryNotConfiguredError}. The signature is stable so
 * consumers can depend on it now.
 *
 * @param _options Query construction options (reserved for the backend reader).
 * @returns A {@linkcode TelemetryQuery} whose methods reject until configured.
 */
export function createTelemetryQuery(_options: TelemetryQueryOptions = {}): TelemetryQuery {
  return {
    queryTraces: () => Promise.reject(new TelemetryQueryNotConfiguredError()),
    getTrace: () => Promise.reject(new TelemetryQueryNotConfiguredError()),
    queryResources: () => Promise.reject(new TelemetryQueryNotConfiguredError()),
  };
}
