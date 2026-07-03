import { assertEquals } from 'jsr:@std/assert@^1';
import { implement } from '@orpc/server';
import { baseContract, type BaseContractRoute } from '@netscript/contracts';
import { z } from 'zod';

// ============================================================================
// Type-level soundness fixture for the 172a-2-SOUND base-contract seam.
//
// Proves the FIRST actual soundness win of 172a-2-SOUND: a route annotated with
// the SOUND `BaseContractRoute<TIn, TOut>` alias carries its precise OUTPUT
// schema through `implement(...)`, so a handler whose return shape does not
// conform to the contract output is a COMPILE error. Under the pre-172a-2-SOUND
// `BaseContractProcedure` erasure (`~orpc: any`) — the annotation the workers /
// sagas health routers used before this slice — the same wrong handlers
// compiled silently.
//
// Each `@ts-expect-error` below MUST stay an error. Deleting one (i.e.
// re-loosening the seam back to `any`) removes the error, fails this file under
// `deno check`, and is exactly the regression the guard is meant to catch.
// ============================================================================

const EmptyInputSchema: z.ZodOptional<z.ZodObject<Record<string, never>>> = z.object({})
  .optional();
const StatusOutputSchema: z.ZodObject<{
  status: z.ZodEnum<{ healthy: 'healthy'; unhealthy: 'unhealthy' }>;
}> = z.object({
  status: z.enum(['healthy', 'unhealthy']),
});

const soundContract: {
  status: BaseContractRoute<typeof EmptyInputSchema, typeof StatusOutputSchema>;
} = {
  status: baseContract
    .route({ method: 'GET', path: '/status' })
    .input(EmptyInputSchema)
    .output(StatusOutputSchema),
};

const impl: ReturnType<typeof implement<typeof soundContract>> = implement(soundContract);

// Positive: a handler whose output conforms to the contract type-checks.
const _validStatus = impl.status.handler(() => ({ status: 'healthy' as const }));

// Negative: `status` must be 'healthy' | 'unhealthy'. Returning an unknown
// literal violates the contract OUTPUT schema. Under `~orpc: any` this compiled.
// @ts-expect-error - 'on-fire' is not a member of the contract output enum
const _wrongStatus = impl.status.handler(() => ({ status: 'on-fire' as const }));

// Negative: omitting the required `status` field must fail the output contract.
// @ts-expect-error - handler output is missing the required `status` field
const _missingStatus = impl.status.handler(() => ({}));

Deno.test('sound BaseContractRoute rejects non-conforming handler output', () => {
  // Reference the type-level bindings at runtime so they are not unused; their
  // mere existence (with the guards above) is the compile-time assertion.
  assertEquals(typeof _validStatus, 'object');
  assertEquals(typeof _wrongStatus, 'object');
  assertEquals(typeof _missingStatus, 'object');
});
