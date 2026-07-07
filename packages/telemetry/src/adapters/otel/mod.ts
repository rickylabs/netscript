/**
 * OpenTelemetry provider adapters for {@linkcode @netscript/telemetry}.
 *
 * Two provider adapters bind the telemetry `ports` contracts to a concrete
 * OpenTelemetry provider:
 *
 * - {@linkcode OtelDenoTracerProvider} — the default, backed by Deno's
 *   auto-registered global provider. Zero runtime dependencies beyond
 *   `@opentelemetry/api`.
 * - {@linkcode OtelSdkTracerProvider} — an opt-in `@opentelemetry/sdk-*`
 *   provider that exports over OTLP/HTTP and flushes batched spans and
 *   observable meters on exit. Its SDK dependency is loaded lazily via a
 *   dynamic import, so it never enters the default module graph.
 *
 * {@linkcode createTelemetryProvider} is the provider-selection seam a
 * composition root calls with the `provider` resolved from configuration.
 *
 * @module
 */

export * from '../../ports/mod.ts';
export * from './otel-deno.ts';
export * from './otel-sdk.ts';
export * from './select-provider.ts';
