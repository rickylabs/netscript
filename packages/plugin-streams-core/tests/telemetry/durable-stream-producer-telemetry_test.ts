import { assertEquals } from '@std/assert';
import { InMemorySpanRecorder } from '@netscript/telemetry/testing';
import { DurableStreamProducer } from '../../src/application/create-durable-stream.ts';
import type { StreamProducerClockPort } from '../../src/ports/stream-producer-clock-port.ts';
import type {
  StreamProducerAcknowledgementV1,
  StreamProducerAppendInputV1,
  StreamProducerCloseInputV1,
  StreamProducerConnectInputV1,
  StreamProducerTransportPort,
  StreamProducerTransportResultV1,
} from '../../src/ports/stream-producer-transport-port.ts';
import { createStreamsInstrumentation } from '../../src/telemetry/instrumentation.ts';
import type {
  StreamsCounterPort,
  StreamsMeter,
  StreamsMeterPort,
  StreamsMetricAttributeValue,
  StreamsObservableCallback,
  StreamsObservableGaugePort,
} from '../../src/telemetry/producer-metrics.ts';
import { StreamProducerMetricNames } from '../../src/telemetry/attributes.ts';
import { createStreamTopicFixture } from '../../src/testing/mod.ts';

interface CounterRecord {
  readonly value: number;
  readonly attributes?: Readonly<Record<string, StreamsMetricAttributeValue>>;
}

class RecordingMeterPort implements StreamsMeterPort {
  readonly counters = new Map<string, CounterRecord[]>();
  readonly #gauges = new Map<string, StreamsObservableCallback[]>();

  getMeter(_name: string, _version?: string): StreamsMeter {
    return {
      createCounter: (name): StreamsCounterPort => ({
        add: (value, attributes) => {
          const records = this.counters.get(name) ?? [];
          records.push({ value, attributes });
          this.counters.set(name, records);
        },
      }),
      createObservableGauge: (name): StreamsObservableGaugePort => ({
        addCallback: (callback) => {
          const callbacks = this.#gauges.get(name) ?? [];
          callbacks.push(callback);
          this.#gauges.set(name, callbacks);
        },
        removeCallback: (callback) => {
          const callbacks = this.#gauges.get(name) ?? [];
          this.#gauges.set(name, callbacks.filter((candidate) => candidate !== callback));
        },
      }),
    };
  }

  forceFlush(): void {
    // Measurements are recorded synchronously by this test adapter.
  }

  count(name: string): number {
    return (this.counters.get(name) ?? []).reduce((sum, record) => sum + record.value, 0);
  }

  async observations(name: string): Promise<number[]> {
    const values: number[] = [];
    for (const callback of this.#gauges.get(name) ?? []) {
      await callback({ observe: (value) => values.push(value) });
    }
    return values;
  }
}

class ImmediateClock implements StreamProducerClockPort {
  sleep(_delayMs: number, _options?: Readonly<{ signal?: AbortSignal }>): Promise<void> {
    return Promise.resolve();
  }
}

class RetryOnceTransport implements StreamProducerTransportPort {
  readonly appends: StreamProducerAppendInputV1[] = [];

  connect(_input: StreamProducerConnectInputV1): Promise<StreamProducerTransportResultV1<void>> {
    return Promise.resolve({ ok: true, value: undefined });
  }

  append(
    input: StreamProducerAppendInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    this.appends.push(input);
    if (this.appends.length === 1) {
      return Promise.resolve({
        ok: false,
        failure: { kind: 'retryable', message: 'planned outage' },
      });
    }
    return Promise.resolve({ ok: true, value: { duplicate: false } });
  }

  close(
    _input: StreamProducerCloseInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    return Promise.resolve({ ok: true, value: { duplicate: false } });
  }
}

class AlwaysRetryAppendTransport extends RetryOnceTransport {
  override append(
    input: StreamProducerAppendInputV1,
  ): Promise<StreamProducerTransportResultV1<StreamProducerAcknowledgementV1>> {
    this.appends.push(input);
    return Promise.resolve({
      ok: false,
      failure: { kind: 'retryable', message: 'still offline' },
    });
  }
}

Deno.test('one publish span and trace identity survive retry through receipt settlement', async () => {
  const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://streams.test');
  const spans = new InMemorySpanRecorder();
  const meter = new RecordingMeterPort();
  const transport = new RetryOnceTransport();
  const producer = new DurableStreamProducer({
    streamPath: '/telemetry/reconnect',
    schema: createStreamTopicFixture(),
    producerId: 'telemetry-producer',
    instrumentation: createStreamsInstrumentation({ tracer: spans, meter }),
    transport,
    clock: new ImmediateClock(),
    reconnectPolicy: { initialDelayMs: 0, maxDelayMs: 0, jitterRatio: 0 },
  });

  try {
    const receipt = producer.upsert('execution', { id: 'execution-1' });
    assertEquals(spans.snapshots()[0]?.ended, false);
    assertEquals(await receipt.completion, { status: 'delivered', attempts: 2 });

    const span = spans.snapshots()[0];
    assertEquals(span?.ended, true);
    assertEquals(span?.events.map((event) => event.name), [
      'stream.producer.buffered',
      'stream.producer.retry',
      'stream.producer.recovered',
      'stream.producer.settled',
    ]);
    assertEquals(transport.appends.length, 2);
    assertEquals(transport.appends[0]?.body, transport.appends[1]?.body);
    assertEquals(transport.appends[0]?.identity, transport.appends[1]?.identity);

    const event = JSON.parse(transport.appends[0]!.body) as {
      headers: { traceparent: string };
    };
    assertEquals(event.headers.traceparent.split('-')[1], span?.spanContext.traceId);
    assertEquals(meter.count(StreamProducerMetricNames.RETRIES), 1);
    assertEquals(meter.count(StreamProducerMetricNames.RECOVERIES), 1);
    assertEquals(meter.count(StreamProducerMetricNames.WRITES_DELIVERED), 1);
    assertEquals(meter.count(StreamProducerMetricNames.STATE_TRANSITIONS) > 0, true);
    assertEquals(await meter.observations(StreamProducerMetricNames.BUFFERED_EVENTS), [0]);
    assertEquals(await meter.observations(StreamProducerMetricNames.BUFFERED_BYTES), [0]);
  } finally {
    await producer.close();
    if (previousUrl === undefined) {
      Deno.env.delete('DURABLE_STREAMS_URL');
    } else {
      Deno.env.set('DURABLE_STREAMS_URL', previousUrl);
    }
  }
});

Deno.test('producer metrics distinguish rejected, dropped, and delivery-unknown writes', async () => {
  const previousUrl = Deno.env.get('DURABLE_STREAMS_URL');
  Deno.env.set('DURABLE_STREAMS_URL', 'http://streams.test');

  try {
    const rejectedMeter = new RecordingMeterPort();
    const rejectedProducer = new DurableStreamProducer({
      streamPath: '/telemetry/rejected',
      schema: createStreamTopicFixture(),
      producerId: 'rejected-producer',
      instrumentation: createStreamsInstrumentation({ meter: rejectedMeter }),
      transport: new RetryOnceTransport(),
      clock: new ImmediateClock(),
      bufferPolicy: { maxEvents: 1 },
    });
    const accepted = rejectedProducer.upsert('execution', { id: 'accepted' });
    const rejected = rejectedProducer.upsert('execution', { id: 'rejected' });
    assertEquals((await rejected.completion).status, 'rejected');
    assertEquals(rejectedMeter.count(StreamProducerMetricNames.WRITES_REJECTED), 1);
    await accepted.completion;
    await rejectedProducer.close();

    const droppedMeter = new RecordingMeterPort();
    const droppedProducer = new DurableStreamProducer({
      streamPath: '/telemetry/dropped',
      schema: createStreamTopicFixture(),
      producerId: 'dropped-producer',
      instrumentation: createStreamsInstrumentation({ meter: droppedMeter }),
      transport: new RetryOnceTransport(),
      clock: new ImmediateClock(),
    });
    const dropped = droppedProducer.upsert('execution', { id: 'dropped' });
    await droppedProducer.stop();
    assertEquals((await dropped.completion).status, 'cancelled');
    assertEquals(droppedMeter.count(StreamProducerMetricNames.WRITES_DROPPED), 1);

    const unknownMeter = new RecordingMeterPort();
    const unknownProducer = new DurableStreamProducer({
      streamPath: '/telemetry/unknown',
      schema: createStreamTopicFixture(),
      producerId: 'unknown-producer',
      instrumentation: createStreamsInstrumentation({ meter: unknownMeter }),
      transport: new AlwaysRetryAppendTransport(),
      clock: new ImmediateClock(),
      reconnectPolicy: { maxAttempts: 1 },
    });
    const unknown = unknownProducer.upsert('execution', { id: 'unknown' });
    assertEquals((await unknown.completion).status, 'delivery-unknown');
    assertEquals(unknownMeter.count(StreamProducerMetricNames.DELIVERY_UNKNOWN), 1);
    await unknownProducer.stop();
  } finally {
    if (previousUrl === undefined) {
      Deno.env.delete('DURABLE_STREAMS_URL');
    } else {
      Deno.env.set('DURABLE_STREAMS_URL', previousUrl);
    }
  }
});
