/**
 * Workers Service Router
 *
 * Combines all routers into a single oRPC router.
 *
 * Uses .prefix() to add versioned paths for OpenAPI:
 * - /api/v1/workers/jobs
 * - /api/v1/workers/executions
 * - /api/v1/workers/tasks
 * - etc.
 *
 * RPC paths follow router structure:
 * - /api/rpc/v1/workers/listJobs
 * - /api/rpc/v1/workers/getJob
 * - etc.
 *
 * This allows `createServiceClient` to work with:
 * `${baseUrl}/api/rpc/v1/workers`
 */

import { os } from '@orpc/server';
import { health } from './routers/health.ts';
import { workersV1 } from './routers/v1.ts';

// ============================================================================
// VERSION ROUTERS
// ============================================================================

/**
 * Version 1 router
 *
 * Handles all V1 endpoints for workers.
 * Follows the same pattern as local services (users, products, orders).
 *
 * Uses .prefix('/v1/workers') to prepend versioned path to all OpenAPI routes.
 */
// deno-lint-ignore no-explicit-any
export const v1: any = {
  health,
  // deno-lint-ignore no-explicit-any
  workers: os.prefix('/v1/workers').router(workersV1 as any),
};

// Future versions:
// export const v2 = {
//   health,
//   workers: os.prefix('/v2/workers').router(workersV2),
// };

// ============================================================================
// COMBINED ROUTER
// ============================================================================

/**
 * Main router with all versions
 *
 * OpenAPI Routes (with prefix):
 * - /v1/workers/jobs
 * - /v1/workers/jobs/{id}
 * - /v1/workers/jobs/{id}/trigger
 * - /v1/workers/executions
 * - /v1/workers/executions/{jobId}/{executionId}
 * - /v1/workers/tasks
 * - /v1/workers/cleanup
 * - /v1/workers/seed
 * - /v1/workers/subscribe (SSE)
 *
 * RPC Routes (from router structure):
 * - v1.health.check
 * - v1.health.ping
 * - v1.workers.listJobs
 * - v1.workers.getJob
 * - v1.workers.createJob
 * - v1.workers.updateJob
 * - v1.workers.deleteJob
 * - v1.workers.triggerJob
 * - v1.workers.listExecutions
 * - v1.workers.getExecution
 * - v1.workers.listTasks
 * - v1.workers.cleanup
 * - v1.workers.seed
 * - v1.workers.subscribe
 */
// deno-lint-ignore no-explicit-any
export const router: any = os.router({
  v1,
  // Future: v2, v3, etc.
});

export type WorkersRouter = typeof router;
