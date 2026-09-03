import type { TelemetrySpan, TelemetryTrace } from '@netscript/telemetry/query';
import { createLiveAspireTelemetryQuery } from './aspire-dashboard-telemetry.ts';

if (import.meta.main) await main();

async function main(): Promise<void> {
  const appHost = Deno.args[0];
  const projectRoot = Deno.args[1];
  if (!appHost || !projectRoot) throw new Error('apphost and project root arguments are required');

  const query = await createLiveAspireTelemetryQuery(projectRoot);
  const flowBCorrelationId = (await Deno.readTextFile(
    `${projectRoot}/.netscript/e2e/flow-b-correlation-id`,
  )).trim();
  if (!flowBCorrelationId) throw new Error('Flow-B correlation fixture was empty');

  let lastSummary = 'no traces returned';
  for (let attempt = 1; attempt <= 30; attempt++) {
    const traces = await query.queryTraces({ limit: 500 });
    try {
      validateFlowB(traces, flowBCorrelationId);
      console.info(`Flow-B grouped trace passed after ${attempt} attempt(s)`);
      return;
    } catch (error) {
      lastSummary = error instanceof Error ? error.message : String(error);
      if (attempt < 30) await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
  }
  throw new Error(`Flow-B trace assertions did not converge: ${lastSummary}`);
}

export function validateFlowB(
  traces: readonly TelemetryTrace[],
  flowBCorrelationId: string,
): void {
  // More than one Flow-B-shaped trace coexists in the dashboard (`behavior.triggers-webhook`
  // fires the same generic webhook earlier in the suite), so the trace carrying the recorded
  // correlation fixture is authoritative; dashboard ordering only breaks ties.
  const flowBShaped = traces.filter((trace) =>
    hasAny(trace, ['trigger.ingress', 'trigger.detect']) && has(trace, 'queue.enqueue') &&
    has(trace, 'queue.dequeue') &&
    has(trace, 'job.execute')
  );
  const main = flowBShaped.find((trace) => carriesCorrelation(trace, flowBCorrelationId)) ??
    flowBShaped[0];
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
  const callbackBoundary = named(main, 'flow-b.callback');
  const saga = assertSagaCompensationCorrelation(traces, flowBCorrelationId);
  tcAssert(
    'TC-1/TC-9',
    callback !== undefined,
    `job trace contains rpc.client; observed=${main.spans.map((span) => span.name).join(',')}`,
  );
  tcAssert('TC-9', dequeue.parentSpanId === enqueue.spanId, 'enqueue -> dequeue parent edge');
  tcAssert(
    'TC-9',
    execute.parentSpanId === dispatch.spanId || isDescendant(main, execute, dispatch),
    'dispatch -> job.execute ancestry survives the queue boundary',
  );
  tcAssert(
    'TC-9',
    callbackBoundary.parentSpanId === execute.spanId ||
      isDescendant(main, callbackBoundary, execute),
    'job.execute -> channelClient callback edge',
  );
  tcAssert(
    'TC-9',
    callback.parentSpanId === callbackBoundary.spanId ||
      isDescendant(main, callback, callbackBoundary),
    'callback boundary -> rpc.client edge',
  );
  const ingress = findNamed(main, ['trigger.ingress', 'trigger.detect']);
  const process = named(main, 'trigger.process');
  tcAssert(
    'TC-9',
    ingress.traceId === process.traceId,
    'trigger ingress never starts a fresh trace',
  );

  const subscribeSpans = traces.flatMap((trace) => trace.spans).filter((span) =>
    span.name === 'stream.subscribe'
  );
  const fanIn =
    subscribeSpans.find((span) =>
      span.links.length > 0 && span.attributes['netscript.correlation.id'] === flowBCorrelationId
    ) ?? subscribeSpans.find((span) => span.links.length > 0) ?? subscribeSpans[0];
  tcAssert('TC-14', fanIn !== undefined, 'real streams consumer span exists');
  tcAssert(
    'TC-14',
    fanIn.attributes['service.name'] === 'flow-b-stream-consumer',
    'stream.subscribe is emitted by the Deno-side consumer hosted in the isolated AppHost gate',
  );
  const producerLink = assertConsumerLinksProducer(main.traceId, fanIn);
  console.info(
    `TC-14 PASS: producerTraceId=${main.traceId} selectedCorrelationId=${
      String(fanIn.attributes['netscript.correlation.id'])
    } linkTraceId=${producerLink.traceId} linkSpanId=${producerLink.spanId}`,
  );
  tcAssert(
    'TC-14',
    fanIn.links.some((link) => Object.keys(link.attributes).length > 0),
    'fan-in link preserves per-message attributes through the SDK provider',
  );

  const correlatedSpans = [
    ingress,
    process,
    enqueue,
    dequeue,
    execute,
    callbackBoundary,
    fanIn,
    saga.handle,
    saga.compensate,
  ];
  for (const span of correlatedSpans) {
    tcAssert(
      'TC-6/TC-7',
      typeof span.attributes['netscript.correlation.id'] === 'string',
      `${span.name} carries netscript.correlation.id`,
    );
  }
  tcAssert(
    'TC-6/TC-7',
    new Set(correlatedSpans.map((span) => span.attributes['netscript.correlation.id'])).size === 1,
    'Flow-B product and boundary spans carry the same correlation id',
  );
  tcAssert(
    'TC-6/TC-7',
    callbackBoundary.attributes['netscript.correlation.id'] === flowBCorrelationId,
    'callback correlation equals the generated saga payload/publish correlation fixture',
  );

  for (const span of correlatedSpans) {
    tcAssert(
      'TC-6/TC-7',
      hasOutcome(span),
      `${span.name} carries a netscript.* outcome`,
    );
  }
}

/** Assert the real generated saga compensation span is correlated and directly parented. */
export function assertSagaCompensationCorrelation(
  traces: readonly TelemetryTrace[],
  flowBCorrelationId: string,
): Readonly<{ handle: TelemetrySpan; compensate: TelemetrySpan }> {
  const spans = traces.flatMap((trace) => trace.spans);
  const handles = spans.filter((span) =>
    span.name === 'saga.handle' &&
    span.attributes['netscript.saga.id'] === 'flow-b-compensation'
  );
  const compensations = spans.filter((span) =>
    span.name === 'saga.cascade.compensate' &&
    span.attributes['netscript.saga.id'] === 'flow-b-compensation'
  );
  const handle =
    handles.find((span) => span.attributes['netscript.correlation.id'] === flowBCorrelationId) ??
      handles[0];
  const compensate =
    compensations.find((span) =>
      span.attributes['netscript.correlation.id'] === flowBCorrelationId
    ) ?? compensations[0];
  tcAssert('TC-1', handle !== undefined, 'generated Flow-B saga.handle exists');
  tcAssert(
    'TC-1',
    compensate !== undefined,
    'generated Flow-B saga.cascade.compensate exists',
  );
  for (const span of [handle, compensate]) {
    tcAssert(
      'TC-6/TC-7',
      span.attributes['netscript.correlation.id'] === flowBCorrelationId,
      `${span.name} correlation equals callback fixture ${flowBCorrelationId}`,
    );
    tcAssert(
      'TC-6/TC-7',
      span.attributes['netscript.saga.correlation_key'] === flowBCorrelationId,
      `${span.name} saga correlation key equals generated payload correlation`,
    );
  }
  tcAssert(
    'TC-9',
    compensate.traceId === handle.traceId && compensate.parentSpanId === handle.spanId,
    'saga.handle -> saga.cascade.compensate is a direct parent edge',
  );
  return Object.freeze({ handle, compensate });
}

/** Assert the SSE consumer has a W3C link into the selected Flow-B producer trace. */
export function assertConsumerLinksProducer(
  producerTraceId: string,
  consumerSpan: TelemetrySpan,
): TelemetrySpan['links'][number] {
  if (consumerSpan.links.length === 0) {
    throw new Error(
      `TC-14 FAIL: SSE consumer has zero W3C links; producerTraceId=${producerTraceId} consumerTraceId=${consumerSpan.traceId} consumerSpanId=${consumerSpan.spanId} linkCount=0`,
    );
  }
  const match = consumerSpan.links.find((link) => link.traceId === producerTraceId);
  if (match) return match;
  const links = consumerSpan.links.map((link, index) =>
    `link[${index}].traceId=${link.traceId} link[${index}].spanId=${link.spanId}`
  ).join(' ');
  throw new Error(
    `TC-14 FAIL: SSE consumer W3C links do not point into the selected Flow-B producer trace; producerTraceId=${producerTraceId} consumerTraceId=${consumerSpan.traceId} consumerSpanId=${consumerSpan.spanId} linkCount=${consumerSpan.links.length} ${links}`,
  );
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
    key.startsWith('netscript.') &&
    (key.endsWith('outcome') || key.endsWith('status')) &&
    typeof value === 'string'
  );
}

function tcAssert(tc: string, condition: boolean, description: string): asserts condition {
  if (!condition) throw new Error(`${tc} FAIL: ${description}`);
  console.info(`${tc} PASS: ${description}`);
}

function carriesCorrelation(trace: TelemetryTrace, correlationId: string): boolean {
  return trace.spans.some((span) => span.attributes['netscript.correlation.id'] === correlationId);
}
