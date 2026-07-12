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

type UnknownConstructor = new (options: unknown) => unknown;

interface ResourceModule {
  readonly Resource: UnknownConstructor;
  readonly resourceFromAttributes?: (attributes: Record<string, string>) => unknown;
}

interface TraceExporterModule {
  readonly OTLPTraceExporter: UnknownConstructor;
}

interface TraceSdkModule {
  readonly BatchSpanProcessor: UnknownConstructor;
  readonly NodeTracerProvider: UnknownConstructor;
}

interface MetricExporterModule {
  readonly OTLPMetricExporter: UnknownConstructor;
}

interface MetricSdkModule {
  readonly MeterProvider: UnknownConstructor;
  readonly PeriodicExportingMetricReader: UnknownConstructor;
}

interface MeterProviderHandle extends SdkMeterProviderHandle {
  getMeter(name: string, version?: string): ReturnType<typeof metrics.getMeter>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isConstructor(value: unknown): value is UnknownConstructor {
  return typeof value === 'function';
}

function assertResourceModule(value: unknown): asserts value is ResourceModule {
  if (
    !isRecord(value) || !isConstructor(value.Resource) ||
    (value.resourceFromAttributes !== undefined &&
      typeof value.resourceFromAttributes !== 'function')
  ) {
    throw new TypeError('OpenTelemetry resources module has an incompatible shape');
  }
}

function assertTraceExporterModule(value: unknown): asserts value is TraceExporterModule {
  if (!isRecord(value) || !isConstructor(value.OTLPTraceExporter)) {
    throw new TypeError('OpenTelemetry trace exporter module has an incompatible shape');
  }
}

function assertTraceSdkModule(value: unknown): asserts value is TraceSdkModule {
  if (
    !isRecord(value) || !isConstructor(value.BatchSpanProcessor) ||
    !isConstructor(value.NodeTracerProvider)
  ) {
    throw new TypeError('OpenTelemetry trace SDK module has an incompatible shape');
  }
}

function assertMetricExporterModule(value: unknown): asserts value is MetricExporterModule {
  if (!isRecord(value) || !isConstructor(value.OTLPMetricExporter)) {
    throw new TypeError('OpenTelemetry metric exporter module has an incompatible shape');
  }
}

function assertMetricSdkModule(value: unknown): asserts value is MetricSdkModule {
  if (
    !isRecord(value) || !isConstructor(value.MeterProvider) ||
    !isConstructor(value.PeriodicExportingMetricReader)
  ) {
    throw new TypeError('OpenTelemetry metric SDK module has an incompatible shape');
  }
}

function assertTracerProviderHandle(value: unknown): asserts value is SdkTracerProviderHandle {
  if (
    !isRecord(value) || typeof value.register !== 'function' ||
    typeof value.forceFlush !== 'function' || typeof value.shutdown !== 'function'
  ) {
    throw new TypeError('OpenTelemetry tracer provider has an incompatible shape');
  }
}

function assertMeterProviderHandle(value: unknown): asserts value is MeterProviderHandle {
  if (
    !isRecord(value) || typeof value.getMeter !== 'function' ||
    typeof value.forceFlush !== 'function' || typeof value.shutdown !== 'function'
  ) {
    throw new TypeError('OpenTelemetry meter provider has an incompatible shape');
  }
}

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
/**
 * Import an `@opentelemetry/*` SDK module through a computed specifier.
 *
 * The computed form keeps these modules OUT of the statically-analyzed module
 * graph: on JSR, bare specifiers that are not in this package's import map
 * would otherwise be rewritten to package-relative paths and fail every
 * consumer's integrity check at graph build (the beta.6 regression). At
 * runtime inside a published package the bare form still cannot resolve, so
 * failures produce an actionable error instead: bring the SDK by passing your
 * own {@linkcode SdkLoader} (or run from a workspace that maps the packages).
 */
async function loadSdkModule(name: string): Promise<unknown> {
  const specifier = `@opentelemetry/${name}`;
  try {
    return await import(specifier);
  } catch (error) {
    throw new Error(
      `Failed to load ${specifier} for the opt-in OpenTelemetry SDK provider. ` +
        'Published consumers must supply their own SdkLoader (createTelemetryProvider ' +
        'sdkLoader option) backed by app-installed @opentelemetry/* packages, or map ' +
        `${specifier} in the application import scope. Cause: ${String(error)}`,
    );
  }
}

export const defaultSdkLoader: SdkLoader = async (options): Promise<SdkBinding> => {
  const endpoint = normalizeEndpoint(options.endpoint);
  const resourceAttributes = buildResourceAttributes(options);

  const [traceExporterMod, sdkTraceNode, resourcesMod, metricExporterMod, sdkMetrics] =
    await Promise.all([
      loadSdkModule('exporter-trace-otlp-http'),
      loadSdkModule('sdk-trace-node'),
      loadSdkModule('resources'),
      loadSdkModule('exporter-metrics-otlp-http'),
      loadSdkModule('sdk-metrics'),
    ]);

  assertTraceExporterModule(traceExporterMod);
  assertTraceSdkModule(sdkTraceNode);
  assertResourceModule(resourcesMod);
  assertMetricExporterModule(metricExporterMod);
  assertMetricSdkModule(sdkMetrics);

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
  assertTracerProviderHandle(tracerProvider);

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
  assertMeterProviderHandle(meterProvider);
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
