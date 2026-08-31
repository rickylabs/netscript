import { assertEquals } from '@std/assert';
import {
  SagaAttributes,
  SagaInstrumentation,
  SagaSpanNames,
  type SagaTelemetryAttributes,
  type SagaTelemetrySpan,
  type SagaTelemetrySpanKind,
  type SagaTraceParent,
} from '../../src/telemetry/mod.ts';

Deno.test('SagaInstrumentation.startHandleSpan forwards parent trace context to tracer', () => {
  const parent: SagaTraceParent = Object.freeze({
    traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    tracestate: 'vendor=value',
  });
  let captured:
    | Readonly<{
      name: string;
      kind: SagaTelemetrySpanKind;
      attributes?: SagaTelemetryAttributes;
      parent?: SagaTraceParent;
    }>
    | undefined;
  const span = createRecordingSpan();
  const instrumentation = new SagaInstrumentation({
    tracer: {
      startSpan(name, options): SagaTelemetrySpan {
        captured = Object.freeze({ name, ...options });
        return span;
      },
    },
  });

  const returned = instrumentation.startHandleSpan({
    sagaId: 'user-registration',
    instanceId: 'user-registration:42',
    eventType: 'UserRegistered',
    attempt: 2,
    durabilityTier: 't2',
    correlationId: 'flow-b-42',
    correlationKey: '42',
    parent,
  });

  assertEquals(returned, span);
  assertEquals(captured?.name, SagaSpanNames.HANDLE);
  assertEquals(captured?.kind, 'internal');
  assertEquals(captured?.parent, parent);
  assertEquals(captured?.attributes?.[SagaAttributes.SAGA_ID], 'user-registration');
  assertEquals(captured?.attributes?.[SagaAttributes.SAGA_INSTANCE_ID], 'user-registration:42');
  assertEquals(captured?.attributes?.[SagaAttributes.SAGA_EVENT_TYPE], 'UserRegistered');
  assertEquals(captured?.attributes?.[SagaAttributes.SAGA_ATTEMPT], 2);
  assertEquals(captured?.attributes?.[SagaAttributes.SAGA_DURABILITY_TIER], 't2');
  assertEquals(captured?.attributes?.[SagaAttributes.CORRELATION_ID], 'flow-b-42');
  assertEquals(captured?.attributes?.[SagaAttributes.SAGA_CORRELATION_KEY], '42');
});

Deno.test('SagaInstrumentation gives every cascade span shared correlation context', () => {
  const parent: SagaTraceParent = Object.freeze({
    traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
  });
  const captured: Array<{
    name: string;
    attributes: Record<string, string | number | boolean | undefined>;
    parent?: SagaTraceParent;
  }> = [];
  const instrumentation = new SagaInstrumentation({
    tracer: {
      startSpan(name, options): SagaTelemetrySpan {
        const attributes = { ...options.attributes };
        captured.push({ name, attributes, parent: options.parent });
        return {
          setAttribute(key, value): void {
            attributes[key] = value;
          },
          addEvent(): void {},
          setStatus(): void {},
          recordException(): void {},
          end(): void {},
        };
      },
    },
  });
  const common = {
    sagaId: 'orders',
    instanceId: 'orders:42',
    correlationId: 'flow-b-42',
    correlationKey: 'order-42',
    parent,
  } as const;

  instrumentation.startCascadeSendSpan({ ...common, targetJobId: 'order.accepted' });
  instrumentation.startCascadeScheduleSpan({ ...common, delayMs: 10 });
  instrumentation.startCascadeSpawnSpan({ ...common, childSagaId: 'shipment' });
  const compensate = instrumentation.startCascadeCompensateSpan({
    ...common,
    reason: 'payment failed',
  });
  instrumentation.recordCompensationCascadeSize(compensate, 2);
  instrumentation.startCascadeCompleteSpan({
    ...common,
    status: 'failed',
    resultPresent: true,
  });

  assertEquals(captured.map((span) => span.name), [
    SagaSpanNames.CASCADE_SEND,
    SagaSpanNames.CASCADE_SCHEDULE,
    SagaSpanNames.CASCADE_SPAWN,
    SagaSpanNames.CASCADE_COMPENSATE,
    SagaSpanNames.CASCADE_COMPLETE,
  ]);
  for (const span of captured) {
    assertEquals(span.parent, parent);
    assertEquals(span.attributes[SagaAttributes.SAGA_ID], 'orders');
    assertEquals(span.attributes[SagaAttributes.SAGA_INSTANCE_ID], 'orders:42');
    assertEquals(span.attributes[SagaAttributes.CORRELATION_ID], 'flow-b-42');
    assertEquals(span.attributes[SagaAttributes.SAGA_CORRELATION_KEY], 'order-42');
  }
  assertEquals(
    captured[3].attributes[SagaAttributes.COMPENSATION_CASCADE_SIZE],
    2,
  );
  assertEquals(captured[4].attributes[SagaAttributes.STATUS], 'failed');
  assertEquals(captured[4].attributes[SagaAttributes.SAGA_RESULT_PRESENT], true);
});

function createRecordingSpan(): SagaTelemetrySpan {
  return {
    setAttribute(): void {},
    addEvent(): void {},
    setStatus(): void {},
    recordException(): void {},
    end(): void {},
  };
}
