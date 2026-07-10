import { assertEquals } from '@std/assert';
import { SpanKind, SpanStatusCode } from '@netscript/telemetry';
import { InMemorySpanRecorder } from '@netscript/telemetry/testing';
import { createOtelSdkSpanLink } from '@netscript/telemetry/otel';
import {
  createOtelSagaTracer,
  createSagaTelemetry,
  SagaAttributes,
  SagaMetricNames,
} from '../../src/telemetry/mod.ts';
import type { MeterPort, ObservableCallback } from '@netscript/telemetry';

Deno.test('createOtelSagaTracer attaches real SDK fan-in links with saga attributes', () => {
  const recorder = new InMemorySpanRecorder();
  const tracer = createOtelSagaTracer({
    tracer: recorder,
    spanLinks: createOtelSdkSpanLink(),
  });
  const span = tracer.startSpan('saga.handle', {
    kind: 'consumer',
    attributes: { [SagaAttributes.SAGA_ID]: 'orders' },
    links: [{
      traceparent: '00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01',
      attributes: {
        [SagaAttributes.SAGA_ID]: 'orders',
        [SagaAttributes.SAGA_EVENT_TYPE]: 'order.submitted',
      },
    }],
  });
  span.setStatus('ok');
  span.end();

  const snapshot = recorder.snapshots()[0];
  assertEquals(snapshot?.kind, SpanKind.CONSUMER);
  assertEquals(snapshot?.status, { code: SpanStatusCode.OK, message: undefined });
  assertEquals(snapshot?.links.length, 1);
  assertEquals(snapshot?.links[0]?.attributes?.[SagaAttributes.SAGA_ID], 'orders');
  assertEquals(snapshot?.links[0]?.attributes?.[SagaAttributes.SAGA_EVENT_TYPE], 'order.submitted');
});

Deno.test('createSagaTelemetry creates the seven shared saga instruments', () => {
  const meter = new RecordingMeterPort();
  const telemetry = createSagaTelemetry({ tracer: new InMemorySpanRecorder(), meter });

  telemetry.recordHandleDuration({
    sagaId: 'orders',
    eventType: 'order.submitted',
    attempt: 1,
    durabilityTier: 't2',
    outcome: 'success',
    durationMs: 12,
  });
  telemetry.recordInstancesActive('orders', 2);
  telemetry.recordCompensation('orders', 'failed');
  telemetry.recordDlq({ sagaId: 'orders', errorClass: 'Error' });
  telemetry.recordIdempotencyHit('orders');
  telemetry.recordConcurrencyThrottled('orders', 'order-1');
  telemetry.recordReplayDuration('orders', 8);

  assertEquals(meter.histograms, [
    SagaMetricNames.HANDLE_DURATION_MS,
    SagaMetricNames.REPLAY_DURATION_MS,
  ]);
  assertEquals(meter.counters, [
    SagaMetricNames.COMPENSATIONS_TOTAL,
    SagaMetricNames.DLQ_TOTAL,
    SagaMetricNames.IDEMPOTENCY_HITS_TOTAL,
    SagaMetricNames.CONCURRENCY_THROTTLED_TOTAL,
  ]);
  assertEquals(meter.gauges, [SagaMetricNames.INSTANCES_ACTIVE]);
  assertEquals(meter.observedActiveInstances(), 2);
});

class RecordingMeterPort implements MeterPort {
  readonly counters: string[] = [];
  readonly histograms: string[] = [];
  readonly gauges: string[] = [];
  #callback: ObservableCallback | undefined;

  getMeter() {
    return {
      createCounter: (name: string) => {
        this.counters.push(name);
        return { add: () => {} };
      },
      createHistogram: (name: string) => {
        this.histograms.push(name);
        return { record: () => {} };
      },
      createObservableGauge: (name: string) => {
        this.gauges.push(name);
        return {
          addCallback: (callback: ObservableCallback): void => {
            this.#callback = callback;
          },
          removeCallback: (_callback: ObservableCallback): void => {},
        };
      },
    };
  }

  forceFlush(): void {}

  observedActiveInstances(): number {
    let observed = 0;
    this.#callback?.({
      observe: (value) => {
        observed = value;
      },
    });
    return observed;
  }
}
