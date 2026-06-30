/**
 * Contract-bound handler and router assembly helpers for plugin services.
 *
 * @module
 */

import { type AnyRouter, os } from '@orpc/server';

/** Route implementer value returned by an oRPC contract's `$context<Ctx>()`. */
export type PluginContractRouter = object;

/** Contract implementer that can bind a concrete request context. */
export interface PluginContractImplementer {
  /** Bind this contract to a request context type. */
  $context<TContext>(): PluginContractRouter;
}

type PluginContractRouterMethod<
  TRouter extends PluginContractRouter,
  TRoute extends PluginContractRouteKey<TRouter>,
> = {
  readonly router: (handlers: PluginContractHandlers<TRouter, TRoute>) => AnyRouter;
};

/** Route keys whose values expose oRPC's `.handler(...)` builder. */
export type PluginContractRouteKey<TRouter extends PluginContractRouter> = {
  [K in keyof TRouter]: TRouter[K] extends { handler: (...args: never[]) => unknown } ? K : never;
}[keyof TRouter];

/** Explicit handler-map type derived from a context-bound oRPC contract router. */
export type PluginContractHandlers<
  TRouter extends PluginContractRouter,
  TRoute extends PluginContractRouteKey<TRouter>,
> = {
  readonly [K in TRoute]: TRouter[K] extends { handler: (...args: never[]) => infer THandler }
    ? THandler
    : never;
};

/** Data required to mount a bound plugin contract under `/vN/<plugin>`. */
export interface PluginContractAssemblyConfig<
  TRouter extends PluginContractRouter,
  TRoute extends PluginContractRouteKey<TRouter>,
> {
  /** Contract version label without a leading slash, for example `v1`. */
  readonly version: string;
  /** Plugin route segment mounted below the version, for example `workers`. */
  readonly namespace: string;
  /** Contract-bound handler map. */
  readonly handlers: PluginContractHandlers<TRouter, TRoute>;
}

/** Context-bound contract helpers produced by {@link bindPluginContract}. */
export interface BoundPluginContract<TRouter extends PluginContractRouter> {
  /** Context-bound implementer used when handlers need `.handler(...)`. */
  readonly router: TRouter;
  /** Preserve the precise mapped handler type while satisfying declaration emit. */
  handlers<TRoute extends PluginContractRouteKey<TRouter>>(
    handlers: PluginContractHandlers<TRouter, TRoute>,
  ): PluginContractHandlers<TRouter, TRoute>;
  /** Assemble the handler map into a version-prefixed service router. */
  assemble<TRoute extends PluginContractRouteKey<TRouter>>(
    config: PluginContractAssemblyConfig<TRouter, TRoute>,
  ): { readonly [version: string]: AnyRouter };
}

/** Contract binder returned before the concrete request context is selected. */
export interface PluginContractBinder<TContract extends PluginContractImplementer> {
  /** Bind the contract to a request context type. */
  context<TContext>(): BoundPluginContract<ReturnType<TContract['$context']>>;
}

/**
 * Bind an implemented plugin contract once, then derive typed handlers and a router.
 *
 * @param contract - Implemented oRPC contract, usually `<name>ContractV1`.
 * @returns A binder that selects a request context and assembles versioned routers.
 *
 * @example
 * ```ts
 * const bound = bindPluginContract(workersContractV1).context<WorkersContext>();
 * export const workersV1 = bound.handlers({
 *   describe: bound.router.describe.handler(() => capabilities),
 * });
 * export const router = bound.assemble({ version: 'v1', namespace: 'workers', handlers: workersV1 });
 * ```
 */
export function bindPluginContract<TContract extends PluginContractImplementer>(
  contract: TContract,
): PluginContractBinder<TContract> {
  return {
    context<TContext>(): BoundPluginContract<ReturnType<TContract['$context']>> {
      const router = contract.$context<TContext>() as ReturnType<TContract['$context']>;
      return {
        router,
        handlers<TRoute extends PluginContractRouteKey<typeof router>>(
          handlers: PluginContractHandlers<typeof router, TRoute>,
        ): PluginContractHandlers<typeof router, TRoute> {
          return handlers;
        },
        assemble<TRoute extends PluginContractRouteKey<typeof router>>(
          config: PluginContractAssemblyConfig<typeof router, TRoute>,
        ): { readonly [version: string]: AnyRouter } {
          return assemblePluginContractRouter(router, config);
        },
      };
    },
  };
}

/**
 * Assemble a context-bound contract handler map under `/version/namespace`.
 *
 * @param router - Context-bound oRPC contract router.
 * @param config - Version, namespace, and typed handlers to mount.
 * @returns A service-router record suitable for `createPluginService`.
 */
export function assemblePluginContractRouter<
  TRouter extends PluginContractRouter,
  TRoute extends PluginContractRouteKey<TRouter>,
>(
  router: TRouter,
  config: PluginContractAssemblyConfig<TRouter, TRoute>,
): { readonly [version: string]: AnyRouter } {
  const contractRouter = router as TRouter & PluginContractRouterMethod<TRouter, TRoute>;
  const implemented = contractRouter.router(config.handlers);
  const prefixed = os
    .prefix(`/${config.version}/${config.namespace}`)
    .router(implemented);
  return os.router({ [config.version]: prefixed });
}
