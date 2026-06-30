/** Route promotion support for the page builder.
 *
 * @module
 */

import { promoteConfigToRoute } from './factory.ts';
import {
  bindRoutePattern,
  defineRouteContract,
} from '../../../route/_internal/contract-runtime.ts';
import type { RuntimePageConfig } from '../internal.ts';
import type {
  AnyDefinePageTypeState,
  DefinePageRouteContractInput,
  DefinePageWithRoute,
  DefinePageWithRouteContract,
  PathParamSchema,
  SearchParamSchema,
} from '../types.ts';
import type { TypedRouteTarget } from '../navigation/mod.ts';

/** Promote an unrouted page config to a routed page config. */
export function promoteRouteConfig<
  TTypes extends AnyDefinePageTypeState,
  TRoute extends TypedRouteTarget<object, object>,
  THasConfiguredRoute extends boolean,
>(
  config: RuntimePageConfig<TTypes, THasConfiguredRoute>,
  route: TRoute,
): RuntimePageConfig<DefinePageWithRoute<TTypes, TRoute>, true> {
  type TRouteTypes = DefinePageWithRoute<TTypes, TRoute>;

  return {
    ...promoteConfigToRoute<TTypes, TRouteTypes, THasConfiguredRoute>(config),
    defaultRoutePattern: route.routePattern,
    pathSchema: route.pathSchema as RuntimePageConfig<TRouteTypes, true>['pathSchema'],
    searchSchema: route.searchSchema as RuntimePageConfig<TRouteTypes, true>['searchSchema'],
    route: route as unknown as RuntimePageConfig<TRouteTypes, true>['route'],
  };
}

/**
 * Promote an unrouted page config using an inline route contract.
 *
 * The inline schema body is bound to the `$route` pattern via
 * `bindRoutePattern(defineRouteContract({...}), $route)`, producing the same
 * runtime bound route reference that `.withRoute(...)` consumes. This keeps the
 * inline (Form A) and sidecar/default (Form B/C) authoring forms converging on
 * one routed runtime config.
 */
export function promoteRouteContractConfig<
  TTypes extends AnyDefinePageTypeState,
  TPathSchema,
  TSearchSchema,
  THasConfiguredRoute extends boolean,
>(
  config: RuntimePageConfig<TTypes, THasConfiguredRoute>,
  contract: DefinePageRouteContractInput<TPathSchema, TSearchSchema>,
): RuntimePageConfig<DefinePageWithRouteContract<TTypes, TPathSchema, TSearchSchema>, true> {
  type TRouteTypes = DefinePageWithRouteContract<TTypes, TPathSchema, TSearchSchema>;

  if (typeof contract.$route !== 'string' || contract.$route.length === 0) {
    throw new Error(
      'definePage().withRouteContract({...}) requires a $route pattern. The NetScript ' +
        'Vite plugin inserts it from the page module path; set ' +
        'pageModuleRouteBinding or add $route: routePatterns.<key>.$route manually.',
    );
  }

  const routeContract = defineRouteContract({
    pathSchema: contract.pathSchema as PathParamSchema<object> | undefined,
    searchSchema: contract.searchSchema as SearchParamSchema<object> | undefined,
  });
  const boundRoute = bindRoutePattern(routeContract, contract.$route);

  return {
    ...promoteConfigToRoute<TTypes, TRouteTypes, THasConfiguredRoute>(config),
    defaultRoutePattern: boundRoute.routePattern,
    pathSchema: contract.pathSchema as RuntimePageConfig<TRouteTypes, true>['pathSchema'],
    searchSchema: contract.searchSchema as RuntimePageConfig<TRouteTypes, true>['searchSchema'],
    route: boundRoute as unknown as RuntimePageConfig<TRouteTypes, true>['route'],
  };
}
