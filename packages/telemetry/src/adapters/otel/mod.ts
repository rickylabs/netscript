/**
 * OpenTelemetry provider adapters for {@linkcode @netscript/telemetry}.
 *
 * Two provider adapters bind the telemetry `ports` contracts to a concrete
 * OpenTelemetry provider:
 *
 * - {@linkcode OtelDenoTracerProvider} — the default, backed by Deno's
 *   auto-registered global provider.
 * - {@linkcode OtelSdkTracerProvider} — an opt-in `@opentelemetry/sdk-trace`
 *   provider (scaffold; registration is deferred to a later slice).
 *
 * @module
 */

export * from '../../ports/mod.ts';
export * from './otel-deno.ts';
export * from './otel-sdk.ts';
