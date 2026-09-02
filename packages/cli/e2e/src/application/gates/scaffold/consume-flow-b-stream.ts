import { createStreamsInstrumentation } from '@netscript/plugin-streams-core/telemetry';
import {
  bindStreamEventSourceV1,
  createStreamSseReplayStateV1,
  parseStreamSseEventV1,
  type StreamSseChangeV1,
  type StreamSseConsumerEventV1,
  type StreamSseReplayStateV1,
} from '@netscript/plugin-streams-core/sse';
import { SpanStatusCode, trace } from 'npm:@opentelemetry/api@^1.9.0';
import {
  BasicTracerProvider,
  type ReadableSpan,
  SimpleSpanProcessor,
  type SpanExporter,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import { createTelemetryProvider, type SdkLoader } from '@netscript/telemetry/otel';
import {
  createLiveAspireTelemetryQuery,
  findJobExecuteIdentity,
} from './aspire-dashboard-telemetry.ts';
import { runDocumentedStreamExample } from './run-documented-stream-example.ts';
import {
  type FlowBProducerIdentity,
  selectFlowBStreamChange,
  streamChangeCorrelationId,
} from './select-flow-b-stream-change.ts';
import { resolveResourceUrlsFromAppHost } from './generated-app-endpoint.ts';
import { resolveOtlpHeadersFromResource } from './otlp-headers.ts';

const FLOW_B_SELECTION_MAX_BATCHES = 40;
const FLOW_B_SELECTION_TIMEOUT_MS = 20_000;
const FLOW_B_SELECTION_RETRY_DELAY_MS = 500;

const projectRoot = Deno.args[0];
if (!projectRoot) throw new Error('project root argument is required');
const appHost = Deno.args[1];
if (!appHost) throw new Error('apphost argument is required');

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

// The consumer's own exporting tracer provider, captured by `createFlowBSdkLoader` during
// `provider.register()` below. Must be declared before that top-level await executes.
let flowBTracerProvider: BasicTracerProvider | undefined;

// The dashboard runs with anonymous access disabled (the MCP smoke needs the dashboard API
// key), so its OTLP receiver rejects unauthenticated exports with HTTP 401 — exactly what the
// hosted `c6ec50214` run reported. The AppHost hands every resource the ingest key as
// `OTEL_EXPORTER_OTLP_HEADERS=x-otlp-api-key=…`; the consumer is not a resource, so it borrows
// the key from the process the AppHost started for the `streams` resource it consumes from.
const otlpHeaders = await resolveOtlpHeadersFromResource(
  projectRoot,
  'streams',
  'flow-b-stream-consumer',
);

const provider = createTelemetryProvider({
  providerId: 'otel-sdk',
  options: { endpoint, serviceName: 'flow-b-stream-consumer' },
  loadSdk: createFlowBSdkLoader(endpoint, otlpHeaders),
});
await provider.register();

try {
  const flowBProducer = await readJobExecuteIdentity(projectRoot);
  const streamBaseUrl = firstResourceUrl(
    await resolveResourceUrlsFromAppHost(appHost, 'streams'),
    'streams',
  );
  const streamUrl = new URL(
    '/v1/stream/netscript/workers/executions',
    streamBaseUrl,
  ).toString();
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
  await response.body?.cancel();

  const selected = await selectFlowBStreamChange(
    flowBProducer,
    createStreamSseReplayStateV1(),
    {
      maxBatches: FLOW_B_SELECTION_MAX_BATCHES,
      timeoutMs: FLOW_B_SELECTION_TIMEOUT_MS,
      retryDelayMs: FLOW_B_SELECTION_RETRY_DELAY_MS,
      readBatch: (state, timeoutMs) => consumeNamedStreamEvents(streamUrl, state, timeoutMs),
    },
  );
  const selectedCorrelationId = streamChangeCorrelationId(selected.change);
  if (selectedCorrelationId !== flowBProducer.correlationId) {
    throw new Error(
      `Flow-B selected correlation changed unexpectedly; expected=${flowBProducer.correlationId} actual=${
        selectedCorrelationId ?? '<missing>'
      }`,
    );
  }
  const messages = [toFanInMessage(selected.change)];
  if (!selected.state.lastCommittedOffset) {
    throw new Error('named SSE control did not commit a replay offset');
  }
  const replay = await consumeNamedStreamEvents(streamUrl, selected.state);
  if (!replay.outcomes.some((event) => event.event === 'heartbeat')) {
    throw new Error('offset reconnect did not receive an up-to-date control heartbeat');
  }
  const malformed = parseStreamSseEventV1({
    eventName: 'control',
    data: '{"streamNextOffset":7}',
    lastCommittedOffset: selected.state.lastCommittedOffset,
  });
  if (malformed.ok || malformed.error.retryable) {
    throw new Error('malformed control did not produce a non-retryable v1 error');
  }
  if (malformed.error.lastCommittedOffset !== selected.state.lastCommittedOffset) {
    throw new Error('malformed control changed the last committed offset');
  }
  const documentedReceipt = await runDocumentedStreamExample(new URL(streamUrl).origin);
  // Pass an explicitly-resolved tracer rather than letting the instrumentation call
  // `@netscript/telemetry`'s `getTracer`. That helper memoises tracers in a module-level cache
  // keyed by name@version, and `trace.getTracer()` binds to whichever provider is registered at
  // the FIRST call — so a tracer resolved before this consumer registered its provider is a
  // no-op, and every later call returns that cached no-op. The span was created and ended
  // against it, exported nothing, and raised no error, which is why TC-14 saw no
  // `stream.subscribe` span while this gate itself passed.
  const span = createStreamsInstrumentation({
    tracer: flowBConsumerTracer(),
  }).startSubscribeSpan({
    streamPath: '/workers/executions',
    collection: 'execution',
    operation: 'fan-in',
    messages,
  });
  span.setAttribute('netscript.correlation.id', selectedCorrelationId);
  span.setAttribute('netscript.stream.outcome', 'success');
  span.setStatus({ code: SpanStatusCode.OK });
  span.end();
  await provider.forceFlush?.();
  console.info(
    `Flow-B named SSE consumer selected correlation ${selectedCorrelationId} after ${selected.batchesRead} batch(es), linked ${messages.length} message(s), committed ${selected.state.lastCommittedOffset}, reconnected to heartbeat, rejected malformed control, and ran the unchanged documented example over ${documentedReceipt} materialized record(s)`,
  );
} finally {
  await provider.shutdown?.();
}

function firstResourceUrl(urls: readonly string[], resourceName: string): string {
  const url = urls[0];
  if (!url) throw new Error(`Aspire resource ${resourceName} declared no URL.`);
  return url;
}

async function readJobExecuteIdentity(projectRoot: string): Promise<FlowBProducerIdentity> {
  const query = await createLiveAspireTelemetryQuery(projectRoot);
  const fixtureCorrelationId = await readFlowBCorrelationFixture(projectRoot);
  for (let attempt = 1; attempt <= 20; attempt++) {
    const identity = findJobExecuteIdentity(
      await query.queryTraces({ serviceName: 'workers', limit: 500 }),
      fixtureCorrelationId,
    );
    if (identity) return identity;
    if (attempt < 20) await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `Flow-B job.execute telemetry did not expose correlation and trace identities${
      fixtureCorrelationId ? ` for fixture correlation ${fixtureCorrelationId}` : ''
    }`,
  );
}

/**
 * The `behavior.otel.webhook` gate records the correlation of the Flow-B run under test; earlier
 * webhook gates leave older `flow-b-callback` executions in the dashboard, so the consumer must
 * anchor on this fixture rather than on dashboard ordering. Absent fixture → legacy first-match.
 */
async function readFlowBCorrelationFixture(projectRoot: string): Promise<string | undefined> {
  try {
    const value = (await Deno.readTextFile(`${projectRoot}/.netscript/e2e/flow-b-correlation-id`))
      .trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

interface NamedStreamReceipt {
  readonly changes: readonly StreamSseChangeV1[];
  readonly outcomes: readonly StreamSseConsumerEventV1[];
  readonly state: StreamSseReplayStateV1;
}

function consumeNamedStreamEvents(
  streamUrl: string,
  initialState: StreamSseReplayStateV1,
  timeoutMs = 15_000,
): Promise<NamedStreamReceipt> {
  return new Promise((resolve, reject) => {
    const url = new URL(streamUrl);
    url.searchParams.set('offset', initialState.lastCommittedOffset ?? '-1');
    url.searchParams.set('live', 'sse');
    const source = new EventSource(url);
    const changes: StreamSseChangeV1[] = [];
    const outcomes: StreamSseConsumerEventV1[] = [];
    let settled = false;
    const timeout = setTimeout(
      () => finish(new Error(`named SSE control timed out after ${Math.ceil(timeoutMs)}ms`)),
      timeoutMs,
    );
    const binding = bindStreamEventSourceV1({
      source,
      initialState,
      onEvent(event) {
        outcomes.push(event);
        if (event.event === 'data') changes.push(...event.payload);
        if (event.event === 'error') {
          finish(new Error(`${event.payload.code}: ${event.payload.message}`));
          return;
        }
        if (event.event === 'control' || event.event === 'heartbeat') {
          finish();
        }
      },
    });

    function finish(error?: Error): void {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      queueMicrotask(() => {
        const state = binding.snapshot();
        binding.dispose();
        if (error) reject(error);
        else resolve({ changes, outcomes, state });
      });
    }
  });
}

function toFanInMessage(change: StreamSseChangeV1): {
  traceparent: string;
  tracestate?: string;
  streamPath: string;
  collection?: string;
  operation?: string;
  messageId?: string;
  correlationId?: string;
} {
  return {
    traceparent: change.headers.traceparent,
    tracestate: change.headers.tracestate,
    streamPath: '/workers/executions',
    collection: change.type,
    operation: change.headers.operation,
    messageId: change.key,
    correlationId: streamChangeCorrelationId(change),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function randomHex(byteLength: number): string {
  return [...crypto.getRandomValues(new Uint8Array(byteLength))]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * The consumer's own provider, kept addressable.
 *
 * `trace.setGlobalTracerProvider` is a **no-op when a provider is already registered** — OTEL
 * returns false rather than replacing it. Relying on the global therefore silently hands back
 * someone else's tracer, or a no-op: the span records nothing, `SimpleSpanProcessor` exports
 * nothing, and no error is raised anywhere. That is exactly what TC-14 kept observing as "no real
 * streams consumer span exists". Taking the tracer from this instance removes the dependency on
 * winning the global-registration race.
 */
// Declared near the top of the module (before `provider.register()` runs) so the loader's
// assignment is not a temporal-dead-zone access; see the doc comment on `flowBConsumerTracer`.

/** Tracer guaranteed to belong to the consumer's own exporting provider. */
function flowBConsumerTracer() {
  if (!flowBTracerProvider) throw new Error('Flow-B tracer provider was not created');
  return flowBTracerProvider.getTracer('netscript.streams');
}

function createFlowBSdkLoader(
  endpoint: string,
  headers: Readonly<Record<string, string>>,
): SdkLoader {
  return () => {
    const exporter = createOtlpJsonSpanExporter(endpoint, headers);
    const processor = new SimpleSpanProcessor(exporter);
    const tracerProvider = new BasicTracerProvider({ spanProcessors: [processor] });
    flowBTracerProvider = tracerProvider;
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

function createOtlpJsonSpanExporter(
  endpoint: string,
  headers: Readonly<Record<string, string>>,
): SpanExporter {
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
        headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify(body),
      }).then((response) => {
        // A rejected export used to be swallowed here: the callback reported failure and nothing
        // read it, so the consumer gate passed while its spans never reached the dashboard. TC-14
        // then failed far downstream with "no real streams consumer span exists" — the symptom at
        // the read end of a problem that happened at the write end. Surface it where it happens.
        if (!response.ok) {
          console.error(
            `flow-b-stream-consumer OTLP export rejected: HTTP ${response.status} from ` +
              `${normalizedEndpoint}/v1/traces - spans will be absent from every later query`,
          );
        }
        resultCallback({ code: response.ok ? 0 : 1 });
      }).catch((error: unknown) => {
        console.error(
          `flow-b-stream-consumer OTLP export failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        resultCallback({ code: 1 });
      });
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
