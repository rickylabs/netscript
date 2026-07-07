import { metrics, propagation, trace } from '@opentelemetry/api';
import type {
  Attributes,
  Context,
  Link,
  Meter,
  MeterPort,
  ObservableCallback,
  PropagationExtractCarrier,
  PropagationInjectCarrier,
  PropagatorPort,
  SpanContext,
  SpanLinkPort,
  TelemetryProviderDescriptor,
  TracerProviderPort,
} from '../../ports/mod.ts';

/**
 * Capability descriptor for the default Deno-native OpenTelemetry provider.
 *
 * Deno's runtime auto-registers a global tracer provider when `OTEL_DENO=true`,
 * so this adapter performs no explicit registration. The Deno-native provider
 * does not yet preserve per-link attributes, which the descriptor advertises.
 */
export const otelDenoDescriptor: TelemetryProviderDescriptor = {
  id: 'otel-deno',
  description: "Deno runtime's auto-registered global OpenTelemetry provider.",
  supportsLinkAttributes: false,
};

/**
 * Provider adapter that binds to Deno's auto-registered global OpenTelemetry
 * provider.
 *
 * This is the default provider for NetScript telemetry. Because the Deno
 * runtime registers the global provider itself when `OTEL_DENO=true`,
 * {@linkcode OtelDenoTracerProvider.register} is a documented no-op; user code
 * must not call `setGlobalTracerProvider` on top of it.
 */
export class OtelDenoTracerProvider implements TracerProviderPort {
  /** Capability descriptor advertising attribute-less links. */
  readonly descriptor: TelemetryProviderDescriptor = otelDenoDescriptor;

  /**
   * No-op: the Deno runtime auto-registers the global provider when
   * `OTEL_DENO=true`. Present to satisfy {@linkcode TracerProviderPort}.
   */
  register(): void {
    // Intentionally empty; Deno owns global provider registration.
  }

  /**
   * Report whether a non-noop tracer provider is registered in this process.
   *
   * Returns `false` when telemetry is disabled (Deno leaves the built-in
   * no-op provider in place) and `true` once the runtime has installed its
   * OTLP-backed provider.
   */
  isActive(): boolean {
    const provider = trace.getTracerProvider();
    return provider?.constructor?.name !== 'NoopTracerProvider';
  }
}

/**
 * Propagator adapter delegating to the global OpenTelemetry propagator that the
 * Deno runtime registers.
 *
 * Inject/extract flow through `@opentelemetry/api`'s global propagation API, so
 * the active W3C Trace Context propagator (installed by the runtime) does the
 * work; when telemetry is off the global propagator is a documented no-op.
 */
export class OtelDenoPropagator implements PropagatorPort {
  /** Inject the current trace context into `carrier` as W3C headers. */
  inject(context: Context, carrier: PropagationInjectCarrier): void {
    propagation.inject(context, carrier);
  }

  /** Extract a trace context from `carrier`, falling back to `context`. */
  extract(context: Context, carrier: PropagationExtractCarrier): Context {
    return propagation.extract(context, carrier);
  }

  /** Carrier keys the global propagator reads and writes. */
  fields(): string[] {
    return propagation.fields();
  }
}

/**
 * Meter adapter delegating to the global OpenTelemetry meter that the Deno
 * runtime registers.
 *
 * {@linkcode OtelDenoMeter.forceFlush} is a no-op: the Deno runtime owns the
 * metric export pipeline, so there is nothing for the adapter to drain.
 */
export class OtelDenoMeter implements MeterPort {
  /** Obtain a {@linkcode Meter} from the global meter provider. */
  getMeter(name: string, version?: string): Meter {
    const meter = metrics.getMeter(name, version);
    return {
      createCounter: (counterName, options) => {
        const counter = meter.createCounter(counterName, options);
        return {
          add: (value: number, attributes?: Attributes) => counter.add(value, attributes),
        };
      },
      createHistogram: (histogramName, options) => {
        const histogram = meter.createHistogram(histogramName, options);
        return {
          record: (value: number, attributes?: Attributes) => histogram.record(value, attributes),
        };
      },
      createObservableGauge: (gaugeName, options) => {
        const gauge = meter.createObservableGauge(gaugeName, options);
        return {
          addCallback: (callback: ObservableCallback) => gauge.addCallback(callback),
          removeCallback: (callback: ObservableCallback) => gauge.removeCallback(callback),
        };
      },
    };
  }

  /** No-op: the Deno runtime owns metric export and flushing. */
  forceFlush(): void {
    // Intentionally empty; Deno owns the metric export pipeline.
  }
}

/**
 * Span-link adapter for the Deno-native provider.
 *
 * The Deno runtime does not preserve per-link attributes at export time, so
 * {@linkcode OtelDenoSpanLink.createLink} drops any supplied attributes and
 * records how many were dropped, keeping the returned {@linkcode Link} an
 * accurate description of what will be exported.
 */
export class OtelDenoSpanLink implements SpanLinkPort {
  /** The Deno-native provider drops link attributes. */
  readonly supportsLinkAttributes = false;

  /** Build a link to `context`, dropping any attributes. */
  createLink(context: SpanContext, attributes?: Attributes): Link {
    const dropped = attributes ? Object.keys(attributes).length : 0;
    return dropped > 0 ? { context, droppedAttributesCount: dropped } : { context };
  }
}

/**
 * Create the default Deno-native tracer provider adapter.
 *
 * @returns A {@linkcode TracerProviderPort} bound to the Deno global provider.
 * @example
 * ```ts
 * import { createOtelDenoProvider } from "@netscript/telemetry/otel";
 *
 * const provider = createOtelDenoProvider();
 * provider.register();
 * ```
 */
export function createOtelDenoProvider(): OtelDenoTracerProvider {
  return new OtelDenoTracerProvider();
}

/** Create the Deno-native propagator adapter. */
export function createOtelDenoPropagator(): OtelDenoPropagator {
  return new OtelDenoPropagator();
}

/** Create the Deno-native meter adapter. */
export function createOtelDenoMeter(): OtelDenoMeter {
  return new OtelDenoMeter();
}

/** Create the Deno-native span-link adapter. */
export function createOtelDenoSpanLink(): OtelDenoSpanLink {
  return new OtelDenoSpanLink();
}
