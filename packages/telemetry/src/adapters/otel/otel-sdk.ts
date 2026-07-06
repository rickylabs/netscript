import type { TelemetryProviderDescriptor, TracerProviderPort } from '../../ports/mod.ts';

/**
 * Error thrown when an opt-in SDK provider is registered before its runtime
 * binding is available.
 *
 * The full `@opentelemetry/sdk-trace-*` provider wiring (custom samplers,
 * span processors, exporters) lands in a later telemetry slice. Until then the
 * SDK adapter exists as a documented scaffold so `@netscript/telemetry/otel`
 * advertises the surface without shipping a partial implementation.
 */
export class TelemetryProviderNotImplementedError extends Error {
  /** Identifier of the provider whose registration is not yet available. */
  readonly providerId: string;

  /**
   * Construct the error for a not-yet-implemented provider.
   *
   * @param providerId Identifier of the provider that is not yet implemented.
   */
  constructor(providerId: string) {
    super(
      `Telemetry provider '${providerId}' is a scaffold; the SDK-backed ` +
        'provider binding is not implemented yet.',
    );
    this.name = 'TelemetryProviderNotImplementedError';
    this.providerId = providerId;
  }
}

/**
 * Capability descriptor for the opt-in SDK-backed OpenTelemetry provider.
 *
 * Unlike the Deno-native provider, a full SDK provider preserves per-link
 * attributes, which the descriptor advertises.
 */
export const otelSdkDescriptor: TelemetryProviderDescriptor = {
  id: 'otel-sdk',
  description: 'Opt-in @opentelemetry/sdk-trace provider (scaffold).',
  supportsLinkAttributes: true,
};

/**
 * Scaffold provider adapter for an opt-in `@opentelemetry/sdk-trace` provider.
 *
 * The concrete SDK wiring is deferred to a later slice; until then
 * {@linkcode OtelSdkTracerProvider.register} throws
 * {@linkcode TelemetryProviderNotImplementedError} so callers fail loudly
 * rather than silently receiving a partial provider.
 */
export class OtelSdkTracerProvider implements TracerProviderPort {
  /** Capability descriptor advertising attribute-preserving links. */
  readonly descriptor: TelemetryProviderDescriptor = otelSdkDescriptor;

  /**
   * Throw {@linkcode TelemetryProviderNotImplementedError}: the SDK-backed
   * provider binding is not implemented yet.
   */
  register(): never {
    throw new TelemetryProviderNotImplementedError(this.descriptor.id);
  }
}

/**
 * Create the opt-in SDK-backed tracer provider adapter (scaffold).
 *
 * @returns A {@linkcode TracerProviderPort} whose `register` throws until the
 * SDK binding is implemented.
 */
export function createOtelSdkProvider(): OtelSdkTracerProvider {
  return new OtelSdkTracerProvider();
}
