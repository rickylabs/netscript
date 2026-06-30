/**
 * Auth service router.
 *
 * @module
 */

import { assemblePluginContractRouter } from '@netscript/plugin/service';
import { authV1 } from './routers/v1.ts';
import { router as authImplementer } from './routers/router-context.ts';

const assembledAuthRouter: Readonly<Record<string, unknown>> = assemblePluginContractRouter(
  authImplementer,
  {
    version: 'v1',
    namespace: 'auth',
    handlers: authV1,
  },
);

/** Main auth service router. */
export const router: typeof assembledAuthRouter = assembledAuthRouter;

/** Assembled auth service router type. */
export type AuthRouter = typeof router;
