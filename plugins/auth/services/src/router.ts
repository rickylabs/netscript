/**
 * Auth service router.
 *
 * @module
 */

import { type AnyRouter, os } from '@orpc/server';
import { health } from './routers/health.ts';
import { authV1 } from './routers/v1.ts';
import { router as authImplementer } from './routers/router-context.ts';
import { currentAuthRequest } from './request-context.ts';
import type { AuthServiceContext } from './routers/v1-types.ts';

const authRequestMiddleware = os.$context<AuthServiceContext>().middleware(
  async ({ next }) => await next({ context: { request: currentAuthRequest() } }),
);

// Build the auth sub-router through the CONTRACT implementer's `.router(...)`
// (not bare `os.router(...)`): the contract-first overload enforces that
// `authV1` conforms to the auth contract and preserves each route's precise
// input/output types in the assembled router. The request-capture middleware
// and the OpenAPI `/v1/auth` prefix are applied through a context-aware builder
// (`os.$context<Ctx>()`) because the implemented procedures require
// `AuthServiceContext`; a bare, context-less `os.prefix(...)` cannot wrap
// context-requiring procedures.
const assembledAuth = authImplementer.router(authV1);
const authRouter = os
  .$context<AuthServiceContext>()
  .use(authRequestMiddleware)
  .prefix('/v1/auth')
  .router(assembledAuth);

/**
 * Version 1 router (health + prefixed auth).
 *
 * `health` keeps its precise per-route handler type. `auth` is annotated with
 * oRPC's `AnyRouter` rather than the bare `any` keyword: the assembled,
 * prefixed, contract-bound auth router is the result of `.router()` /
 * `.use().prefix().router()` call expressions whose context-merged type cannot
 * be spelled or inferred for JSR `--isolatedDeclarations` declaration emit.
 * Consumer-facing route precision is NOT lost — it is carried by the published
 * `authContractV1` (and the `authV1` handler map), which is what drives client
 * typing; this server-side assembly boundary does not re-export per-procedure
 * I/O.
 */
export const v1: {
  health: typeof health;
  auth: AnyRouter;
} = {
  health,
  auth: authRouter,
};

/**
 * Main router with all versions.
 *
 * Annotated as `{ v1: AnyRouter }` (assignable to the service layer's
 * `ServiceRouter = Record<string, unknown>`). `os.router(...)` returns the input
 * router record essentially unchanged, so this annotation is faithful while
 * satisfying JSR `--isolatedDeclarations` (the bare call expression is otherwise
 * un-emittable). The `auth` sub-router uses `AnyRouter` (see {@link v1});
 * consumer route precision is carried by the published `authContractV1`.
 */
export const router: { v1: AnyRouter } = os.router({
  v1,
});

/** Assembled auth service router type. */
export type AuthRouter = typeof router;
