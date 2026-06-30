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

import { type AnyRouter, os } from '@orpc/server';
import { health } from './routers/health.ts';
import { workersV1 } from './routers/v1.ts';
import { router as workersImplementer } from './routers/router-context.ts';
import type { WorkersRequestContext } from './routers/router-context.ts';

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
// Build the workers sub-router through the CONTRACT implementer's `.router(...)`
// (not bare `os.router(...)`): the contract-first overload enforces that
// `workersV1` conforms to the workers contract and preserves each route's
// precise input/output types in the assembled router. The OpenAPI `/v1/workers`
// prefix is applied through a context-aware builder (`os.$context<Ctx>()`)
// because the implemented procedures require `WorkersRequestContext`; a bare,
// context-less `os.prefix(...)` cannot wrap context-requiring procedures.
const assembledWorkers = workersImplementer.router(workersV1);
const workersSubRouter = os
  .$context<WorkersRequestContext>()
  .prefix('/v1/workers')
  .router(assembledWorkers);

/**
 * Version 1 router (health + prefixed workers).
 *
 * `health` keeps its precise per-route handler type. `workers` is annotated with
 * oRPC's `AnyRouter` rather than the bare `any` keyword: the assembled,
 * prefixed, contract-bound workers router is the result of `.router()` /
 * `.prefix().router()` call expressions whose 22-procedure, context-merged type
 * cannot be spelled or inferred for JSR `--isolatedDeclarations` declaration
 * emit. Consumer-facing route precision is NOT lost — it is carried by the
 * published `workersContractV1` (and the per-route `workersV1` handler maps),
 * which is what drives client typing; this server-side assembly boundary does
 * not re-export per-procedure I/O. See DRIFT in the run notes.
 */
export const v1: {
  health: typeof health;
  workers: AnyRouter;
} = {
  health,
  workers: workersSubRouter,
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
/**
 * Main router with all versions.
 *
 * Annotated as the concrete `{ v1: typeof v1 }` record (assignable to the
 * service layer's `ServiceRouter = Record<string, unknown>`). `os.router(...)`
 * returns the input router record essentially unchanged, so this annotation is
 * faithful while satisfying JSR `--isolatedDeclarations` (the bare call
 * expression is otherwise un-emittable). The `workers` sub-router uses
 * `AnyRouter` (see {@link v1}); consumer route precision is carried by the
 * published `workersContractV1`. See DRIFT in the run notes.
 */
export const router: { v1: AnyRouter } = os.router({
  v1,
  // Future: v2, v3, etc.
});

/** Assembled workers service router type. */
export type WorkersRouter = typeof router;
