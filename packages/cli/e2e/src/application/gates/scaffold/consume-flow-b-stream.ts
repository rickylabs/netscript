import { createStreamsInstrumentation } from '@netscript/plugin-streams-core/telemetry';
import { SpanStatusCode, trace } from 'npm:@opentelemetry/api@^1.9.0';
import {
  BasicTracerProvider,
  type ReadableSpan,
  SimpleSpanProcessor,
  type SpanExporter,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import { createTelemetryProvider, type SdkLoader } from '@netscript/telemetry/otel';

const projectRoot = Deno.args[0];
if (!projectRoot) throw new Error('project root argument is required');

const metadataText = await Deno.readTextFile(
  `${projectRoot}/.netscript/e2e/aspire-start.json`,
);
const metadata = JSON.parse(metadataText);
if (!isRecord(metadata) || typeof metadata.logFile !== 'string') {
  throw new Error('Aspire start metadata did not contain logFile');
}
const logText = await Deno.readTextFile(metadata.logFile);
const endpoints = [...logText.matchAll(/OTLP\/HTTP:\s+(https?:\/\/\S+)/g)];
const endpoint = endpoints.at(-1)?.[1];
if (!endpoint) throw new Error('Aspire OTLP/HTTP endpoint was not found');

const provider = createTelemetryProvider({
  providerId: 'otel-sdk',
  options: { endpoint, serviceName: 'flow-b-stream-consumer' },
  loadSdk: createFlowBSdkLoader(endpoint),
});
await provider.register();

try {
  const flowBCorrelationId = await readJobExecuteCorrelation(metadata.dashboardUrl);
  const streamUrl = 'http://127.0.0.1:4437/v1/stream/netscript/workers/executions';
  let response = await fetch(
    `${streamUrl}?offset=-1`,
    {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (response.status === 404) {
    const traceId = randomHex(16);
    const spanId = randomHex(8);
    const createResponse = await fetch(streamUrl, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'execution',
        key: 'flow-b-e2e',
        value: { correlationId: 'flow-b-e2e' },
        headers: {
          operation: 'upsert',
          traceparent: `00-${traceId}-${spanId}-01`,
        },
      }),
    });
    if (!createResponse.ok && createResponse.status !== 409) {
      throw new Error(`workers stream create failed: HTTP ${createResponse.status}`);
    }
    response = await fetch(`${streamUrl}?offset=-1`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    });
  }
  if (!response.ok) throw new Error(`workers stream read failed: HTTP ${response.status}`);
  const payload: unknown = await response.json();

  const messages = collectMessages(payload);
  if (messages.length === 0) {
    throw new Error('real workers stream contained no trace-bearing execution messages');
  }
  const span = createStreamsInstrumentation().startSubscribeSpan({
    streamPath: '/workers/executions',
    collection: 'execution',
    operation: 'fan-in',
    messages,
  });
  span.setAttribute('netscript.correlation.id', flowBCorrelationId);
  span.setAttribute('netscript.stream.outcome', 'success');
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
  await provider.forceFlush?.();
  console.info(`Flow-B real stream consumer linked ${messages.length} message(s)`);
} finally {
  await provider.shutdown?.();
}

async function readJobExecuteCorrelation(dashboardUrl: unknown): Promise<string> {
  if (typeof dashboardUrl !== 'string') {
    throw new Error('Aspire start metadata did not contain dashboardUrl');
  }
  const tracesUrl = new URL('/api/telemetry/traces', dashboardUrl);
  for (let attempt = 1; attempt <= 20; attempt++) {
    const response = await fetch(tracesUrl);
    if (!response.ok) throw new Error(`Dashboard traces read failed: HTTP ${response.status}`);
    const correlationId = findJobExecuteCorrelation(await response.json());
    if (correlationId) return correlationId;
    if (attempt < 20) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('job.execute telemetry did not expose netscript.correlation.id');
}

function findJobExecuteCorrelation(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findJobExecuteCorrelation(item);
      if (found) return found;
    }
    return undefined;
  }
  if (!isRecord(value)) return undefined;
  if (value.name === 'job.execute' && Array.isArray(value.attributes)) {
    const attributes = value.attributes;
    const jobId = attributeString(attributes, ['netscript.job.id', 'job.id']);
    const correlationId = attributeString(attributes, ['netscript.correlation.id']);
    if (jobId === 'flow-b-callback' && correlationId) return correlationId;
  }
  for (const child of Object.values(value)) {
    const found = findJobExecuteCorrelation(child);
    if (found) return found;
  }
  return undefined;
}

function attributeString(
  attributes: readonly unknown[],
  keys: readonly string[],
): string | undefined {
  for (const attribute of attributes) {
    if (
      !isRecord(attribute) || !keys.includes(String(attribute.key)) ||
      !isRecord(attribute.value)
    ) continue;
    if (typeof attribute.value.stringValue === 'string') return attribute.value.stringValue;
  }
  return undefined;
}

function collectMessages(value: unknown): Array<{
  traceparent: string;
  tracestate?: string;
  streamPath: string;
  collection?: string;
  operation?: string;
  messageId?: string;
  correlationId?: string;
}> {
  const messages: Array<{
    traceparent: string;
    tracestate?: string;
    streamPath: string;
    collection?: string;
    operation?: string;
    messageId?: string;
    correlationId?: string;
  }> = [];
  visit(value, messages);
  return messages;
}

function visit(value: unknown, messages: ReturnType<typeof collectMessages>): void {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, messages);
    return;
  }
  if (!isRecord(value)) return;
  const headers = isRecord(value.headers) ? value.headers : undefined;
  const traceparent = headers?.traceparent;
  if (typeof traceparent === 'string') {
    const nestedValue = isRecord(value.value) ? value.value : undefined;
    messages.push({
      traceparent,
      tracestate: typeof headers?.tracestate === 'string' ? headers.tracestate : undefined,
      streamPath: '/workers/executions',
      collection: typeof value.type === 'string' ? value.type : undefined,
      operation: typeof headers?.operation === 'string' ? headers.operation : undefined,
      messageId: typeof value.key === 'string' ? value.key : undefined,
      correlationId: typeof nestedValue?.correlationId === 'string'
        ? nestedValue.correlationId
        : undefined,
    });
  }
  for (const child of Object.values(value)) visit(child, messages);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function randomHex(byteLength: number): string {
  return [...crypto.getRandomValues(new Uint8Array(byteLength))]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

function createFlowBSdkLoader(endpoint: string): SdkLoader {
  return () => {
    const exporter = createOtlpJsonSpanExporter(endpoint);
    const processor = new SimpleSpanProcessor(exporter);
    const tracerProvider = new BasicTracerProvider({ spanProcessors: [processor] });
    return Promise.resolve({
      tracerProvider: {
        register: () => {
          trace.setGlobalTracerProvider(tracerProvider);
        },
        forceFlush: () => tracerProvider.forceFlush(),
        shutdown: () => tracerProvider.shutdown(),
      },
      meterProvider: {
        forceFlush: () => Promise.resolve(),
        shutdown: () => Promise.resolve(),
      },
    });
  };
}

function createOtlpJsonSpanExporter(endpoint: string): SpanExporter {
  const normalizedEndpoint = endpoint.replace(/\/$/, '');
  return {
    export(spans: ReadableSpan[], resultCallback: (result: { code: number }) => void): void {
      const body = {
        resourceSpans: [{
          resource: {
            attributes: [{ key: 'service.name', value: { stringValue: 'flow-b-stream-consumer' } }],
          },
          scopeSpans: [{
            scope: { name: 'netscript.streams' },
            spans: spans.map(toOtlpSpan),
          }],
        }],
      };
      fetch(`${normalizedEndpoint}/v1/traces`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      }).then((response) => resultCallback({ code: response.ok ? 0 : 1 }))
        .catch(() => resultCallback({ code: 1 }));
    },
    shutdown: () => Promise.resolve(),
  };
}

function toOtlpSpan(span: ReadableSpan): Record<string, unknown> {
  return {
    traceId: span.spanContext().traceId,
    spanId: span.spanContext().spanId,
    parentSpanId: span.parentSpanContext?.spanId,
    name: span.name,
    kind: span.kind,
    startTimeUnixNano: hrTimeToNanoseconds(span.startTime),
    endTimeUnixNano: hrTimeToNanoseconds(span.endTime),
    attributes: toOtlpAttributes(span.attributes),
    status: { code: span.status.code },
    links: span.links.map((link) => ({
      traceId: link.context.traceId,
      spanId: link.context.spanId,
      attributes: toOtlpAttributes(link.attributes ?? {}),
    })),
  };
}

function hrTimeToNanoseconds(time: readonly [number, number]): string {
  return (BigInt(time[0]) * 1_000_000_000n + BigInt(time[1])).toString();
}

function toOtlpAttributes(
  attributes: Readonly<Record<string, unknown>>,
): Array<{ key: string; value: Record<string, unknown> }> {
  const result: Array<{ key: string; value: Record<string, unknown> }> = [];
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === 'string') result.push({ key, value: { stringValue: value } });
    else if (typeof value === 'boolean') result.push({ key, value: { boolValue: value } });
    else if (typeof value === 'number') result.push({ key, value: { doubleValue: value } });
  }
  return result;
}
