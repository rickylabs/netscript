/**
 * Auth service router.
 *
 * @module
 */

import { os } from '@orpc/server';
import { health } from './routers/health.ts';
import { authV1 } from './routers/v1.ts';
import { currentAuthRequest } from './request-context.ts';
import type { AuthServiceContext } from './routers/v1-types.ts';

const authRequestMiddleware = os.$context<AuthServiceContext>().middleware(
  async ({ next }) => await next({ context: { request: currentAuthRequest() } }),
);

const authRouter = os.$context<AuthServiceContext>().use(authRequestMiddleware).prefix('/v1/auth')
  // deno-lint-ignore no-explicit-any
  .router(authV1 as any);

// deno-lint-ignore no-explicit-any
export const v1: any = {
  health,
  auth: authRouter,
};

// deno-lint-ignore no-explicit-any
export const router: any = os.router({
  v1,
});

export type AuthRouter = typeof router;
