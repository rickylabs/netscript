import { AspireTelemetryQuery, type TelemetryQueryPort } from '@netscript/telemetry/query';

/**
 * Creates the suite's shared telemetry reader from Aspire start metadata.
 *
 * The detached/non-TTY AppHost writes its reachable dashboard URL to
 * `.netscript/e2e/aspire-start.json`; CLI `aspire otel` discovery is not
 * reliable for that lifecycle. The fetch adapter normalizes the dashboard's
 * OTLP envelopes into the package-owned telemetry query contract.
 */
export async function createLiveAspireTelemetryQuery(
  projectRoot: string,
): Promise<TelemetryQueryPort> {
  const metadata = await readObject(`${projectRoot}/.netscript/e2e/aspire-start.json`);
  if (typeof metadata.dashboardUrl !== 'string') {
    throw new Error('Aspire start metadata did not contain dashboardUrl');
  }
  return new AspireTelemetryQuery({
    endpoint: new URL(metadata.dashboardUrl).origin,
    fetch: createLiveAspireFetch(fetch),
  });
}

/** Normalize live Aspire Dashboard trace and log OTLP envelopes for the shared query adapter. */
export function createLiveAspireFetch(liveFetch: typeof fetch): typeof fetch {
  return async (input, init) => {
    const response = await liveFetch(input, init);
    if (!response.ok) return response;

    const path = requestPath(input);
    if (!path.endsWith('/traces') && !path.endsWith('/logs')) return response;

    const payload: unknown = await response.json();
    return path.endsWith('/traces')
      ? Response.json({ spans: flattenOtlpSpans(payload) })
      : Response.json({ logs: flattenOtlpLogs(payload) });
  };
}

function requestPath(input: RequestInfo | URL): string {
  const value = input instanceof Request ? input.url : String(input);
  return new URL(value).pathname;
}

function flattenOtlpSpans(payload: unknown): unknown[] {
  const flattened: unknown[] = [];
  visitResourceSpans(payload, flattened);
  return flattened;
}

function visitResourceSpans(value: unknown, flattened: unknown[]): void {
  if (Array.isArray(value)) {
    for (const item of value) visitResourceSpans(item, flattened);
    return;
  }
  if (!isRecord(value)) return;
  if (Array.isArray(value.resourceSpans)) {
    for (const resourceSpan of value.resourceSpans) flattenResourceSpan(resourceSpan, flattened);
    return;
  }
  for (const child of Object.values(value)) visitResourceSpans(child, flattened);
}

function flattenResourceSpan(value: unknown, flattened: unknown[]): void {
  if (!isRecord(value)) return;
  const resource = isRecord(value.resource) ? value.resource : {};
  const resourceAttributes = Array.isArray(resource.attributes) ? resource.attributes : [];
  const serviceName = attributeString(resourceAttributes, 'service.name') ?? 'unknown';
  const scopeSpans = Array.isArray(value.scopeSpans) ? value.scopeSpans : [];
  for (const scope of scopeSpans) {
    if (!isRecord(scope) || !Array.isArray(scope.spans)) continue;
    for (const span of scope.spans) {
      if (!isRecord(span)) continue;
      const attributes = Array.isArray(span.attributes) ? [...span.attributes] : [];
      attributes.push({ key: 'service.name', value: { stringValue: serviceName } });
      flattened.push({ ...span, kind: normalizeOtlpKind(span.kind), attributes });
    }
  }
}

function flattenOtlpLogs(payload: unknown): unknown[] {
  const flattened: unknown[] = [];
  visitResourceLogs(payload, flattened);
  return flattened;
}

function visitResourceLogs(value: unknown, flattened: unknown[]): void {
  if (Array.isArray(value)) {
    for (const item of value) visitResourceLogs(item, flattened);
    return;
  }
  if (!isRecord(value)) return;
  if (Array.isArray(value.resourceLogs)) {
    for (const resourceLog of value.resourceLogs) flattenResourceLog(resourceLog, flattened);
    return;
  }
  for (const child of Object.values(value)) visitResourceLogs(child, flattened);
}

function flattenResourceLog(value: unknown, flattened: unknown[]): void {
  if (!isRecord(value)) return;
  const resource = isRecord(value.resource) ? value.resource : {};
  const resourceAttributes = Array.isArray(resource.attributes) ? resource.attributes : [];
  const serviceName = attributeString(resourceAttributes, 'service.name') ?? 'unknown';
  const scopeLogs = Array.isArray(value.scopeLogs) ? value.scopeLogs : [];
  for (const scope of scopeLogs) {
    if (!isRecord(scope) || !Array.isArray(scope.logRecords)) continue;
    for (const log of scope.logRecords) {
      if (!isRecord(log)) continue;
      const attributes = Array.isArray(log.attributes) ? [...log.attributes] : [];
      attributes.push({ key: 'service.name', value: { stringValue: serviceName } });
      flattened.push({ ...log, body: otlpString(log.body), attributes });
    }
  }
}

function normalizeOtlpKind(value: unknown): unknown {
  if (value === 1) return 'internal';
  if (value === 2) return 'server';
  if (value === 3) return 'client';
  if (value === 4) return 'producer';
  if (value === 5) return 'consumer';
  return value;
}

function attributeString(attributes: readonly unknown[], key: string): string | undefined {
  for (const attribute of attributes) {
    if (!isRecord(attribute) || attribute.key !== key || !isRecord(attribute.value)) continue;
    if (typeof attribute.value.stringValue === 'string') return attribute.value.stringValue;
  }
  return undefined;
}

function otlpString(value: unknown): unknown {
  return isRecord(value) && typeof value.stringValue === 'string' ? value.stringValue : value;
}

async function readObject(path: string): Promise<Record<string, unknown>> {
  const value: unknown = JSON.parse(await Deno.readTextFile(path));
  if (!isRecord(value)) throw new Error(`${path} did not contain an object`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
