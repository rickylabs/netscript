/**
 * Internal oRPC router narrowing for service primitives.
 *
 * @module
 */

import type { Router } from '@orpc/server';

export type OrpcRouter = Router<never, Record<PropertyKey, unknown>>;

export function isOrpcRouter(router: unknown): router is OrpcRouter {
  return typeof router === 'object' && router !== null;
}
