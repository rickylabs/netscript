/**
 * @module linux/systemd/systemd-environment
 *
 * Compose a systemd unit's `Environment=` record with the canonical OTEL env
 * derived by the core observability convention (R-DEPLOY-3, D6). The Linux
 * analogue of the SERVY adapter's OTEL sourcing: systemd units get their
 * `OTEL_DENO` / `OTEL_SERVICE_NAME` / exporter env from the shared core helper
 * rather than a hand-rolled per-adapter copy — closing the gap where the
 * systemd unit previously carried no OTEL wiring at all.
 *
 * Pure module (no `Deno.*` I/O): the returned record is handed to
 * `renderSystemdUnit(config.environment)`.
 */

import {
  observabilityEnv,
  type ObservabilityEnvOptions,
} from '../../../domain/deploy/observability-convention.ts';

/**
 * Merge the core OTEL env on top of a systemd unit's base `Environment=` record.
 * The convention is authoritative for the OTEL keys it emits; all other base
 * env entries are preserved.
 */
export function withObservabilityEnvironment(
  baseEnv: Record<string, string>,
  otel: ObservabilityEnvOptions,
): Record<string, string> {
  return { ...baseEnv, ...observabilityEnv(otel) };
}
