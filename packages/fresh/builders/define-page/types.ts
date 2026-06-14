import type { ComponentChildren } from 'preact';
import type { z } from 'zod';
import type { FormValues, RuntimeFormState } from '../../form/types.ts';
import type { RouteReference } from '../../route/contract.ts';
import type { InferRoutePath, InferRouteSearch, TypedRouteTarget } from './navigation/mod.ts';
import type {
  DefinePageRouteNavFor,
  DefinePageRuntimeContextBase,
  DefinePageSlotsFor,
} from './catalog.ts';

/** @internal */
export type UnknownRecord = Record<string, unknown>;
/** @internal */
export type EmptyRecord = Record<string, never>;
/** @internal */
export type HasPathParams<TPath extends object> = [keyof TPath] extends [never] ? false
  : TPath extends EmptyRecord ? false
  : true;
/** @internal */
export type DefinePageLayerProps = object;
/** @internal */
export type DefinePageLayerMap = Record<string, DefinePageLayerProps>;
/** @internal */
export type SearchParamValue = string | string[] | undefined;
/** @internal */
export type PathParamInput = Record<string, string | undefined>;
/** @internal */
export type SearchParamInput = Record<string, SearchParamValue>;

/** @internal */
export interface PaginationSearchSchemaOptions {
  defaultLimit?: number;
  defaultSort?: string;
  defaultOrder?: 'asc' | 'desc';
}

/** @internal */
export interface PaginationSearchState {
  page: number;
  limit: number;
  offset: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

/** @internal */
export interface DefinePageTelemetryConfig {
  enabled?: boolean;
  spanName?: string;
}

/** @internal */
export type DefinePageLayerDelivery = 'blocking' | 'defer' | 'stream';

/** @internal */
export type ValidatedRouteHref = string & { readonly __validatedRouteHref: true };
/** @internal */
export type Simplify<T> = { [K in keyof T]: T[K] } & Record<PropertyKey, never>;
/** @internal */
export type DefinePageMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/** @internal */
export interface DefinePageRequestContext<TState = EmptyRecord> {
  url: URL;
  req: Request;
  params: Record<string, string | undefined>;
  state: TState;
  isPartial?: boolean;
  data?: unknown;
}

/** @internal */
export interface DefinePageRenderContext<TState = EmptyRecord>
  extends DefinePageRequestContext<TState> {
  render(body: ComponentChildren, init?: ResponseInit): Response;
}

/** @internal */
export interface SchemaParseSuccess<TOutput> {
  success: true;
  data: TOutput;
}

/** @internal */
export interface SchemaParseFailure {
  success: false;
  error?: unknown;
}

/** @internal */
export type SchemaParseResult<TOutput> = SchemaParseSuccess<TOutput> | SchemaParseFailure;

/** @internal */
export interface SchemaLike<TInput = unknown, TOutput = TInput> {
  safeParse(input: TInput): SchemaParseResult<TOutput>;
}

type InferSafeParseOutput<TSchema> = TSchema extends
  { safeParse: (...args: never[]) => infer TResult }
  ? Extract<TResult, SchemaParseSuccess<unknown>> extends SchemaParseSuccess<infer TOutput>
    ? TOutput
  : never
  : never;

/** @internal */
export type InferSchemaOutput<TSchema> = TSchema extends { _output: infer TOutput } ? TOutput
  : [InferSafeParseOutput<TSchema>] extends [never] ? EmptyRecord
  : InferSafeParseOutput<TSchema>;

/** @internal */
export type ResolveSchemaOutput<TCurrent, TSchema> = InferSchemaOutput<TSchema> extends object
  ? InferSchemaOutput<TSchema>
  : TCurrent;

/** @internal */
export type PathParamSchema<TOutput = unknown> = SchemaLike<PathParamInput, TOutput>;
/** @internal */
export type SearchParamSchema<TOutput = unknown> = SchemaLike<SearchParamInput, TOutput>;

/** @internal */
export interface DefinePageTypeState<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> {
  readonly __definePageTypeState: true;
  state: TState;
  resources: TResources;
  path: TPath;
  search: TSearch;
  layerData: TLayerData;
}

/** @internal */
export type AnyDefinePageTypeState = DefinePageTypeState<
  unknown,
  UnknownRecord,
  object,
  object,
  DefinePageLayerMap
>;
/** @internal */
export type DefinePageRootTypeState<TState = EmptyRecord> = DefinePageTypeState<
  TState,
  EmptyRecord,
  EmptyRecord,
  EmptyRecord,
  EmptyRecord
>;

/** @internal */
export type NormalizeDefinePageTypeState<
  TStateOrTypes = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
> = TStateOrTypes extends AnyDefinePageTypeState ? TStateOrTypes
  : DefinePageTypeState<TStateOrTypes, TResources, TPath, TSearch, TLayerData>;

/** @internal */
export type DefinePageStateOf<TTypes extends AnyDefinePageTypeState> = TTypes['state'];
/** @internal */
export type DefinePageResourcesOf<TTypes extends AnyDefinePageTypeState> = TTypes['resources'];
/** @internal */
export type DefinePagePathOf<TTypes extends AnyDefinePageTypeState> = TTypes['path'];
/** @internal */
export type DefinePageSearchOf<TTypes extends AnyDefinePageTypeState> = TTypes['search'];
/** @internal */
export type DefinePageLayerDataOf<TTypes extends AnyDefinePageTypeState> = TTypes['layerData'];

/** @internal */
export interface DefinePageContract<
  TTypes extends AnyDefinePageTypeState = AnyDefinePageTypeState,
> {
  readonly $types: TTypes;
}

/** @internal */
export type DefinePageTypeCarrier = DefinePageContract | {
  readonly $types?: AnyDefinePageTypeState;
};

/** @internal */
export type InferDefinePageTypes<TValue extends DefinePageTypeCarrier> = TValue extends {
  readonly $types: infer TTypes extends AnyDefinePageTypeState;
} ? TTypes
  : TValue extends { readonly $types?: infer TTypes extends AnyDefinePageTypeState } ? TTypes
  : never;

/** @internal */
export type InferDefinePageState<TValue extends DefinePageTypeCarrier> = DefinePageStateOf<
  InferDefinePageTypes<TValue>
>;
/** @internal */
export type InferDefinePageResources<TValue extends DefinePageTypeCarrier> = DefinePageResourcesOf<
  InferDefinePageTypes<TValue>
>;
/** @internal */
export type InferDefinePagePath<TValue extends DefinePageTypeCarrier> = DefinePagePathOf<
  InferDefinePageTypes<TValue>
>;
/** @internal */
export type InferDefinePageSearch<TValue extends DefinePageTypeCarrier> = DefinePageSearchOf<
  InferDefinePageTypes<TValue>
>;
/** @internal */
export type InferDefinePageLayerData<TValue extends DefinePageTypeCarrier> = DefinePageLayerDataOf<
  InferDefinePageTypes<TValue>
>;
/** @internal */
export type InferDefinePageResource<
  TValue extends DefinePageTypeCarrier,
  TKey extends keyof InferDefinePageResources<TValue> & string,
> = InferDefinePageResources<TValue>[TKey];
/** @internal */
export type InferDefinePageLayerProps<
  TValue extends DefinePageTypeCarrier,
  TLayer extends keyof InferDefinePageLayerData<TValue> & string,
> = InferDefinePageLayerData<TValue>[TLayer];
/** @internal */
export type InferDefinePageHasRoute<TValue extends DefinePageTypeCarrier> = TValue extends {
  readonly route: unknown;
} ? true
  : false;
/** @internal */
export type InferDefinePageLayoutSlots<TValue extends DefinePageTypeCarrier> = DefinePageSlotsFor<
  InferDefinePageTypes<TValue>
>;
/** @internal */
export type InferDefinePageLayoutContext<TValue extends DefinePageTypeCarrier> =
  DefinePageLayoutContextBase<InferDefinePageTypes<TValue>, InferDefinePageHasRoute<TValue>>;
/** @internal */
export interface InferDefinePageLayoutProps<TValue extends DefinePageTypeCarrier> {
  readonly slots: InferDefinePageLayoutSlots<TValue>;
  readonly ctx: InferDefinePageLayoutContext<TValue>;
}
/** @internal */
export type InferDefinePageContext<TValue extends DefinePageTypeCarrier> =
  DefinePageRuntimeContextBase<InferDefinePageTypes<TValue>, InferDefinePageHasRoute<TValue>>;

/** @internal */
export type DefinePageWithResource<TTypes extends AnyDefinePageTypeState, K extends string, TOut> =
  DefinePageTypeState<
    DefinePageStateOf<TTypes>,
    Simplify<DefinePageResourcesOf<TTypes> & Record<K, TOut>>,
    DefinePagePathOf<TTypes>,
    DefinePageSearchOf<TTypes>,
    DefinePageLayerDataOf<TTypes>
  >;

/** @internal */
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

/** @internal */
export type DefinePageWithPathParams<TTypes extends AnyDefinePageTypeState, TSchema> =
  DefinePageTypeState<
    DefinePageStateOf<TTypes>,
    DefinePageResourcesOf<TTypes>,
    ResolveSchemaOutput<DefinePagePathOf<TTypes>, TSchema>,
    DefinePageSearchOf<TTypes>,
    DefinePageLayerDataOf<TTypes>
  >;

/** @internal */
export type DefinePageWithSearchParams<TTypes extends AnyDefinePageTypeState, TSchema> =
  DefinePageTypeState<
    DefinePageStateOf<TTypes>,
    DefinePageResourcesOf<TTypes>,
    DefinePagePathOf<TTypes>,
    ResolveSchemaOutput<DefinePageSearchOf<TTypes>, TSchema>,
    DefinePageLayerDataOf<TTypes>
  >;

/** @internal */
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

/** @internal */
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

/** @internal */
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

/** @internal */
export type DefinePageWithForm<
  TTypes extends AnyDefinePageTypeState,
  K extends string,
  TSchema extends z.ZodTypeAny,
> = DefinePageWithLayer<TTypes, K, RuntimeFormState<z.input<TSchema> & FormValues>>;

/** @internal */
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

/** @internal */
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

/** @internal */
export type DefinePageLayerContextBase<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = DefinePageAugmentedContextBase<TTypes, THasRoute>;

/** @internal */
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

/** @internal */
export type DefinePageLayoutContextBase<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = DefinePageAugmentedContextBase<TTypes, THasRoute>;

/** @internal */
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

export type {
  DefinePageBuildOptions,
  DefinePageBuildResult,
  DefinePageBuildResultFor,
  DefinePageDefinition,
  DefinePageDefinitionFor,
  DefinePageFormConfigFor,
  DefinePageHandlers,
  DefinePageHandlersFor,
  DefinePageHeaderResolver,
  DefinePageHeaderResolverFor,
  DefinePageLayerConfig,
  DefinePageLayerConfigFor,
  DefinePageLayerLoader,
  DefinePageLayerLoaderFor,
  DefinePageLayout,
  DefinePageLayoutFor,
  DefinePageMetaDescriptor,
  DefinePageMetaResolver,
  DefinePageMetaResolverFor,
  DefinePageMethodHandler,
  DefinePageMethodHandlerFor,
  DefinePageResourceFactory,
  DefinePageResourceFactoryFor,
  DefinePageRoutedDefinition,
  DefinePageRoutedDefinitionFor,
  DefinePageRouteNav,
  DefinePageRouteNavFor,
  DefinePageRuntimeContextBase,
  DefinePageSlot,
  DefinePageSlots,
  DefinePageSlotsFor,
  InferDefinePageLayerLoaderProps,
  MakeHrefArgs,
  MakeHrefInput,
  ResolveDefinePageLayerLoaderOutput,
} from './catalog.ts';
