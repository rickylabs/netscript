import { metrics } from '@opentelemetry/api';
import type {
  Attributes,
  Link,
  SpanContext,
  SpanLinkPort,
  TelemetryProviderDescriptor,
  TelemetryProviderOptions,
  TracerProviderPort,
} from '../../ports/mod.ts';

/**
 * Handle over a concrete SDK tracer provider.
 *
 * The {@linkcode SdkLoader} builds this from `@opentelemetry/sdk-trace-*`; the
 * adapter drives its lifecycle without importing the SDK statically, so the SDK
 * never enters the default (zero-dependency) module graph.
 */
export interface SdkTracerProviderHandle {
  /** Install the provider as the global tracer/propagator/context manager. */
  register(): void;
  /** Flush buffered spans without shutting the provider down. */
  forceFlush(): Promise<void>;
  /** Flush and release the provider. */
  shutdown(): Promise<void>;
}

/**
 * Handle over a concrete SDK meter provider.
 *
 * Observable instruments export on a collection cycle, so
 * {@linkcode SdkMeterProviderHandle.forceFlush} on exit is what prevents the
 * final gauge values from being lost.
 */
export interface SdkMeterProviderHandle {
  /** Collect and export buffered measurements. */
  forceFlush(): Promise<void>;
  /** Flush and release the meter provider. */
  shutdown(): Promise<void>;
}

/**
 * SDK binding produced by a {@linkcode SdkLoader}: the trace and metric
 * provider handles the adapter drives.
 */
export interface SdkBinding {
  /** Trace provider handle. */
  readonly tracerProvider: SdkTracerProviderHandle;
  /** Meter provider handle. */
  readonly meterProvider: SdkMeterProviderHandle;
}

/**
 * Function that loads and wires the OpenTelemetry SDK from
 * {@linkcode TelemetryProviderOptions}.
 *
 * The default loader dynamically imports `@opentelemetry/sdk-trace-node`,
 * `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/sdk-metrics`,
 * `@opentelemetry/exporter-metrics-otlp-http`, and `@opentelemetry/resources`.
 * Tests inject a fake loader so no SDK package is required to exercise the
 * adapter's lifecycle.
 */
export type SdkLoader = (options: TelemetryProviderOptions) => Promise<SdkBinding>;

function normalizeEndpoint(endpoint: string | undefined): string {
  const base = endpoint ?? 'http://localhost:4318';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function buildResourceAttributes(
  options: TelemetryProviderOptions,
): Record<string, string> {
  const attributes: Record<string, string> = { ...options.resourceAttributes };
  attributes['service.name'] = options.serviceName ?? 'unknown-service';
  if (options.serviceVersion) {
    attributes['service.version'] = options.serviceVersion;
  }
  return attributes;
}

/**
 * Default {@linkcode SdkLoader}: dynamically imports the OpenTelemetry SDK and
 * wires an OTLP/HTTP trace exporter (batched) plus a periodic OTLP/HTTP metric
 * reader.
 *
 * All SDK imports are dynamic `import()` calls, so the packages are resolved
 * only when the SDK provider is actually selected — they never appear in the
 * default export graph. Consumers who opt into the SDK provider must add the
 * `@opentelemetry/sdk-*` and `@opentelemetry/exporter-*-otlp-http` packages to
 * their own dependencies.
 */
export const defaultSdkLoader: SdkLoader = async (options) => {
  const endpoint = normalizeEndpoint(options.endpoint);
  const resourceAttributes = buildResourceAttributes(options);

  const [traceExporterMod, sdkTraceNode, resourcesMod, metricExporterMod, sdkMetrics] =
    await Promise.all([
      import('@opentelemetry/exporter-trace-otlp-http'),
      import('@opentelemetry/sdk-trace-node'),
      import('@opentelemetry/resources'),
      import('@opentelemetry/exporter-metrics-otlp-http'),
      import('@opentelemetry/sdk-metrics'),
    ]);

  const resource = typeof resourcesMod.resourceFromAttributes === 'function'
    ? resourcesMod.resourceFromAttributes(resourceAttributes)
    : new resourcesMod.Resource(resourceAttributes);

  const traceExporter = new traceExporterMod.OTLPTraceExporter({
    url: `${endpoint}/v1/traces`,
  });
  const spanProcessor = new sdkTraceNode.BatchSpanProcessor(traceExporter);
  const tracerProvider = new sdkTraceNode.NodeTracerProvider({
    resource,
    spanProcessors: [spanProcessor],
  });

  const metricExporter = new metricExporterMod.OTLPMetricExporter({
    url: `${endpoint}/v1/metrics`,
  });
  const metricReader = new sdkMetrics.PeriodicExportingMetricReader({
    exporter: metricExporter,
  });
  const meterProvider = new sdkMetrics.MeterProvider({
    resource,
    readers: [metricReader],
  });
  metrics.setGlobalMeterProvider(meterProvider);

  return {
    tracerProvider: {
      register: () => tracerProvider.register(),
      forceFlush: async () => {
        await tracerProvider.forceFlush();
      },
      shutdown: async () => {
        await tracerProvider.shutdown();
      },
    },
    meterProvider: {
      forceFlush: async () => {
        await meterProvider.forceFlush();
      },
      shutdown: async () => {
        await meterProvider.shutdown();
      },
    },
  };
};

/**
 * Capability descriptor for the opt-in SDK-backed OpenTelemetry provider.
 *
 * Unlike the Deno-native provider, a full SDK provider preserves per-link
 * attributes, which the descriptor advertises.
 */
export const otelSdkDescriptor: TelemetryProviderDescriptor = {
  id: 'otel-sdk',
  description: 'Opt-in @opentelemetry/sdk-trace + OTLP/HTTP provider.',
  supportsLinkAttributes: true,
};

/**
 * Opt-in provider adapter backed by the `@opentelemetry/sdk-*` packages.
 *
 * The SDK is loaded lazily through an injectable {@linkcode SdkLoader}, so the
 * default build stays free of the SDK dependency; only selecting this provider
 * pulls it in. On {@linkcode OtelSdkTracerProvider.register} the adapter builds
 * the SDK binding, installs the global provider, and wires flush-on-exit so
 * batched spans and observable meters drain before the process terminates.
 */
export class OtelSdkTracerProvider implements TracerProviderPort {
  /** Capability descriptor advertising attribute-preserving links. */
  readonly descriptor: TelemetryProviderDescriptor = otelSdkDescriptor;

  readonly #options: TelemetryProviderOptions;
  readonly #loadSdk: SdkLoader;
  #binding: SdkBinding | undefined;
  #exitBound = false;

  readonly #onBeforeUnload = (): void => {
    // Best-effort: `beforeunload` cannot await, so this kicks a flush that may
    // not complete. The reliable drain path is an awaited `shutdown()`.
    void this.forceFlush();
  };

  readonly #onSigterm = (): void => {
    void this.shutdown().finally(() => {
      Deno.exit(0);
    });
  };

  /**
   * Construct the SDK provider adapter.
   *
   * @param options Export options (endpoint, protocol, resource attributes).
   * @param loadSdk Loader used to build the SDK binding; defaults to
   * {@linkcode defaultSdkLoader}. Tests inject a fake to avoid a real SDK.
   */
  constructor(
    options: TelemetryProviderOptions = {},
    loadSdk: SdkLoader = defaultSdkLoader,
  ) {
    this.#options = options;
    this.#loadSdk = loadSdk;
  }

  /**
   * Load the SDK, install it as the global provider, and wire flush-on-exit.
   *
   * Idempotent: a second call while already registered resolves without
   * rebuilding the binding.
   */
  async register(): Promise<void> {
    if (this.#binding) {
      return;
    }
    const binding = await this.#loadSdk(this.#options);
    binding.tracerProvider.register();
    this.#binding = binding;
    this.#bindExitFlush();
  }

  /** Flush buffered spans and observable meters without shutting down. */
  async forceFlush(): Promise<void> {
    const binding = this.#binding;
    if (!binding) {
      return;
    }
    await binding.tracerProvider.forceFlush();
    await binding.meterProvider.forceFlush();
  }

  /** Flush and release the SDK trace and meter providers. */
  async shutdown(): Promise<void> {
    const binding = this.#binding;
    if (!binding) {
      return;
    }
    this.#unbindExitFlush();
    this.#binding = undefined;
    await binding.tracerProvider.shutdown();
    await binding.meterProvider.shutdown();
  }

  #bindExitFlush(): void {
    if (this.#exitBound) {
      return;
    }
    globalThis.addEventListener('beforeunload', this.#onBeforeUnload);
    try {
      Deno.addSignalListener('SIGTERM', this.#onSigterm);
    } catch {
      // SIGTERM is not available on every platform (for example Windows);
      // `beforeunload` and explicit shutdown remain as the flush paths.
    }
    this.#exitBound = true;
  }

  #unbindExitFlush(): void {
    if (!this.#exitBound) {
      return;
    }
    globalThis.removeEventListener('beforeunload', this.#onBeforeUnload);
    try {
      Deno.removeSignalListener('SIGTERM', this.#onSigterm);
    } catch {
      // Mirror the guard in #bindExitFlush.
    }
    this.#exitBound = false;
  }
}

/**
 * Span-link adapter for the SDK provider.
 *
 * The SDK preserves per-link attributes at export time, so
 * {@linkcode OtelSdkSpanLink.createLink} keeps them on the returned
 * {@linkcode Link}.
 */
export class OtelSdkSpanLink implements SpanLinkPort {
  /** The SDK provider preserves link attributes. */
  readonly supportsLinkAttributes = true;

  /** Build a link to `context`, preserving any attributes. */
  createLink(context: SpanContext, attributes?: Attributes): Link {
    return attributes ? { context, attributes } : { context };
  }
}

/**
 * Create the opt-in SDK-backed tracer provider adapter.
 *
 * @param options Export options passed to the SDK exporters.
 * @param loadSdk Optional loader override (defaults to
 * {@linkcode defaultSdkLoader}).
 * @returns A {@linkcode TracerProviderPort} that loads the SDK on `register`.
 * @example
 * ```ts
 * import { createOtelSdkProvider } from "@netscript/telemetry/otel";
 *
 * const provider = createOtelSdkProvider({ endpoint: "http://localhost:4318" });
 * await provider.register();
 * ```
 */
export function createOtelSdkProvider(
  options?: TelemetryProviderOptions,
  loadSdk?: SdkLoader,
): OtelSdkTracerProvider {
  return new OtelSdkTracerProvider(options, loadSdk);
}

/** Create the SDK span-link adapter. */
export function createOtelSdkSpanLink(): OtelSdkSpanLink {
  return new OtelSdkSpanLink();
}
