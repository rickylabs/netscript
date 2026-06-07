import type { TelemetryConfig } from './constants.ts';
import { getTelemetryConfig } from './environment.ts';

let cachedConfig: TelemetryConfig | null = null;

/**
 * Return the cached telemetry configuration for the process.
 */
export function getConfig(): TelemetryConfig {
  if (!cachedConfig) {
    cachedConfig = getTelemetryConfig();
  }
  return cachedConfig;
}

/**
 * Clear the cached telemetry configuration.
 */
export function resetConfig(): void {
  cachedConfig = null;
}
