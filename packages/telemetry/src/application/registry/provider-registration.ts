/**
 * Composition seam binding a telemetry provider adapter to the
 * {@linkcode InstrumentationRegistry}.
 *
 * The registry is the real composition seam for provider selection: a
 * composition root picks a {@linkcode TracerProviderPort} (see
 * `createTelemetryProvider` in `@netscript/telemetry/otel`) and registers it
 * here, so provider registration flows through the same lifecycle as every
 * other instrumentation. Registering the provider also flips the process-level
 * "provider registered" signal, which lets `getTelemetryConfig` report
 * telemetry as enabled independently of `OTEL_DENO`.
 *
 * This module takes the provider _port_, never a concrete adapter, so it does
 * not violate the telemetry layering law (application must not import
 * `adapters/`). The concrete adapter is chosen by the composition root and
 * passed in.
 *
 * @module
 */

import type { TracerProviderPort } from '../../ports/mod.ts';
import {
  clearProviderRegistration,
  markProviderRegistered,
} from '../../config/provider-registration.ts';
import type { InstrumentationRegistration } from './types.ts';

/** Default registration name used for the telemetry provider. */
export const TELEMETRY_PROVIDER_REGISTRATION_NAME = 'telemetry-provider';

/**
 * Build an {@linkcode InstrumentationRegistration} that activates `provider`
 * through the {@linkcode InstrumentationRegistry} lifecycle.
 *
 * On `setup` the provider is registered (asynchronously for the SDK provider)
 * and the process is marked telemetry-enabled; on `teardown` the provider is
 * shut down — flushing buffered spans and observable meters — and the signal is
 * cleared.
 *
 * @param provider Provider port chosen by the composition root.
 * @param name Registration name; defaults to
 * {@linkcode TELEMETRY_PROVIDER_REGISTRATION_NAME}.
 * @example
 * ```ts
 * import { getTelemetryConfig } from "@netscript/telemetry/config";
 * import { createTelemetryProvider } from "@netscript/telemetry/otel";
 * import {
 *   createProviderRegistration,
 *   InstrumentationRegistry,
 * } from "@netscript/telemetry/registry";
 *
 * const config = getTelemetryConfig();
 * const provider = createTelemetryProvider({
 *   providerId: config.provider,
 *   options: { endpoint: config.endpoint, serviceName: config.serviceName },
 * });
 *
 * const registry = new InstrumentationRegistry();
 * registry.register(createProviderRegistration(provider));
 * await registry.setupAll({ serviceName: config.serviceName });
 * ```
 */
export function createProviderRegistration(
  provider: TracerProviderPort,
  name: string = TELEMETRY_PROVIDER_REGISTRATION_NAME,
): InstrumentationRegistration {
  return {
    name,
    setup: async () => {
      await provider.register();
      markProviderRegistered();
    },
    teardown: async () => {
      await provider.shutdown?.();
      clearProviderRegistration();
    },
  };
}
