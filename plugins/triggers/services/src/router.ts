/**
 * Triggers service router.
 *
 * Assembles the triggers v1 contract handler map through the shared plugin
 * service binder, preserving the version-prefixed `/v1/triggers` contract
 * mount while keeping connector-local router casts out of the public surface.
 *
 * @module
 */

import { assemblePluginContractRouter } from '@netscript/plugin/service';
import { triggersV1 } from './routers/v1.ts';
import { router as triggersImplementer } from './routers/router-context.ts';

const assembledTriggersRouter: Readonly<Record<string, unknown>> = assemblePluginContractRouter(
  triggersImplementer,
  {
    version: 'v1',
    namespace: 'triggers',
    handlers: triggersV1,
  },
);

/** Main triggers service router. */
export const router: typeof assembledTriggersRouter = assembledTriggersRouter;

/** Assembled triggers service router type. */
export type TriggersRouter = typeof router;
