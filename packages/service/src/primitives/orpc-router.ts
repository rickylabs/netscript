/**
 * Internal oRPC router narrowing for service primitives.
 *
 * @module
 */

import type { Router } from '@orpc/server';
import type { ServiceRouter } from '../types.ts';

export type OrpcRouter = Router<never, Record<PropertyKey, unknown>>;

export function isOrpcRouter(router: ServiceRouter): router is OrpcRouter {
  return typeof router === 'object' && router !== null;
}
