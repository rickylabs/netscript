/**
 * Workers Health Check Router
 *
 * Version-agnostic health check handlers for the Workers API.
 */

import { implement } from '@orpc/server';
import { baseContract, type BaseContractRoute } from '@netscript/contracts';
import { z } from 'zod';

const startTime = Date.now();

// Named input/output schemas so each route can be annotated with the SOUND
// `BaseContractRoute<TIn, TOut>` alias (172a-2-SOUND slice 3). Carrying the
// precise `typeof <schema>` through the contract is what makes the handler
// bodies below genuinely type-checked against the contract output — under the
// previous `BaseContractProcedure` (`~orpc: any`) annotation a wrong handler
// shape compiled silently.
const CheckInputSchema: z.ZodOptional<z.ZodObject<Record<string, never>>> = z.object({})
  .optional();
const CheckOutputSchema: z.ZodObject<{
  status: z.ZodEnum<{ healthy: 'healthy'; degraded: 'degraded'; unhealthy: 'unhealthy' }>;
  service: z.ZodString;
  version: z.ZodString;
  timestamp: z.ZodString;
  uptime: z.ZodOptional<z.ZodNumber>;
}> = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  service: z.string(),
  version: z.string(),
  timestamp: z.string(),
  uptime: z.number().optional(),
});
const PingInputSchema: z.ZodOptional<z.ZodObject<{ message: z.ZodOptional<z.ZodString> }>> = z
  .object({ message: z.string().optional() }).optional();
const PingOutputSchema: z.ZodObject<{ message: z.ZodString; timestamp: z.ZodString }> = z.object({
  message: z.string(),
  timestamp: z.string(),
});

/**
 * Version-agnostic health contract.
 *
 * Each member is annotated as the contracts package's sound
 * {@link BaseContractRoute} (the type `baseContract.route().input().output()`
 * returns, parameterized on the precise input/output schemas). The explicit
 * annotation is what lets JSR `--isolatedDeclarations` emit `healthContractV1`'s
 * type (and, downstream, the exported `health` handler map) without inferring
 * the inline builder chain, while keeping the output schema types precise so the
 * handlers are type-checked.
 */
const healthContract: {
  check: BaseContractRoute<typeof CheckInputSchema, typeof CheckOutputSchema>;
  ping: BaseContractRoute<typeof PingInputSchema, typeof PingOutputSchema>;
} = {
  check: baseContract
    .route({ method: 'GET', path: '/health' })
    .input(CheckInputSchema)
    .output(CheckOutputSchema),

  ping: baseContract
    .route({ method: 'GET', path: '/ping' })
    .input(PingInputSchema)
    .output(PingOutputSchema),
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
