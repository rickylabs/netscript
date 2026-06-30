/**
 * Health router for the auth API service.
 *
 * @module
 */

import { implement } from '@orpc/server';
import { oc } from '@orpc/contract';
import type { BaseContractProcedure } from '@netscript/contracts';
import { z } from 'zod';

const healthContract: {
  live: BaseContractProcedure;
  ready: BaseContractProcedure;
} = {
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

const healthContractV1: ReturnType<typeof implement<typeof healthContract>> = implement(
  healthContract,
);

/**
 * Precise handler-map type for the auth health contract.
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

/** Auth API health handlers. */
export const health: HealthHandlers<'live' | 'ready'> = {
  live: healthContractV1.live.handler(() => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })),
  ready: healthContractV1.ready.handler(() => ({
    status: 'ready',
    timestamp: new Date().toISOString(),
  })),
};
