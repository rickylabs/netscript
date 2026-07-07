import type { TelemetryProviderOptions, TracerProviderPort } from '../../ports/mod.ts';
import { createOtelDenoProvider } from './otel-deno.ts';
import { createOtelSdkProvider, type SdkLoader } from './otel-sdk.ts';

/**
 * Identifier of a selectable telemetry provider adapter.
 *
 * Mirrors the `TelemetryProviderId` resolved by `@netscript/telemetry/config`
 * from `NETSCRIPT_TELEMETRY_PROVIDER`. It is duplicated here as a literal union
 * because the telemetry layering law bars provider adapters from importing the
 * `config/` module.
 */
export type TelemetryProviderSelection = 'otel-deno' | 'otel-sdk';

/** Inputs for {@linkcode createTelemetryProvider}. */
export interface CreateTelemetryProviderInput {
  /**
   * Provider to build. Defaults to `"otel-deno"` (the zero-dependency default);
   * a composition root typically passes the `provider` field resolved by
   * `getTelemetryConfig()`.
   */
  readonly providerId?: TelemetryProviderSelection;
  /** Export options forwarded to the SDK provider. */
  readonly options?: TelemetryProviderOptions;
  /** Loader override for the SDK provider (tests inject a fake). */
  readonly loadSdk?: SdkLoader;
}

/**
 * Build the telemetry provider adapter the composition root selected.
 *
 * This is the provider-selection seam: the composition root resolves which
 * provider to bind (from `NETSCRIPT_TELEMETRY_PROVIDER`, surfaced as
 * `config.provider`) and calls this to construct it. Selecting `"otel-deno"`
 * keeps the build free of the OpenTelemetry SDK; `"otel-sdk"` opts into it.
 *
 * @param input Provider selection and options.
 * @returns The selected {@linkcode TracerProviderPort}.
 * @example
 * ```ts
 * import { getTelemetryConfig } from "@netscript/telemetry/config";
 * import { createTelemetryProvider } from "@netscript/telemetry/otel";
 *
 * const config = getTelemetryConfig();
 * const provider = createTelemetryProvider({
 *   providerId: config.provider,
 *   options: { endpoint: config.endpoint, serviceName: config.serviceName },
 * });
 * await provider.register();
 * ```
 */
export function createTelemetryProvider(
  input: CreateTelemetryProviderInput = {},
): TracerProviderPort {
  if (input.providerId === 'otel-sdk') {
    return createOtelSdkProvider(input.options, input.loadSdk);
  }
  return createOtelDenoProvider();
}
