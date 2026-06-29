/**
 * Workers Health Check Router
 *
 * Version-agnostic health check handlers for the Workers API.
 */

import { implement } from '@orpc/server';
import { type BaseContractProcedure, baseContract } from '@netscript/contracts';
import { z } from 'zod';

const startTime = Date.now();

/**
 * Version-agnostic health contract.
 *
 * Each member is annotated as the contracts package's public
 * {@link BaseContractProcedure} (the type `baseContract.route().input().output()`
 * returns). The explicit annotation is what lets JSR `--isolatedDeclarations`
 * emit `healthContractV1`'s type (and, downstream, the exported `health` handler
 * map) without inferring the inline builder chain.
 */
const healthContract: { check: BaseContractProcedure; ping: BaseContractProcedure } = {
  check: baseContract
    .route({ method: 'GET', path: '/health' })
    .input(z.object({}).optional())
    .output(z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy']),
      service: z.string(),
      version: z.string(),
      timestamp: z.string(),
      uptime: z.number().optional(),
    })),

  ping: baseContract
    .route({ method: 'GET', path: '/ping' })
    .input(z.object({ message: z.string().optional() }).optional())
    .output(z.object({
      message: z.string(),
      timestamp: z.string(),
    })),
};

const healthContractV1: ReturnType<typeof implement<typeof healthContract>> = implement(
  healthContract,
);

/**
 * Precise handler-map type for the version-agnostic health contract.
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
// HEALTH CHECK HANDLERS
// ============================================================================

export const health: HealthHandlers<'check' | 'ping'> = {
  /**
   * Health check endpoint - for testing oRPC connectivity
   */
  check: healthContractV1.check.handler(() => {
    return {
      status: 'healthy' as const,
      service: 'workers-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };
  }),

  /**
   * Simple ping endpoint - for testing oRPC connectivity
   */
  ping: healthContractV1.ping.handler(({ input }) => {
    return {
      message: input?.message ? `Pong: ${input.message}` : 'Pong!',
      timestamp: new Date().toISOString(),
    };
  }),
};
