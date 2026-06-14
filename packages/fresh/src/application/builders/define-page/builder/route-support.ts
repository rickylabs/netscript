/** Route promotion support for the page builder.
 *
 * @module
 */

import { promoteConfigToRoute } from './factory.ts';
import type { RuntimePageConfig } from '../internal.ts';
import type { AnyDefinePageTypeState, DefinePageWithRoute } from '../types.ts';
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
