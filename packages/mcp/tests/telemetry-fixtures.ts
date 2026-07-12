import type {
  TelemetryLog,
  TelemetryQueryPort,
  TelemetryResource,
  TelemetrySpan,
  TelemetryTrace,
} from '@netscript/telemetry/query';

export function span(overrides: Partial<TelemetrySpan> = {}): TelemetrySpan {
  return {
    traceId: 'trace-1',
    spanId: crypto.randomUUID(),
    name: 'operation',
    kind: 'internal',
    startTimeUnixMs: 100,
    endTimeUnixMs: 120,
    statusCode: 1,
    attributes: {},
    events: [],
    links: [],
    ...overrides,
  };
}
export function log(overrides: Partial<TelemetryLog> = {}): TelemetryLog {
  return { timeUnixMs: 100, severity: 'INFO', body: 'message', attributes: {}, ...overrides };
}

export class FakeTelemetryQuery implements TelemetryQueryPort {
  constructor(
    readonly spans: readonly TelemetrySpan[] = [],
    readonly logs: readonly TelemetryLog[] = [],
    readonly resources: readonly TelemetryResource[] = [],
  ) {}
  querySpans(): Promise<readonly TelemetrySpan[]> {
    return Promise.resolve(this.spans);
  }
  queryLogs(): Promise<readonly TelemetryLog[]> {
    return Promise.resolve(this.logs);
  }
  queryResources(): Promise<readonly TelemetryResource[]> {
    return Promise.resolve(this.resources);
  }
  queryTraces(): Promise<readonly TelemetryTrace[]> {
    return Promise.resolve([]);
  }
  getTrace(traceId: string): Promise<TelemetryTrace | undefined> {
    const spans = this.spans.filter((value) => value.traceId === traceId);
    return Promise.resolve(spans.length ? { traceId, spans } : undefined);
  }
  queryMetrics(): Promise<readonly never[]> {
    return Promise.resolve([]);
  }
  exportTraces(): Promise<{ readonly resourceSpans: readonly unknown[] }> {
    return Promise.resolve({ resourceSpans: [] });
  }
}
