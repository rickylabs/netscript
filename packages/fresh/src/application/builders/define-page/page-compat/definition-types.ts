/** Definition compatibility types for page builders.
 *
 * @module
 */

import type { EmptyRecord, PageLayerMap, PageRenderable, UnknownRecord } from './shared-types.ts';
import type {
  PageContext,
  PageLayoutContext,
  PageRenderContext,
  PageRequestContext,
} from './context-types.ts';
import type { PageMethod } from './form-types.ts';
import type { PageRouteNavigation, PageRouteReference } from './route-types.ts';

/** Slot function exposed to layouts for a resolved layer. */
export type PageSlot<TProps extends object> = (() => PageRenderable) & {
  /** Resolved layer data when available. */
  data?: TProps;
};

/** Slot map exposed to layouts. */
export type PageSlots<TLayerData extends PageLayerMap> = {
  [K in keyof TLayerData]: PageSlot<TLayerData[K]>;
};

/** Metadata descriptor accepted by `withMeta()`. */
export interface PageMetaDescriptor {
  /** Document title. */
  readonly title?: string;
  /** Document description. */
  readonly description?: string;
  /** Canonical URL for the page. */
  readonly canonicalUrl?: string;
  /** Robots directive. */
  readonly robots?: string;
  /** Additional meta tags. */
  readonly meta?: ReadonlyArray<
    { readonly name?: string; readonly property?: string; readonly content: string }
  >;
  /** Additional link tags. */
  readonly links?: ReadonlyArray<
    { readonly rel: string; readonly href: string; readonly title?: string; readonly type?: string }
  >;
  /** Optional JSON-LD payload. */
  readonly jsonLd?: unknown | readonly unknown[];
}

/** Metadata resolver accepted by `withMeta()`. */
export type PageMetaResolver<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  THasRoute extends boolean = false,
> = (
  ctx: PageLayoutContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
) => PageMetaDescriptor | Promise<PageMetaDescriptor>;

/** Header resolver accepted by `withHeader()`. */
export type PageHeaderResolver<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  THasRoute extends boolean = false,
> = (
  ctx: PageLayoutContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
) => HeadersInit | Promise<HeadersInit>;

/** Layout function accepted by `withLayout()`. */
export type PageLayout<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  THasRoute extends boolean = false,
> = (
  slots: PageSlots<TLayerData>,
  ctx: PageLayoutContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
) => PageRenderable;

/** Built page handlers returned by `build()`. */
export type PageHandlers<TState = EmptyRecord> = Partial<
  Record<
    PageMethod,
    (
      ctx: PageRequestContext<TState> | PageRenderContext<TState>,
    ) => Response | { data: unknown } | Promise<Response | { data: unknown }>
  >
>;

/** Build options accepted by `page.build(...)`. */
export interface PageBuildOptions {
  /** Explicit route pattern when not using `withRoute(...)`. */
  readonly routePattern?: string;
}

/** Unrouted page definition returned by `build()` without a route. */
export interface PageDefinition<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
> {
  /** Page renderer used by Fresh route modules. */
  readonly page: (ctx: PageRequestContext<TState>) => Promise<PageRenderable>;
  /** Default export-compatible page renderer. */
  readonly default: (ctx: PageRequestContext<TState>) => Promise<PageRenderable>;
  /** Optional built handlers. */
  readonly handler?: PageHandlers<TState>;
}

/** Hook bundle returned on routed page definitions. */
export interface PageHooks<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
> {
  /** Read the full routed page context. */
  useContext(): PageContext<TState, TResources, TPath, TSearch, TLayerData, true> & {
    readonly slots: PageSlots<TLayerData>;
  };
  /** Read the current Fresh route state. */
  useState(): TState;
  /** Read all resolved resources. */
  useResources(): TResources;
  /** Read one resolved resource by key. */
  useResource<TKey extends keyof TResources & string>(key: TKey): TResources[TKey];
  /** Read all resolved layer data. */
  useLayers(): Partial<TLayerData>;
  /** Read one optional layer payload. */
  useLayer<TLayer extends keyof TLayerData & string>(id: TLayer): TLayerData[TLayer] | undefined;
  /** Read one required layer payload. */
  useRequiredLayer<TLayer extends keyof TLayerData & string>(id: TLayer): TLayerData[TLayer];
  /** Read all layer render slots. */
  useSlots(): PageSlots<TLayerData>;
  /** Read the bound typed route. */
  useRoute(): PageRouteReference<TPath, TSearch> & {
    readonly path: TPath;
    readonly search: TSearch;
  };
  /** Read the current path state. */
  usePath(): TPath;
  /** Read the current search state. */
  useSearch(): TSearch;
}

/** Routed page definition returned by `build()` with route metadata. */
export interface RoutedPageDefinition<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
> extends PageDefinition<TState, TResources, TPath, TSearch, TLayerData> {
  /** Typed href builder for the page route. */
  readonly nav: PageRouteNavigation<TPath, TSearch>;
  /** Bound route reference for the page. */
  readonly route: PageRouteReference<TPath, TSearch>;
  /** Typed hook bundle for the page. */
  readonly hooks: PageHooks<TState, TResources, TPath, TSearch, TLayerData>;
}
