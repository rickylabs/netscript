import { assert, assertEquals } from '@std/assert';
import { createAnalyzeDbBottlenecksFlow } from '../src/application/flows/analyze-db-bottlenecks-flow.ts';
import { createAnalyzeServicePerformanceFlow } from '../src/application/flows/analyze-service-performance-flow.ts';
import { createGetAppStatusFlow } from '../src/application/flows/get-app-status-flow.ts';
import { createGetLastJobResultFlow } from '../src/application/flows/get-last-job-result-flow.ts';
import { createGetRecentErrorsFlow } from '../src/application/flows/get-recent-errors-flow.ts';
import { createGetRunFlow } from '../src/application/flows/get-run-flow.ts';
import { createListRunsFlow } from '../src/application/flows/list-runs-flow.ts';
import { createResolvedTelemetryQuery } from '../src/infrastructure/telemetry-query-adapter.ts';
import { validateSchema } from '../src/domain/schema.ts';
import { TOOL_OUTPUT_SCHEMAS } from '../src/domain/tool-contracts.ts';
import {
  aspireDashboardResourcesFixture,
  aspireDashboardSpansFixture,
} from './fixtures/telemetry/aspire-13.4.6-fixture.ts';

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json' },
  });
}

const fixtureFetch: typeof fetch = (input) => {
  const path = new URL(String(input)).pathname;
  if (path.endsWith('/resources')) {
    return Promise.resolve(jsonResponse(aspireDashboardResourcesFixture));
  }
  if (path.endsWith('/logs')) {
    return Promise.resolve(jsonResponse([]));
  }
  return Promise.resolve(jsonResponse(aspireDashboardSpansFixture));
};

Deno.test('MCP adapter and telemetry flows consume the captured Aspire 13.4.6 shape', async () => {
  const query = createResolvedTelemetryQuery('http://fixture.invalid', {}, {
    fetch: fixtureFetch,
  });

  const spans = await query.querySpans();
  const resources = await query.queryResources();
  assertEquals(spans.length, 17);
  assertEquals(resources.length, 11);
  assert(spans.some((span) => span.attributes['service.name'] === 'workers'));
  assert(spans.some((span) => span.kind === 'consumer'));
  assert(resources.some((resource) => resource.serviceInstanceId !== undefined));

  const list = await createListRunsFlow(query)({ limit: 20 });
  assert(list.ok);
  const runs = (list.value as { runs: readonly { id: string }[] }).runs;
  assert(runs.length > 0);

  const run = await createGetRunFlow(query)({ id: runs[0]!.id });
  assert(run.ok);
  validateSchema(TOOL_OUTPUT_SCHEMAS.get_run, run.value);
  assert((run.value as { spans: readonly unknown[] }).spans.length > 0);

  const captureNow = 1_784_264_560_000;
  const job = await createGetLastJobResultFlow(query, () => captureNow)({
    jobId: 'health-check',
  });
  assert(job.ok);
  assertEquals((job.value as { found: boolean }).found, true);

  assert((await createGetAppStatusFlow(query)({})).ok);
  assert((await createGetRecentErrorsFlow(query)({ limit: 20 })).ok);
  assert(
    (await createAnalyzeServicePerformanceFlow(query, () => captureNow)({
      service: 'workers',
    })).ok,
  );
  assert((await createAnalyzeDbBottlenecksFlow(query, () => captureNow)({})).ok);
});
