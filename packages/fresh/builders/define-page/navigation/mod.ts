import { type ComponentChildren, type ComponentType, h, type JSX } from 'preact';
import { DefinePageNavigationContext, useRequiredNavigationContext } from './context.ts';
import {
  useDefinePageContext,
  useDefinePageLayer,
  useDefinePageLayers,
  useDefinePageResource,
  useDefinePageResources,
  useDefinePageSlots,
  useDefinePageState,
  useRequiredDefinePageLayer,
} from './hooks.ts';
import {
  type BoundGetLinkPropsInput,
  type BoundLinkProps,
  createResolvedLinkProps,
  createRouteNav,
  type FreshLinkAttributes,
  Link,
  type LinkProps,
  type TypedRouteTarget,
} from './link.tsx';
export { useCurrentPath, useCurrentRoute, useCurrentSearch } from './hooks.ts';
export { createRouteNav, getBoundLinkProps, getLinkProps, Link } from './link.tsx';
export type {
  BoundGetLinkPropsInput,
  BoundLinkProps,
  CurrentRouteState,
  FreshLinkAttributes,
  FreshPartialLinkAttributes,
  GetLinkPropsInput,
  InferRoutePath,
  InferRouteSearch,
  LinkProps,
  RouteSearchUpdate,
  TypedRoutePathInput,
  TypedRoutePathOf,
  TypedRouteSearchOf,
  TypedRouteTarget,
} from './link.tsx';
import type {
  AnyDefinePageTypeState,
  DefinePageLayoutContextBase,
  DefinePageRouteNav,
  DefinePageSlot,
  DefinePageSlotsFor,
  DefinePageStateOf,
  DefinePageTypeCarrier,
  InferDefinePageContext,
  InferDefinePageLayerData,
  InferDefinePagePath,
  InferDefinePageResources,
  InferDefinePageSearch,
  InferDefinePageTypes,
  PathParamSchema,
  SearchParamSchema,
  UnknownRecord,
  ValidatedRouteHref,
} from '../types.ts';

interface CurrentDefinePageRoute<TValue extends DefinePageTypeCarrier>
  extends TypedRouteTarget<InferDefinePagePath<TValue>, InferDefinePageSearch<TValue>> {
  readonly path: InferDefinePagePath<TValue>;
  readonly search: InferDefinePageSearch<TValue>;
  readonly nav: DefinePageRouteNav<InferDefinePagePath<TValue>, InferDefinePageSearch<TValue>>;
  getLinkProps(
    input: BoundGetLinkPropsInput<CurrentDefinePageRoute<TValue>>,
  ): FreshLinkAttributes & { href: ValidatedRouteHref };
  readonly Link: ComponentType<BoundLinkProps<CurrentDefinePageRoute<TValue>>>;
}

/** @internal */
export interface DefinePageHooks<TValue extends DefinePageTypeCarrier> {
  useContext(): InferDefinePageContext<TValue>;
  useState(): DefinePageStateOf<InferDefinePageTypes<TValue>>;
  useResources(): InferDefinePageResources<TValue>;
  useResource<TKey extends keyof InferDefinePageResources<TValue> & string>(
    key: TKey,
  ): InferDefinePageResources<TValue>[TKey];
  useLayers(): Partial<InferDefinePageLayerData<TValue>>;
  useLayer<TLayer extends keyof InferDefinePageLayerData<TValue> & string>(
    id: TLayer,
  ): InferDefinePageLayerData<TValue>[TLayer] | undefined;
  useRequiredLayer<TLayer extends keyof InferDefinePageLayerData<TValue> & string>(
    id: TLayer,
  ): InferDefinePageLayerData<TValue>[TLayer];
  useSlots(): DefinePageSlotsFor<InferDefinePageTypes<TValue>>;
  useRoute(): CurrentDefinePageRoute<TValue>;
  usePath(): InferDefinePagePath<TValue>;
  useSearch(): InferDefinePageSearch<TValue>;
}

/** @internal */
export function wrapWithNavigationContext<TSearch extends object>(
  body: ComponentChildren,
  routePattern: string,
  pathSchema: PathParamSchema<object> | undefined,
  searchSchema: SearchParamSchema<TSearch> | undefined,
  runtimeContext: DefinePageLayoutContextBase<AnyDefinePageTypeState, boolean>,
  slots: Record<string, DefinePageSlot<UnknownRecord>>,
): JSX.Element {
  return h(DefinePageNavigationContext.Provider, {
    value: {
      routePattern,
      pathSchema,
      searchSchema,
      runtimeContext,
      slots,
      nav: createRouteNav({ routePattern, pathSchema, searchSchema }),
    },
  }, body);
}

/** @internal */
export function usePageRoute<TValue extends DefinePageTypeCarrier>(): CurrentDefinePageRoute<
  TValue
> {
  const navigationContext = useRequiredNavigationContext();
  type TPath = InferDefinePagePath<TValue>;
  type TSearch = InferDefinePageSearch<TValue>;
  type TTarget = TypedRouteTarget<TPath, TSearch>;

  const target: TTarget = {
    routePattern: navigationContext.routePattern,
    pathSchema: navigationContext.pathSchema as PathParamSchema<TPath> | undefined,
    searchSchema: navigationContext.searchSchema as SearchParamSchema<TSearch> | undefined,
  };

  const getLinkProps = (
    input: BoundGetLinkPropsInput<TTarget>,
  ): FreshLinkAttributes & { href: ValidatedRouteHref } => {
    return createResolvedLinkProps(
      {
        routePattern: target.routePattern,
        pathSchema: target.pathSchema,
        searchSchema: target.searchSchema,
      },
      input,
      navigationContext,
    );
  };

  const CurrentLink: ComponentType<BoundLinkProps<TTarget>> = (props) => {
    return Link<TTarget>({
      to: target,
      ...(props as unknown as Omit<LinkProps<TTarget>, 'to'>),
    } as LinkProps<TTarget>);
  };

  return {
    ...target,
    path: navigationContext.runtimeContext.path as TPath,
    search: navigationContext.runtimeContext.search as TSearch,
    nav: createRouteNav({
      routePattern: target.routePattern,
      pathSchema: target.pathSchema,
      searchSchema: target.searchSchema,
    }),
    getLinkProps,
    Link: CurrentLink,
  };
}

/** @internal */
export function usePagePath<TValue extends DefinePageTypeCarrier>(): InferDefinePagePath<TValue> {
  return usePageRoute<TValue>().path;
}

/** @internal */
export function usePageSearch<TValue extends DefinePageTypeCarrier>(): InferDefinePageSearch<
  TValue
> {
  return usePageRoute<TValue>().search;
}

/** @internal */
export function createDefinePageHooks<TValue extends DefinePageTypeCarrier>(): DefinePageHooks<
  TValue
> {
  return {
    useContext() {
      return useDefinePageContext<TValue>();
    },
    useState() {
      return useDefinePageState<TValue>();
    },
    useResources() {
      return useDefinePageResources<TValue>();
    },
    useResource<TKey extends keyof InferDefinePageResources<TValue> & string>(key: TKey) {
      return useDefinePageResource<TValue, TKey>(key);
    },
    useLayers() {
      return useDefinePageLayers<TValue>();
    },
    useLayer<TLayer extends keyof InferDefinePageLayerData<TValue> & string>(id: TLayer) {
      return useDefinePageLayer<TValue, TLayer>(id);
    },
    useRequiredLayer<TLayer extends keyof InferDefinePageLayerData<TValue> & string>(id: TLayer) {
      return useRequiredDefinePageLayer<TValue, TLayer>(id);
    },
    useSlots() {
      return useDefinePageSlots<TValue>();
    },
    useRoute() {
      return usePageRoute<TValue>();
    },
    usePath() {
      return usePagePath<TValue>();
    },
    useSearch() {
      return usePageSearch<TValue>();
    },
  };
}
