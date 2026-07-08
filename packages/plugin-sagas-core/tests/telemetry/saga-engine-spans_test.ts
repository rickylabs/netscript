import { assert, assertEquals, assertRejects } from '@std/assert';

import { defineSaga, sagaComplete } from '../../mod.ts';
import type { SagaCorrelationKey, SagaDefinition, SagaState } from '../../src/domain/mod.ts';
import { createSagaEngine, createSagaRuntime } from '../../src/runtime/mod.ts';
import {
  SagaAttributes,
  SagaInstrumentation,
  SagaSpanEvents,
  SagaSpanNames,
  type SagaTelemetryAttributes,
  SagaTelemetryOutcomes,
  type SagaTelemetrySpan,
  type SagaTelemetrySpanKind,
  type SagaTelemetryStatus,
  type SagaTraceParent,
} from '../../src/telemetry/mod.ts';

Deno.test('SagaEngine emits one successful saga.handle span for a handled message', async () => {
  const telemetry = new RecordingTelemetry();
  const engine = createSagaEngine({
    instrumentation: telemetry.instrumentation,
  });
  const traceparent = '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01';
  const definition = defineSaga('telemetry-success')
    .state<SagaState>({ count: 0 })
    .durability('t2')
    .on('counter.incremented', (saga) => {
      saga.state = { count: Number(saga.state.count ?? 0) + 1 };
      return [sagaComplete()];
    })
    .build() as SagaDefinition;

  await engine.register([definition]);
  await engine.start();
  try {
    const results = await engine.handle({
      type: 'counter.incremented',
      payload: {},
      correlationKey: 'counter-1' as SagaCorrelationKey,
      traceparent,
      tracestate: 'vendor=value',
    });

    assertEquals(results.length, 1);
    assertEquals(telemetry.spans.length, 1);
    const span = telemetry.spans[0];
    assertEquals(span.name, SagaSpanNames.HANDLE);
    assertEquals(span.kind, 'internal');
    assertEquals(span.parent, { traceparent, tracestate: 'vendor=value' });
    assertEquals(span.attributes[SagaAttributes.SAGA_ID], 'telemetry-success');
    assertEquals(span.attributes[SagaAttributes.SAGA_INSTANCE_ID], 'telemetry-success:counter-1');
    assertEquals(span.attributes[SagaAttributes.SAGA_EVENT_TYPE], 'counter.incremented');
    assertEquals(span.attributes[SagaAttributes.SAGA_ATTEMPT], 1);
    assertEquals(span.attributes[SagaAttributes.SAGA_DURABILITY_TIER], 't2');
    assertEquals(span.attributes[SagaAttributes.SAGA_CORRELATION_KEY], 'counter-1');
    assertEquals(span.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.SUCCESS);
    assertEquals(span.events, [
      { name: SagaSpanEvents.STATE_BEFORE, attributes: { [SagaAttributes.STATUS]: undefined } },
      { name: SagaSpanEvents.STATE_AFTER, attributes: { [SagaAttributes.STATUS]: 'completed' } },
    ]);
    assertEquals(span.status, { status: 'ok', description: undefined });
    assertEquals(span.exceptions.length, 0);
    assertEquals(span.ended, true);
    assertEquals(telemetry.durations.length, 1);
    assertEquals(telemetry.durations[0].attributes?.[SagaAttributes.SAGA_ID], 'telemetry-success');
    assertEquals(
      telemetry.durations[0].attributes?.[SagaAttributes.SAGA_EVENT_TYPE],
      'counter.incremented',
    );
    assertEquals(telemetry.durations[0].attributes?.[SagaAttributes.OUTCOME], 'success');
    assert(telemetry.durations[0].value >= 0);
  } finally {
    await engine.stop('saga engine telemetry test complete');
  }
});

Deno.test('SagaEngine records an ERROR span and rethrows when a handler throws', async () => {
  const telemetry = new RecordingTelemetry();
  const engine = createSagaEngine({
    instrumentation: telemetry.instrumentation,
  });
  const failure = new Error('handler failed');
  const definition = defineSaga('telemetry-failure')
    .state<SagaState>({})
    .on('work.requested', () => {
      throw failure;
    })
    .build() as SagaDefinition;

  await engine.register([definition]);
  await engine.start();
  try {
    await assertRejects(
      () =>
        engine.handle({
          type: 'work.requested',
          payload: {},
          correlationKey: 'work-1' as SagaCorrelationKey,
        }),
      Error,
      'handler failed',
    );

    assertEquals(telemetry.spans.length, 1);
    const span = telemetry.spans[0];
    assertEquals(span.name, SagaSpanNames.HANDLE);
    assertEquals(span.attributes[SagaAttributes.SAGA_ID], 'telemetry-failure');
    assertEquals(span.attributes[SagaAttributes.SAGA_INSTANCE_ID], 'telemetry-failure:work-1');
    assertEquals(span.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.ERROR);
    assertEquals(span.events, [
      { name: SagaSpanEvents.STATE_BEFORE, attributes: { [SagaAttributes.STATUS]: undefined } },
    ]);
    assertEquals(span.status, { status: 'error', description: 'handler failed' });
    assertEquals(span.exceptions, [failure]);
    assertEquals(span.ended, true);
    assertEquals(telemetry.durations.length, 1);
    assertEquals(telemetry.durations[0].attributes?.[SagaAttributes.OUTCOME], 'error');
    assert(telemetry.durations[0].value >= 0);
  } finally {
    await engine.stop('saga engine telemetry failure test complete');
  }
});

Deno.test('createSagaRuntime threads native instrumentation into the saga engine', async () => {
  const telemetry = new RecordingTelemetry();
  const runtime = createSagaRuntime({
    native: {
      instrumentation: telemetry.instrumentation,
    },
  });
  const definition = defineSaga('telemetry-runtime')
    .state<SagaState>({})
    .on('work.requested', () => [sagaComplete()])
    .build() as SagaDefinition;

  await runtime.register([definition]);
  await runtime.start();
  try {
    await runtime.publish({
      type: 'work.requested',
      payload: {},
      correlationKey: 'work-1' as SagaCorrelationKey,
    });

    assertEquals(telemetry.spans.length, 1);
    assertEquals(telemetry.spans[0].name, SagaSpanNames.HANDLE);
    assertEquals(telemetry.spans[0].attributes[SagaAttributes.SAGA_ID], 'telemetry-runtime');
    assertEquals(telemetry.spans[0].attributes[SagaAttributes.OUTCOME], 'success');
    assertEquals(telemetry.spans[0].ended, true);
  } finally {
    await runtime.stop('saga runtime telemetry test complete');
  }
});

class RecordingTelemetry {
  readonly spans: RecordingSpan[] = [];
  readonly durations: Array<{
    value: number;
    attributes?: SagaTelemetryAttributes;
  }> = [];
  readonly instrumentation = new SagaInstrumentation({
    tracer: {
      startSpan: (name, options): SagaTelemetrySpan => {
        const span = new RecordingSpan(name, options.kind, options.attributes, options.parent);
        this.spans.push(span);
        return span;
      },
    },
    meter: {
      handleDurationMs: {
        record: (value, attributes): void => {
          this.durations.push({ value, attributes });
        },
      },
    },
  });
}

class RecordingSpan implements SagaTelemetrySpan {
  readonly attributes: Record<string, string | number | boolean | undefined>;
  readonly events: Array<{
    name: string;
    attributes?: SagaTelemetryAttributes;
  }> = [];
  readonly exceptions: unknown[] = [];
  status?: Readonly<{ status: SagaTelemetryStatus; description?: string }>;
  ended = false;

  constructor(
    readonly name: string,
    readonly kind: SagaTelemetrySpanKind,
    attributes: SagaTelemetryAttributes | undefined,
    readonly parent: SagaTraceParent | undefined,
  ) {
    this.attributes = { ...attributes };
  }

  setAttribute(key: string, value: string | number | boolean): void {
    this.attributes[key] = value;
  }

  addEvent(name: string, attributes?: SagaTelemetryAttributes): void {
    this.events.push({ name, attributes });
  }

  setStatus(status: SagaTelemetryStatus, description?: string): void {
    this.status = { status, description };
  }

  recordException(error: unknown): void {
    this.exceptions.push(error);
  }

  end(): void {
    this.ended = true;
  }
}
