import { assert, assertEquals } from '@std/assert';

import { defineSaga, sagaCompensate } from '../../mod.ts';
import type { SagaCorrelationKey, SagaDefinition, SagaState } from '../../src/domain/mod.ts';
import { createSagaRuntime, SagaCompensator } from '../../src/runtime/mod.ts';
import { TestSagaClock } from '../../src/testing/mod.ts';
import {
  SagaInstrumentation,
  SagaSpanNames,
  type SagaTelemetryAttributeValue,
  type SagaTelemetrySpan,
  type SagaTelemetryTracer,
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
    .on('order.rejected', () => [
      sagaCompensate(
        { type: 'payment.refund', payload: {} },
        'inventory unavailable',
      ),
    ])
    .compensate('payment.refund', () => [])
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
    this.spans.push({ name, attributes });
    return {
      setAttribute(key, value): void {
        attributes[key] = value;
      },
      addEvent(): void {},
      setStatus(): void {},
      recordException(): void {},
      end(): void {},
    };
  }
}
