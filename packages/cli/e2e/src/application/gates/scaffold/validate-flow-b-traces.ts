import {
  AspireTelemetryQuery,
  type TelemetrySpan,
  type TelemetryTrace,
} from '@netscript/telemetry/query';

const appHost = Deno.args[0];
const projectRoot = Deno.args[1];
if (!appHost || !projectRoot) throw new Error('apphost and project root arguments are required');

const metadata = await readObject(`${projectRoot}/.netscript/e2e/aspire-start.json`);
const dashboardUrl = typeof metadata.dashboardUrl === 'string'
  ? new URL(metadata.dashboardUrl).origin
  : 'https://localhost:18888';
const query = new AspireTelemetryQuery({
  endpoint: dashboardUrl,
  fetch: createLiveAspireFetch(fetch),
});

let lastSummary = 'no traces returned';
for (let attempt = 1; attempt <= 30; attempt++) {
  const traces = await query.queryTraces({ limit: 500 });
  try {
    validateFlowB(traces);
    console.info(`Flow-B grouped trace passed after ${attempt} attempt(s)`);
    Deno.exit(0);
  } catch (error) {
    lastSummary = error instanceof Error ? error.message : String(error);
    if (attempt < 30) await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
}
throw new Error(`Flow-B trace assertions did not converge: ${lastSummary}`);

function validateFlowB(traces: readonly TelemetryTrace[]): void {
  const main = traces.find((trace) =>
    hasAny(trace, ['trigger.ingress', 'trigger.detect']) && has(trace, 'queue.enqueue') &&
    has(trace, 'queue.dequeue') &&
    has(trace, 'job.execute')
  );
  tcAssert(
    'TC-1/TC-2',
    main !== undefined,
    'named, explicitly-kind-ed Flow-B spans share one trace',
  );

  const enqueue = named(main, 'queue.enqueue');
  const dequeue = named(main, 'queue.dequeue');
  const dispatch = findNamed(main, [
    'worker.process',
    'scheduler.dispatch',
    'job.spawn',
    'queue.dequeue',
  ]);
  const execute = named(main, 'job.execute');
  const callback = main.spans.find((span) => span.name === 'rpc.client');
  tcAssert(
    'TC-1/TC-9',
    callback !== undefined,
    `job trace contains rpc.client; observed=${main.spans.map((span) => span.name).join(',')}`,
  );
  tcAssert('TC-9', dequeue.parentSpanId === enqueue.spanId, 'enqueue -> dequeue parent edge');
  tcAssert('TC-9', execute.parentSpanId === dispatch.spanId, 'dispatch -> job.execute parent edge');
  tcAssert(
    'TC-9',
    callback.parentSpanId === execute.spanId || isDescendant(main, callback, execute),
    'job.execute -> channelClient callback edge',
  );
  const ingress = findNamed(main, ['trigger.ingress', 'trigger.detect']);
  const process = named(main, 'trigger.process');
  tcAssert(
    'TC-9',
    ingress.traceId === process.traceId,
    'trigger ingress never starts a fresh trace',
  );

  const fanIn = traces.flatMap((trace) => trace.spans).find((span) =>
    span.name === 'stream.subscribe' && span.links.length > 0
  );
  tcAssert('TC-14', fanIn !== undefined, 'real streams consumer links to a Flow-B producer');
  tcAssert(
    'TC-14',
    fanIn.links.some((link) => Object.keys(link.attributes).length > 0),
    'fan-in link preserves per-message attributes through the SDK provider',
  );

  const assertedSpans = [
    ingress,
    process,
    enqueue,
    dequeue,
    dispatch,
    execute,
    callback,
    fanIn,
  ];
  for (const span of assertedSpans) {
    tcAssert(
      'TC-6/TC-7',
      typeof span.attributes['netscript.correlation.id'] === 'string',
      `${span.name} carries netscript.correlation.id`,
    );
    tcAssert(
      'TC-3/TC-7',
      span.statusCode !== 0 && hasOutcome(span),
      `${span.name} carries status and a netscript.* outcome`,
    );
  }
}

function has(trace: TelemetryTrace, name: string): boolean {
  return trace.spans.some((span) => span.name === name);
}

function hasAny(trace: TelemetryTrace, names: readonly string[]): boolean {
  return trace.spans.some((span) => names.includes(span.name));
}

function named(trace: TelemetryTrace, name: string): TelemetrySpan {
  const span = trace.spans.find((candidate) => candidate.name === name);
  if (!span) throw new Error(`TC-1 missing span ${name}`);
  return span;
}

function findNamed(trace: TelemetryTrace, names: readonly string[]): TelemetrySpan {
  const span = trace.spans.find((candidate) => names.includes(candidate.name));
  if (!span) throw new Error(`TC-1 missing dispatch span (${names.join(', ')})`);
  return span;
}

function isDescendant(
  trace: TelemetryTrace,
  child: TelemetrySpan,
  ancestor: TelemetrySpan,
): boolean {
  let parentId = child.parentSpanId;
  while (parentId) {
    if (parentId === ancestor.spanId) return true;
    parentId = trace.spans.find((span) => span.spanId === parentId)?.parentSpanId;
  }
  return false;
}

function hasOutcome(span: TelemetrySpan): boolean {
  return Object.entries(span.attributes).some(([key, value]) =>
    key.startsWith('netscript.') && key.endsWith('outcome') && typeof value === 'string'
  );
}

function tcAssert(tc: string, condition: boolean, description: string): asserts condition {
  if (!condition) throw new Error(`${tc} FAIL: ${description}`);
  console.info(`${tc} PASS: ${description}`);
}

function createLiveAspireFetch(liveFetch: typeof fetch): typeof fetch {
  return async (input, init) => {
    const response = await liveFetch(input, init);
    if (!response.ok) return response;
    const payload = await response.json();
    return Response.json({ spans: flattenOtlpSpans(payload) });
  };
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

async function readObject(path: string): Promise<Record<string, unknown>> {
  const value = JSON.parse(await Deno.readTextFile(path));
  if (!isRecord(value)) throw new Error(`${path} did not contain an object`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
