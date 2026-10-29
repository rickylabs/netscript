import { createServiceClient } from '@netscript/sdk/client';
import { pricingV2 } from './contracts.ts';

const pricing = createServiceClient({
  contract: pricingV2,
  serviceName: 'pricing',
  routerName: 'pricing',
  apiVersion: 'v2',
});
export async function quoteForTeam(seats: number) {
  return await pricing.quote({ seats });
}
