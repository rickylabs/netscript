import type { TelemetryConfig } from './constants.ts';
import { getTelemetryConfig } from './environment.ts';

let cachedConfig: TelemetryConfig | null = null;

export function getConfig(): TelemetryConfig {
  if (!cachedConfig) {
    cachedConfig = getTelemetryConfig();
  }
  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}
