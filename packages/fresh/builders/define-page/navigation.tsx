import { type ComponentChildren, type ComponentType, type JSX } from 'preact';
import {
  DefinePageNavigationContext,
  type DefinePageNavigationContextValue,
  readNavigationContext,
  useRequiredNavigationContext,
} from './navigation/context.ts';
import type {
  AnyDefinePageTypeState,
  DefinePageLayoutContextBase,
  DefinePageRouteNav,
  DefinePageRouteNavFor,
  DefinePageSlot,
  DefinePageSlotsFor,
  DefinePageStateOf,
  DefinePageTypeCarrier,
  EmptyRecord,
  HasPathParams,
  InferDefinePageContext,
  InferDefinePageHasRoute,
  InferDefinePageLayerData,
  InferDefinePagePath,
  InferDefinePageResources,
  InferDefinePageSearch,
  InferDefinePageTypes,
  PathParamSchema,
  SearchParamSchema,
  SearchParamValue,
  UnknownRecord,
  ValidatedRouteHref,
} from './types.ts';

export interface TypedRouteTarget<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> {
  readonly routePattern: string;
  readonly pathSchema?: PathParamSchema<TPath>;
  readonly searchSchema?: SearchParamSchema<TSearch>;
  readonly $types?: {
    path: TPath;
    search: TSearch;
  };
}

export type TypedRoutePathOf<TTarget extends TypedRouteTarget<object, object>> = NonNullable<
  TTarget['$types']
>['path'];

export type TypedRouteSearchOf<TTarget extends TypedRouteTarget<object, object>> = NonNullable<
  TTarget['$types']
>['search'];

export type InferRoutePath<TTarget extends TypedRouteTarget<object, object>> = TypedRoutePathOf<
  TTarget
>;
export type InferRouteSearch<TTarget extends TypedRouteTarget<object, object>> = TypedRouteSearchOf<
  TTarget
>;

export interface CurrentRouteState<TTarget extends TypedRouteTarget<object, object>> {
  readonly path: TypedRoutePathOf<TTarget>;
  readonly search: TypedRouteSearchOf<TTarget>;
}

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

export interface FreshLinkAttributes extends JSX.HTMLAttributes<HTMLAnchorElement> {
  'f-client-nav'?: boolean;
}

export interface FreshPartialLinkAttributes extends FreshLinkAttributes {
  'f-partial'?: string;
}

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

export type TypedRoutePathInput<TPath extends object> = HasPathParams<TPath> extends true
  ? { path: TPath }
  : { path?: TPath };

export type RouteSearchUpdate<TSearch extends object> =
  | Partial<TSearch>
  | ((prev: TSearch) => Partial<TSearch>);

export type GetLinkPropsInput<TTarget extends TypedRouteTarget<object, object>> =
  & Omit<FreshLinkAttributes, 'children' | 'href'>
  & TypedRoutePathInput<TypedRoutePathOf<TTarget>>
  & {
    to: TTarget;
    search?: RouteSearchUpdate<TypedRouteSearchOf<TTarget>>;
    replace?: boolean;
    preserveSearchParams?: boolean;
  };

export type BoundGetLinkPropsInput<TTarget extends TypedRouteTarget<object, object>> = Omit<
  GetLinkPropsInput<TTarget>,
  'to'
>;

export type LinkProps<TTarget extends TypedRouteTarget<object, object>> =
  & Omit<FreshLinkAttributes, 'href'>
  & TypedRoutePathInput<TypedRoutePathOf<TTarget>>
  & {
    to: TTarget;
    search?: RouteSearchUpdate<TypedRouteSearchOf<TTarget>>;
    children: ComponentChildren;
    replace?: boolean;
    preserveSearchParams?: boolean;
  };

export type BoundLinkProps<TTarget extends TypedRouteTarget<object, object>> = Omit<
  LinkProps<TTarget>,
  'to'
>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function stringifySearchValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => stringifySearchValue(entry));
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [String(value)];
}

function serializeSearch(search: UnknownRecord): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    const values = stringifySearchValue(value);
    for (const entry of values) {
      params.append(key, entry);
    }
  }

  return params.toString();
}

function normalizeBaseSearch<TSearch extends object>(
  schema: SearchParamSchema<TSearch> | undefined,
  routePattern: string,
  navigationContext: DefinePageNavigationContextValue | null,
  preserveSearchParams: boolean,
): TSearch {
  if (preserveSearchParams && navigationContext?.routePattern === routePattern) {
    return navigationContext.runtimeContext.search as TSearch;
  }

  if (!schema) {
    return {} as TSearch;
  }

  const fallback = schema.safeParse({});
  if (fallback.success && isRecord(fallback.data)) {
    return fallback.data as TSearch;
  }

  return {} as TSearch;
}

function validatePath<TPath extends object>(
  schema: PathParamSchema<TPath> | undefined,
  path: TPath | undefined,
): TPath {
  const candidate = (path ?? {}) as TPath;

  if (!schema) {
    return candidate;
  }

  const result = schema.safeParse(candidate as Record<string, string | undefined>);
  if (!result.success || !isRecord(result.data)) {
    throw new Error('definePage().nav.makeHref() received invalid path params.');
  }

  return result.data as TPath;
}

function validateSearch<TSearch extends object>(
  schema: SearchParamSchema<TSearch> | undefined,
  search: UnknownRecord,
): TSearch {
  if (!schema) {
    return search as TSearch;
  }

  const result = schema.safeParse(search as Record<string, SearchParamValue>);
  if (!result.success || !isRecord(result.data)) {
    throw new Error('definePage().nav.makeHref() received invalid search params.');
  }

  return result.data as TSearch;
}

function fillRoutePattern(pattern: string, path: UnknownRecord): string {
  let pathname = pattern;

  pathname = pathname.replace(/\[\[\.\.\.([^\]]+)\]\]/g, (_match, key: string) => {
    const value = path[key];
    if (value === undefined || value === null || value === '') {
      return '';
    }

    const parts = stringifySearchValue(value).map((entry) => encodeURIComponent(entry));
    return parts.length === 0 ? '' : `/${parts.join('/')}`;
  });

  pathname = pathname.replace(/\[\.\.\.([^\]]+)\]/g, (_match, key: string) => {
    const value = path[key];
    const parts = stringifySearchValue(value).map((entry) => encodeURIComponent(entry));
    if (parts.length === 0) {
      throw new Error(`definePage().nav.makeHref() is missing catch-all path param "${key}".`);
    }

    return parts.join('/');
  });

  pathname = pathname.replace(/\[([^\]]+)\]/g, (_match, key: string) => {
    const value = path[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`definePage().nav.makeHref() is missing path param "${key}".`);
    }

    return encodeURIComponent(String(value));
  });

  pathname = pathname.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = path[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`definePage().nav.makeHref() is missing path param "${key}".`);
    }

    return encodeURIComponent(String(value));
  });

  return pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export function wrapWithNavigationContext<TSearch extends object>(
  body: ComponentChildren,
  routePattern: string,
  pathSchema: PathParamSchema<object> | undefined,
  searchSchema: SearchParamSchema<TSearch> | undefined,
  runtimeContext: DefinePageLayoutContextBase<AnyDefinePageTypeState, boolean>,
  slots: Record<string, DefinePageSlot<UnknownRecord>>,
): JSX.Element {
  return (
    <DefinePageNavigationContext.Provider
      value={{
        routePattern,
        pathSchema,
        searchSchema,
        runtimeContext,
        slots,
        nav: createRouteNav({ routePattern, pathSchema, searchSchema }),
      }}
    >
      {body}
    </DefinePageNavigationContext.Provider>
  );
}

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

function useDefinePageContext<TValue extends DefinePageTypeCarrier>(): InferDefinePageContext<
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

function useDefinePageState<TValue extends DefinePageTypeCarrier>(): DefinePageStateOf<
  InferDefinePageTypes<TValue>
> {
  return useDefinePageContext<TValue>().state;
}

function useDefinePageResources<TValue extends DefinePageTypeCarrier>(): InferDefinePageResources<
  TValue
> {
  return useDefinePageContext<TValue>().resources;
}

function useDefinePageResource<
  TValue extends DefinePageTypeCarrier,
  TKey extends keyof InferDefinePageResources<TValue> & string,
>(key: TKey): InferDefinePageResources<TValue>[TKey] {
  return useDefinePageContext<TValue>().resource(key);
}

function useDefinePageLayers<TValue extends DefinePageTypeCarrier>(): Partial<
  InferDefinePageLayerData<TValue>
> {
  return useDefinePageContext<TValue>().layerData;
}

function useDefinePageLayer<
  TValue extends DefinePageTypeCarrier,
  TLayer extends keyof InferDefinePageLayerData<TValue> & string,
>(id: TLayer): InferDefinePageLayerData<TValue>[TLayer] | undefined {
  return useDefinePageLayers<TValue>()[id];
}

function useRequiredDefinePageLayer<
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

function useDefinePageSlots<TValue extends DefinePageTypeCarrier>(): DefinePageSlotsFor<
  InferDefinePageTypes<TValue>
> {
  return useDefinePageContext<TValue>().slots;
}

export function useCurrentPath<TTarget extends TypedRouteTarget<object, object>>(
  target: TTarget,
): TypedRoutePathOf<TTarget> {
  return useCurrentRoute(target).path;
}

export function useCurrentSearch<TTarget extends TypedRouteTarget<object, object>>(
  target: TTarget,
): TypedRouteSearchOf<TTarget> {
  return useCurrentRoute(target).search;
}

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

export function usePagePath<TValue extends DefinePageTypeCarrier>(): InferDefinePagePath<TValue> {
  return usePageRoute<TValue>().path;
}

export function usePageSearch<TValue extends DefinePageTypeCarrier>(): InferDefinePageSearch<
  TValue
> {
  return usePageRoute<TValue>().search;
}

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

function buildHref<TPath extends object, TSearch extends object>(
  options: {
    routePattern: string;
    pathSchema?: PathParamSchema<TPath>;
    searchSchema?: SearchParamSchema<TSearch>;
  },
  input: {
    path?: TPath;
    search?: RouteSearchUpdate<TSearch>;
    preserveSearchParams?: boolean;
  },
  navigationContext: DefinePageNavigationContextValue | null,
): ValidatedRouteHref {
  const resolvedPath = validatePath(options.pathSchema, input.path);
  const baseSearch = normalizeBaseSearch<TSearch>(
    options.searchSchema,
    options.routePattern,
    navigationContext,
    input.preserveSearchParams ?? false,
  );
  const nextSearch = typeof input.search === 'function' ? input.search(baseSearch) : input.search;
  const resolvedSearch = validateSearch<TSearch>(options.searchSchema, {
    ...baseSearch,
    ...(nextSearch ?? {}),
  } as UnknownRecord);

  const pathname = fillRoutePattern(options.routePattern, resolvedPath as UnknownRecord);
  const queryString = serializeSearch(resolvedSearch as UnknownRecord);
  return `${pathname}${queryString ? `?${queryString}` : ''}` as ValidatedRouteHref;
}

function createResolvedLinkProps<TPath extends object, TSearch extends object>(
  options: {
    routePattern: string;
    pathSchema?: PathParamSchema<TPath>;
    searchSchema?: SearchParamSchema<TSearch>;
  },
  input: Omit<FreshLinkAttributes, 'children' | 'href'> & {
    path?: TPath;
    search?: RouteSearchUpdate<TSearch>;
    replace?: boolean;
    preserveSearchParams?: boolean;
  },
  navigationContext: DefinePageNavigationContextValue | null,
): FreshLinkAttributes & { href: ValidatedRouteHref } {
  const {
    path,
    search,
    replace: _replace,
    preserveSearchParams,
    ...anchorProps
  } = input;
  const href = buildHref(options, { path, search, preserveSearchParams }, navigationContext);

  return {
    ...anchorProps,
    href,
    'f-client-nav': anchorProps['f-client-nav'] ?? true,
  };
}

export function getLinkProps<TTarget extends TypedRouteTarget<object, object>>(
  input: GetLinkPropsInput<TTarget>,
): FreshLinkAttributes & { href: ValidatedRouteHref } {
  const { to, ...linkInput } = input;
  return createResolvedLinkProps(
    {
      routePattern: to.routePattern,
      pathSchema: to.pathSchema,
      searchSchema: to.searchSchema,
    },
    linkInput,
    null,
  );
}

export function getBoundLinkProps<TTarget extends TypedRouteTarget<object, object>>(
  target: TTarget,
  input: BoundGetLinkPropsInput<TTarget>,
): FreshLinkAttributes & { href: ValidatedRouteHref } {
  const navigationContext = readNavigationContext();

  return createResolvedLinkProps(
    {
      routePattern: target.routePattern,
      pathSchema: target.pathSchema,
      searchSchema: target.searchSchema,
    },
    input,
    navigationContext,
  );
}

export function Link<TTarget extends TypedRouteTarget<object, object>>(
  props: LinkProps<TTarget>,
): JSX.Element {
  const { to, children, ...linkInput } = props;
  const resolvedAnchorProps = getBoundLinkProps(to, linkInput as BoundGetLinkPropsInput<TTarget>);

  return (
    <a
      {...resolvedAnchorProps}
      href={resolvedAnchorProps.href}
      f-client-nav={resolvedAnchorProps['f-client-nav'] ?? true}
    >
      {children}
    </a>
  );
}

export function createRouteNav<TPath extends object, TSearch extends object>(
  options: {
    routePattern: string;
    pathSchema?: PathParamSchema<TPath>;
    searchSchema?: SearchParamSchema<TSearch>;
  },
): DefinePageRouteNav<TPath, TSearch> {
  const makeHref: DefinePageRouteNav<TPath, TSearch>['makeHref'] = (...args) => {
    const [input] = args as [{ path?: TPath; search?: Partial<TSearch> } | undefined];
    return buildHref(options, { ...(input ?? {}), path: input?.path ?? ({} as TPath) }, null);
  };

  return { makeHref };
}
