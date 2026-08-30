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
import {
  aspireDashboardResources1353Fixture,
  aspireDashboardSpans1353Fixture,
} from './fixtures/telemetry/aspire-13.5.3-fixture.ts';

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: { 'content-type': 'application/json' },
  });
}

function createFixtureFetch(resourcesFixture: unknown, spansFixture: unknown): typeof fetch {
  return (input) => {
    const path = new URL(String(input)).pathname;
    if (path.endsWith('/resources')) {
      return Promise.resolve(jsonResponse(resourcesFixture));
    }
    if (path.endsWith('/logs')) {
      return Promise.resolve(jsonResponse([]));
    }
    return Promise.resolve(jsonResponse(spansFixture));
  };
}

// See fixtures/telemetry/README.md § "Current capture". This brief-scoped relay capture omitted
// database.codegen and the streams plugin, so it has only the trigger producer trace: no worker
// consumer/job.execute span, listed run, or last-job result. The `service.name === "workers"`
// assertion is satisfied by workers-api's @hono/otel span attribute, not a worker-runtime span.
const ASPIRE_1353_CAPTURED_WITHOUT_CONSUMER = {
  workerSpanKind: 'producer',
  listedRunCount: 0,
  jobFound: false,
} as const;

async function assertCapturedTelemetryShape(options: {
  resourcesFixture: unknown;
  spansFixture: unknown;
  spanCount: number;
  resourceCount: number;
  workerSpanKind: 'consumer' | 'producer';
  captureNow: number;
  listedRunCount: number;
  jobFound: boolean;
}): Promise<void> {
  const query = createResolvedTelemetryQuery('http://fixture.invalid', {}, {
    fetch: createFixtureFetch(options.resourcesFixture, options.spansFixture),
  });

  const spans = await query.querySpans();
  const resources = await query.queryResources();
  assertEquals(spans.length, options.spanCount);
  assertEquals(resources.length, options.resourceCount);
  assert(spans.some((span) => span.attributes['service.name'] === 'workers'));
  assert(spans.some((span) => span.kind === options.workerSpanKind));
  assert(resources.some((resource) => resource.serviceInstanceId !== undefined));

  const list = await createListRunsFlow(query)({ limit: 20 });
  assert(list.ok);
  const runs = (list.value as { runs: readonly { id: string }[] }).runs;
  assertEquals(runs.length, options.listedRunCount);

  if (runs[0]) {
    const run = await createGetRunFlow(query)({ id: runs[0].id });
    assert(run.ok);
    validateSchema(TOOL_OUTPUT_SCHEMAS.get_run, run.value);
    assert((run.value as { spans: readonly unknown[] }).spans.length > 0);
  }

  const job = await createGetLastJobResultFlow(query, () => options.captureNow)({
    jobId: 'health-check',
  });
  assert(job.ok);
  assertEquals((job.value as { found: boolean }).found, options.jobFound);

  assert((await createGetAppStatusFlow(query)({})).ok);
  assert((await createGetRecentErrorsFlow(query)({ limit: 20 })).ok);
  assert(
    (await createAnalyzeServicePerformanceFlow(query, () => options.captureNow)({
      service: 'workers',
    })).ok,
  );
  assert((await createAnalyzeDbBottlenecksFlow(query, () => options.captureNow)({})).ok);
}

Deno.test('MCP adapter and telemetry flows consume the captured Aspire 13.4.6 shape', async () => {
  await assertCapturedTelemetryShape({
    resourcesFixture: aspireDashboardResourcesFixture,
    spansFixture: aspireDashboardSpansFixture,
    spanCount: 17,
    resourceCount: 11,
    workerSpanKind: 'consumer',
    captureNow: 1_784_264_560_000,
    listedRunCount: 2,
    jobFound: true,
  });
});

Deno.test('MCP adapter and telemetry flows consume the captured Aspire 13.5.3 shape', async () => {
  await assertCapturedTelemetryShape({
    resourcesFixture: aspireDashboardResources1353Fixture,
    spansFixture: aspireDashboardSpans1353Fixture,
    spanCount: 29,
    resourceCount: 4,
    captureNow: 1_788_114_300_000,
    ...ASPIRE_1353_CAPTURED_WITHOUT_CONSUMER,
  });
});
