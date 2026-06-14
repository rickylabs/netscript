import type { CachedEntry as CacheEntryLike } from '@netscript/sdk/ports';
import type { ComponentChildren, ComponentType, JSX } from 'preact';
import type { z } from 'zod';
import type { DeferPolicyInput, DeferPolicyProfile } from '../../defer/policy.ts';
import type { FormConfig } from '../../form/runtime/config.ts';
import type {
  AnyDefinePageTypeState,
  DefinePageAugmentedContextBase,
  DefinePageLayerContextBase,
  DefinePageLayerDataOf,
  DefinePageLayerDelivery,
  DefinePageLayerMap,
  DefinePageLayerProps,
  DefinePageLayoutContextBase,
  DefinePageMethod,
  DefinePagePathOf,
  DefinePageRenderContext,
  DefinePageRequestContext,
  DefinePageRouteFor,
  DefinePageSearchOf,
  DefinePageStateOf,
  EmptyRecord,
  HasPathParams,
  NormalizeDefinePageTypeState,
  UnknownRecord,
  ValidatedRouteHref,
} from './types.ts';
import type { DefinePageHooks } from './navigation/mod.ts';

/** @internal */
export type DefinePageResourceFactoryFor<
  TTypes extends AnyDefinePageTypeState,
  TOut,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayerContextBase<TTypes, THasRoute>,
) => TOut | Promise<TOut>;

/** @internal */
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

/** @internal */
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

/** @internal */
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
/** @internal */
export type ResolveDefinePageLayerLoaderOutput<TOutput> = TOutput extends
  CacheEntryLike<infer TProps> ? TProps
  : Exclude<TOutput, null | undefined>;

/** Infer the layer props produced by a page layer loader function. */
/** @internal */
export type InferDefinePageLayerLoaderProps<TLoader extends (...args: never[]) => unknown> =
  Awaited<ReturnType<TLoader>> extends { readonly data: infer TProps }
    ? TProps extends object ? TProps : never
    : Exclude<Awaited<ReturnType<TLoader>>, null | undefined> extends infer TProps extends object
      ? TProps
    : never;

/** @internal */
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

/** @internal */
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

/** @internal */
export type MakeHrefInput<TPath extends object, TSearch extends object> =
  HasPathParams<TPath> extends true ? { path: TPath; search?: Partial<TSearch> }
    : { path?: TPath; search?: Partial<TSearch> };

/** @internal */
export type MakeHrefArgs<TPath extends object, TSearch extends object> =
  HasPathParams<TPath> extends true ? [input: MakeHrefInput<TPath, TSearch>]
    : [input?: MakeHrefInput<TPath, TSearch>];

/** @internal */
export interface DefinePageRouteNav<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> {
  makeHref(...args: MakeHrefArgs<TPath, TSearch>): ValidatedRouteHref;
}

/** @internal */
export type DefinePageRouteNavFor<TTypes extends AnyDefinePageTypeState> = DefinePageRouteNav<
  DefinePagePathOf<TTypes>,
  DefinePageSearchOf<TTypes>
>;

/** @internal */
export interface DefinePageBuildOptions {
  routePattern?: string;
}

/** @internal */
export type DefinePageMethodHandlerFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayerContextBase<TTypes, THasRoute>,
) => Response | { data: unknown } | Promise<Response | { data: unknown }>;

/** @internal */
export type DefinePageFormConfigFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
  TSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput = unknown,
> = FormConfig<TTypes, THasRoute, TSchema, TOutput>;

/** @internal */
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

/** @internal */
export type DefinePageSlot<TProps extends DefinePageLayerProps> = (() => JSX.Element | null) & {
  data?: TProps;
};

/** @internal */
export type DefinePageSlots<TLayerData extends DefinePageLayerMap> = {
  [K in keyof TLayerData]: DefinePageSlot<TLayerData[K]>;
};

/** @internal */
export type DefinePageSlotsFor<TTypes extends AnyDefinePageTypeState> = DefinePageSlots<
  DefinePageLayerDataOf<TTypes>
>;

/** @internal */
export type DefinePageRuntimeContextBase<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = DefinePageAugmentedContextBase<TTypes, THasRoute> & {
  slots: DefinePageSlotsFor<TTypes>;
};

/** @internal */
export interface DefinePageMetaDescriptor {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  robots?: string;
  meta?: Array<{ name?: string; property?: string; content: string }>;
  links?: Array<{ rel: string; href: string; title?: string; type?: string }>;
  jsonLd?: unknown | unknown[];
}

/** @internal */
export type DefinePageMetaResolverFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayoutContextBase<TTypes, THasRoute>,
) => DefinePageMetaDescriptor | Promise<DefinePageMetaDescriptor>;

/** @internal */
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

/** @internal */
export type DefinePageHeaderResolverFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  ctx: DefinePageLayoutContextBase<TTypes, THasRoute>,
) => HeadersInit | Promise<HeadersInit>;

/** @internal */
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

/** @internal */
export type DefinePageLayoutFor<
  TTypes extends AnyDefinePageTypeState,
  THasRoute extends boolean = false,
> = (
  slots: DefinePageSlotsFor<TTypes>,
  ctx: DefinePageLayoutContextBase<TTypes, THasRoute>,
) => ComponentChildren;

/** @internal */
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

/** @internal */
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

/** @internal */
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

/** @internal */
export interface DefinePageDefinitionFor<TTypes extends AnyDefinePageTypeState> {
  readonly $types?: TTypes;
  page: (ctx: DefinePageRequestContext<DefinePageStateOf<TTypes>>) => Promise<JSX.Element>;
  readonly default: (
    ctx: DefinePageRequestContext<DefinePageStateOf<TTypes>>,
  ) => Promise<JSX.Element>;
  handler?: DefinePageHandlersFor<TTypes>;
}

/** @internal */
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

/** @internal */
export interface DefinePageRoutedDefinitionFor<TTypes extends AnyDefinePageTypeState>
  extends DefinePageDefinitionFor<TTypes> {
  readonly nav: DefinePageRouteNavFor<TTypes>;
  readonly route: DefinePageRouteFor<TTypes>;
  readonly hooks: DefinePageHooks<DefinePageRoutedDefinitionFor<TTypes>>;
}

/** @internal */
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

/** @internal */
export type DefinePageBuildResultFor<TBuildOptions, TTypes extends AnyDefinePageTypeState> =
  TBuildOptions extends string | { routePattern: string } ? DefinePageRoutedDefinitionFor<TTypes>
    : DefinePageDefinitionFor<TTypes>;

/** @internal */
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
