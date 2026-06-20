/**
 * Auth service router.
 *
 * @module
 */

import { os } from '@orpc/server';
import { health } from './routers/health.ts';
import { authV1 } from './routers/v1.ts';

// deno-lint-ignore no-explicit-any
export const v1: any = {
  health,
  // deno-lint-ignore no-explicit-any
  auth: os.prefix('/v1/auth').router(authV1 as any),
};

// deno-lint-ignore no-explicit-any
export const router: any = os.router({
  v1,
});

export type AuthRouter = typeof router;
