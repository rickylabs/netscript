/** Route promotion support for the page builder.
 *
 * @module
 */

import { promoteConfigToRoute } from './factory.ts';
import {
  bindRoutePattern,
  defineRouteContract,
  type RouteReference,
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
import type { InferRoutePath, InferRouteSearch, TypedRouteTarget } from '../navigation/mod.ts';

function isRouteReference<TRoute extends TypedRouteTarget<object, object>>(
  route: TRoute,
): route is TRoute & RouteReference<InferRoutePath<TRoute>, InferRouteSearch<TRoute>> {
  return 'nav' in route && 'href' in route && typeof route.href === 'function' &&
    'parsePath' in route && typeof route.parsePath === 'function' &&
    'parseSearch' in route && typeof route.parseSearch === 'function';
}

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

  if (!isRouteReference(route)) {
    throw new TypeError(
      'definePage().withRoute(...) requires a complete route reference with navigation and parsers.',
    );
  }

  return {
    ...promoteConfigToRoute<TTypes, TRouteTypes, THasConfiguredRoute>(config),
    defaultRoutePattern: route.routePattern,
    pathSchema: route.pathSchema as RuntimePageConfig<TRouteTypes, true>['pathSchema'],
    searchSchema: route.searchSchema as RuntimePageConfig<TRouteTypes, true>['searchSchema'],
    route,
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
  TPathSchema extends PathParamSchema<object> | undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined,
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
    pathSchema: contract.pathSchema,
    searchSchema: contract.searchSchema,
  });
  const boundRoute = bindRoutePattern(routeContract, contract.$route);

  return {
    ...promoteConfigToRoute<TTypes, TRouteTypes, THasConfiguredRoute>(config),
    defaultRoutePattern: boundRoute.routePattern,
    pathSchema: contract.pathSchema as RuntimePageConfig<TRouteTypes, true>['pathSchema'],
    searchSchema: contract.searchSchema as RuntimePageConfig<TRouteTypes, true>['searchSchema'],
    route: boundRoute as unknown as RuntimePageConfig<TRouteTypes, true>['route'], // quality-allow: DefinePageWithRouteContract preserves prior path/search output when either optional schema is omitted, but BoundRouteContract maps an omitted schema to EmptyRecord; TypeScript cannot equate those conditional states without presence-specific legacy builder overloads
  };
}
