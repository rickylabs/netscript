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
  assertEquals(captured?.attributes?.[SagaAttributes.SAGA_CORRELATION_KEY], '42');
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
