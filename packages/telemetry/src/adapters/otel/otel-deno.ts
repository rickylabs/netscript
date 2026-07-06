import { trace } from '@opentelemetry/api';
import type { TelemetryProviderDescriptor, TracerProviderPort } from '../../ports/mod.ts';

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
