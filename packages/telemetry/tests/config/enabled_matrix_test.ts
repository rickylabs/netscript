import { assertEquals } from '@std/assert';
import {
  clearProviderRegistration,
  getTelemetryConfig,
  isProviderRegistered,
  isTelemetryEnabled,
  markProviderRegistered,
  resetConfig,
} from '../../config.ts';

const ENABLE_VARS = [
  'OTEL_DENO',
  'NETSCRIPT_TELEMETRY_ENABLED',
  'NETSCRIPT_TELEMETRY_PROVIDER',
] as const;

function clearEnv(): void {
  for (const name of ENABLE_VARS) {
    Deno.env.delete(name);
  }
}

function reset(): void {
  clearEnv();
  clearProviderRegistration();
  resetConfig();
}

Deno.test('telemetry is disabled when no signal is present', () => {
  reset();
  try {
    assertEquals(isTelemetryEnabled(), false);
    assertEquals(getTelemetryConfig().enabled, false);
  } finally {
    reset();
  }
});

Deno.test('OTEL_DENO=true still enables telemetry', () => {
  reset();
  Deno.env.set('OTEL_DENO', 'true');
  try {
    resetConfig();
    assertEquals(isTelemetryEnabled(), true);
    assertEquals(getTelemetryConfig().enabled, true);
  } finally {
    reset();
  }
});

Deno.test('NETSCRIPT_TELEMETRY_ENABLED enables telemetry without OTEL_DENO', () => {
  reset();
  Deno.env.set('NETSCRIPT_TELEMETRY_ENABLED', 'true');
  try {
    resetConfig();
    assertEquals(Deno.env.get('OTEL_DENO'), undefined);
    assertEquals(isTelemetryEnabled(), true);
    assertEquals(getTelemetryConfig().enabled, true);
  } finally {
    reset();
  }
});

Deno.test('a registered provider enables telemetry without OTEL_DENO', () => {
  reset();
  try {
    assertEquals(isTelemetryEnabled(), false);

    markProviderRegistered();
    resetConfig();
    assertEquals(isProviderRegistered(), true);
    assertEquals(Deno.env.get('OTEL_DENO'), undefined);
    assertEquals(isTelemetryEnabled(), true);
    assertEquals(getTelemetryConfig().enabled, true);

    clearProviderRegistration();
    resetConfig();
    assertEquals(isTelemetryEnabled(), false);
  } finally {
    reset();
  }
});

Deno.test('provider selection reads NETSCRIPT_TELEMETRY_PROVIDER', () => {
  reset();
  try {
    resetConfig();
    assertEquals(getTelemetryConfig().provider, 'otel-deno');

    Deno.env.set('NETSCRIPT_TELEMETRY_PROVIDER', 'otel-sdk');
    resetConfig();
    assertEquals(getTelemetryConfig().provider, 'otel-sdk');

    Deno.env.set('NETSCRIPT_TELEMETRY_PROVIDER', 'bogus');
    resetConfig();
    assertEquals(getTelemetryConfig().provider, 'otel-deno');
  } finally {
    reset();
  }
});
