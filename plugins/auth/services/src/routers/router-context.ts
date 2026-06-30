/**
 * Auth Service Router Context
 *
 * Binds the canonical, type-sound auth v1 contract implementer
 * (`@netscript/plugin-auth-core/contracts/v1`) to the connector's request
 * context. Every `router.<route>.handler(...)` is checked against the contract
 * IO; there is no `any`/`Record<string, unknown>` erasure on the handler map.
 *
 * @module
 */

import { authContractV1 } from '@netscript/plugin-auth-core/contracts/v1';
import type { AuthServiceContext } from './v1-types.ts';

type AuthRouterContext = ReturnType<typeof authContractV1.$context<AuthServiceContext>>;

const authRouter: AuthRouterContext = authContractV1.$context<AuthServiceContext>();

/** Context-bound auth v1 implementer used to build every handler. */
export const router: typeof authRouter = authRouter;

/**
 * Precise type of a contract-bound handler map slice.
 *
 * Each handler value is exactly the `ImplementedProcedure` that
 * `router[K].handler(...)` produces — its input/output schemas, context, and
 * error map are derived from the auth contract, not hand-authored. Splitting
 * the handlers across modules forces them to be `export`ed, which means JSR
 * `--isolatedDeclarations` requires an explicit annotation; this mapped type is
 * that annotation while preserving per-route precision (no `any`, no
 * `Record<string, unknown>` erasure).
 */
export type AuthHandlers<K extends keyof typeof router> = {
  [P in K]: (typeof router)[P] extends { handler: (...args: never[]) => infer R } ? R
    : never;
};
