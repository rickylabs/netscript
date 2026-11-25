/**
 * Typed dependency-health shapes returned by `DirectoryPort.health`.
 *
 * @module
 */

/**
 * Overall dependency health state reported by `DirectoryPort.health`.
 *
 * @example
 * ```ts
 * import type { DirectoryHealthStatus } from '@netscript/plugin-directory-core/domain';
 *
 * const status: DirectoryHealthStatus = 'healthy';
 * console.log(status);
 * ```
 */
export type DirectoryHealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Outcome of an individual redacted health probe.
 *
 * @example
 * ```ts
 * import type { DirectoryHealthProbeStatus } from '@netscript/plugin-directory-core/domain';
 *
 * const status: DirectoryHealthProbeStatus = 'pass';
 * console.log(status);
 * ```
 */
export type DirectoryHealthProbeStatus = 'pass' | 'warn' | 'fail' | 'info';

/**
 * Individual dependency probe inside {@link DirectoryHealth}.
 *
 * Probe messages must never include credentials, bind secrets, or distinguished names.
 *
 * @example
 * ```ts
 * import type { DirectoryHealthProbe } from '@netscript/plugin-directory-core/domain';
 *
 * const probe: DirectoryHealthProbe = {
 *   name: 'replicas',
 *   status: 'pass',
 *   message: '2 of 2 configured hosts reachable.',
 *   latencyMs: 14,
 * };
 * console.log(probe.name, probe.status);
 * ```
 */
export type DirectoryHealthProbe = Readonly<{
  /** Stable probe identifier such as `'bind'`, `'search'`, `'replicas'`, or `'tls-certificate'`. */
  name: string;
  /** Probe status (`'info'` is informational and does not degrade overall health). */
  status: DirectoryHealthProbeStatus;
  /** Redacted human-readable summary with no secrets or distinguished names. */
  message: string;
  /** Optional probe duration in milliseconds. */
  latencyMs?: number;
}>;

/**
 * Typed dependency probe payload returned by `DirectoryPort.health`.
 *
 * Multi-host adapters report `'degraded'` when only some configured hosts answer,
 * and `'unhealthy'` when none do.
 *
 * @example
 * ```ts
 * import type { DirectoryHealth } from '@netscript/plugin-directory-core/domain';
 *
 * const health: DirectoryHealth = {
 *   status: 'degraded',
 *   checkedAt: '2026-06-01T12:00:00.000Z',
 *   reachableHosts: 1,
 *   totalHosts: 2,
 * };
 * console.log(health.status, health.reachableHosts, health.totalHosts);
 * ```
 */
export type DirectoryHealth = Readonly<{
  /** Aggregate dependency health status. */
  status: DirectoryHealthStatus;
  /** ISO-8601 UTC timestamp when health was checked. */
  checkedAt: string;
  /** Optional count of reachable configured directory hosts. */
  reachableHosts?: number;
  /** Optional total count of configured directory hosts. */
  totalHosts?: number;
  /** Optional redacted per-check diagnostics (never containing credentials or DNs). */
  probes?: readonly DirectoryHealthProbe[];
}>;
