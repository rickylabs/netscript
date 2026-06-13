import { type DefinePageNavigationContextValue, useRequiredNavigationContext } from './context.ts';
import type {
  AnyDefinePageTypeState,
  DefinePageLayoutContextBase,
  DefinePageRouteNavFor,
  DefinePageSlotsFor,
  DefinePageStateOf,
  DefinePageTypeCarrier,
  InferDefinePageContext,
  InferDefinePageHasRoute,
  InferDefinePageLayerData,
  InferDefinePagePath,
  InferDefinePageResources,
  InferDefinePageSearch,
  InferDefinePageTypes,
  PathParamSchema,
  SearchParamSchema,
} from '../types.ts';
import type {
  CurrentRouteState,
  TypedRoutePathOf,
  TypedRouteSearchOf,
  TypedRouteTarget,
} from './link.tsx';

function assertRouteContext<TTarget extends TypedRouteTarget<object, object>>(
  target: TTarget,
  navigationContext: DefinePageNavigationContextValue,
): void {
  if (navigationContext.routePattern !== target.routePattern) {
    throw new Error(
      `Current route context mismatch. Expected "${target.routePattern}" but received "${navigationContext.routePattern}".`,
    );
  }
}

/** Read typed path/search state for the current route target. */
export function useCurrentRoute<TTarget extends TypedRouteTarget<object, object>>(
  target: TTarget,
): CurrentRouteState<TTarget> {
  const navigationContext = useRequiredNavigationContext();
  assertRouteContext(target, navigationContext);

  return {
    path: navigationContext.runtimeContext.path as TypedRoutePathOf<TTarget>,
    search: navigationContext.runtimeContext.search as TypedRouteSearchOf<TTarget>,
  };
}

/** Read the current route path state. */
export function useCurrentPath<TTarget extends TypedRouteTarget<object, object>>(
  target: TTarget,
): TypedRoutePathOf<TTarget> {
  return useCurrentRoute(target).path;
}

/** Read the current route search state. */
export function useCurrentSearch<TTarget extends TypedRouteTarget<object, object>>(
  target: TTarget,
): TypedRouteSearchOf<TTarget> {
  return useCurrentRoute(target).search;
}

/** Read the full define-page runtime context. */
export function useDefinePageContext<
  TValue extends DefinePageTypeCarrier,
>(): InferDefinePageContext<
  TValue
> {
  const navigationContext = useRequiredNavigationContext();
  type TTypes = InferDefinePageTypes<TValue>;
  type THasRoute = InferDefinePageHasRoute<TValue>;

  return {
    ...(navigationContext.runtimeContext as DefinePageLayoutContextBase<TTypes, THasRoute>),
    routePattern: navigationContext.routePattern,
    pathSchema: navigationContext.pathSchema as
      | PathParamSchema<InferDefinePagePath<TValue>>
      | undefined,
    searchSchema: navigationContext.searchSchema as
      | SearchParamSchema<
        InferDefinePageSearch<TValue>
      >
      | undefined,
    nav: navigationContext.nav as DefinePageRouteNavFor<TTypes>,
    slots: navigationContext.slots as DefinePageSlotsFor<TTypes>,
  } as InferDefinePageContext<TValue>;
}

/** Read the current define-page state. */
export function useDefinePageState<TValue extends DefinePageTypeCarrier>(): DefinePageStateOf<
  InferDefinePageTypes<TValue>
> {
  return useDefinePageContext<TValue>().state;
}

/** Read all request resources. */
export function useDefinePageResources<
  TValue extends DefinePageTypeCarrier,
>(): InferDefinePageResources<
  TValue
> {
  return useDefinePageContext<TValue>().resources;
}

/** Read one request resource by key. */
export function useDefinePageResource<
  TValue extends DefinePageTypeCarrier,
  TKey extends keyof InferDefinePageResources<TValue> & string,
>(key: TKey): InferDefinePageResources<TValue>[TKey] {
  return useDefinePageContext<TValue>().resource(key);
}

/** Read all resolved layer data. */
export function useDefinePageLayers<TValue extends DefinePageTypeCarrier>(): Partial<
  InferDefinePageLayerData<TValue>
> {
  return useDefinePageContext<TValue>().layerData;
}

/** Read optional layer data by id. */
export function useDefinePageLayer<
  TValue extends DefinePageTypeCarrier,
  TLayer extends keyof InferDefinePageLayerData<TValue> & string,
>(id: TLayer): InferDefinePageLayerData<TValue>[TLayer] | undefined {
  return useDefinePageLayers<TValue>()[id];
}

/** Read required layer data by id. */
export function useRequiredDefinePageLayer<
  TValue extends DefinePageTypeCarrier,
  TLayer extends keyof InferDefinePageLayerData<TValue> & string,
>(id: TLayer): InferDefinePageLayerData<TValue>[TLayer] {
  const layer = useDefinePageLayer<TValue, TLayer>(id);

  if (layer === undefined) {
    throw new Error(
      `definePage() could not resolve layer data for "${id}" in the current render tree.`,
    );
  }

  return layer;
}

/** Read page slots keyed by layer id. */
export function useDefinePageSlots<TValue extends DefinePageTypeCarrier>(): DefinePageSlotsFor<
  InferDefinePageTypes<TValue>
> {
  return useDefinePageContext<TValue>().slots;
}
