import { assert, assertEquals, assertFalse, assertStringIncludes } from '@std/assert';
import { createMcpCliServer } from '../cli.ts';
import { createGetAppStatusFlow } from '../src/application/flows/get-app-status-flow.ts';
import { createAnalyzeServicePerformanceFlow } from '../src/application/flows/analyze-service-performance-flow.ts';
import { createAnalyzeDbBottlenecksFlow } from '../src/application/flows/analyze-db-bottlenecks-flow.ts';
import { readTelemetrySnapshot } from '../src/application/telemetry/read-telemetry-snapshot.ts';
import { MCP_PACKAGE_VERSION } from '../src/publish-assets.generated.ts';
import {
  DASHBOARD_API_KEY,
  DASHBOARD_CONFIG,
  DASHBOARD_TOKEN,
  FakeDashboard,
  otlpSpan,
  SNAPSHOT_NOW,
  spanEnvelope,
} from './telemetry-dashboard-fixtures.ts';

const request = { sinceUnixMs: SNAPSHOT_NOW - 60_000, untilUnixMs: SNAPSHOT_NOW, service: 'api' };
const input = { service: 'api', sinceUnixMs: request.sinceUnixMs };

Deno.test('bound telemetry snapshot returns exactly the traces served by the fake dashboard API', async () => {
  const dashboard = new FakeDashboard();
  try {
    const raw = [
      otlpSpan(),
      otlpSpan({
        spanId: 'span-db',
        name: 'db.query',
        attributes: [{ key: 'db.operation.name', value: { stringValue: 'SELECT' } }],
      }),
    ];
    dashboard.spanPayload = spanEnvelope(raw);
    const snapshot = await dashboard.reader().readSnapshot(request, new AbortController().signal);
    assert(snapshot.ok);
    assertEquals(
      snapshot.spans.map((span) => [span.traceId, span.spanId]),
      raw.map((span) => [span.traceId, span.spanId]),
    );
    assertEquals(snapshot.spans[0]?.endTimeUnixMs! - snapshot.spans[0]?.startTimeUnixMs!, 100);
    assertEquals(snapshot.provenance.sampleCount, 2);
    assertEquals(snapshot.provenance.window, {
      sinceUnixMs: request.sinceUnixMs,
      untilUnixMs: SNAPSHOT_NOW,
    });
    assertEquals(snapshot.provenance.servingRevision, MCP_PACKAGE_VERSION);
    assertEquals(snapshot.provenance.serviceRevisions, ['api-revision-7']);
    assertEquals(snapshot.provenance.nativeMetrics, 'dashboard_only');
    assertEquals(dashboard.discoveries, [[
      'ps',
      '--format',
      'Json',
      '--nologo',
      '--non-interactive',
    ]]);
    const spanRequest = dashboard.requests.find((url) => url.pathname.endsWith('/spans'));
    assertEquals(spanRequest?.searchParams.get('resource'), 'api');
    assertEquals(spanRequest?.searchParams.get('limit'), '1000');
    assertFalse(dashboard.requests.some((url) => url.pathname.endsWith('/metrics')));
    const performance = await createAnalyzeServicePerformanceFlow(
      dashboard.reader(),
      () => SNAPSHOT_NOW,
    )(input);
    assert(performance.ok);
    assertEquals(Reflect.get(performance.value as object, 'averageDurationMs'), 100);
    const db = await createAnalyzeDbBottlenecksFlow(dashboard.reader(), () => SNAPSHOT_NOW)(input);
    assert(db.ok);
    assertEquals(Reflect.get(db.value as object, 'sampleCount'), 1);
  } finally {
    await dashboard.close();
  }
});

Deno.test('wrong project binding diagnoses every assigned tool instead of returning zeros', async () => {
  const dashboard = new FakeDashboard();
  dashboard.psMode = 'wrong';
  try {
    const source = dashboard.reader();
    const flows = [
      createGetAppStatusFlow(source, undefined, '.', () => SNAPSHOT_NOW),
      createAnalyzeServicePerformanceFlow(source, () => SNAPSHOT_NOW),
      createAnalyzeDbBottlenecksFlow(source, () => SNAPSHOT_NOW),
    ];
    for (const flow of flows) {
      const result = await flow(input);
      assertFalse(result.ok);
      if (result.ok) throw new Error('Expected diagnostic');
      assertEquals(result.error.code, 'telemetry_unbound');
      assertStringIncludes(result.error.message, '--project-root');
      assertEquals(result.error.provenance?.sampleCount, null);
      assertEquals(result.error.provenance?.window, {
        sinceUnixMs: request.sinceUnixMs,
        untilUnixMs: SNAPSHOT_NOW,
      });
      assertFalse(JSON.stringify(result).includes('averageDurationMs'));
      assertFalse(JSON.stringify(result).includes('p95DurationMs'));
    }
    assertEquals(dashboard.requests.length, 0);
    assertEquals(dashboard.discoveries.length, 3);
  } finally {
    await dashboard.close();
  }
});

Deno.test('all three tool envelopes exclude dashboard login tokens, API keys and config values', async () => {
  const dashboard = new FakeDashboard();
  try {
    dashboard.spanPayload = spanEnvelope([otlpSpan({
      name: `query ${DASHBOARD_TOKEN} ${DASHBOARD_API_KEY}`,
      attributes: [{ key: 'db.statement', value: { stringValue: `SELECT ${DASHBOARD_API_KEY}` } }],
    })]);
    const server = createMcpCliServer({
      projectRoot: '/fixture/project',
      endpoint: dashboard.endpoint,
      diagnosticEvidence: {
        read: () => Promise.resolve(undefined),
        write: () => Promise.resolve(),
        appendDrift: () => Promise.resolve(),
      },
    });
    for (const fail of [false, true]) {
      if (fail) dashboard.status = 401;
      for (
        const name of ['get_app_status', 'analyze_service_performance', 'analyze_db_bottlenecks']
      ) {
        const response = await server.handle({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name, arguments: { service: 'api', sinceUnixMs: SNAPSHOT_NOW - 60_000 } },
        });
        assert(response && 'result' in response, JSON.stringify(response));
        const serialized = JSON.stringify(response);
        for (
          const secret of [
            DASHBOARD_TOKEN,
            DASHBOARD_API_KEY,
            DASHBOARD_CONFIG,
            dashboard.endpoint,
            '/fixture/project',
          ]
        ) {
          assertFalse(serialized.includes(secret), `Leaked private value in ${name}`);
        }
        assertEquals(Reflect.get(response.result as object, 'isError'), fail);
        assertStringIncludes(serialized, 'servingRevision');
      }
    }
  } finally {
    await dashboard.close();
  }
});

Deno.test('status reads real OTLP error logs and retains emitter identity', async () => {
  const dashboard = new FakeDashboard();
  try {
    const snapshot = await dashboard.reader().readSnapshot(
      { ...request, includeHealth: true },
      new AbortController().signal,
    );
    assert(snapshot.ok);
    assertEquals(snapshot.logs.length, 1);
    assertEquals(snapshot.logs[0]?.body, 'checkout failed');
    assertEquals(snapshot.logs[0]?.attributes['service.name'], 'api');
    const result = await createGetAppStatusFlow(
      dashboard.reader(),
      undefined,
      '.',
      () => SNAPSHOT_NOW,
    )(input);
    assert(result.ok);
    assertEquals(Reflect.get(result.value as object, 'status'), 'fail');
    assertEquals(Reflect.get(result.value as object, 'counts'), {
      resources: 1,
      spans: 1,
      errors: 1,
    });
    assertEquals(Reflect.get(result.value as object, 'provenance').logCount, 1);
  } finally {
    await dashboard.close();
  }
});

Deno.test('successful empty windows have no zero-latency statistics and capped windows remain partial', async () => {
  const dashboard = new FakeDashboard();
  try {
    dashboard.spanPayload = spanEnvelope([]);
    const empty = await createAnalyzeServicePerformanceFlow(dashboard.reader(), () => SNAPSHOT_NOW)(
      input,
    );
    assert(!empty.ok);
    assertEquals(empty.error.code, 'telemetry_no_data');
    assertEquals(empty.error.provenance?.sampleCount, 0);
    assertFalse('averageDurationMs' in empty.error);
    dashboard.spanPayload = spanEnvelope(
      Array.from({ length: 1000 }, (_, index) =>
        otlpSpan({
          spanId: `span-${index}`,
          startTimeUnixNano: String(BigInt(SNAPSHOT_NOW - 120_000) * 1_000_000n),
          endTimeUnixNano: String(BigInt(SNAPSHOT_NOW - 119_900) * 1_000_000n),
        })),
      1200,
    );
    const partial = await createAnalyzeDbBottlenecksFlow(dashboard.reader(), () => SNAPSHOT_NOW)(
      input,
    );
    assert(!partial.ok);
    assertEquals(partial.error.code, 'telemetry_partial');
    assertEquals(partial.error.provenance?.sourceTruncated, true);
    assertEquals(partial.error.provenance?.sampleCount, 0);
    assertEquals(partial.error.provenance?.totalCount, 1200);
    assertEquals(partial.error.provenance?.returnedCount, 1000);
    assertEquals(partial.error.provenance?.observedRange, {
      sinceUnixMs: SNAPSHOT_NOW - 120_000,
      untilUnixMs: SNAPSHOT_NOW - 120_000,
    });
  } finally {
    await dashboard.close();
  }
});

Deno.test('time windows exclude both historical and future spans locally', async () => {
  const dashboard = new FakeDashboard();
  try {
    dashboard.spanPayload = spanEnvelope([
      otlpSpan(),
      otlpSpan({
        startTimeUnixNano: String(BigInt(SNAPSHOT_NOW + 1000) * 1_000_000n),
        endTimeUnixNano: String(BigInt(SNAPSHOT_NOW + 2000) * 1_000_000n),
      }),
      otlpSpan({
        startTimeUnixNano: String(BigInt(SNAPSHOT_NOW - 120_000) * 1_000_000n),
        endTimeUnixNano: String(BigInt(SNAPSHOT_NOW - 119_000) * 1_000_000n),
      }),
    ]);
    const snapshot = await readTelemetrySnapshot(dashboard.reader(), request);
    assert(snapshot.ok);
    assertEquals(snapshot.spans.length, 1);
    assertEquals(snapshot.provenance.returnedCount, 3);
  } finally {
    await dashboard.close();
  }
});

Deno.test('failed discovery and unsupported/malformed dashboard responses are unavailable, never no_data', async () => {
  const dashboard = new FakeDashboard();
  try {
    for (const mode of ['failed', 'malformed'] as const) {
      dashboard.psMode = mode;
      const result = await createAnalyzeServicePerformanceFlow(
        dashboard.reader(),
        () => SNAPSHOT_NOW,
      )(input);
      assert(!result.ok);
      assertEquals(result.error.code, 'telemetry_unavailable');
      assertEquals(result.error.provenance?.sampleCount, null);
      assertFalse(JSON.stringify(result).includes(DASHBOARD_CONFIG));
    }
    dashboard.psMode = 'bound';
    for (const status of [401, 403, 404, 500]) {
      dashboard.status = status;
      const result = await createAnalyzeDbBottlenecksFlow(dashboard.reader(), () => SNAPSHOT_NOW)(
        input,
      );
      assert(!result.ok);
      assertEquals(
        result.error.code,
        status === 404 ? 'telemetry_unknown_service' : 'telemetry_unavailable',
      );
      assertEquals(result.error.provenance?.sampleCount, null);
    }
    dashboard.status = 200;
    for (
      const payload of [
        {},
        { data: { resourceSpans: 'wrong' } },
        spanEnvelope([otlpSpan({ name: null })]),
        { data: { resourceSpans: [] }, totalCount: 1, returnedCount: 1 },
      ]
    ) {
      dashboard.spanPayload = payload;
      const result = await createAnalyzeServicePerformanceFlow(
        dashboard.reader(),
        () => SNAPSHOT_NOW,
      )(input);
      assert(!result.ok);
      assertEquals(result.error.code, 'telemetry_unavailable');
      assertEquals(result.error.provenance?.sampleCount, null);
    }
    dashboard.spanPayload = spanEnvelope([otlpSpan()]);
    dashboard.logPayload = {};
    const badLogs = await createGetAppStatusFlow(
      dashboard.reader(),
      undefined,
      '.',
      () => SNAPSHOT_NOW,
    )(input);
    assert(!badLogs.ok);
    assertEquals(badLogs.error.code, 'telemetry_unavailable');
  } finally {
    await dashboard.close();
  }
});

Deno.test('invalid explicit binding does not fall through to discovery and restart is rediscovered per call', async () => {
  const dashboard = new FakeDashboard();
  try {
    const invalid = await dashboard.reader({ endpoint: 'file:///invalid-dashboard' }).readSnapshot(
      request,
      new AbortController().signal,
    );
    assert(!invalid.ok);
    assertEquals(invalid.code, 'telemetry_unavailable');
    assertEquals(dashboard.discoveries.length, 0);
    assertEquals(dashboard.requests.length, 0);
    const source = dashboard.reader();
    dashboard.psMode = 'missing';
    const missing = await source.readSnapshot(request, new AbortController().signal);
    assert(!missing.ok);
    assertEquals(missing.code, 'telemetry_unbound');
    dashboard.psMode = 'bound';
    const ready = await source.readSnapshot(request, new AbortController().signal);
    assert(ready.ok);
    assertEquals(dashboard.discoveries.length, 2);
  } finally {
    await dashboard.close();
  }
});

Deno.test('unknown service and replica filters receive an actionable service diagnostic', async () => {
  const dashboard = new FakeDashboard();
  try {
    const flows = [
      createGetAppStatusFlow(dashboard.reader(), undefined, '.', () => SNAPSHOT_NOW),
      createAnalyzeServicePerformanceFlow(dashboard.reader(), () => SNAPSHOT_NOW),
      createAnalyzeDbBottlenecksFlow(dashboard.reader(), () => SNAPSHOT_NOW),
    ];
    for (const flow of flows) {
      const result = await flow({ ...input, service: 'missing-replica' });
      assert(!result.ok);
      assertEquals(result.error.code, 'telemetry_unknown_service');
      assertStringIncludes(result.error.message, 'service or replica name');
      assertFalse(result.error.message.includes('authentication'));
      assertEquals(result.error.provenance?.sampleCount, null);
      assertFalse(JSON.stringify(result).includes('averageDurationMs'));
    }
  } finally {
    await dashboard.close();
  }
});

Deno.test('a selected replica retains its completed service and database measurements', async () => {
  const dashboard = new FakeDashboard();
  dashboard.spanPayload = spanEnvelope([otlpSpan({
    attributes: [{ key: 'db.operation.name', value: { stringValue: 'SELECT' } }],
  })]);
  try {
    const replicaInput = { ...input, service: 'api-api-1' };
    for (
      const flow of [
        createAnalyzeServicePerformanceFlow(dashboard.reader(), () => SNAPSHOT_NOW),
        createAnalyzeDbBottlenecksFlow(dashboard.reader(), () => SNAPSHOT_NOW),
      ]
    ) {
      const result = await flow(replicaInput);
      assert(result.ok);
      assertEquals(Reflect.get(result.value as object, 'sampleCount'), 1);
    }
    const result = await createGetAppStatusFlow(
      dashboard.reader(),
      undefined,
      '.',
      () => SNAPSHOT_NOW,
    )(replicaInput);
    assert(result.ok);
    assertEquals(Reflect.get(result.value as object, 'counts').resources, 1);
  } finally {
    await dashboard.close();
  }
});
