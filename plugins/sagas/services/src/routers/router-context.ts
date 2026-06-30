/**
 * Sagas Service Router Context
 *
 * Binds the canonical, type-sound sagas v1 contract implementer
 * (`@netscript/plugin-sagas-core/contracts/v1`) to the connector's request
 * context. Every `router.<route>.handler(...)` is checked against the contract
 * IO; there is no `any`/`Record<string, unknown>` erasure on the handler map.
 *
 * @module
 */

import { sagasContractV1 } from '../../../contracts/v1/mod.ts';
import type { SagaServiceContext } from './v1-types.ts';

type SagasRouterContext = ReturnType<typeof sagasContractV1.$context<SagaServiceContext>>;

const sagasRouter: SagasRouterContext = sagasContractV1.$context<SagaServiceContext>();

/** Context-bound sagas v1 implementer used to build every handler. */
export const router: typeof sagasRouter = sagasRouter;

/**
 * Precise type of a contract-bound handler map slice.
 *
 * Each handler value is exactly the `ImplementedProcedure` that
 * `router[K].handler(...)` produces — its input/output schemas, context, and
 * error map are derived from the sagas contract, not hand-authored. Splitting
 * the handlers across modules forces them to be `export`ed, which means JSR
 * `--isolatedDeclarations` requires an explicit annotation; this mapped type is
 * that annotation while preserving per-route precision (no `any`, no
 * `Record<string, unknown>` erasure).
 */
export type SagasHandlers<K extends keyof typeof router> = {
  [P in K]: (typeof router)[P] extends { handler: (...args: never[]) => infer R } ? R
    : never;
};
