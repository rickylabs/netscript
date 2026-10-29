import { baseContract } from '@netscript/contracts';
import { createServiceClient } from '@netscript/sdk/client';
import { implement } from '@orpc/server';
import { z } from 'zod';

export const pricingV2 = {
  quote: baseContract
    .route({ method: 'GET', path: '/quote' })
    .meta({ access: { authentication: 'none' } })
    .input(z.object({ seats: z.number().int().positive() }))
    .output(z.object({ totalCents: z.number().int(), currency: z.literal('USD') })),
};
const os = implement(pricingV2);
export const router = {
  quote: os.quote.handler(({ input }) => ({ totalCents: input.seats * 1500, currency: 'USD' })),
};
const pricing = createServiceClient({
  contract: pricingV2,
  serviceName: 'pricing',
  routerName: 'pricing',
  apiVersion: 'v2',
});
export async function quoteForTeam(seats: number) {
  return await pricing.quote({ seats });
}
