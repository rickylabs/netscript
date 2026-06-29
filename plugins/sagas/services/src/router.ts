/**
 * Sagas Router
 *
 * Combines all routers into the main router for the Sagas API service.
 *
 * Uses .prefix() to add versioned paths for OpenAPI:
 * - /api/v1/sagas/sagas
 * - /api/v1/sagas/instances
 * - /api/v1/sagas/publish
 * - /api/v1/sagas/subscribe (SSE)
 *
 * RPC paths follow router structure:
 * - /api/rpc/v1/sagas/listSagas
 * - /api/rpc/v1/sagas/getSaga
 * - /api/rpc/v1/sagas/listInstances
 * - /api/rpc/v1/sagas/getInstance
 * - /api/rpc/v1/sagas/publish
 * - /api/rpc/v1/sagas/subscribe
 *
 * @module
 */

import { type AnyRouter, os } from '@orpc/server';
import { health } from './routers/health.ts';
import { sagasV1 } from './routers/v1.ts';
import { router as sagasImplementer } from './routers/router-context.ts';
import type { SagaServiceContext } from './routers/v1-types.ts';

// ============================================================================
// VERSION ROUTERS
// ============================================================================

/**
 * Version 1 router
 *
 * Handles all V1 endpoints for sagas.
 * Follows the same pattern as workers plugin.
 *
 * Uses .prefix('/v1/sagas') to prepend versioned path to all OpenAPI routes.
 */
// Build the sagas sub-router through the CONTRACT implementer's `.router(...)`
// (not bare `os.router(...)`): the contract-first overload enforces that
// `sagasV1` conforms to the sagas contract and preserves each route's precise
// input/output types in the assembled router. The OpenAPI `/v1/sagas` prefix is
// applied through a context-aware builder (`os.$context<Ctx>()`) because the
// implemented procedures require `SagaServiceContext`; a bare, context-less
// `os.prefix(...)` cannot wrap context-requiring procedures.
const assembledSagas = sagasImplementer.router(sagasV1);
const sagasSubRouter = os
  .$context<SagaServiceContext>()
  .prefix('/v1/sagas')
  .router(assembledSagas);

/**
 * Version 1 router (health + prefixed sagas).
 *
 * `health` keeps its precise per-route handler type. `sagas` is annotated with
 * oRPC's `AnyRouter` rather than the bare `any` keyword: the assembled,
 * prefixed, contract-bound sagas router is the result of `.router()` /
 * `.prefix().router()` call expressions whose context-merged type cannot be
 * spelled or inferred for JSR `--isolatedDeclarations` declaration emit.
 * Consumer-facing route precision is NOT lost — it is carried by the published
 * `sagasContractV1` (and the `sagasV1` handler map), which is what drives client
 * typing; this server-side assembly boundary does not re-export per-procedure
 * I/O.
 */
export const v1: {
  health: typeof health;
  sagas: AnyRouter;
} = {
  health,
  sagas: sagasSubRouter,
};

// ============================================================================
// COMBINED ROUTER
// ============================================================================

/**
 * Main router with all versions
 *
 * OpenAPI Routes (with prefix):
 * - /api/v1/sagas/sagas
 * - /api/v1/sagas/sagas/{id}
 * - /api/v1/sagas/instances
 * - /api/v1/sagas/instances/{sagaName}/{correlationId}
 * - /api/v1/sagas/publish
 * - /api/v1/sagas/subscribe (SSE)
 *
 * RPC Routes (from router structure):
 * - v1.health.check
 * - v1.health.ping
 * - v1.sagas.listSagas
 * - v1.sagas.getSaga
 * - v1.sagas.listInstances
 * - v1.sagas.getInstance
 * - v1.sagas.publish
 * - v1.sagas.subscribe
 */
/**
 * Main router with all versions.
 *
 * Annotated as `{ v1: AnyRouter }` (assignable to the service layer's
 * `ServiceRouter = Record<string, unknown>`). `os.router(...)` returns the input
 * router record essentially unchanged, so this annotation is faithful while
 * satisfying JSR `--isolatedDeclarations` (the bare call expression is otherwise
 * un-emittable). The `sagas` sub-router uses `AnyRouter` (see {@link v1});
 * consumer route precision is carried by the published `sagasContractV1`.
 */
export const router: { v1: AnyRouter } = os.router({
  v1,
  // Future: v2, v3, etc.
});

/** Assembled sagas service router type. */
export type Router = typeof router;
