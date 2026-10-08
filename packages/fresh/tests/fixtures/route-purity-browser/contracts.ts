import {
  bindRoutePattern,
  type BoundRouteContract,
  defineRouteContract,
} from '../../../src/application/route/mod.ts';
import { z } from 'zod';

const channelContract = defineRouteContract({
  pathSchema: z.object({ channel: z.enum(['A', 'B']) }),
});
export const channelRoute: BoundRouteContract<{ channel: 'A' | 'B' }, Record<string, never>> =
  bindRoutePattern(channelContract, '/channel/[channel]');
export const pairedChannel: ReturnType<typeof channelRoute.withPartial<typeof channelRoute>> =
  channelRoute.withPartial(bindRoutePattern(channelContract, '/partials/channel/[channel]'));
const chatContract = defineRouteContract({ searchSchema: z.object({ id: z.string().min(1) }) });
export const sendRoute: BoundRouteContract<Record<string, never>, { id: string }> =
  bindRoutePattern(chatContract, '/chat/send');
export const readRoute: BoundRouteContract<Record<string, never>, { id: string }> =
  bindRoutePattern(chatContract, '/chat/read');
