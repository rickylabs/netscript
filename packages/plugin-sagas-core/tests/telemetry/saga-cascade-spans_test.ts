import { assert, assertEquals, assertRejects } from '@std/assert';

import { defineSaga, sagaCompensate, schedule, send } from '../../mod.ts';
import {
  type CascadedMessage,
  type SagaCorrelationKey,
  type SagaDefinition,
  type SagaInstanceId,
  SagasError,
  type SagaState,
} from '../../src/domain/mod.ts';
import { createSagaRuntime, SagaCompensator } from '../../src/runtime/mod.ts';
import type { SagaSchedulerPort } from '../../src/runtime/mod.ts';
import { TestSagaClock } from '../../src/testing/mod.ts';
import {
  SagaAttributes,
  SagaInstrumentation,
  SagaSpanNames,
  type SagaTelemetryAttributeValue,
  SagaTelemetryOutcomes,
  type SagaTelemetrySpan,
  type SagaTelemetryTracer,
  type SagaTraceParent,
} from '../../src/telemetry/mod.ts';

Deno.test('Saga runtime emits a compensation cascade span', async () => {
  const tracer = await runCompensationScenario();

  assert(
    tracer.spans.some((span) => span.name === SagaSpanNames.CASCADE_COMPENSATE),
    'expected saga.cascade.compensate to be started',
  );
});

Deno.test('Saga handle span carries the cross-plane correlation id', async () => {
  const tracer = await runCompensationScenario();
  const handle = tracer.spans.find((span) => span.name === SagaSpanNames.HANDLE);

  assert(handle, 'expected saga.handle to be started');
  assertEquals(handle.attributes['netscript.correlation.id'], 'order-42');
});

Deno.test('compensation and returned cascades consume engine-selected correlation and parents', async () => {
  const tracer = await runCompensationScenario();
  const handles = tracer.spans.filter((span) => span.name === SagaSpanNames.HANDLE);
  const compensate = tracer.spans.find((span) => span.name === SagaSpanNames.CASCADE_COMPENSATE);
  const cascadeSend = tracer.spans.find((span) => span.name === SagaSpanNames.CASCADE_SEND);

  assertEquals(handles.length, 2);
  assert(compensate);
  assert(cascadeSend);
  assertEquals(compensate.parent?.traceparent, handles[0].context.traceparent);
  assertEquals(cascadeSend.parent?.traceparent, compensate.context.traceparent);
  assertEquals(handles[1].parent?.traceparent, cascadeSend.context.traceparent);
  for (const span of [handles[0], compensate, cascadeSend, handles[1]]) {
    assertEquals(span.attributes[SagaAttributes.CORRELATION_ID], 'order-42');
  }
  assertEquals(
    compensate.attributes[SagaAttributes.SAGA_CORRELATION_KEY],
    'domain-order-42',
  );
  assertEquals(
    compensate.attributes[SagaAttributes.COMPENSATION_CASCADE_SIZE],
    1,
  );
  assertEquals(compensate.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.SUCCESS);
  assertEquals(cascadeSend.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.SUCCESS);
  assertEquals(compensate.ended, true);
  assertEquals(cascadeSend.ended, true);
});

Deno.test('bridge records send failures at the downstream operation', async () => {
  const tracer = new RecordingTracer();
  const runtime = createSagaRuntime({
    native: { instrumentation: new SagaInstrumentation({ tracer }) },
  });
  const definition = defineSaga('send-error-telemetry')
    .state<SagaState>({})
    .on('start', () => [send('explode', {})])
    .on('explode', () => {
      throw new Error('downstream exploded');
    })
    .build() as SagaDefinition;

  await runtime.register([definition]);
  await runtime.start();
  try {
    await assertRejects(
      () =>
        runtime.publish({
          type: 'start',
          payload: {},
          correlationKey: 'send-error-42' as SagaCorrelationKey,
        }),
      Error,
      'downstream exploded',
    );
  } finally {
    await runtime.stop('send error telemetry test complete');
  }

  const span = tracer.spans.find((candidate) => candidate.name === SagaSpanNames.CASCADE_SEND);
  assert(span);
  assertEquals(span.attributes[SagaAttributes.CORRELATION_ID], 'send-error-42');
  assertEquals(span.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.ERROR);
  assertEquals(span.status, 'error');
  assertEquals(span.ended, true);
});

Deno.test('bridge records scheduled persistence success and missing-scheduler errors', async () => {
  const successTracer = new RecordingTracer();
  const scheduler = new RecordingScheduler();
  const successRuntime = createSagaRuntime({
    native: {
      instrumentation: new SagaInstrumentation({ tracer: successTracer }),
      scheduler,
    },
  });
  const definition = defineSaga('schedule-telemetry')
    .state<SagaState>({})
    .on('start', () => [schedule({ type: 'later', payload: {} }, 10)])
    .build() as SagaDefinition;
  await successRuntime.register([definition]);
  await successRuntime.start();
  try {
    await successRuntime.publish({
      type: 'start',
      payload: {},
      correlationKey: 'schedule-42' as SagaCorrelationKey,
    });
  } finally {
    await successRuntime.stop('schedule success telemetry test complete');
  }

  const success = successTracer.spans.find(
    (candidate) => candidate.name === SagaSpanNames.CASCADE_SCHEDULE,
  );
  assert(success);
  assertEquals(scheduler.messages.length, 1);
  assertEquals(success.attributes[SagaAttributes.CORRELATION_ID], 'schedule-42');
  assertEquals(success.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.SUCCESS);
  assertEquals(success.ended, true);
  const scheduledMessage = scheduler.messages[0].message;
  assert('type' in scheduledMessage);
  assertEquals(scheduledMessage.correlationKey, 'schedule-42');
  assertEquals(scheduledMessage.traceparent, success.context.traceparent);

  const errorTracer = new RecordingTracer();
  const errorRuntime = createSagaRuntime({
    native: { instrumentation: new SagaInstrumentation({ tracer: errorTracer }) },
  });
  await errorRuntime.register([definition]);
  await errorRuntime.start();
  try {
    await assertRejects(
      () =>
        errorRuntime.publish({
          type: 'start',
          payload: {},
          correlationKey: 'schedule-error-42' as SagaCorrelationKey,
        }),
      SagasError,
      'schedule cascades require SagaScheduler',
    );
  } finally {
    await errorRuntime.stop('schedule error telemetry test complete');
  }
  const failure = errorTracer.spans.find(
    (candidate) => candidate.name === SagaSpanNames.CASCADE_SCHEDULE,
  );
  assert(failure);
  assertEquals(failure.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.ERROR);
  assertEquals(failure.status, 'error');
  assertEquals(failure.ended, true);
});

Deno.test('bridge preserves a handler-supplied scheduled correlation key', async () => {
  const tracer = new RecordingTracer();
  const scheduler = new RecordingScheduler();
  const runtime = createSagaRuntime({
    native: {
      instrumentation: new SagaInstrumentation({ tracer }),
      scheduler,
    },
  });
  const definition = defineSaga('schedule-correlation-precedence')
    .state<SagaState>({})
    .on('start', () => [
      schedule({
        type: 'later',
        payload: {},
        correlationKey: 'handler-chosen' as SagaCorrelationKey,
      }, 10),
    ])
    .build() as SagaDefinition;

  await runtime.register([definition]);
  await runtime.start();
  try {
    await runtime.publish({
      type: 'start',
      payload: {},
      correlationKey: 'upstream-42' as SagaCorrelationKey,
    });
  } finally {
    await runtime.stop('schedule precedence test complete');
  }

  const span = tracer.spans.find(
    (candidate) => candidate.name === SagaSpanNames.CASCADE_SCHEDULE,
  );
  assert(span);
  assertEquals(span.attributes[SagaAttributes.CORRELATION_ID], 'upstream-42');
  const scheduledMessage = scheduler.messages[0].message;
  assert('type' in scheduledMessage);
  assertEquals(scheduledMessage.correlationKey, 'handler-chosen');
  assertEquals(scheduledMessage.traceparent, span.context.traceparent);
});

Deno.test('send transports upstream correlation when the DSL supplies no child key', async () => {
  const tracer = new RecordingTracer();
  const runtime = createSagaRuntime({
    native: { instrumentation: new SagaInstrumentation({ tracer }) },
  });
  const definition = defineSaga('send-correlation-transport')
    .state<SagaState>({})
    .on('start', () => [send('next', {})])
    .on('next', () => [])
    .build() as SagaDefinition;

  await runtime.register([definition]);
  await runtime.start();
  try {
    await runtime.publish({
      type: 'start',
      payload: {},
      correlationKey: 'upstream-42' as SagaCorrelationKey,
    });
  } finally {
    await runtime.stop('send correlation transport test complete');
  }

  const handles = tracer.spans.filter((span) => span.name === SagaSpanNames.HANDLE);
  assertEquals(handles.length, 2);
  assertEquals(handles[1].attributes[SagaAttributes.CORRELATION_ID], 'upstream-42');
  assertEquals(
    handles[1].attributes[SagaAttributes.SAGA_CORRELATION_KEY],
    'upstream-42',
  );
});

Deno.test('bridge records unsupported structural spawn as error-only', async () => {
  const tracer = new RecordingTracer();
  const runtime = createSagaRuntime({
    native: { instrumentation: new SagaInstrumentation({ tracer }) },
  });
  const messages = JSON.parse('[{"kind":"spawn","sagaId":"ChildSaga","input":{}}]');

  await assertRejects(
    () => runtime.dispatchCascaded(messages),
    SagasError,
    'Spawn cascades are unsupported.',
  );

  const span = tracer.spans[0];
  assertEquals(span.name, SagaSpanNames.CASCADE_SPAWN);
  assertEquals(span.attributes[SagaAttributes.CHILD_SAGA_ID], 'ChildSaga');
  assertEquals(span.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.ERROR);
  assertEquals(span.status, 'error');
  assertEquals(span.ended, true);
});

Deno.test('SagaCompensator records missing handlers as skipped without deriving correlation', async () => {
  const tracer = new RecordingTracer();
  const instrumentation = new SagaInstrumentation({ tracer });
  const compensator = new SagaCompensator({ clock: new TestSagaClock(), instrumentation });
  const definition = defineSaga('missing-compensation-telemetry')
    .state<SagaState>({})
    .on('order.created', () => [])
    .build() as SagaDefinition;

  const result = await compensator.compensate({
    definition,
    instanceId: 'missing-compensation-telemetry:42' as SagaInstanceId,
    state: {},
    message: {
      type: 'order.created',
      payload: {},
      correlationKey: 'message-fallback' as SagaCorrelationKey,
    },
  });

  assertEquals(result.compensated, false);
  const span = tracer.spans[0];
  assertEquals(span.attributes[SagaAttributes.CORRELATION_ID], undefined);
  assertEquals(span.attributes[SagaAttributes.SAGA_CORRELATION_KEY], undefined);
  assertEquals(span.attributes[SagaAttributes.COMPENSATION_CASCADE_SIZE], 0);
  assertEquals(span.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.SKIPPED);
  assertEquals(span.ended, true);
});

Deno.test('SagaCompensator rejects a registered handler when engine correlation context is absent', async () => {
  const tracer = new RecordingTracer();
  const compensator = new SagaCompensator({
    clock: new TestSagaClock(),
    instrumentation: new SagaInstrumentation({ tracer }),
  });
  const definition = defineSaga('no-correlation-fallback')
    .state<SagaState>({})
    .on('order.created', () => [])
    .compensate('order.created', () => [])
    .build() as SagaDefinition;

  const error = await assertRejects(
    () =>
      compensator.compensate({
        definition,
        instanceId: 'no-correlation-fallback:42' as SagaInstanceId,
        state: {},
        message: {
          type: 'order.created',
          payload: {},
          correlationKey: 'must-not-be-used' as SagaCorrelationKey,
        },
      }),
    SagasError,
    'requires an engine-resolved correlationKey',
  );

  assertEquals(error.code, 'SAGA_VALIDATION_FAILED');
  const span = tracer.spans[0];
  assertEquals(span.attributes[SagaAttributes.SAGA_CORRELATION_KEY], undefined);
  assertEquals(span.attributes[SagaAttributes.OUTCOME], SagaTelemetryOutcomes.ERROR);
  assertEquals(span.status, 'error');
  assertEquals(span.ended, true);
});

Deno.test('SagaCompensator preserves message trace context when no span context exists', async () => {
  const compensator = new SagaCompensator({ clock: new TestSagaClock() });
  let observedTraceparent: string | undefined;
  const definition = defineSaga('compensation-message-trace')
    .state<SagaState>({})
    .on('undo', () => [])
    .compensate('undo', (_saga, _message, context) => {
      observedTraceparent = context.traceparent;
      return [];
    })
    .build() as SagaDefinition;

  await compensator.compensate({
    definition,
    instanceId: 'compensation-message-trace:42' as SagaInstanceId,
    state: {},
    message: {
      type: 'undo',
      payload: {},
      traceparent: `00-${'b'.repeat(32)}-${'c'.repeat(16)}-01`,
    },
    correlationKey: 'domain-42' as SagaCorrelationKey,
  });

  assertEquals(
    observedTraceparent,
    `00-${'b'.repeat(32)}-${'c'.repeat(16)}-01`,
  );
});

Deno.test('SagaCompensator records thrown and nested-deferred compensation as errors', async () => {
  const thrownTracer = new RecordingTracer();
  const thrownInstrumentation = new SagaInstrumentation({ tracer: thrownTracer });
  const compensator = new SagaCompensator({
    clock: new TestSagaClock(),
    instrumentation: thrownInstrumentation,
  });
  const definition = defineSaga('compensation-errors')
    .state<SagaState>({})
    .on('undo', () => [])
    .compensate('undo', () => {
      throw new Error('undo failed');
    })
    .build() as SagaDefinition;

  await assertRejects(
    () =>
      compensator.compensate({
        definition,
        instanceId: 'compensation-errors:42' as SagaInstanceId,
        state: {},
        message: { type: 'undo', payload: {} },
        correlationId: 'flow-b-42',
        correlationKey: 'domain-42' as SagaCorrelationKey,
      }),
    Error,
    'undo failed',
  );
  assertEquals(
    thrownTracer.spans[0].attributes[SagaAttributes.OUTCOME],
    SagaTelemetryOutcomes.ERROR,
  );
  assertEquals(thrownTracer.spans[0].ended, true);

  const nestedTracer = new RecordingTracer();
  const nestedInstrumentation = new SagaInstrumentation({ tracer: nestedTracer });
  const nested = sagaCompensate(sagaCompensate({ type: 'undo', payload: {} }));
  await assertRejects(
    () =>
      compensator.compensateCascaded(
        definition,
        'compensation-errors:42' as SagaInstanceId,
        {},
        nested,
        {
          correlationId: 'flow-b-42',
          correlationKey: 'domain-42' as SagaCorrelationKey,
          instrumentation: nestedInstrumentation,
        },
      ),
    SagasError,
    'Nested cascaded compensation is deferred',
  );
  assertEquals(
    nestedTracer.spans[0].attributes[SagaAttributes.COMPENSATION_CASCADE_SIZE],
    0,
  );
  assertEquals(
    nestedTracer.spans[0].attributes[SagaAttributes.OUTCOME],
    SagaTelemetryOutcomes.ERROR,
  );
  assertEquals(nestedTracer.spans[0].ended, true);
});

async function runCompensationScenario(): Promise<RecordingTracer> {
  const tracer = new RecordingTracer();
  const runtime = createSagaRuntime({
    native: {
      instrumentation: new SagaInstrumentation({ tracer }),
      compensator: new SagaCompensator({ clock: new TestSagaClock() }),
    },
  });
  const definition = defineSaga('compensation-telemetry')
    .state<SagaState>({})
    .correlate(() => 'domain-order-42' as SagaCorrelationKey)
    .on('order.rejected', () => [
      sagaCompensate(
        { type: 'payment.refund', payload: {} },
        'inventory unavailable',
      ),
    ])
    .on('compensation.done', () => [])
    .compensate('payment.refund', () => [send('compensation.done', {})])
    .build() as SagaDefinition;

  await runtime.register([definition]);
  await runtime.start();
  try {
    await runtime.publish({
      type: 'order.rejected',
      payload: {},
      correlationKey: 'order-42' as SagaCorrelationKey,
    });
  } finally {
    await runtime.stop('saga cascade red-before complete');
  }

  return tracer;
}

type RecordedSpan = Readonly<{
  name: string;
  attributes: Record<string, SagaTelemetryAttributeValue>;
  parent?: SagaTraceParent;
  context: SagaTraceParent;
  status?: 'ok' | 'error';
  ended: boolean;
}>;

class RecordingTracer implements SagaTelemetryTracer {
  readonly spans: RecordedSpan[] = [];

  startSpan(
    name: string,
    options: Parameters<SagaTelemetryTracer['startSpan']>[1],
  ): SagaTelemetrySpan {
    const attributes: Record<string, SagaTelemetryAttributeValue> = {
      ...options.attributes,
    };
    const context = Object.freeze({
      traceparent: `00-${'a'.repeat(32)}-${
        (this.spans.length + 1).toString(16).padStart(16, '0')
      }-01`,
    });
    const recorded = {
      name,
      attributes,
      parent: options.parent,
      context,
      status: undefined as 'ok' | 'error' | undefined,
      ended: false,
    };
    this.spans.push(recorded);
    return {
      spanContext(): SagaTraceParent {
        return context;
      },
      setAttribute(key, value): void {
        attributes[key] = value;
      },
      addEvent(): void {},
      setStatus(status): void {
        recorded.status = status;
      },
      recordException(): void {},
      end(): void {
        recorded.ended = true;
      },
    };
  }
}

class RecordingScheduler implements SagaSchedulerPort {
  readonly id = 'recording-scheduler';
  readonly messages: CascadedMessage<'scheduled'>[] = [];

  start(): Promise<void> {
    return Promise.resolve();
  }

  stop(): Promise<void> {
    return Promise.resolve();
  }

  scheduleCascaded(message: CascadedMessage<'scheduled'>): Promise<void> {
    this.messages.push(message);
    return Promise.resolve();
  }
}
