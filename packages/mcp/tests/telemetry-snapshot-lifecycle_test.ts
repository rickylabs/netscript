import { assert, assertEquals, assertRejects } from '@std/assert';
import { AspireTelemetrySnapshot } from '../src/infrastructure/telemetry/aspire-telemetry-snapshot.ts';
import { executeAspireCliCommand } from '../src/infrastructure/service-endpoints/aspire-cli-command.ts';
import { createAnalyzeServicePerformanceFlow } from '../src/application/flows/analyze-service-performance-flow.ts';
import {
  FakeDashboard,
  otlpSpan,
  SNAPSHOT_NOW,
  spanEnvelope,
} from './telemetry-dashboard-fixtures.ts';

const request = { sinceUnixMs: SNAPSHOT_NOW - 60_000, untilUnixMs: SNAPSHOT_NOW };

Deno.test('malformed JSON, connection errors and cancellation cannot become empty success', async () => {
  for (const mode of ['json', 'html', 'empty', 'network', 'cancelled'] as const) {
    const source = new AspireTelemetrySnapshot({
      projectRoot: '/fixture/project',
      endpoint: 'http://dashboard.invalid',
      fetch: (_input, init) => {
        assert(init?.signal);
        if (mode === 'network') return Promise.reject(new TypeError('private transport config'));
        if (mode === 'cancelled') {
          return new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(init.signal?.reason), {
              once: true,
            });
          });
        }
        return Promise.resolve(
          new Response(
            mode === 'empty' ? '' : mode === 'html' ? '<html>login</html>' : 'invalid json',
          ),
        );
      },
    });
    const controller = new AbortController();
    const pending = source.readSnapshot(request, controller.signal);
    if (mode === 'cancelled') setTimeout(() => controller.abort(), 0);
    const result = await pending;
    assert(!result.ok);
    assertEquals(result.code, 'telemetry_unavailable');
    assertEquals(result.provenance.sampleCount, null);
  }
});

Deno.test('oversized HTTP snapshots fail within the byte budget', async () => {
  let cancelled = false;
  const source = new AspireTelemetrySnapshot({
    projectRoot: '/fixture/project',
    endpoint: 'http://dashboard.invalid',
    fetch: () =>
      Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            pull(controller) {
              controller.enqueue(new Uint8Array(1024 * 1024));
            },
            cancel() {
              cancelled = true;
            },
          }),
        ),
      ),
  });
  const result = await source.readSnapshot(request, new AbortController().signal);
  assert(!result.ok);
  assertEquals(result.code, 'telemetry_unavailable');
  assert(cancelled);
});

Deno.test('incomplete spans never produce a zero-latency service measurement', async () => {
  const dashboard = new FakeDashboard();
  try {
    dashboard.spanPayload = spanEnvelope([otlpSpan({ endTimeUnixNano: undefined })]);
    const result = await createAnalyzeServicePerformanceFlow(
      dashboard.reader(),
      () => SNAPSHOT_NOW,
    )({ service: 'api', sinceUnixMs: request.sinceUnixMs });
    assert(!result.ok);
    assertEquals(result.error.code, 'telemetry_no_completed_samples');
    assertEquals(result.error.provenance?.sampleCount, 1);
  } finally {
    await dashboard.close();
  }
});

Deno.test('Aspire command cancellation reaps a quiet child that ignores SIGTERM', async () => {
  if (Deno.build.os === 'windows') return;
  const directory = await Deno.makeTempDir();
  const ready = `${directory}/ready`;
  const watcher = Deno.watchFs(directory);
  const controller = new AbortController();
  try {
    const command = executeAspireCliCommand(Deno.execPath(), [
      'eval',
      `Deno.addSignalListener('SIGTERM', () => {}); Deno.writeTextFileSync(${
        JSON.stringify(ready)
      }, 'ready'); await new Promise(() => {});`,
    ], controller.signal);
    const reject = assertRejects(() => command, DOMException, 'aborted');
    for await (const event of watcher) {
      if (event.paths.includes(ready)) break;
    }
    controller.abort();
    await reject;
    // The command promise settles only after output/status are collected; Deno's resource
    // sanitizer also rejects a leaked child or an uncleared escalation timer.
  } finally {
    watcher.close();
    await Deno.remove(directory, { recursive: true });
  }
});

Deno.test('one failed HTTP read cancels and settles its in-flight siblings before returning', async () => {
  let active = 0;
  const source = new AspireTelemetrySnapshot({
    projectRoot: '/fixture/project',
    endpoint: 'http://dashboard.invalid',
    fetch: (input, init) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith('/spans')) {
        return Promise.resolve(new Response('not found', { status: 404 }));
      }
      active++;
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          active--;
          reject(init.signal?.reason);
        }, { once: true });
      });
    },
  });
  const result = await source.readSnapshot(
    { ...request, service: 'missing', includeHealth: true },
    new AbortController().signal,
  );
  assert(!result.ok);
  assertEquals(result.code, 'telemetry_unknown_service');
  assertEquals(active, 0);
});
