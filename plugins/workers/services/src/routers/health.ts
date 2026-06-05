/**
 * Workers Health Check Router
 *
 * Version-agnostic health check handlers for the Workers API.
 */

import { implement } from '@orpc/server';
import { baseContract } from '@netscript/contracts';
import { z } from 'zod';

const startTime = Date.now();

const healthContract = {
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

const healthContractV1 = implement(healthContract);

// ============================================================================
// HEALTH CHECK HANDLERS
// ============================================================================

export const health = {
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
