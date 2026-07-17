/**
 * Health check primitives for service health monitoring.
 *
 * @example
 * ```typescript
 * import { createHealthHandler, healthChecks } from '@netscript/service';
 *
 * app.get('/health', createHealthHandler({
 *   checks: [
 *     healthChecks.database(db),
 *     healthChecks.kv(),
 *     healthChecks.service('users', 'http://localhost:3000'),
 *   ],
 * }));
 * ```
 *
 * @module
 */

import type { ServiceHandler } from '../types.ts';

/** Health status values emitted by service health handlers. */
export const HEALTH_STATUS = {
  healthy: 'healthy',
  degraded: 'degraded',
  unhealthy: 'unhealthy',
} as const;

/** Health status emitted by the service health endpoint. */
export type HealthStatus = typeof HEALTH_STATUS[keyof typeof HEALTH_STATUS];

const LIVENESS_STATUS_OK = 'ok';

/**
 * A single health check definition.
 */
export interface HealthCheck {
  /** Name of the health check (e.g., 'database', 'redis') */
  name: string;
  /** Whether this check belongs to the running app's active configuration. Defaults to `true`. */
  configured?: boolean;
  /** Function that performs the health check */
  check: () => Promise<{ healthy: boolean; message?: string; latency?: number }>;
}

/** Options shared by pre-built dependency health checks. */
export interface HealthCheckAdapterOptions {
  /** Override the check name reported in health details. */
  name?: string;
  /** Whether the adapter belongs to the running app's active configuration. */
  configured?: boolean;
}

/**
 * Response format for health endpoint.
 */
export interface HealthResponse {
  /** Overall health status for the service. */
  status: HealthStatus;
  /** ISO timestamp of the health check */
  timestamp: string;
  /** Optional service version */
  version?: string;
  /** Individual check results */
  checks: Array<{
    name: string;
    healthy: boolean;
    message?: string;
    latency?: number;
  }>;
}

/**
 * Options for createHealthHandler.
 */
export interface HealthHandlerOptions {
  /** Array of health checks to run */
  checks?: HealthCheck[];
  /** Service version to include in response */
  version?: string;
  /** Whether to include detailed check results (default: true) */
  includeDetails?: boolean;
}

/**
 * Creates a comprehensive health check handler that runs all checks in parallel.
 *
 * @example
 * ```typescript
 * app.get('/health', createHealthHandler({
 *   checks: [healthChecks.database(db)],
 *   version: '1.0.0',
 * }));
 * ```
 */
export function createHealthHandler(options?: HealthHandlerOptions): ServiceHandler {
  const { checks = [], version, includeDetails = true } = options ?? {};
  const configuredChecks = checks.filter((check) => check.configured !== false);

  return async (c): Promise<Response> => {
    const results = await Promise.allSettled(
      configuredChecks.map(async (check) => {
        const start = performance.now();
        try {
          const result = await check.check();
          return {
            name: check.name,
            ...result,
            latency: Math.round(performance.now() - start),
          };
        } catch (error) {
          return {
            name: check.name,
            healthy: false,
            message: error instanceof Error ? error.message : 'Unknown error',
            latency: Math.round(performance.now() - start),
          };
        }
      }),
    );

    const checkResults = results.map((r) =>
      r.status === 'fulfilled'
        ? r.value
        : { name: 'unknown', healthy: false, message: 'Check failed' }
    );

    const allHealthy = checkResults.length === 0 || checkResults.every((r) => r.healthy);
    const someHealthy = checkResults.some((r) => r.healthy);
    let status: HealthStatus = HEALTH_STATUS.unhealthy;
    if (allHealthy) {
      status = HEALTH_STATUS.healthy;
    } else if (someHealthy) {
      status = HEALTH_STATUS.degraded;
    }

    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      checks: includeDetails ? checkResults : [],
      version,
    };

    return c.json(response, allHealthy ? 200 : 503);
  };
}

/**
 * Pre-built health checks for common dependencies.
 */
export const healthChecks = {
  /**
   * Database health check using Prisma.
   *
   * @example
   * ```typescript
   * healthChecks.database(db)
   * ```
   */
  database: (
    db: { $queryRaw: (query: TemplateStringsArray) => Promise<unknown> },
    options: HealthCheckAdapterOptions = {},
  ): HealthCheck => ({
    name: options.name ?? 'database',
    configured: options.configured,
    check: async () => {
      await db.$queryRaw`SELECT 1`;
      return { healthy: true };
    },
  }),

  /**
   * Deno KV health check.
   *
   * @example
   * ```typescript
   * healthChecks.kv()
   * ```
   */
  kv: (options: HealthCheckAdapterOptions = {}): HealthCheck => ({
    name: options.name ?? 'kv',
    configured: options.configured,
    check: async () => {
      const kv = await Deno.openKv();
      await kv.get(['health_check']);
      return { healthy: true };
    },
  }),

  /**
   * External service health check via HTTP.
   *
   * @example
   * ```typescript
   * healthChecks.service('users', 'http://localhost:3000')
   * ```
   */
  service: (
    name: string,
    baseUrl: string,
    options: HealthCheckAdapterOptions = {},
  ): HealthCheck => ({
    name: options.name ?? `service:${name}`,
    configured: options.configured,
    check: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
        return { healthy: response.ok };
      } finally {
        clearTimeout(timeoutId);
      }
    },
  }),

  /**
   * Custom health check with a simple boolean function.
   *
   * @example
   * ```typescript
   * healthChecks.custom('redis', async () => {
   *   return await redis.ping() === 'PONG';
   * })
   * ```
   */
  custom: (
    name: string,
    fn: () => Promise<boolean>,
    options: HealthCheckAdapterOptions = {},
  ): HealthCheck => ({
    name: options.name ?? name,
    configured: options.configured,
    check: async () => ({ healthy: await fn() }),
  }),
};

/**
 * Creates a simple liveness check handler.
 * Returns 200 OK if the service is running.
 *
 * @example
 * ```typescript
 * app.get('/health/live', createLivenessHandler());
 * ```
 */
export function createLivenessHandler(): ServiceHandler {
  return (c): Response => c.json({ status: LIVENESS_STATUS_OK }, 200);
}

/**
 * Creates a readiness check handler that runs multiple async checks.
 *
 * @example
 * ```typescript
 * app.get('/health/ready', createReadinessHandler([
 *   async () => { await db.$queryRaw`SELECT 1`; return true; },
 * ]));
 * ```
 */
export function createReadinessHandler(
  checks: Array<() => Promise<boolean>>,
): ServiceHandler {
  return async (c): Promise<Response> => {
    try {
      const results = await Promise.all(checks.map((check) => check()));
      const allReady = results.every((r) => r === true);
      return c.json({ ready: allReady }, allReady ? 200 : 503);
    } catch {
      return c.json({ ready: false }, 503);
    }
  };
}
