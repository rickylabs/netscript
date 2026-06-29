/**
 * Triggers service router.
 *
 * Assembles the triggers v1 contract handler map through the CONTRACT
 * implementer's `.router(...)` (not bare `os.router(...)`): the contract-first
 * overload enforces that `triggersV1` conforms to the triggers contract and
 * preserves each route's precise input/output types in the assembled router.
 * The `/v1/triggers` prefix is applied through a context-aware builder
 * (`os.$context<Ctx>()`) because the implemented procedures require
 * `TriggerServiceContext`.
 *
 * @module
 */

import { type AnyRouter, os } from '@orpc/server';
import { triggersV1 } from './routers/v1.ts';
import { router as triggersImplementer } from './routers/router-context.ts';
import type { TriggerServiceContext } from './routers/v1-types.ts';

const assembledTriggers = triggersImplementer.router(triggersV1);
const triggersRouter = os
  .$context<TriggerServiceContext>()
  .prefix('/v1/triggers')
  .router(assembledTriggers);

/**
 * Version 1 router (prefixed triggers contract).
 *
 * `triggers` is annotated with oRPC's `AnyRouter` rather than the bare `any`
 * keyword: the assembled, prefixed, contract-bound router is the result of
 * `.router()` / `.prefix().router()` call expressions whose context-merged type
 * cannot be spelled or inferred for JSR `--isolatedDeclarations` declaration
 * emit. Consumer-facing route precision is NOT lost — it is carried by the
 * published `triggersContractV1` (and the `triggersV1` handler map), which is
 * what drives client typing; this server-side assembly boundary does not
 * re-export per-procedure I/O.
 */
export const v1: {
  triggers: AnyRouter;
} = {
  triggers: triggersRouter,
};

/**
 * Main router with all versions.
 *
 * Annotated as `{ v1: AnyRouter }` (assignable to the service layer's
 * `ServiceRouter = Record<string, unknown>`). `os.router(...)` returns the input
 * router record essentially unchanged, so this annotation is faithful while
 * satisfying JSR `--isolatedDeclarations` (the bare call expression is otherwise
 * un-emittable). Consumer route precision is carried by the published
 * `triggersContractV1`.
 */
export const router: { v1: AnyRouter } = os.router({
  v1,
});

/** Assembled triggers service router type. */
export type TriggersRouter = typeof router;
