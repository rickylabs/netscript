import { assertEquals } from '@std/assert';
import {
  KVAttributes,
  NetScriptExecutionAttributes,
  NetScriptJobAttributes,
  SagaAttributes,
  TriggerAttributes,
} from '@netscript/telemetry/attributes';
import {
  aggregateAppStatus,
  aggregateDbBottlenecks,
  aggregateErrors,
  aggregateLastJobResult,
  aggregateRuns,
  aggregateServicePerformance,
  classifyDomain,
  summarizeSpanTree,
} from '../src/application/telemetry-aggregation.ts';
import { log, span } from './telemetry-fixtures.ts';
import { TOOL_OUTPUT_SCHEMAS } from '../src/domain/tool-contracts.ts';
import { validateSchema } from '../src/domain/schema.ts';

Deno.test('domain classification and identity precedence are deterministic', () => {
  assertEquals(
    classifyDomain({ 'netscript.stream.path': '/events', [TriggerAttributes.TRIGGER_ID]: 't' }),
    'trigger',
  );
  const runs = aggregateRuns([
    span({
      attributes: {
        [NetScriptExecutionAttributes.EXECUTION_ID]: 'exec',
        [NetScriptJobAttributes.JOB_ID]: 'job',
        [SagaAttributes.SAGA_INSTANCE_ID]: 'saga',
      },
    }),
  ], {});
  assertEquals(runs[0]?.id, 'exec');
});

Deno.test('last job result selects newest completed span by optional name or id', () => {
  const jobs = [
    span({
      traceId: 'old',
      startTimeUnixMs: 10,
      endTimeUnixMs: 20,
      attributes: {
        [NetScriptJobAttributes.JOB_ID]: '1',
        [NetScriptJobAttributes.JOB_NAME]: 'email',
      },
    }),
    span({
      traceId: 'new',
      startTimeUnixMs: 30,
      endTimeUnixMs: 50,
      statusCode: 2,
      statusMessage: 'boom',
      attributes: {
        [NetScriptJobAttributes.JOB_ID]: '2',
        [NetScriptJobAttributes.JOB_NAME]: 'email',
        [NetScriptJobAttributes.JOB_STATUS]: 'failed',
        [NetScriptJobAttributes.JOB_EXIT_CODE]: 7,
      },
    }),
    span({
      traceId: 'running',
      startTimeUnixMs: 60,
      endTimeUnixMs: undefined,
      attributes: {
        [NetScriptJobAttributes.JOB_ID]: '3',
        [NetScriptJobAttributes.JOB_NAME]: 'email',
      },
    }),
  ];
  assertEquals(aggregateLastJobResult(jobs, { jobName: 'email' }).traceId, 'new');
  assertEquals(aggregateLastJobResult(jobs, { jobId: '1' }).traceId, 'old');
  assertEquals(aggregateLastJobResult(jobs, { jobId: 'missing' }), { found: false });
  validateSchema(TOOL_OUTPUT_SCHEMAS.get_last_job_result, aggregateLastJobResult(jobs));
  validateSchema(TOOL_OUTPUT_SCHEMAS.get_last_job_result, { found: false });
});

Deno.test('service performance uses nearest-rank percentiles and stable grouping', () => {
  const durations = [10, 20, 30, 40];
  const result = aggregateServicePerformance(
    durations.map((value, index) =>
      span({
        name: index < 2 ? 'fast' : 'slow',
        startTimeUnixMs: 100 + index,
        endTimeUnixMs: 100 + index + value,
        statusCode: index === 3 ? 2 : 1,
        attributes: { 'service.name': 'api' },
      })
    ),
    { service: 'api', sinceUnixMs: 0, nowUnixMs: 60_000 },
  );
  assertEquals({ p50: result.p50DurationMs, p95: result.p95DurationMs }, { p50: 20, p95: 40 });
  assertEquals(result.topOperations.map((item) => item.name), ['slow', 'fast']);
  assertEquals(result.errorRate, 0.25);
  validateSchema(TOOL_OUTPUT_SCHEMAS.analyze_service_performance, result);
  validateSchema(
    TOOL_OUTPUT_SCHEMAS.analyze_service_performance,
    aggregateServicePerformance([], { service: 'api', sinceUnixMs: 0, nowUnixMs: 60_000 }),
  );
});

Deno.test('db bottlenecks include NetScript KV and OTel db namespace and rank total time', () => {
  const result = aggregateDbBottlenecks([
    span({
      name: 'kv',
      startTimeUnixMs: 10,
      endTimeUnixMs: 50,
      attributes: { [KVAttributes.KV_OPERATION]: 'get' },
    }),
    span({
      name: 'db',
      startTimeUnixMs: 20,
      endTimeUnixMs: 50,
      statusCode: 2,
      attributes: { 'db.statement': ' SELECT   1 ' },
    }),
    span({ name: 'http', startTimeUnixMs: 20, endTimeUnixMs: 200 }),
  ], { sinceUnixMs: 0 });
  assertEquals(result.sampleCount, 2);
  assertEquals(result.operations.map((item) => item.operation), ['get', 'SELECT 1']);
  assertEquals(result.operations[1]?.errorCount, 1);
  validateSchema(TOOL_OUTPUT_SCHEMAS.analyze_db_bottlenecks, result);
  validateSchema(
    TOOL_OUTPUT_SCHEMAS.analyze_db_bottlenecks,
    aggregateDbBottlenecks([], { sinceUnixMs: 0 }),
  );
});

Deno.test('app status and recent errors group semantic telemetry', () => {
  const failed = span({
    statusCode: 2,
    statusMessage: 'boom',
    attributes: { [SagaAttributes.SAGA_INSTANCE_ID]: 's1', 'service.name': 'api' },
  });
  assertEquals(
    aggregateAppStatus([{ serviceName: 'api', attributes: {} }], [failed], []).status,
    'fail',
  );
  const groups = aggregateErrors([failed], [
    log({
      severity: 'ERROR',
      body: 'bad',
      traceId: 'trace-2',
      attributes: { 'netscript.worker.id': 'w', 'service.name': 'worker' },
    }),
  ]);
  assertEquals(groups.length, 2);
  assertEquals(groups[0]?.relatedTraceIds.length, 1);
});

Deno.test('span tree bounds cycles, depth, and count', () => {
  const spans = Array.from(
    { length: 60 },
    (_, index) =>
      span({
        spanId: `s${index}`,
        parentSpanId: index ? `s${index - 1}` : undefined,
        startTimeUnixMs: index,
      }),
  );
  const tree = summarizeSpanTree(spans);
  assertEquals(tree.length, 9);
  assertEquals(tree.at(-1)?.depth, 8);
});
