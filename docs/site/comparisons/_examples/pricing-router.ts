import { implement } from '@orpc/server';
import { pricingV2 } from './contracts.ts';

const os = implement(pricingV2);
export const router = {
  quote: os.quote.handler(({ input }) => ({ totalCents: input.seats * 1500, currency: 'USD' })),
};
