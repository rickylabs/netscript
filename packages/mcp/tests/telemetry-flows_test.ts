import { assert, assertEquals } from '@std/assert';
import {
  NetScriptExecutionAttributes,
  NetScriptJobAttributes,
} from '@netscript/telemetry/attributes';
import { createGetAppStatusFlow } from '../src/application/flows/get-app-status-flow.ts';
import { createGetRecentErrorsFlow } from '../src/application/flows/get-recent-errors-flow.ts';
import { createGetRunFlow } from '../src/application/flows/get-run-flow.ts';
import { createListRunsFlow } from '../src/application/flows/list-runs-flow.ts';
import { createGetLastJobResultFlow } from '../src/application/flows/get-last-job-result-flow.ts';
import { createAnalyzeServicePerformanceFlow } from '../src/application/flows/analyze-service-performance-flow.ts';
import { createAnalyzeDbBottlenecksFlow } from '../src/application/flows/analyze-db-bottlenecks-flow.ts';
import { FakeTelemetryQuery, log, span } from './telemetry-fixtures.ts';

const spans = [span({
  traceId: 'trace-1',
  spanId: 'root',
  name: 'job.execute',
  startTimeUnixMs: 200,
  statusCode: 2,
  statusMessage: 'failed',
  attributes: {
    [NetScriptExecutionAttributes.EXECUTION_ID]: 'run-1',
    [NetScriptJobAttributes.JOB_NAME]: 'email',
    [NetScriptJobAttributes.JOB_STATUS]: 'failed',
    'service.name': 'worker',
  },
})];
const query = new FakeTelemetryQuery(spans, [
  log({ severity: 'ERROR', traceId: 'trace-1', body: 'failed' }),
], [{ serviceName: 'worker', attributes: {} }]);

Deno.test('all four telemetry flows return bounded semantic summaries', async () => {
  const app = await createGetAppStatusFlow(query)({});
  assert(app.ok);
  assertEquals((app.value as { status: string }).status, 'fail');
  const list = await createListRunsFlow(query)({ limit: 1 });
  assert(list.ok);
  assertEquals((list.value as { count: number }).count, 1);
  const run = await createGetRunFlow(query)({ id: 'run-1' });
  assert(run.ok);
  assertEquals((run.value as { spans: unknown[] }).spans.length, 1);
  const errors = await createGetRecentErrorsFlow(query)({ limit: 1 });
  assert(errors.ok);
  assertEquals((errors.value as { groups: unknown[] }).groups.length, 1);
});

Deno.test('trace intelligence flows apply windows and return structured empty summaries', async () => {
  const empty = new FakeTelemetryQuery();
  const job = await createGetLastJobResultFlow(empty, () => 1_000_000)({ jobName: 'missing' });
  assert(job.ok);
  assertEquals(job.value, { found: false });
  const performance = await createAnalyzeServicePerformanceFlow(empty, () => 1_000_000)({
    service: 'api',
  });
  assert(performance.ok);
  assertEquals((performance.value as { sampleCount: number }).sampleCount, 0);
  const db = await createAnalyzeDbBottlenecksFlow(empty, () => 1_000_000)({ sinceUnixMs: 123 });
  assert(db.ok);
  assertEquals(db.value, { sinceUnixMs: 123, sampleCount: 0, operations: [] });
});

Deno.test('get_run returns structured not found', async () => {
  const result = await createGetRunFlow(query)({ id: 'missing' });
  assert(!result.ok);
  assertEquals(result.error.code, 'run_not_found');
});
