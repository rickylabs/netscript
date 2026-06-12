import type { CachedEntry as CacheEntryLike } from '@netscript/sdk/ports';
import type { ComponentChildren, ComponentType, JSX } from 'preact';
import { z } from 'zod';
import type { DeferPolicyInput, DeferPolicyProfile } from '../../defer/policy.ts';
import type { FormConfig } from '../../form/config.ts';
import type { FormValues, RuntimeFormState } from '../../form/types.ts';
import type { RouteReference } from '../../route/contract.ts';
import type {
  DefinePageHooks,
  InferRoutePath,
  InferRouteSearch,
  TypedRouteTarget,
} from './navigation.tsx';

/** A record with string keys and unknown values. */
export type UnknownRecord = Record<string, unknown>;
/** A record with no keys; the empty object type. */
export type EmptyRecord = Record<string, never>;
/** Returns true when the path shape contains at least one parameter. */
export type HasPathParams<TPath extends object> = [keyof TPath] extends [never] ? false
  : TPath extends EmptyRecord ? false
  : true;
/** Props accepted by a page layer. */
export type DefinePageLayerProps = object;
/** Map of layer identifiers to their prop shapes. */
export type DefinePageLayerMap = Record<string, DefinePageLayerProps>;
/** A single raw search parameter value. */
export type SearchParamValue = string | string[] | undefined;
/** Raw path parameter input before validation. */
export type PathParamInput = Record<string, string | undefined>;
/** Raw search parameter input before validation. */
export type SearchParamInput = Record<string, SearchParamValue>;

/** Defines the shape of pagination search schema options. */
export interface PaginationSearchSchemaOptions {
  /** The default limit. */
  defaultLimit?: number;
  /** The default sort. */
  defaultSort?: string;
  /** The default order. */
  defaultOrder?: 'asc' | 'desc';
}

/** Defines the shape of pagination search state. */
export interface PaginationSearchState {
  /** The page. */
  page: number;
  /** The limit. */
  limit: number;
  /** The offset. */
  offset: number;
  /** The sort by. */
  sortBy: string;
  /** The sort order. */
  sortOrder: 'asc' | 'desc';
}

/** Defines the shape of define page telemetry config. */
export interface DefinePageTelemetryConfig {
  /** The enabled. */
  enabled?: boolean;
  /** The span name. */
  spanName?: string;
}

/** Type alias for define page layer delivery. */
export type DefinePageLayerDelivery = 'blocking' | 'defer' | 'stream';

/** Internal brand used to nominalize a validated route HREF string. */
export declare const validatedRouteHrefBrand: unique symbol;
/** Internal brand used to identify definePage type state carriers. */
export declare const definePageTypeStateBrand: unique symbol;

/** A route HREF string that has passed validation/branding. */
export type ValidatedRouteHref = string & { readonly [validatedRouteHrefBrand]: true };
/** Flatten an object type for cleaner IntelliSense. */
export type Simplify<T> = { [K in keyof T]: T[K] } & Record<PropertyKey, never>;
/** Supported HTTP methods for definePage handlers. */
export type DefinePageMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/** Defines the shape of define page request context. */
export interface DefinePageRequestContext<TState = EmptyRecord> {
  /** The url. */
  url: URL;
  /** The req. */
  req: Request;
  /** The params. */
  params: Record<string, string | undefined>;
  /** The state. */
  state: TState;
  /** The is partial. */
  isPartial?: boolean;
  /** The data. */
  data?: unknown;
}

/** Defines the shape of define page render context. */
export interface DefinePageRenderContext<TState = EmptyRecord>
  extends DefinePageRequestContext<TState> {
  /** render. */
  render(body: ComponentChildren, init?: ResponseInit): Response;
}

/** Successful schema parse result. */
export interface SchemaParseSuccess<TOutput> {
  /** The success. */
  success: true;
  /** The data. */
  data: TOutput;
}

/** Failed schema parse result. */
export interface SchemaParseFailure {
  /** The success. */
  success: false;
  /** The error. */
  error?: unknown;
}

/** Result of a safe schema parse, either success or failure. */
export type SchemaParseResult<TOutput> = SchemaParseSuccess<TOutput> | SchemaParseFailure;

/** Minimal schema interface used by route/path/search parameter validators. */
export interface SchemaLike<TInput = unknown, TOutput = TInput> {
  /** safe Parse. */
  safeParse(input: TInput): SchemaParseResult<TOutput>;
}

/** Infers the output type of a schema from its safeParse signature. */
export type InferSafeParseOutput<TSchema> = TSchema extends
  { safeParse: (...args: never[]) => infer TResult }
  ? Extract<TResult, SchemaParseSuccess<unknown>> extends SchemaParseSuccess<infer TOutput>
    ? TOutput
  : never
  : never;

/** Infers the output shape of a path or search schema. */
export type InferSchemaOutput<TSchema> = TSchema extends { _output: infer TOutput } ? TOutput
  : [InferSafeParseOutput<TSchema>] extends [never] ? EmptyRecord
  : InferSafeParseOutput<TSchema>;

/** Type alias for resolve schema output. */
export type ResolveSchemaOutput<TCurrent, TSchema> = InferSchemaOutput<TSchema> extends object
  ? InferSchemaOutput<TSchema>
  : TCurrent;

/** Schema used to validate and infer path parameters. */
export type PathParamSchema<TOutput = unknown> = SchemaLike<PathParamInput, TOutput>;
/** Schema used to validate and infer search parameters. */
export type SearchParamSchema<TOutput = unknown> = SchemaLike<SearchParamInput, TOutput>;

/** Defines the shape of define page type state. */
export interface DefinePageTypeState<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> {
  /** Internal brand marker for define-page type state. */
  readonly [definePageTypeStateBrand]: true;
  /** The state. */
  state: TState;
  /** The resources. */
  resources: TResources;
  /** The path. */
  path: TPath;
  /** The search. */
  search: TSearch;
  /** The layer data. */
  layerData: TLayerData;
}

/** Type alias for any define page type state. */
export type AnyDefinePageTypeState = DefinePageTypeState<
  unknown,
  UnknownRecord,
  object,
  object,
  DefinePageLayerMap
>;
/** Type alias for define page root type state. */
export type DefinePageRootTypeState<TState = EmptyRecord> = DefinePageTypeState<
  TState,
  EmptyRecord,
  EmptyRecord,
  EmptyRecord,
  EmptyRecord
>;

/** Type alias for normalize define page type state. */
export type NormalizeDefinePageTypeState<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> = TStateOrTypes extends AnyDefinePageTypeState ? TStateOrTypes
  : DefinePageTypeState<TStateOrTypes, TResources, TPath, TSearch, TLayerData>;

/** Type alias for define page state of. */
export type DefinePageStateOf<TTypes extends AnyDefinePageTypeState> = TTypes['state'];
/** Type alias for define page resources of. */
export type DefinePageResourcesOf<TTypes extends AnyDefinePageTypeState> = TTypes['resources'];
/** Type alias for define page path of. */
export type DefinePagePathOf<TTypes extends AnyDefinePageTypeState> = TTypes['path'];
/** Type alias for define page search of. */
export type DefinePageSearchOf<TTypes extends AnyDefinePageTypeState> = TTypes['search'];
/** Type alias for define page layer data of. */
export type DefinePageLayerDataOf<TTypes extends AnyDefinePageTypeState> = TTypes['layerData'];

/** Defines the shape of define page contract. */
export interface DefinePageContract<
  TTypes extends AnyDefinePageTypeState = AnyDefinePageTypeState,
> {
  /** The $types. */
  readonly $types: TTypes;
}

/** Type alias for define page type carrier. */
export type DefinePageTypeCarrier = DefinePageContract | {
  readonly $types?: AnyDefinePageTypeState;
};

/** Type alias for infer define page types. */
export type InferDefinePageTypes<TValue extends DefinePageTypeCarrier> = TValue extends {
  readonly $types: infer TTypes extends AnyDefinePageTypeState;
} ? TTypes
  : TValue extends { readonly $types?: infer TTypes extends AnyDefinePageTypeState } ? TTypes
  : never;

/** Type alias for infer define page state. */
export type InferDefinePageState<TValue extends DefinePageTypeCarrier> = DefinePageStateOf<
  InferDefinePageTypes<TValue>
>;
/** Type alias for infer define page resources. */
export type InferDefinePageResources<TValue extends DefinePageTypeCarrier> = DefinePageResourcesOf<
  InferDefinePageTypes<TValue>
>;
/** Type alias for infer define page path. */
export type InferDefinePagePath<TValue extends DefinePageTypeCarrier> = DefinePagePathOf<
  InferDefinePageTypes<TValue>
>;
/** Type alias for infer define page search. */
export type InferDefinePageSearch<TValue extends DefinePageTypeCarrier> = DefinePageSearchOf<
  InferDefinePageTypes<TValue>
>;
/** Type alias for infer define page layer data. */
export type InferDefinePageLayerData<TValue extends DefinePageTypeCarrier> = DefinePageLayerDataOf<
  InferDefinePageTypes<TValue>
>;
/** Type alias for infer define page resource. */
export type InferDefinePageResource<
  TValue extends DefinePageTypeCarrier,
  TKey extends keyof InferDefinePageResources<TValue> & string,
> = InferDefinePageResources<TValue>[TKey];
/** Type alias for infer define page layer props. */
export type InferDefinePageLayerProps<
  TValue extends DefinePageTypeCarrier,
  TLayer extends keyof InferDefinePageLayerData<TValue> & string,
> = InferDefinePageLayerData<TValue>[TLayer];
/** Type alias for infer define page has route. */
export type InferDefinePageHasRoute<TValue extends DefinePageTypeCarrier> = TValue extends {
  readonly route: unknown;
} ? true
  : false;
/** Type alias for infer define page layout slots. */
export type InferDefinePageLayoutSlots<TValue extends DefinePageTypeCarrier> = DefinePageSlotsFor<
  InferDefinePageTypes<TValue>
>;
/** Type alias for infer define page layout context. */
export type InferDefinePageLayoutContext<TValue extends DefinePageTypeCarrier> =
  DefinePageLayoutContextBase<InferDefinePageTypes<TValue>, InferDefinePageHasRoute<TValue>>;
/** Defines the shape of infer define page layout props. */
export interface InferDefinePageLayoutProps<TValue extends DefinePageTypeCarrier> {
  /** The slots. */
  readonly slots: InferDefinePageLayoutSlots<TValue>;
  /** The ctx. */
  readonly ctx: InferDefinePageLayoutContext<TValue>;
}
/** Type alias for infer define page context. */
export type InferDefinePageContext<TValue extends DefinePageTypeCarrier> =
  DefinePageRuntimeContextBase<InferDefinePageTypes<TValue>, InferDefinePageHasRoute<TValue>>;

/** Type alias for define page with resource. */
export type DefinePageWithResource<TTypes extends AnyDefinePageTypeState, K extends string, TOut> =
  DefinePageTypeState<
    DefinePageStateOf<TTypes>,
    Simplify<DefinePageResourcesOf<TTypes> & Record<K, TOut>>,
    DefinePagePathOf<TTypes>,
    DefinePageSearchOf<TTypes>,
    DefinePageLayerDataOf<TTypes>
  >;

/** Type alias for define page with resources. */
export type DefinePageWithResources<
  TTypes extends AnyDefinePageTypeState,
  TFactories extends Record<string, (...args: never[]) => unknown>,
> = DefinePageTypeState<
  DefinePageStateOf<TTypes>,
  Simplify<
    DefinePageResourcesOf<TTypes> & { [K in keyof TFactories]: Awaited<ReturnType<TFactories[K]>> }
  >,
  DefinePagePathOf<TTypes>,
  DefinePageSearchOf<TTypes>,
  DefinePageLayerDataOf<TTypes>
>;

/** Type alias for define page with path params. */
export type DefinePageWithPathParams<TTypes extends AnyDefinePageTypeState, TSchema> =
  DefinePageTypeState<
    DefinePageStateOf<TTypes>,
    DefinePageResourcesOf<TTypes>,
    ResolveSchemaOutput<DefinePagePathOf<TTypes>, TSchema>,
    DefinePageSearchOf<TTypes>,
    DefinePageLayerDataOf<TTypes>
  >;

/** Type alias for define page with search params. */
export type DefinePageWithSearchParams<TTypes extends AnyDefinePageTypeState, TSchema> =
  DefinePageTypeState<
    DefinePageStateOf<TTypes>,
    DefinePageResourcesOf<TTypes>,
    DefinePagePathOf<TTypes>,
    ResolveSchemaOutput<DefinePageSearchOf<TTypes>, TSchema>,
    DefinePageLayerDataOf<TTypes>
  >;

/** Type alias for define page with params. */
export type DefinePageWithParams<
  TTypes extends AnyDefinePageTypeState,
  TPathSchema,
  TSearchSchema,
> = DefinePageTypeState<
  DefinePageStateOf<TTypes>,
  DefinePageResourcesOf<TTypes>,
  ResolveSchemaOutput<DefinePagePathOf<TTypes>, TPathSchema>,
  ResolveSchemaOutput<DefinePageSearchOf<TTypes>, TSearchSchema>,
  DefinePageLayerDataOf<TTypes>
>;

/** Type alias for define page with route. */
export type DefinePageWithRoute<
  TTypes extends AnyDefinePageTypeState,
  TRoute extends TypedRouteTarget<object, object>,
> = DefinePageTypeState<
  DefinePageStateOf<TTypes>,
  DefinePageResourcesOf<TTypes>,
  InferRoutePath<TRoute>,
  InferRouteSearch<TRoute>,
  DefinePageLayerDataOf<TTypes>
>;

/** Type alias for define page with layer. */
export type DefinePageWithLayer<
  TTypes extends AnyDefinePageTypeState,
  K extends string,
  TProps extends DefinePageLayerProps,
> = DefinePageTypeState<
  DefinePageStateOf<TTypes>,
  DefinePageResourcesOf<TTypes>,
  DefinePagePathOf<TTypes>,
  DefinePageSearchOf<TTypes>,
  Simplify<DefinePageLayerDataOf<TTypes> & Record<K, TProps>>
>;

/** Type alias for define page with form. */
export type DefinePageWithForm<
  TTypes extends AnyDefinePageTypeState,
  K extends string,
  TSchema extends z.ZodTypeAny,
> = DefinePageWithLayer<TTypes, K, RuntimeFormState<z.input<TSchema> & FormValues>>;

/** Re-exported Zod input extraction helper. */
export type { input } from 'zod';
/** Re-exported Zod output extraction helper. */
export type { output } from 'zod';

/** Type alias for define page route for. */
export type DefinePageRouteFor<TTypes extends AnyDefinePageTypeState> = RouteReference<
  DefinePagePathOf<TTypes>,
  DefinePageSearchOf<TTypes>
>;

/** Route-specific fields attached to page contexts. */
export type DefinePageRouteContext<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean,
> = {
  routePattern: string;
  pathSchema?: PathParamSchema<DefinePagePathOf<TTypes>>;
  searchSchema?: SearchParamSchema<DefinePageSearchOf<TTypes>>;
  nav: DefinePageRouteNavFor<TTypes>;
  route?: DefinePageRouteFor<TTypes>;
} & (THasRoute extends true ? { route: DefinePageRouteFor<TTypes> } : EmptyRecord);

/** Base augmented context shared by layer and layout contexts. */
export type DefinePageAugmentedContextBase<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean,
> =
  & DefinePageRequestContext<DefinePageStateOf<TTypes>>
  & DefinePageRouteContext<TTypes, THasRoute>
  & {
    signal: AbortSignal;
    path: DefinePagePathOf<TTypes>;
    search: DefinePageSearchOf<TTypes>;
    layerData: Partial<DefinePageLayerDataOf<TTypes>>;
    resource<K extends keyof DefinePageResourcesOf<TTypes> & string>(
      key: K,
    ): DefinePageResourcesOf<TTypes>[K];
    resources: DefinePageResourcesOf<TTypes>;
  };

/** Type alias for define page layer context base. */
export type DefinePageLayerContextBase<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = DefinePageAugmentedContextBase<TTypes, THasRoute>;

/** Type alias for define page layer context. */
export type DefinePageLayerContext<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> = DefinePageLayerContextBase<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    EmptyRecord
  >,
  false
>;

/** Type alias for define page layout context base. */
export type DefinePageLayoutContextBase<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = DefinePageAugmentedContextBase<TTypes, THasRoute>;

/** Type alias for define page layout context. */
export type DefinePageLayoutContext<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> = DefinePageLayoutContextBase<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    TLayerData
  >,
  false
>;

/** Type alias for define page resource factory for. */
export type DefinePageResourceFactoryFor<
  TTypes extends AnyDefinePageTypeState,
  TOut,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayerContextBase<TTypes, THasRoute>,
) => TOut | Promise<TOut>;

/** Type alias for define page resource factory. */
export type DefinePageResourceFactory<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TOut = unknown,
> = DefinePageResourceFactoryFor<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    EmptyRecord
  >,
  TOut,
  false
>;

/** Type alias for define page layer loader for. */
export type DefinePageLayerLoaderFor<
  TTypes extends AnyDefinePageTypeState,
  TProps extends DefinePageLayerProps,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayerContextBase<TTypes, THasRoute>,
) =>
  | TProps
  | CacheEntryLike<TProps>
  | null
  | undefined
  | Promise<TProps | CacheEntryLike<TProps> | null | undefined>;

/** Type alias for define page layer loader. */
export type DefinePageLayerLoader<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TProps extends DefinePageLayerProps = EmptyRecord,
> = DefinePageLayerLoaderFor<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    EmptyRecord
  >,
  TProps,
  false
>;

/** Resolves the props type produced by a layer loader. */
export type ResolveDefinePageLayerLoaderOutput<TOutput> = TOutput extends
  CacheEntryLike<infer TProps> ? TProps
  : Exclude<TOutput, null | undefined>;

/** Type alias for infer define page layer loader props. */
export type InferDefinePageLayerLoaderProps<TLoader extends (...args: never[]) => unknown> =
  ResolveDefinePageLayerLoaderOutput<Awaited<ReturnType<TLoader>>> extends
    infer TProps extends DefinePageLayerProps ? TProps
    : never;

/** Defines the shape of define page layer config for. */
export interface DefinePageLayerConfigFor<
  TTypes extends AnyDefinePageTypeState,
  TProps extends DefinePageLayerProps,
  THasRoute extends boolean = false,
> {
  /** The loader. */
  loader?: DefinePageLayerLoaderFor<TTypes, TProps, THasRoute>;
  /** partial. */
  partial?: string | ((ctx: DefinePageLayerContextBase<TTypes, THasRoute>) => string);
  /** partial Name. */
  partialName?: string | ((ctx: DefinePageLayerContextBase<TTypes, THasRoute>) => string);
  /** The fallback. */
  fallback?: JSX.Element | ComponentType<Record<string, never>>;
  /** The policy. */
  policy?: DeferPolicyInput | DeferPolicyProfile;
  /** params. */
  params?: (ctx: DefinePageLayerContextBase<TTypes, THasRoute>) => Record<string, string>;
  /** layer Deps. */
  layerDeps?: (
    ctx: Pick<DefinePageLayerContextBase<TTypes, THasRoute>, 'path' | 'search'>,
  ) => unknown;
  /** The stale time. */
  staleTime?: number;
  /** The gc time. */
  gcTime?: number;
  /** The stale reload mode. */
  staleReloadMode?: 'blocking' | 'background';
  /** should Reload. */
  shouldReload?: boolean | ((ctx: DefinePageLayerContextBase<TTypes, THasRoute>) => boolean);
  /** The delivery. */
  delivery?: DefinePageLayerDelivery;
}

/** Type alias for define page layer config. */
export type DefinePageLayerConfig<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TProps extends DefinePageLayerProps = EmptyRecord,
> = DefinePageLayerConfigFor<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    EmptyRecord
  >,
  TProps,
  false
>;

/** Arguments accepted by {@link DefinePageRouteNav.makeHref}. */
export type MakeHrefInput<TPath extends object, TSearch extends object> = HasPathParams<TPath> extends
  true
  ? { path: TPath; search?: Partial<TSearch> }
  : { path?: TPath; search?: Partial<TSearch> };

/** Tuple shape for {@link DefinePageRouteNav.makeHref} depending on path params. */
export type MakeHrefArgs<TPath extends object, TSearch extends object> = HasPathParams<TPath> extends
  true
  ? [input: MakeHrefInput<TPath, TSearch>]
  : [input?: MakeHrefInput<TPath, TSearch>];

/** Navigation helpers produced for a typed route. */
export interface DefinePageRouteNav<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> {
  /** Build an HREF for this route with optional path and search input. */
  makeHref(...args: MakeHrefArgs<TPath, TSearch>): ValidatedRouteHref;
}

/** Type alias for define page route nav for. */
export type DefinePageRouteNavFor<TTypes extends AnyDefinePageTypeState> = DefinePageRouteNav<
  DefinePagePathOf<TTypes>,
  DefinePageSearchOf<TTypes>
>;

/** Defines the shape of define page build options. */
export interface DefinePageBuildOptions {
  /** The route pattern. */
  routePattern?: string;
}

/** Type alias for define page method handler for. */
export type DefinePageMethodHandlerFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayerContextBase<TTypes, THasRoute>,
) => Response | { data: unknown } | Promise<Response | { data: unknown }>;

/** Type alias for define page form config for. */
export type DefinePageFormConfigFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
  TSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput = unknown,
> = FormConfig<TTypes, THasRoute, TSchema, TOutput>;

/** Type alias for define page method handler. */
export type DefinePageMethodHandler<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> = DefinePageMethodHandlerFor<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    EmptyRecord
  >,
  false
>;

/** Type alias for define page slot. */
export type DefinePageSlot<TProps extends DefinePageLayerProps> = (() => JSX.Element | null) & {
  data?: TProps;
};

/** Type alias for define page slots. */
export type DefinePageSlots<TLayerData extends DefinePageLayerMap> = {
  [K in keyof TLayerData]: DefinePageSlot<TLayerData[K]>;
};

/** Type alias for define page slots for. */
export type DefinePageSlotsFor<TTypes extends AnyDefinePageTypeState> = DefinePageSlots<
  DefinePageLayerDataOf<TTypes>
>;

/** Type alias for define page runtime context base. */
export type DefinePageRuntimeContextBase<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = DefinePageAugmentedContextBase<TTypes, THasRoute> & {
  slots: DefinePageSlotsFor<TTypes>;
};

/** Defines the shape of define page meta descriptor. */
export interface DefinePageMetaDescriptor {
  /** The title. */
  title?: string;
  /** The description. */
  description?: string;
  /** The canonical url. */
  canonicalUrl?: string;
  /** The robots. */
  robots?: string;
  /** The meta. */
  meta?: Array<{ name?: string; property?: string; content: string }>;
  /** The links. */
  links?: Array<{ rel: string; href: string; title?: string; type?: string }>;
  /** The json ld. */
  jsonLd?: unknown | unknown[];
}

/** Type alias for define page meta resolver for. */
export type DefinePageMetaResolverFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayoutContextBase<TTypes, THasRoute>,
) => DefinePageMetaDescriptor | Promise<DefinePageMetaDescriptor>;

/** Type alias for define page meta resolver. */
export type DefinePageMetaResolver<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> = DefinePageMetaResolverFor<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    TLayerData
  >,
  false
>;

/** Type alias for define page header resolver for. */
export type DefinePageHeaderResolverFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayoutContextBase<TTypes, THasRoute>,
) => HeadersInit | Promise<HeadersInit>;

/** Type alias for define page header resolver. */
export type DefinePageHeaderResolver<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> = DefinePageHeaderResolverFor<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    TLayerData
  >,
  false
>;

/** Type alias for define page layout for. */
export type DefinePageLayoutFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  slots: DefinePageSlotsFor<TTypes>,
  ctx: DefinePageLayoutContextBase<TTypes, THasRoute>,
) => ComponentChildren;

/** Type alias for define page layout. */
export type DefinePageLayout<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> = DefinePageLayoutFor<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    TLayerData
  >,
  false
>;

/** Type alias for define page handlers for. */
export type DefinePageHandlersFor<TTypes extends AnyDefinePageTypeState> = Partial<
  Record<
    DefinePageMethod,
    (
      ctx:
        | DefinePageRequestContext<DefinePageStateOf<TTypes>>
        | DefinePageRenderContext<DefinePageStateOf<TTypes>>,
    ) => Response | { data: unknown } | Promise<Response | { data: unknown }>
  >
>;

/** Type alias for define page handlers. */
export type DefinePageHandlers<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> = DefinePageHandlersFor<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    EmptyRecord
  >
>;

/** Defines the shape of define page definition for. */
export interface DefinePageDefinitionFor<TTypes extends AnyDefinePageTypeState> {
  /** The $types. */
  readonly $types?: TTypes;
  /** page. */
  page: (ctx: DefinePageRequestContext<DefinePageStateOf<TTypes>>) => Promise<JSX.Element>;
  /** The default. */
  readonly default: (
    /** Property `ctx`. */
    ctx: DefinePageRequestContext<DefinePageStateOf<TTypes>>,
  ) => Promise<JSX.Element>;
  /** The handler. */
  handler?: DefinePageHandlersFor<TTypes>;
}

/** Type alias for define page definition. */
export type DefinePageDefinition<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> = DefinePageDefinitionFor<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    TLayerData
  >
>;

/** Defines the shape of define page routed definition for. */
export interface DefinePageRoutedDefinitionFor<TTypes extends AnyDefinePageTypeState>
  extends DefinePageDefinitionFor<TTypes> {
  /** The nav. */
  readonly nav: DefinePageRouteNavFor<TTypes>;
  /** The route. */
  readonly route: DefinePageRouteFor<TTypes>;
  /** The hooks. */
  readonly hooks: DefinePageHooks<DefinePageRoutedDefinitionFor<TTypes>>;
}

/** Type alias for define page routed definition. */
export type DefinePageRoutedDefinition<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> = DefinePageRoutedDefinitionFor<
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    TLayerData
  >
>;

/** Type alias for define page build result for. */
export type DefinePageBuildResultFor<TBuildOptions, TTypes extends AnyDefinePageTypeState> =
  TBuildOptions extends string | { routePattern: string } ? DefinePageRoutedDefinitionFor<TTypes>
    : DefinePageDefinitionFor<TTypes>;

/** Type alias for define page build result. */
export type DefinePageBuildResult<
  TBuildOptions,
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> = DefinePageBuildResultFor<
  TBuildOptions,
  NormalizeDefinePageTypeState<
    TStateOrTypes,
    TResources,
    TPath,
    TSearch,
    TLayerData
  >
>;
