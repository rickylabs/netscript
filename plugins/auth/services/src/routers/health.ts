/**
 * Health router for the auth API service.
 *
 * @module
 */

import { implement } from '@orpc/server';
import { oc } from '@orpc/contract';
import { z } from 'zod';

const healthContract = {
  live: oc
    .route({ method: 'GET', path: '/health/live' })
    .input(z.object({}).optional())
    .output(z.object({
      status: z.literal('ok'),
      timestamp: z.string().datetime(),
    })),
  ready: oc
    .route({ method: 'GET', path: '/health/ready' })
    .input(z.object({}).optional())
    .output(z.object({
      status: z.enum(['ready', 'not_ready']),
      timestamp: z.string().datetime(),
    })),
};

const healthContractV1 = implement(healthContract);

/** Auth API health handlers. */
export const health: Record<string, unknown> = {
  live: healthContractV1.live.handler(() => ({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
  })),
  ready: healthContractV1.ready.handler(() => ({
    status: 'ready' as const,
    timestamp: new Date().toISOString(),
  })),
};
