/**
 * Typed Hono environment for NetScript service middleware.
 *
 * NetScript service middleware stores the authenticated {@link Principal} and a
 * request-scoped {@link Logger} on the Hono context. Apps that read those values
 * with `c.get("principal")` / `c.get("logger")` should type their Hono instance
 * with {@link ServiceEnv} (`new Hono<ServiceEnv>()`) instead of relying on a
 * global type augmentation, which JSR does not permit in published packages.
 *
 * @module
 */

import type { Logger } from '@netscript/logger';
import type { Principal } from './types.ts';

/** Context variables set by NetScript service middleware. */
export interface ServiceVariables {
  /** Authenticated principal set by the authn middleware, if any. */
  principal: Principal | undefined;
  /** Request-scoped logger injected by the logger middleware, if any. */
  logger: Logger | undefined;
}

/** Hono environment carrying NetScript service context variables. */
export interface ServiceEnv {
  /** Service context variables keyed for `c.get` / `c.set`. */
  Variables: ServiceVariables;
}
