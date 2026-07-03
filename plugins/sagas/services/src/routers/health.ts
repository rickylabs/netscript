/**
 * Health Router
 *
 * Health check endpoints for the Sagas API service.
 * Implements API, KV, and registry readiness checks for the sagas plugin service.
 * @module
 */

import { z } from 'zod';
import { baseContract, type BaseContractRoute } from '@netscript/contracts';
import { implement } from '@orpc/server';
import { getKv } from '@netscript/kv';
import { listSagaMetadata } from '../saga-registry.ts';

// ============================================================================
// HEALTH CHECK SCHEMAS
// ============================================================================

const ComponentHealthSchema: z.ZodObject<{
  status: z.ZodEnum<{ healthy: 'healthy'; unhealthy: 'unhealthy' }>;
  latency: z.ZodOptional<z.ZodNumber>;
  message: z.ZodOptional<z.ZodString>;
}> = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  latency: z.number().optional(),
  message: z.string().optional(),
});

// Named input/output schemas so each route can be annotated with the SOUND
// `BaseContractRoute<TIn, TOut>` alias (172a-2-SOUND slice 3). The precise
// `typeof <schema>` flows through `implement(...)`, so the handler bodies below
// are genuinely type-checked against the contract output — under the previous
// `BaseContractProcedure` (`~orpc: any`) annotation a wrong handler shape
// compiled silently.
const HealthInputSchema: z.ZodOptional<z.ZodObject<Record<string, never>>> = z.object({})
  .optional();

const LiveOutputSchema: z.ZodObject<{ status: z.ZodLiteral<'ok'>; timestamp: z.ZodString }> = z
  .object({
    status: z.literal('ok'),
    timestamp: z.string().datetime(),
  });

const ReadyOutputSchema: z.ZodObject<{
  status: z.ZodEnum<{ ready: 'ready'; not_ready: 'not_ready' }>;
  timestamp: z.ZodString;
}> = z.object({
  status: z.enum(['ready', 'not_ready']),
  timestamp: z.string().datetime(),
});

const HealthCheckResultSchema: z.ZodObject<{
  status: z.ZodEnum<{ healthy: 'healthy'; degraded: 'degraded'; unhealthy: 'unhealthy' }>;
  service: z.ZodString;
  timestamp: z.ZodString;
  version: z.ZodString;
  checks: z.ZodOptional<z.ZodRecord<z.ZodString, typeof ComponentHealthSchema>>;
}> = z.object({
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
  live: BaseContractRoute<typeof HealthInputSchema, typeof LiveOutputSchema>;
  ready: BaseContractRoute<typeof HealthInputSchema, typeof ReadyOutputSchema>;
  check: BaseContractRoute<typeof HealthInputSchema, typeof HealthCheckResultSchema>;
} = {
  /**
   * Liveness probe - is the process alive?
   * Fast and simple, fails only if process is deadlocked.
   */
  live: baseContract
    .route({ method: 'GET', path: '/health/live' })
    .input(HealthInputSchema)
    .output(LiveOutputSchema),

  /**
   * Readiness probe - can the service accept traffic?
   * Checks if KV-backed saga metadata is reachable.
   */
  ready: baseContract
    .route({ method: 'GET', path: '/health/ready' })
    .input(HealthInputSchema)
    .output(ReadyOutputSchema),

  /**
   * Detailed health check - comprehensive status of all components.
   */
  check: baseContract
    .route({ method: 'GET', path: '/health' })
    .input(HealthInputSchema)
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
