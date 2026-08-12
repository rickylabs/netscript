import { createRouteReference } from '../../../src/application/route/mod.ts';
import type { RouteReference, SearchParamInput } from '../../../src/application/route/types.ts';

/** Generated Form-C route-tree shape consumed by the browser fixture page. */
export const routes: {
  readonly orders: {
    readonly $id: {
      readonly $route: RouteReference<{ readonly id: string }, SearchParamInput>;
    };
  };
} = {
  orders: {
    $id: {
      $route: createRouteReference('/orders/[id]', {
        id: 'orders.$id',
        kind: 'page',
      }),
    },
  },
};
