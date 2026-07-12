import { assertEquals } from '@std/assert';
import {
  NetScriptExecutionAttributes,
  NetScriptJobAttributes,
  SagaAttributes,
  TriggerAttributes,
} from '@netscript/telemetry/attributes';
import {
  aggregateAppStatus,
  aggregateErrors,
  aggregateRuns,
  classifyDomain,
  summarizeSpanTree,
} from '../src/application/telemetry-aggregation.ts';
import { log, span } from './telemetry-fixtures.ts';

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
