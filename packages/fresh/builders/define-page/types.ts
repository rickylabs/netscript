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

export type UnknownRecord = Record<string, unknown>;
export type EmptyRecord = Record<string, never>;
export type HasPathParams<TPath extends object> = [keyof TPath] extends [never] ? false
  : TPath extends EmptyRecord ? false
  : true;
export type DefinePageLayerProps = object;
export type DefinePageLayerMap = Record<string, DefinePageLayerProps>;
export type SearchParamValue = string | string[] | undefined;
export type PathParamInput = Record<string, string | undefined>;
export type SearchParamInput = Record<string, SearchParamValue>;

export interface PaginationSearchSchemaOptions {
  defaultLimit?: number;
  defaultSort?: string;
  defaultOrder?: 'asc' | 'desc';
}

export interface PaginationSearchState {
  page: number;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface DefinePageTelemetryConfig {
  enabled?: boolean;
  spanName?: string;
}

export type DefinePageLayerDelivery = 'blocking' | 'defer' | 'stream';

declare const validatedRouteHrefBrand: unique symbol;
declare const definePageTypeStateBrand: unique symbol;

export type ValidatedRouteHref = string & { readonly [validatedRouteHrefBrand]: true };
export type Simplify<T> = { [K in keyof T]: T[K] } & Record<PropertyKey, never>;
export type DefinePageMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

export interface DefinePageRequestContext<TState = EmptyRecord> {
  url: URL;
  req: Request;
  params: Record<string, string | undefined>;
  state: TState;
  isPartial?: boolean;
  data?: unknown;
}

export interface DefinePageRenderContext<TState = EmptyRecord>
  extends DefinePageRequestContext<TState> {
  render(body: ComponentChildren, init?: ResponseInit): Response;
}

export interface SchemaParseSuccess<TOutput> {
  success: true;
  data: TOutput;
}

export interface SchemaParseFailure {
  success: false;
  error?: unknown;
}

export type SchemaParseResult<TOutput> = SchemaParseSuccess<TOutput> | SchemaParseFailure;

export interface SchemaLike<TInput = unknown, TOutput = TInput> {
  safeParse(input: TInput): SchemaParseResult<TOutput>;
}

type InferSafeParseOutput<TSchema> = TSchema extends
  { safeParse: (...args: never[]) => infer TResult }
  ? Extract<TResult, SchemaParseSuccess<unknown>> extends SchemaParseSuccess<infer TOutput>
    ? TOutput
  : never
  : never;

export type InferSchemaOutput<TSchema> = TSchema extends { _output: infer TOutput } ? TOutput
  : [InferSafeParseOutput<TSchema>] extends [never] ? EmptyRecord
  : InferSafeParseOutput<TSchema>;

export type ResolveSchemaOutput<TCurrent, TSchema> = InferSchemaOutput<TSchema> extends object
  ? InferSchemaOutput<TSchema>
  : TCurrent;

export type PathParamSchema<TOutput = unknown> = SchemaLike<PathParamInput, TOutput>;
export type SearchParamSchema<TOutput = unknown> = SchemaLike<SearchParamInput, TOutput>;

export interface DefinePageTypeState<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> {
  readonly [definePageTypeStateBrand]: true;
  state: TState;
  resources: TResources;
  path: TPath;
  search: TSearch;
  layerData: TLayerData;
}

export type AnyDefinePageTypeState = DefinePageTypeState<
  unknown,
  UnknownRecord,
  object,
  object,
  DefinePageLayerMap
>;
export type DefinePageRootTypeState<TState = EmptyRecord> = DefinePageTypeState<
  TState,
  EmptyRecord,
  EmptyRecord,
  EmptyRecord,
  EmptyRecord
>;

export type NormalizeDefinePageTypeState<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> = TStateOrTypes extends AnyDefinePageTypeState ? TStateOrTypes
  : DefinePageTypeState<TStateOrTypes, TResources, TPath, TSearch, TLayerData>;

export type DefinePageStateOf<TTypes extends AnyDefinePageTypeState> = TTypes['state'];
export type DefinePageResourcesOf<TTypes extends AnyDefinePageTypeState> = TTypes['resources'];
export type DefinePagePathOf<TTypes extends AnyDefinePageTypeState> = TTypes['path'];
export type DefinePageSearchOf<TTypes extends AnyDefinePageTypeState> = TTypes['search'];
export type DefinePageLayerDataOf<TTypes extends AnyDefinePageTypeState> = TTypes['layerData'];

export interface DefinePageContract<
  TTypes extends AnyDefinePageTypeState = AnyDefinePageTypeState,
> {
  readonly $types: TTypes;
}

export type DefinePageTypeCarrier = DefinePageContract | {
  readonly $types?: AnyDefinePageTypeState;
};

export type InferDefinePageTypes<TValue extends DefinePageTypeCarrier> = TValue extends {
  readonly $types: infer TTypes extends AnyDefinePageTypeState;
} ? TTypes
  : TValue extends { readonly $types?: infer TTypes extends AnyDefinePageTypeState } ? TTypes
  : never;

export type InferDefinePageState<TValue extends DefinePageTypeCarrier> = DefinePageStateOf<
  InferDefinePageTypes<TValue>
>;
export type InferDefinePageResources<TValue extends DefinePageTypeCarrier> = DefinePageResourcesOf<
  InferDefinePageTypes<TValue>
>;
export type InferDefinePagePath<TValue extends DefinePageTypeCarrier> = DefinePagePathOf<
  InferDefinePageTypes<TValue>
>;
export type InferDefinePageSearch<TValue extends DefinePageTypeCarrier> = DefinePageSearchOf<
  InferDefinePageTypes<TValue>
>;
export type InferDefinePageLayerData<TValue extends DefinePageTypeCarrier> = DefinePageLayerDataOf<
  InferDefinePageTypes<TValue>
>;
export type InferDefinePageResource<
  TValue extends DefinePageTypeCarrier,
  TKey extends keyof InferDefinePageResources<TValue> & string,
> = InferDefinePageResources<TValue>[TKey];
export type InferDefinePageLayerProps<
  TValue extends DefinePageTypeCarrier,
  TLayer extends keyof InferDefinePageLayerData<TValue> & string,
> = InferDefinePageLayerData<TValue>[TLayer];
export type InferDefinePageHasRoute<TValue extends DefinePageTypeCarrier> = TValue extends {
  readonly route: unknown;
} ? true
  : false;
export type InferDefinePageLayoutSlots<TValue extends DefinePageTypeCarrier> = DefinePageSlotsFor<
  InferDefinePageTypes<TValue>
>;
export type InferDefinePageLayoutContext<TValue extends DefinePageTypeCarrier> =
  DefinePageLayoutContextBase<InferDefinePageTypes<TValue>, InferDefinePageHasRoute<TValue>>;
export interface InferDefinePageLayoutProps<TValue extends DefinePageTypeCarrier> {
  readonly slots: InferDefinePageLayoutSlots<TValue>;
  readonly ctx: InferDefinePageLayoutContext<TValue>;
}
export type InferDefinePageContext<TValue extends DefinePageTypeCarrier> =
  DefinePageRuntimeContextBase<InferDefinePageTypes<TValue>, InferDefinePageHasRoute<TValue>>;

export type DefinePageWithResource<TTypes extends AnyDefinePageTypeState, K extends string, TOut> =
  DefinePageTypeState<
    DefinePageStateOf<TTypes>,
    Simplify<DefinePageResourcesOf<TTypes> & Record<K, TOut>>,
    DefinePagePathOf<TTypes>,
    DefinePageSearchOf<TTypes>,
    DefinePageLayerDataOf<TTypes>
  >;

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

export type DefinePageWithPathParams<TTypes extends AnyDefinePageTypeState, TSchema> =
  DefinePageTypeState<
    DefinePageStateOf<TTypes>,
    DefinePageResourcesOf<TTypes>,
    ResolveSchemaOutput<DefinePagePathOf<TTypes>, TSchema>,
    DefinePageSearchOf<TTypes>,
    DefinePageLayerDataOf<TTypes>
  >;

export type DefinePageWithSearchParams<TTypes extends AnyDefinePageTypeState, TSchema> =
  DefinePageTypeState<
    DefinePageStateOf<TTypes>,
    DefinePageResourcesOf<TTypes>,
    DefinePagePathOf<TTypes>,
    ResolveSchemaOutput<DefinePageSearchOf<TTypes>, TSchema>,
    DefinePageLayerDataOf<TTypes>
  >;

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

export type DefinePageWithForm<
  TTypes extends AnyDefinePageTypeState,
  K extends string,
  TSchema extends z.ZodTypeAny,
> = DefinePageWithLayer<TTypes, K, RuntimeFormState<z.input<TSchema> & FormValues>>;

export type DefinePageRouteFor<TTypes extends AnyDefinePageTypeState> = RouteReference<
  DefinePagePathOf<TTypes>,
  DefinePageSearchOf<TTypes>
>;

type DefinePageRouteContext<TTypes extends AnyDefinePageTypeState, THasRoute extends boolean> = {
  routePattern: string;
  pathSchema?: PathParamSchema<DefinePagePathOf<TTypes>>;
  searchSchema?: SearchParamSchema<DefinePageSearchOf<TTypes>>;
  nav: DefinePageRouteNavFor<TTypes>;
  route?: DefinePageRouteFor<TTypes>;
} & (THasRoute extends true ? { route: DefinePageRouteFor<TTypes> } : EmptyRecord);

type DefinePageAugmentedContextBase<
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

export type DefinePageLayerContextBase<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = DefinePageAugmentedContextBase<TTypes, THasRoute>;

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

export type DefinePageLayoutContextBase<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = DefinePageAugmentedContextBase<TTypes, THasRoute>;

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

export type DefinePageResourceFactoryFor<
  TTypes extends AnyDefinePageTypeState,
  TOut,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayerContextBase<TTypes, THasRoute>,
) => TOut | Promise<TOut>;

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

/** Resolve the props payload returned by a page layer loader. */
export type ResolveDefinePageLayerLoaderOutput<TOutput> = TOutput extends
  CacheEntryLike<infer TProps> ? TProps
  : Exclude<TOutput, null | undefined>;

/** Infer the layer props produced by a page layer loader function. */
export type InferDefinePageLayerLoaderProps<TLoader extends (...args: never[]) => unknown> =
  Awaited<ReturnType<TLoader>> extends { readonly data: infer TProps }
    ? TProps extends object ? TProps : never
    : Exclude<Awaited<ReturnType<TLoader>>, null | undefined> extends infer TProps extends object
      ? TProps
    : never;

export interface DefinePageLayerConfigFor<
  TTypes extends AnyDefinePageTypeState,
  TProps extends DefinePageLayerProps,
  THasRoute extends boolean = false,
> {
  loader?: DefinePageLayerLoaderFor<TTypes, TProps, THasRoute>;
  partial?: string | ((ctx: DefinePageLayerContextBase<TTypes, THasRoute>) => string);
  partialName?: string | ((ctx: DefinePageLayerContextBase<TTypes, THasRoute>) => string);
  fallback?: JSX.Element | ComponentType<Record<string, never>>;
  policy?: DeferPolicyInput | DeferPolicyProfile;
  params?: (ctx: DefinePageLayerContextBase<TTypes, THasRoute>) => Record<string, string>;
  layerDeps?: (
    ctx: Pick<DefinePageLayerContextBase<TTypes, THasRoute>, 'path' | 'search'>,
  ) => unknown;
  staleTime?: number;
  gcTime?: number;
  staleReloadMode?: 'blocking' | 'background';
  shouldReload?: boolean | ((ctx: DefinePageLayerContextBase<TTypes, THasRoute>) => boolean);
  delivery?: DefinePageLayerDelivery;
}

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

type MakeHrefInput<TPath extends object, TSearch extends object> = HasPathParams<TPath> extends true
  ? { path: TPath; search?: Partial<TSearch> }
  : { path?: TPath; search?: Partial<TSearch> };

type MakeHrefArgs<TPath extends object, TSearch extends object> = HasPathParams<TPath> extends true
  ? [input: MakeHrefInput<TPath, TSearch>]
  : [input?: MakeHrefInput<TPath, TSearch>];

export interface DefinePageRouteNav<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> {
  makeHref(...args: MakeHrefArgs<TPath, TSearch>): ValidatedRouteHref;
}

export type DefinePageRouteNavFor<TTypes extends AnyDefinePageTypeState> = DefinePageRouteNav<
  DefinePagePathOf<TTypes>,
  DefinePageSearchOf<TTypes>
>;

export interface DefinePageBuildOptions {
  routePattern?: string;
}

export type DefinePageMethodHandlerFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayerContextBase<TTypes, THasRoute>,
) => Response | { data: unknown } | Promise<Response | { data: unknown }>;

export type DefinePageFormConfigFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
  TSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput = unknown,
> = FormConfig<TTypes, THasRoute, TSchema, TOutput>;

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

export type DefinePageSlot<TProps extends DefinePageLayerProps> = (() => JSX.Element | null) & {
  data?: TProps;
};

export type DefinePageSlots<TLayerData extends DefinePageLayerMap> = {
  [K in keyof TLayerData]: DefinePageSlot<TLayerData[K]>;
};

export type DefinePageSlotsFor<TTypes extends AnyDefinePageTypeState> = DefinePageSlots<
  DefinePageLayerDataOf<TTypes>
>;

export type DefinePageRuntimeContextBase<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = DefinePageAugmentedContextBase<TTypes, THasRoute> & {
  slots: DefinePageSlotsFor<TTypes>;
};

export interface DefinePageMetaDescriptor {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
  meta?: Array<{ name?: string; property?: string; content: string }>;
  links?: Array<{ rel: string; href: string; title?: string; type?: string }>;
  jsonLd?: unknown | unknown[];
}

export type DefinePageMetaResolverFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayoutContextBase<TTypes, THasRoute>,
) => DefinePageMetaDescriptor | Promise<DefinePageMetaDescriptor>;

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

export type DefinePageHeaderResolverFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayoutContextBase<TTypes, THasRoute>,
) => HeadersInit | Promise<HeadersInit>;

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

export type DefinePageLayoutFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  slots: DefinePageSlotsFor<TTypes>,
  ctx: DefinePageLayoutContextBase<TTypes, THasRoute>,
) => ComponentChildren;

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

export interface DefinePageDefinitionFor<TTypes extends AnyDefinePageTypeState> {
  readonly $types?: TTypes;
  page: (ctx: DefinePageRequestContext<DefinePageStateOf<TTypes>>) => Promise<JSX.Element>;
  readonly default: (
    ctx: DefinePageRequestContext<DefinePageStateOf<TTypes>>,
  ) => Promise<JSX.Element>;
  handler?: DefinePageHandlersFor<TTypes>;
}

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

export interface DefinePageRoutedDefinitionFor<TTypes extends AnyDefinePageTypeState>
  extends DefinePageDefinitionFor<TTypes> {
  readonly nav: DefinePageRouteNavFor<TTypes>;
  readonly route: DefinePageRouteFor<TTypes>;
  readonly hooks: DefinePageHooks<DefinePageRoutedDefinitionFor<TTypes>>;
}

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

export type DefinePageBuildResultFor<TBuildOptions, TTypes extends AnyDefinePageTypeState> =
  TBuildOptions extends string | { routePattern: string } ? DefinePageRoutedDefinitionFor<TTypes>
    : DefinePageDefinitionFor<TTypes>;

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
