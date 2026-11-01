import { baseContract } from '@netscript/contracts';
import { z } from 'zod';

export const pricingV2 = {
  quote: baseContract
    .route({ method: 'GET', path: '/quote' })
    .meta({ access: { authentication: 'none' } })
    .input(z.object({ seats: z.number().int().positive() }))
    .output(z.object({ totalCents: z.number().int(), currency: z.literal('USD') })),
};
