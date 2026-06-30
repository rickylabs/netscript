/**
 * Workers service router assembled through the shared plugin service binder.
 *
 * @module
 */

import { assemblePluginContractRouter } from '@netscript/plugin/service';
import { router as workersRouter } from './routers/router-context.ts';
import { workersV1 } from './routers/v1.ts';

const assembledWorkersRouter: Readonly<Record<string, unknown>> = assemblePluginContractRouter(
  workersRouter,
  {
    version: 'v1',
    namespace: 'workers',
    handlers: workersV1,
  },
);

/** Main workers service router. */
export const router: typeof assembledWorkersRouter = assembledWorkersRouter;

/** Assembled workers service router type. */
export type WorkersRouter = typeof router;
