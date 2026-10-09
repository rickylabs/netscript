import { assert, assertEquals, assertRejects } from '@std/assert';
import { context, ROOT_CONTEXT, SpanKind, trace } from '@opentelemetry/api';
import { createOtelCommandTelemetryPort, type OtelCommandTelemetrySpan } from '../../commands.ts';
import {
  contextWithSpan,
  extractContext,
  getSpanFromContext,
  injectContext,
} from '../../context.ts';
import { getActiveContext } from '../../tracer.ts';
import { done, recording, start } from './native-fixture.ts';

Deno.test('command adapter creates native INTERNAL server child and preserves result identity', async () => {
  await Promise.resolve();
  await recording(async (tracer, exporter) => {
    await Promise.resolve();
    const definitions: { name: string; definitionVersion: number }[] = [{
      name: start.name,
      definitionVersion: 1,
    }];
    const port = createOtelCommandTelemetryPort({ definitions, tracer });
    definitions[0]!.name = 'mutated';
    const server = tracer.startSpan('rpc', { kind: SpanKind.SERVER });
    const value = {};
    const result = await context.with(
      contextWithSpan(server),
      () =>
        port.trace(Object.assign({}, start, { payload: 'SECRET' }), async (span) => {
          await Promise.resolve();
          assertEquals(
            trace.getActiveSpan()?.spanContext().spanId === server.spanContext().spanId,
            false,
          );
          span.finish(done);
          return value;
        }),
    );
    server.end();
    assert(result === value);
    const spans = exporter.getFinishedSpans();
    const command = spans.find((s) => s.name === 'command.execute');
    assert(command);
    assertEquals(command.kind, SpanKind.INTERNAL);
    assertEquals(command.parentSpanContext?.spanId, server.spanContext().spanId);
    assertEquals(command.spanContext().traceId, server.spanContext().traceId);
    assertEquals(command.status, { code: 1 });
    assertEquals(command.events, []);
    assertEquals(
      Object.keys(command.attributes).sort(),
      [
        'netscript.command.name',
        'netscript.command.definition.version',
        'netscript.command.outcome',
        'netscript.command.idempotency',
        'netscript.command.isolation',
        'netscript.command.store.provider',
        'netscript.command.audit.count',
        'netscript.command.outbox.count',
      ].sort(),
    );
    assertEquals(JSON.stringify(command.attributes).includes('SECRET'), false);
  });
});

Deno.test('command publication creates native PRODUCER W3C consumer and deferred link relationships', async () => {
  await Promise.resolve();
  await recording(async (tracer, exporter) => {
    await Promise.resolve();
    const port = createOtelCommandTelemetryPort({ definitions: [start], tracer });
    let propagated: Record<string, string> = {};
    let publicationId = '';
    await port.traceRelay(start, async (relay) => {
      await Promise.resolve();
      await port.tracePublish(start, async (publish) => {
        await Promise.resolve();
        publicationId = trace.getActiveSpan()!.spanContext().spanId;
        propagated = injectContext({}, getActiveContext());
        publish.finish(done);
      });
      relay.finish(done);
    });
    const parent = extractContext(propagated);
    const consumer = tracer.startSpan('worker.consume', { kind: SpanKind.CONSUMER }, parent);
    consumer.end();
    const remote = getSpanFromContext(parent)!;
    const deferred = tracer.startSpan('saga.deferred', {
      kind: SpanKind.CONSUMER,
      root: true,
      links: [{ context: remote.spanContext() }],
    }, ROOT_CONTEXT);
    deferred.end();
    const spans = exporter.getFinishedSpans();
    const producer = spans.find((s) => s.name === 'command.outbox.publish')!;
    const relay = spans.find((s) => s.name === 'command.outbox.relay')!;
    assertEquals(producer.kind, SpanKind.PRODUCER);
    assertEquals(relay.kind, SpanKind.INTERNAL);
    assertEquals(producer.parentSpanContext?.spanId, relay.spanContext().spanId);
    const received = spans.find((s) => s.name === 'worker.consume')!;
    assertEquals(received.parentSpanContext?.spanId, publicationId);
    assertEquals(received.spanContext().traceId, producer.spanContext().traceId);
    const linked = spans.find((s) => s.name === 'saga.deferred')!;
    assertEquals(linked.parentSpanContext, undefined);
    assertEquals(linked.links.map((l) => l.context.spanId), [publicationId]);
    assertEquals(linked.spanContext().traceId === producer.spanContext().traceId, false);
  });
});

Deno.test('command adapter ends once ignores retained finish and preserves secret error identity', async () => {
  await Promise.resolve();
  await recording(async (tracer, exporter) => {
    await Promise.resolve();
    const port = createOtelCommandTelemetryPort({ definitions: [start], tracer });
    let retained: OtelCommandTelemetrySpan | undefined;
    let calls = 0;
    const error = new Error('SECRET driver payload actor key');
    try {
      await port.trace(start, async (span) => {
        await Promise.resolve();
        retained = span;
        calls++;
        throw error;
      });
    } catch (caught) {
      assert(caught === error);
    }
    retained!.finish(done);
    assertEquals(calls, 1);
    const spans = exporter.getFinishedSpans();
    assertEquals(spans.length, 1);
    assertEquals(spans[0]!.status, { code: 2 });
    assertEquals(spans[0]!.attributes['netscript.command.outcome'], 'failed');
    assertEquals(spans[0]!.events, []);
    assertEquals(
      JSON.stringify({
        attributes: spans[0]!.attributes,
        status: spans[0]!.status,
        events: spans[0]!.events,
      }).includes('SECRET'),
      false,
    );
    await assertRejects(
      () =>
        port.trace(start, async () => {
          await Promise.resolve();
          throw error;
        }),
      Error,
      'SECRET',
    );
  });
});
