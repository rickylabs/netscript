/**
 * Sagas service router assembled through the shared plugin service binder.
 *
 * @module
 */

import { assemblePluginContractRouter } from '@netscript/plugin/service';
import { router as sagasRouter } from './routers/router-context.ts';
import { sagasV1 } from './routers/v1.ts';

const assembledSagasRouter: Readonly<Record<string, unknown>> = assemblePluginContractRouter(
  sagasRouter,
  {
    version: 'v1',
    namespace: 'sagas',
    handlers: sagasV1,
  },
);

/** Main sagas service router. */
export const router: typeof assembledSagasRouter = assembledSagasRouter;

/** Assembled sagas service router type. */
export type Router = typeof router;
