/**
 * Health Router
 *
 * Health check endpoints for the Sagas API service.
 * Implements API, KV, and registry readiness checks for the sagas plugin service.
 * @module
 */

import { z } from 'zod';
import { baseContract, type BaseContractProcedure } from '@netscript/contracts';
import { implement } from '@orpc/server';
import { getKv } from '@netscript/kv';
import { listSagaMetadata } from '../saga-registry.ts';

// ============================================================================
// HEALTH CHECK SCHEMAS
// ============================================================================

const ComponentHealthSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  latency: z.number().optional(),
  message: z.string().optional(),
});

const HealthCheckResultSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  service: z.string(),
  timestamp: z.string().datetime(),
  version: z.string(),
  checks: z.record(z.string(), ComponentHealthSchema).optional(),
});

// ============================================================================
// HEALTH CONTRACT
// ============================================================================

const healthContract: {
  live: BaseContractProcedure;
  ready: BaseContractProcedure;
  check: BaseContractProcedure;
} = {
  /**
   * Liveness probe - is the process alive?
   * Fast and simple, fails only if process is deadlocked.
   */
  live: baseContract
    .route({ method: 'GET', path: '/health/live' })
    .input(z.object({}).optional())
    .output(z.object({
      status: z.literal('ok'),
      timestamp: z.string().datetime(),
    })),

  /**
   * Readiness probe - can the service accept traffic?
   * Checks if KV-backed saga metadata is reachable.
   */
  ready: baseContract
    .route({ method: 'GET', path: '/health/ready' })
    .input(z.object({}).optional())
    .output(z.object({
      status: z.enum(['ready', 'not_ready']),
      timestamp: z.string().datetime(),
    })),

  /**
   * Detailed health check - comprehensive status of all components.
   */
  check: baseContract
    .route({ method: 'GET', path: '/health' })
    .input(z.object({}).optional())
    .output(HealthCheckResultSchema),
};

const healthContractV1: ReturnType<typeof implement<typeof healthContract>> = implement(
  healthContract,
);

/**
 * Precise handler-map type for the sagas health contract.
 *
 * Each value is exactly the `ImplementedProcedure` that
 * `healthContractV1[K].handler(...)` returns. JSR `--isolatedDeclarations` cannot
 * infer the type of an exported handler map built from `.handler(...)` call
 * expressions, so this explicit (non-`readonly`, to stay assignable to oRPC's
 * mutable `Router`) mapped type is the annotation — preserving per-route
 * precision with no `any` / `Record<string, unknown>` erasure.
 */
type HealthHandlers<K extends keyof typeof healthContractV1> = {
  [P in K]: (typeof healthContractV1)[P] extends { handler: (...args: never[]) => infer R } ? R
    : never;
};

// ============================================================================
// HEALTH HANDLERS
// ============================================================================

export const health: HealthHandlers<'live' | 'ready' | 'check'> = {
  /**
   * Liveness probe - always returns OK if process is running
   */
  live: healthContractV1.live.handler(() => {
    return {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Readiness probe - checks if KV is ready.
   */
  ready: healthContractV1.ready.handler(async () => {
    const isReady = await canReachKv();

    return {
      status: isReady ? 'ready' as const : 'not_ready' as const,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Comprehensive health check with component details
   */
  check: healthContractV1.check.handler(async () => {
    const checks: Record<
      string,
      { status: 'healthy' | 'unhealthy'; latency?: number; message?: string }
    > = {};

    // Check KV status
    const kvStart = Date.now();
    try {
      await getKv();
      checks.kv = {
        status: 'healthy',
        latency: Date.now() - kvStart,
      };
    } catch (error) {
      checks.kv = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check registry status
    const registryStart = Date.now();
    try {
      const sagaCount = (await listSagaMetadata()).length;
      checks.registry = {
        status: 'healthy',
        latency: Date.now() - registryStart,
        message: `${sagaCount} sagas registered`,
      };
    } catch (error) {
      checks.registry = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Determine overall status
    const unhealthyCount = Object.values(checks).filter((c) => c.status === 'unhealthy').length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount === 0) {
      status = 'healthy';
    } else if (unhealthyCount < totalChecks) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      service: 'sagas-api',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks,
    };
  }),
};

async function canReachKv(): Promise<boolean> {
  try {
    await getKv();
    return true;
  } catch {
    return false;
  }
}
