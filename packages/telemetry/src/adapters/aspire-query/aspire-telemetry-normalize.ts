import type {
  MetricQueryFilter,
  ResourceQueryFilter,
  TelemetryAttributeValue,
  TelemetryLog,
  TelemetryMetric,
  TelemetryMetricPoint,
  TelemetryResource,
  TelemetrySpan,
  TelemetrySpanEvent,
  TelemetrySpanKind,
  TelemetrySpanLink,
  TelemetryTrace,
  TraceQueryFilter,
} from '../../domain/query.ts';

function readString(source: object, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = Reflect.get(source, key);
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function readNumber(source: object, keys: readonly string[]): number | undefined {
  for (const key of keys) {
    const value = Reflect.get(source, key);
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
}

function readObject(source: object, keys: readonly string[]): object | undefined {
  for (const key of keys) {
    const value = Reflect.get(source, key);
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value;
    }
  }
  return undefined;
}

function readArray(source: object, keys: readonly string[]): readonly unknown[] {
  for (const key of keys) {
    const value = Reflect.get(source, key);
    if (Array.isArray(value)) {
      return value;
    }
  }
  return [];
}

/** Report whether `value` is a non-array object. */
export function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toUnixMs(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 10_000_000_000 ? Math.round(value / 1_000_000) : value;
  }
  if (typeof value === 'string' && value.length > 0) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric > 10_000_000_000 ? Math.round(numeric / 1_000_000) : numeric;
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function normalizeAttributeValue(value: unknown): TelemetryAttributeValue | undefined {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (isObject(value)) {
    const stringValue = readString(value, ['stringValue', 'value']);
    if (stringValue !== undefined) {
      return stringValue;
    }
    const numberValue = readNumber(value, ['intValue', 'doubleValue']);
    if (numberValue !== undefined) {
      return numberValue;
    }
    const boolValue = Reflect.get(value, 'boolValue');
    if (typeof boolValue === 'boolean') {
      return boolValue;
    }
  }
  return undefined;
}

function normalizeAttributes(value: unknown): Readonly<Record<string, TelemetryAttributeValue>> {
  const attributes: Record<string, TelemetryAttributeValue> = {};

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!isObject(entry)) {
        continue;
      }
      const key = readString(entry, ['key', 'name']);
      if (!key) {
        continue;
      }
      const normalized = normalizeAttributeValue(Reflect.get(entry, 'value'));
      if (normalized !== undefined) {
        attributes[key] = normalized;
      }
    }
    return attributes;
  }

  if (isObject(value)) {
    for (const [key, rawValue] of Object.entries(value)) {
      const normalized = normalizeAttributeValue(rawValue);
      if (normalized !== undefined) {
        attributes[key] = normalized;
      }
    }
  }

  return attributes;
}

function normalizeKind(value: unknown): TelemetrySpanKind {
  if (typeof value === 'string') {
    const lowered = value.toLowerCase().replace(/^span_kind_/, '');
    if (
      lowered === 'server' ||
      lowered === 'client' ||
      lowered === 'producer' ||
      lowered === 'consumer'
    ) {
      return lowered;
    }
  }
  // OpenTelemetry SpanKind numeric values reserve 0 for unspecified and use
  // 1–5 for internal, server, client, producer, and consumer respectively.
  if (value === 2) return 'server';
  if (value === 3) return 'client';
  if (value === 4) return 'producer';
  if (value === 5) return 'consumer';
  return 'internal';
}

function normalizeStatusCode(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (lowered === 'ok') return 1;
    if (lowered === 'error') return 2;
  }
  return 0;
}

function normalizeSpanEvent(value: unknown): TelemetrySpanEvent | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  const name = readString(value, ['name', 'eventName']);
  const timeUnixMs = toUnixMs(
    Reflect.get(value, 'timeUnixNano') ?? Reflect.get(value, 'timestamp') ??
      Reflect.get(value, 'timeUnixMs'),
  );
  if (!name || timeUnixMs === undefined) {
    return undefined;
  }
  return {
    name,
    timeUnixMs,
    attributes: normalizeAttributes(Reflect.get(value, 'attributes')),
  };
}

function normalizeSpanLink(value: unknown): TelemetrySpanLink | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  const traceId = readString(value, ['traceId', 'trace_id']);
  const spanId = readString(value, ['spanId', 'span_id']);
  if (!traceId || !spanId) {
    return undefined;
  }
  return {
    traceId,
    spanId,
    attributes: normalizeAttributes(Reflect.get(value, 'attributes')),
  };
}

/** Normalize one backend span object into the telemetry query contract. */
export function normalizeSpan(value: unknown): TelemetrySpan | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  const traceId = readString(value, ['traceId', 'trace_id']);
  const spanId = readString(value, ['spanId', 'span_id', 'id']);
  const name = readString(value, ['name', 'spanName']);
  const startTimeUnixMs = toUnixMs(
    Reflect.get(value, 'startTimeUnixNano') ?? Reflect.get(value, 'startTime') ??
      Reflect.get(value, 'startTimeUnixMs'),
  );
  if (!traceId || !spanId || !name || startTimeUnixMs === undefined) {
    return undefined;
  }

  const status = readObject(value, ['status']);
  const events = readArray(value, ['events']).map(normalizeSpanEvent)
    .filter((event) => event !== undefined);
  const links = readArray(value, ['links']).map(normalizeSpanLink)
    .filter((link) => link !== undefined);

  return {
    traceId,
    spanId,
    parentSpanId: readString(value, ['parentSpanId', 'parent_span_id']),
    name,
    kind: normalizeKind(Reflect.get(value, 'kind')),
    startTimeUnixMs,
    endTimeUnixMs: toUnixMs(
      Reflect.get(value, 'endTimeUnixNano') ?? Reflect.get(value, 'endTime') ??
        Reflect.get(value, 'endTimeUnixMs'),
    ),
    statusCode: status
      ? normalizeStatusCode(Reflect.get(status, 'code'))
      : normalizeStatusCode(Reflect.get(value, 'statusCode')),
    statusMessage: status ? readString(status, ['message']) : readString(value, ['statusMessage']),
    attributes: normalizeAttributes(Reflect.get(value, 'attributes')),
    events,
    links,
  };
}

/** Normalize one backend trace object into the telemetry query contract. */
export function normalizeTrace(value: unknown): TelemetryTrace | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  const traceId = readString(value, ['traceId', 'trace_id', 'id']);
  const spans = readArray(value, ['spans', 'scopeSpans'])
    .flatMap((entry) => isObject(entry) ? readArray(entry, ['spans']) : [entry])
    .map(normalizeSpan)
    .filter((span) => span !== undefined)
    .sort((left, right) => left.startTimeUnixMs - right.startTimeUnixMs);

  const resolvedTraceId = traceId ?? spans[0]?.traceId;
  return resolvedTraceId ? { traceId: resolvedTraceId, spans } : undefined;
}

/** Group flat spans into trace records keyed by trace id. */
export function groupSpans(spans: readonly TelemetrySpan[]): readonly TelemetryTrace[] {
  const grouped = new Map<string, TelemetrySpan[]>();
  for (const span of spans) {
    const current = grouped.get(span.traceId) ?? [];
    current.push(span);
    grouped.set(span.traceId, current);
  }
  return [...grouped.entries()].map(([traceId, traceSpans]) => ({
    traceId,
    spans: traceSpans.sort((left, right) => left.startTimeUnixMs - right.startTimeUnixMs),
  }));
}

/** Normalize one backend log object into the telemetry query contract. */
export function normalizeLog(value: unknown): TelemetryLog | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  const timeUnixMs = toUnixMs(
    Reflect.get(value, 'timeUnixNano') ?? Reflect.get(value, 'timestamp') ??
      Reflect.get(value, 'timeUnixMs'),
  );
  if (timeUnixMs === undefined) {
    return undefined;
  }
  return {
    timeUnixMs,
    severity: readString(value, ['severity', 'severityText', 'level']) ?? 'INFO',
    body: readString(value, ['body', 'message']) ?? '',
    traceId: readString(value, ['traceId', 'trace_id']),
    spanId: readString(value, ['spanId', 'span_id']),
    attributes: normalizeAttributes(Reflect.get(value, 'attributes')),
  };
}

/** Normalize one backend resource object into the telemetry query contract. */
export function normalizeResource(value: unknown): TelemetryResource | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  const attributes = normalizeAttributes(
    Reflect.get(value, 'attributes') ?? Reflect.get(value, 'resourceAttributes'),
  );
  const serviceName = readString(value, ['serviceName', 'service.name', 'name']) ??
    String(attributes['service.name'] ?? '');
  if (serviceName.length === 0) {
    return undefined;
  }
  return {
    serviceName,
    serviceInstanceId:
      readString(value, ['serviceInstanceId', 'service.instance.id', 'instanceId']) ??
        (typeof attributes['service.instance.id'] === 'string'
          ? attributes['service.instance.id']
          : undefined),
    attributes,
  };
}

function normalizeMetricPoint(value: unknown): TelemetryMetricPoint | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  const timeUnixMs = toUnixMs(
    Reflect.get(value, 'timeUnixNano') ?? Reflect.get(value, 'timestamp') ??
      Reflect.get(value, 'timeUnixMs'),
  );
  const metricValue = readNumber(value, ['value', 'sum', 'count']);
  if (timeUnixMs === undefined || metricValue === undefined) {
    return undefined;
  }
  return {
    timeUnixMs,
    value: metricValue,
    attributes: normalizeAttributes(Reflect.get(value, 'attributes')),
  };
}

/** Normalize one backend metric object into the telemetry query contract. */
export function normalizeMetric(value: unknown): TelemetryMetric | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  const name = readString(value, ['name', 'metricName']);
  if (!name) {
    return undefined;
  }
  const typeText = readString(value, ['type', 'kind']) ?? 'gauge';
  const type = typeText === 'counter' || typeText === 'histogram' ? typeText : 'gauge';
  const points = readArray(value, ['points', 'dataPoints'])
    .map(normalizeMetricPoint)
    .filter((point) => point !== undefined);
  return {
    name,
    type,
    unit: readString(value, ['unit']),
    description: readString(value, ['description']),
    resource: normalizeResource(Reflect.get(value, 'resource')),
    points,
  };
}

/** Select a backend result array from a wrapped payload. */
export function selectItems(value: unknown, keys: readonly string[]): readonly unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (!isObject(value)) {
    return [];
  }
  const envelope = Reflect.get(value, 'data');
  const source = isObject(envelope) || Array.isArray(envelope) ? envelope : value;
  if (Array.isArray(source)) {
    return source;
  }
  for (const key of keys) {
    const nested = Reflect.get(source, key);
    if (Array.isArray(nested)) {
      return nested;
    }
  }
  return [source];
}

/** Unwrap the Aspire Dashboard's `{ data: ... }` response envelope. */
export function unwrapData(value: unknown): unknown {
  if (!isObject(value)) {
    return value;
  }
  const data = Reflect.get(value, 'data');
  return isObject(data) || Array.isArray(data) ? data : value;
}

/**
 * Select spans from flat responses or Aspire Dashboard OTLP resource/scope nesting.
 *
 * Resource attributes are prepended to each span so normalized spans retain the
 * service identity required by downstream query consumers. Span attributes come
 * last and therefore win if the same key appears at both levels.
 */
export function selectSpans(value: unknown): readonly unknown[] {
  const source = unwrapData(value);
  if (Array.isArray(source)) {
    return source;
  }
  if (!isObject(source)) {
    return [];
  }

  const resourceSpans = Reflect.get(source, 'resourceSpans');
  if (!Array.isArray(resourceSpans)) {
    return selectItems(source, ['spans', 'items']);
  }

  const spans: unknown[] = [];
  for (const resourceEntry of resourceSpans) {
    if (!isObject(resourceEntry)) {
      continue;
    }
    const resource = readObject(resourceEntry, ['resource']);
    const resourceAttributes = resource ? readArray(resource, ['attributes']) : [];
    for (const scopeEntry of readArray(resourceEntry, ['scopeSpans'])) {
      if (!isObject(scopeEntry)) {
        continue;
      }
      for (const span of readArray(scopeEntry, ['spans'])) {
        if (!isObject(span)) {
          continue;
        }
        spans.push({
          ...span,
          attributes: [
            ...resourceAttributes,
            ...readArray(span, ['attributes']),
          ],
        });
      }
    }
  }
  return spans;
}

/** Append query parameters shared by Aspire telemetry endpoints. */
export function appendFilterParams(
  params: URLSearchParams,
  filter: TraceQueryFilter | MetricQueryFilter | ResourceQueryFilter | undefined,
): void {
  if (!filter) {
    return;
  }
  const resource = filter.resource ?? filter.serviceName;
  if (resource) {
    params.set('resource', resource);
  }
  if ('sinceUnixMs' in filter && filter.sinceUnixMs !== undefined) {
    params.set('since', new Date(filter.sinceUnixMs).toISOString());
  }
  if ('limit' in filter && filter.limit !== undefined) {
    params.set('limit', String(filter.limit));
  }
  if ('follow' in filter && filter.follow !== undefined) {
    params.set('follow', filter.follow ? 'true' : 'false');
  }
  if ('metricName' in filter && filter.metricName) {
    params.set('metric', filter.metricName);
  }
}
