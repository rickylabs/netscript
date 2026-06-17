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

import { os } from '@orpc/server';
import { health } from './routers/health.ts';
import { sagasV1 } from './routers/v1.ts';

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
// deno-lint-ignore no-explicit-any
export const v1: any = {
  health,
  // deno-lint-ignore no-explicit-any
  sagas: os.prefix('/v1/sagas').router(sagasV1 as any),
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
// deno-lint-ignore no-explicit-any
export const router: any = os.router({
  v1,
  // Future: v2, v3, etc.
});

export type Router = typeof router;
