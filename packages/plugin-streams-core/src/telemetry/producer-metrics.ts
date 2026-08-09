import type {
  StreamProducerStateSnapshotV1,
  StreamWriteOutcomeV1,
  StreamWriteRejectionReasonV1,
} from '../domain/producer-contract-v1.ts';
import { CORE_PACKAGE_VERSION } from '../package-metadata.generated.ts';
import { OtelDenoMeter } from '@netscript/telemetry/otel';
import { StreamAttributes, StreamProducerMetricNames } from './attributes.ts';

/** Attribute value used by producer metric ports. */
export type StreamsMetricAttributeValue = string | number | boolean;

/** Counter instrument used by reconnect telemetry. */
export interface StreamsCounterPort {
  /** Add one value with bounded producer attributes. */
  add(value: number, attributes?: Readonly<Record<string, StreamsMetricAttributeValue>>): void;
}

/** Result sink used when observing buffered producer values. */
export interface StreamsObservableResultPort {
  /** Observe one current value with bounded producer attributes. */
  observe(value: number, attributes?: Readonly<Record<string, StreamsMetricAttributeValue>>): void;
}

/** Callback used by an observable producer gauge. */
export type StreamsObservableCallback = (
  result: StreamsObservableResultPort,
) => void | Promise<void>;

/** Observable gauge used for bounded producer queue values. */
export interface StreamsObservableGaugePort {
  /** Register a collection callback. */
  addCallback(callback: StreamsObservableCallback): void;
  /** Remove a collection callback. */
  removeCallback(callback: StreamsObservableCallback): void;
}

/** Minimal meter used by reconnect telemetry. */
export interface StreamsMeter {
  /** Create an additive counter. */
  createCounter(
    name: string,
    options?: Readonly<{ description?: string; unit?: string }>,
  ): StreamsCounterPort;
  /** Create an asynchronous gauge. */
  createObservableGauge(
    name: string,
    options?: Readonly<{ description?: string; unit?: string }>,
  ): StreamsObservableGaugePort;
}

/** Minimal meter provider dependency used by stream instrumentation. */
export interface StreamsMeterPort {
  /** Obtain a meter for the streams instrumentation scope. */
  getMeter(name: string, version?: string): StreamsMeter;
}

interface ProducerMetricInstruments {
  readonly bufferedEvents: StreamsObservableGaugePort;
  readonly bufferedBytes: StreamsObservableGaugePort;
  readonly writesDelivered: StreamsCounterPort;
  readonly writesRejected: StreamsCounterPort;
  readonly writesDropped: StreamsCounterPort;
  readonly retries: StreamsCounterPort;
  readonly recoveries: StreamsCounterPort;
  readonly deliveryUnknown: StreamsCounterPort;
  readonly stateTransitions: StreamsCounterPort;
}

/** Metric recorder for reconnecting producer state and terminal outcomes. */
export class StreamProducerMetrics {
  readonly #instruments: ProducerMetricInstruments;
  readonly #bufferObservations = new Map<
    string,
    Readonly<{ streamPath: string; producerId: string; events: number; bytes: number }>
  >();

  /** Create instruments from an optional metric provider. */
  constructor(provider: StreamsMeterPort = new OtelDenoMeter()) {
    const meter = provider.getMeter('netscript.streams', CORE_PACKAGE_VERSION);
    this.#instruments = {
      bufferedEvents: meter.createObservableGauge(StreamProducerMetricNames.BUFFERED_EVENTS, {
        description: 'Durable stream producer events awaiting terminal settlement.',
        unit: '{event}',
      }),
      bufferedBytes: meter.createObservableGauge(StreamProducerMetricNames.BUFFERED_BYTES, {
        description: 'Serialized durable stream producer bytes awaiting terminal settlement.',
        unit: 'By',
      }),
      writesDelivered: meter.createCounter(StreamProducerMetricNames.WRITES_DELIVERED, {
        description: 'Durable stream producer writes acknowledged as delivered.',
        unit: '{write}',
      }),
      writesRejected: meter.createCounter(StreamProducerMetricNames.WRITES_REJECTED, {
        description: 'Durable stream producer writes rejected before acceptance.',
        unit: '{write}',
      }),
      writesDropped: meter.createCounter(StreamProducerMetricNames.WRITES_DROPPED, {
        description: 'Accepted durable stream producer writes explicitly cancelled.',
        unit: '{write}',
      }),
      retries: meter.createCounter(StreamProducerMetricNames.RETRIES, {
        description: 'Durable stream producer retry attempts.',
        unit: '{attempt}',
      }),
      recoveries: meter.createCounter(StreamProducerMetricNames.RECOVERIES, {
        description: 'Durable stream producer operations recovered after retry.',
        unit: '{recovery}',
      }),
      deliveryUnknown: meter.createCounter(StreamProducerMetricNames.DELIVERY_UNKNOWN, {
        description: 'Durable stream producer writes with an ambiguous terminal delivery result.',
        unit: '{write}',
      }),
      stateTransitions: meter.createCounter(StreamProducerMetricNames.STATE_TRANSITIONS, {
        description: 'Durable stream producer lifecycle transitions.',
        unit: '{transition}',
      }),
    };
    this.#instruments.bufferedEvents.addCallback((result) => {
      for (const observation of this.#bufferObservations.values()) {
        result.observe(observation.events, metricAttributes(observation));
      }
    });
    this.#instruments.bufferedBytes.addCallback((result) => {
      for (const observation of this.#bufferObservations.values()) {
        result.observe(observation.bytes, metricAttributes(observation));
      }
    });
  }

  /** Record one terminal write outcome. */
  recordOutcome(streamPath: string, producerId: string, outcome: StreamWriteOutcomeV1): void {
    const reason = 'reason' in outcome ? outcome.reason : undefined;
    const attributes = metricAttributes({ streamPath, producerId, reason });
    if (outcome.status === 'delivered') {
      this.#instruments.writesDelivered.add(1, attributes);
    } else if (outcome.status === 'rejected') {
      this.#instruments.writesRejected.add(1, attributes);
    } else if (outcome.status === 'cancelled') {
      this.#instruments.writesDropped.add(1, attributes);
    } else {
      this.#instruments.deliveryUnknown.add(1, attributes);
    }
  }

  /** Record one state transition. */
  recordState(
    streamPath: string,
    producerId: string,
    snapshot: StreamProducerStateSnapshotV1,
  ): void {
    this.#instruments.stateTransitions.add(
      1,
      metricAttributes({
        streamPath,
        producerId,
        state: snapshot.state,
        attempt: snapshot.attempt,
      }),
    );
  }

  /** Update observable queue values. */
  recordBuffer(streamPath: string, producerId: string, events: number, bytes: number): void {
    this.#bufferObservations.set(`${streamPath}\0${producerId}`, {
      streamPath,
      producerId,
      events,
      bytes,
    });
  }

  /** Record another bounded attempt. */
  recordRetry(
    streamPath: string,
    producerId: string,
    phase: 'connect' | 'append' | 'close',
    attempt: number,
    reason: string,
  ): void {
    this.#instruments.retries.add(
      1,
      metricAttributes({ streamPath, producerId, phase, attempt, reason }),
    );
  }

  /** Record successful recovery after retry. */
  recordRecovery(
    streamPath: string,
    producerId: string,
    phase: 'connect' | 'append' | 'close',
    attempt: number,
  ): void {
    this.#instruments.recoveries.add(
      1,
      metricAttributes({ streamPath, producerId, phase, attempt }),
    );
  }

  /** Record rejection before a publish span exists. */
  recordRejected(
    streamPath: string,
    producerId: string,
    reason: StreamWriteRejectionReasonV1,
  ): void {
    this.#instruments.writesRejected.add(
      1,
      metricAttributes({ streamPath, producerId, reason }),
    );
  }
}

function metricAttributes(
  input: Readonly<{
    streamPath: string;
    producerId: string;
    state?: string;
    reason?: string;
    phase?: string;
    attempt?: number;
  }>,
): Record<string, string | number> {
  return {
    [StreamAttributes.STREAM_PATH]: input.streamPath,
    [StreamAttributes.PRODUCER_ID]: input.producerId,
    ...(input.state ? { [StreamAttributes.PRODUCER_STATE]: input.state } : {}),
    ...(input.reason ? { [StreamAttributes.PRODUCER_REASON]: input.reason } : {}),
    ...(input.phase ? { [StreamAttributes.PRODUCER_PHASE]: input.phase } : {}),
    ...(input.attempt !== undefined ? { [StreamAttributes.PRODUCER_ATTEMPT]: input.attempt } : {}),
  };
}
