/**
 * Provider ports for {@linkcode @netscript/telemetry}.
 *
 * A telemetry provider adapter binds the vendor-neutral `domain` contracts to a
 * concrete OpenTelemetry provider (the Deno-native global provider, or a
 * user-supplied SDK provider). This module defines the port those adapters
 * implement and the capability descriptor they advertise so the composition
 * root can select a provider without importing an adapter directly.
 *
 * @module
 */

/**
 * Capability descriptor advertised by a telemetry provider adapter.
 *
 * The descriptor lets the composition root reason about a provider's
 * capabilities (for example, whether span links can carry per-link attributes)
 * before selecting it, without importing the adapter implementation.
 */
export interface TelemetryProviderDescriptor {
  /** Stable identifier for the provider adapter (for example `"otel-deno"`). */
  readonly id: string;
  /** Human-readable summary of what the provider binds to. */
  readonly description: string;
  /**
   * Whether the provider's span links can carry per-link attributes.
   *
   * The Deno-native provider currently drops link attributes; a full SDK
   * provider preserves them.
   */
  readonly supportsLinkAttributes: boolean;
}

/**
 * Port a telemetry provider adapter implements to make itself selectable by the
 * composition root.
 *
 * The port is intentionally narrow: it advertises a capability
 * {@linkcode TelemetryProviderDescriptor} and exposes a single `register` hook.
 * Tracer access itself continues to flow through the global OpenTelemetry
 * provider via the application layer, so the port does not re-expose
 * `getTracer`.
 */
export interface TracerProviderPort {
  /** Capability descriptor for this provider. */
  readonly descriptor: TelemetryProviderDescriptor;
  /**
   * Ensure the provider is active for the current process.
   *
   * Implementations that rely on Deno's auto-registered global provider treat
   * this as a no-op; SDK-backed providers perform explicit registration.
   */
  register(): void;
}
