/** Runtime context compatibility types for page builders.
 *
 * @module
 */

import type { EmptyRecord, PageCacheEntry, PageLayerMap, UnknownRecord } from './shared-types.ts';
import type {
  PagePathSchema,
  PageRouteNavigation,
  PageRouteReference,
  PageRouteTarget,
  PageSchemaParseResult,
  PageSearchSchema,
} from './route-types.ts';

/** Typed request context exposed to page builders. */
export interface PageRequestContext<TState = EmptyRecord> {
  /** Request URL for the current route render. */
  readonly url: URL;
  /** Raw request object from Fresh. */
  readonly req: Request;
  /** Raw Fresh path params. */
  readonly params: Record<string, string | undefined>;
  /** Fresh route state. */
  readonly state: TState;
  /** True when the current request already targets a partial. */
  readonly isPartial?: boolean;
  /** Data returned by a page method handler. */
  readonly data?: unknown;
}

/** Request context variant used when a page can call `ctx.render()`. */
export interface PageRenderContext<TState = EmptyRecord> extends PageRequestContext<TState> {
  /** Render the page body with Fresh response metadata. */
  render(body: unknown, init?: ResponseInit): Response;
}

/** Typed defer policy profile accepted by `withPolicy()`. */
export type PageDeferPolicyProfile =
  | 'balanced'
  | 'aggressive-first-paint'
  | 'background-refresh'
  | 'low-bandwidth';

/** Typed defer policy override accepted by `withPolicy()`. */
export interface PageDeferPolicyInput {
  /** Named policy profile to start from. */
  readonly profile?: PageDeferPolicyProfile;
  /** Override for the freshness window in milliseconds. */
  readonly staleTimeMs?: number;
  /** Prewarm the partial when the cache is missing. */
  readonly prewarmOnMiss?: boolean;
  /** Prewarm the partial when the cache is stale. */
  readonly prewarmOnStale?: boolean;
  /** Allow client refresh even when server cache is fresh. */
  readonly clientRefreshOnFreshCache?: boolean;
  /** Skip client refresh when the server is already prewarming. */
  readonly skipClientWhenServerPrewarm?: boolean;
}

/** Typed telemetry configuration accepted by `withTelemetry()`. */
export interface PageTelemetryConfig {
  /** Enables or disables route telemetry. */
  readonly enabled?: boolean;
  /** Optional explicit span name. */
  readonly spanName?: string;
}

/** Delivery mode for a deferred page layer. */
export type PageLayerDelivery = 'blocking' | 'defer' | 'stream';

/** Infer the typed path state from a route target. */
export type PageRoutePath<TRoute extends PageRouteTarget<object, object>> = NonNullable<
  TRoute['$types']
>['path'];

/** Infer the typed search state from a route target. */
export type PageRouteSearch<TRoute extends PageRouteTarget<object, object>> = NonNullable<
  TRoute['$types']
>['search'];

/** Infer the output object carried by a schema-like value. */
export type SchemaOutput<TSchema, TFallback extends object> = TSchema extends undefined ? TFallback
  : TSchema extends { readonly _output: infer TOutput extends object } ? TOutput
  : TSchema extends
    { safeParse(input: unknown): PageSchemaParseResult<infer TOutput extends object> } ? TOutput
  : TFallback;

/** Infer the input object accepted by a schema-like value. */
export type SchemaInput<TSchema, TFallback extends object> = TSchema extends undefined ? TFallback
  : TSchema extends { readonly _input: infer TInput extends object } ? TInput
  : TSchema extends { safeParse(input: infer TInput extends object): unknown } ? TInput
  : TFallback;

/** Flatten mapped and intersected object types for cleaner IntelliSense. */
export type Simplify<T> = { [K in keyof T]: T[K] } & object;

/** Runtime context shared by loaders, handlers, layouts, and metadata resolvers. */
export interface PageContext<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  THasRoute extends boolean = false,
> extends PageRequestContext<TState> {
  /** Request abort signal. */
  readonly signal: AbortSignal;
  /** Parsed route path params. */
  readonly path: TPath;
  /** Parsed route search state. */
  readonly search: TSearch;
  /** Layer data already resolved by earlier pipeline stages. */
  readonly layerData: Partial<TLayerData>;
  /** Route pattern currently being rendered. */
  readonly routePattern: string;
  /** Optional typed path schema. */
  readonly pathSchema?: PagePathSchema<TPath>;
  /** Optional typed search schema. */
  readonly searchSchema?: PageSearchSchema<TSearch>;
  /** Typed href builder for the route. */
  readonly nav: PageRouteNavigation<TPath, TSearch>;
  /** Generated route reference when the page was built with routing. */
  readonly route: THasRoute extends true ? PageRouteReference<TPath, TSearch>
    : PageRouteReference<TPath, TSearch> | undefined;
  /** All resolved resources keyed by resource id. */
  readonly resources: TResources;
  /** Resolve a single named resource with full typing. */
  resource<TKey extends keyof TResources & string>(key: TKey): TResources[TKey];
}

/** Runtime context variant used for page layouts and metadata. */
export interface PageLayoutContext<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  THasRoute extends boolean = false,
> extends PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute> {}

/** Resource factory accepted by `withResource()` and `withResources()`. */
export type PageResourceFactory<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  TOut = unknown,
  THasRoute extends boolean = false,
> = (
  ctx: PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
) => TOut | Promise<TOut>;

/** Async loader accepted by `withLayer()`. */
export type PageLayerLoader<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  TProps extends object = EmptyRecord,
  THasRoute extends boolean = false,
> = (
  ctx: PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
) =>
  | TProps
  | PageCacheEntry<TProps>
  | null
  | undefined
  | Promise<TProps | PageCacheEntry<TProps> | null | undefined>;

/** Config object accepted by `withLayer()`. */
export interface PageLayerConfig<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  TProps extends object = EmptyRecord,
  THasRoute extends boolean = false,
> {
  /** Async loader providing data for the layer component. */
  readonly loader?: PageLayerLoader<
    TState,
    TResources,
    TPath,
    TSearch,
    TLayerData,
    TProps,
    THasRoute
  >;
  /** Partial endpoint or partial resolver used to refresh the layer. */
  readonly partial?:
    | string
    | ((ctx: PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>) => string);
  /** Stable Fresh partial name. */
  readonly partialName?:
    | string
    | ((
      ctx: PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
    ) => string);
  /** Fallback content shown while a deferred layer is pending. */
  readonly fallback?: unknown;
  /** Defer policy applied to the layer. */
  readonly policy?: PageDeferPolicyInput | PageDeferPolicyProfile;
  /** Extra params added to defer form submissions. */
  readonly params?: (
    ctx: PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
  ) => Record<string, string>;
  /** Dependency projection used to decide when the layer should reload. */
  readonly layerDeps?: (
    ctx: Pick<
      PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
      'path' | 'search'
    >,
  ) => unknown;
  /** Freshness window for the cached layer payload. */
  readonly staleTime?: number;
  /** Cache retention window for the layer payload. */
  readonly gcTime?: number;
  /** Stale reload mode. */
  readonly staleReloadMode?: 'blocking' | 'background';
  /** Explicit reload guard. */
  readonly shouldReload?:
    | boolean
    | ((
      ctx: PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
    ) => boolean);
  /** Delivery mode for the layer. */
  readonly delivery?: PageLayerDelivery;
}
