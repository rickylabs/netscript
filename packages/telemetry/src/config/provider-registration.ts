/**
 * Process-level record of whether a telemetry provider adapter has registered.
 *
 * Telemetry is considered enabled when the Deno runtime turns it on
 * (`OTEL_DENO=true`), when a caller opts in explicitly
 * (`NETSCRIPT_TELEMETRY_ENABLED=true`), or when a provider adapter registers
 * through the composition seam. This module holds that last signal so
 * {@linkcode getTelemetryConfig} can decouple `enabled` from `OTEL_DENO`
 * without importing an adapter (which the layering fitness test forbids).
 *
 * @module
 */

let providerRegistered = false;

/**
 * Mark that a telemetry provider adapter has registered for this process.
 *
 * Called by the composition seam after a {@linkcode TracerProviderPort}
 * registers, so telemetry reports as enabled even when `OTEL_DENO` is unset.
 */
export function markProviderRegistered(): void {
  providerRegistered = true;
}

/**
 * Clear the provider-registration signal.
 *
 * Called on provider shutdown and by tests that need a clean process state.
 */
export function clearProviderRegistration(): void {
  providerRegistered = false;
}

/** Report whether a telemetry provider adapter has registered for this process. */
export function isProviderRegistered(): boolean {
  return providerRegistered;
}
