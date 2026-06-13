import type { ComponentType } from 'preact';
import { z } from 'zod';
import type { RuntimeFormState } from '../../../form/types.ts';
import type { TypedRouteTarget } from '../navigation.tsx';
import type { ResourceFactoryMap, RuntimePageConfig } from '../internal.ts';
import type {
  AnyDefinePageTypeState,
  DefinePageBuildOptions,
  DefinePageBuildResultFor,
  DefinePageDefinitionFor,
  DefinePageFormConfigFor,
  DefinePageHeaderResolverFor,
  DefinePageLayerConfigFor,
  DefinePageLayerLoaderFor,
  DefinePageLayerProps,
  DefinePageLayoutFor,
  DefinePageMetaResolverFor,
  DefinePageMethod,
  DefinePageMethodHandlerFor,
  DefinePageResourceFactoryFor,
  DefinePageRootTypeState,
  DefinePageRoutedDefinitionFor,
  DefinePageRouteNavFor,
  DefinePageTelemetryConfig,
  DefinePageWithForm,
  DefinePageWithLayer,
  DefinePageWithParams,
  DefinePageWithPathParams,
  DefinePageWithResource,
  DefinePageWithResources,
  DefinePageWithRoute,
  DefinePageWithSearchParams,
  EmptyRecord,
  PathParamSchema,
  SearchParamSchema,
} from '../types.ts';

/** Input values inferred from the schema used by a page form. */
export type FormSchemaInput<TSchema extends z.ZodTypeAny> = z.input<TSchema> & object;

/** Fluent definition-time builder for page contracts. */
export interface DefinePageBuilder<
  TTypes extends AnyDefinePageTypeState = DefinePageRootTypeState,
  THasConfiguredRoute extends boolean = false,
> {
  /**
   * Compile-time-only type carrier for inference helpers.
   * This property is not part of the meaningful runtime builder surface.
   */
  readonly $types?: TTypes;

  /** Register a request-scoped resource factory. */
  withResource<K extends string, TOut>(
    key: K,
    factory: DefinePageResourceFactoryFor<TTypes, TOut, THasConfiguredRoute>,
  ): DefinePageBuilder<DefinePageWithResource<TTypes, K, TOut>, THasConfiguredRoute>;

  /** Register multiple request-scoped resource factories. */
  withResources<TFactories extends ResourceFactoryMap<TTypes, THasConfiguredRoute>>(
    factories: TFactories,
  ): DefinePageBuilder<DefinePageWithResources<TTypes, TFactories>, THasConfiguredRoute>;

  /** Register path and search parameter schemas together. */
  withParams<TPathSchema, TSearchSchema>(
    schemas: {
      path?: TPathSchema & PathParamSchema;
      search?: TSearchSchema & SearchParamSchema;
    },
  ): DefinePageBuilder<
    DefinePageWithParams<TTypes, TPathSchema, TSearchSchema>,
    THasConfiguredRoute
  >;

  /** Register a path parameter schema. */
  withPathParams<TSchema>(
    schema: TSchema & PathParamSchema,
  ): DefinePageBuilder<DefinePageWithPathParams<TTypes, TSchema>, THasConfiguredRoute>;

  /** Register a search parameter schema. */
  withSearchParams<TSchema>(
    schema: TSchema & SearchParamSchema,
  ): DefinePageBuilder<DefinePageWithSearchParams<TTypes, TSchema>, THasConfiguredRoute>;

  /** Bind the page to a generated typed route target. */
  withRoute<TRoute extends TypedRouteTarget<object, object>>(
    route: TRoute,
  ): DefinePageBuilder<DefinePageWithRoute<TTypes, TRoute>, true>;

  /** Configure default deferred layer policy. */
  withPolicy(
    policy: RuntimePageConfig<TTypes>['policy'],
  ): DefinePageBuilder<TTypes, THasConfiguredRoute>;

  /** Configure page telemetry. */
  withTelemetry(
    telemetry: DefinePageTelemetryConfig,
  ): DefinePageBuilder<TTypes, THasConfiguredRoute>;

  /** Register a render layer for the page. */
  withLayer<K extends string, TProps extends DefinePageLayerProps = EmptyRecord>(
    id: K,
    component: ComponentType<TProps>,
    config?:
      | DefinePageLayerConfigFor<TTypes, TProps, THasConfiguredRoute>
      | DefinePageLayerLoaderFor<TTypes, TProps, THasConfiguredRoute>,
  ): DefinePageBuilder<DefinePageWithLayer<TTypes, K, TProps>, THasConfiguredRoute>;

  /**
   * Register a route-bound form as a typed layer in the page pipeline.
   *
   * Creates a layer, method handler, CSRF headers, and form metadata in a
   * single step.
   */
  withForm<
    K extends string,
    TSchema extends z.ZodTypeAny,
    TOutput = unknown,
  >(
    id: K,
    component: ComponentType<RuntimeFormState<FormSchemaInput<TSchema>>>,
    config: DefinePageFormConfigFor<TTypes, THasConfiguredRoute, TSchema, TOutput>,
  ): DefinePageBuilder<DefinePageWithForm<TTypes, K, TSchema>, THasConfiguredRoute>;

  /** Register a page method handler. */
  withHandler(
    method: DefinePageMethod,
    handler: DefinePageMethodHandlerFor<TTypes, THasConfiguredRoute>,
  ): DefinePageBuilder<TTypes, THasConfiguredRoute>;

  /** Register a page layout. */
  withLayout(
    layout: DefinePageLayoutFor<TTypes, THasConfiguredRoute>,
  ): DefinePageBuilder<TTypes, THasConfiguredRoute>;

  /** Register page metadata. */
  withMeta(
    resolver: DefinePageMetaResolverFor<TTypes, THasConfiguredRoute>,
  ): DefinePageBuilder<TTypes, THasConfiguredRoute>;

  /** Register a static response header. */
  withHeader(name: string, value: string): DefinePageBuilder<TTypes, THasConfiguredRoute>;
  /** Register response headers from a HeadersInit value. */
  withHeader(headers: HeadersInit): DefinePageBuilder<TTypes, THasConfiguredRoute>;
  /** Register a response header resolver. */
  withHeader(
    resolver: DefinePageHeaderResolverFor<TTypes, THasConfiguredRoute>,
  ): DefinePageBuilder<TTypes, THasConfiguredRoute>;

  /** Register the response status code. */
  withStatus(status: number): DefinePageBuilder<TTypes, THasConfiguredRoute>;

  /** Mark this page as streaming-capable. */
  withStreaming(): DefinePageBuilder<TTypes, THasConfiguredRoute>;

  /** Create typed navigation helpers for the page route. */
  createNav(routePattern?: string): DefinePageRouteNavFor<TTypes>;

  /** Build an unbound or previously routed page definition. */
  build(): THasConfiguredRoute extends true ? DefinePageRoutedDefinitionFor<TTypes>
    : DefinePageDefinitionFor<TTypes>;
  /** Build a page definition bound to a route pattern. */
  build(routePattern: string): DefinePageRoutedDefinitionFor<TTypes>;
  /** Build using explicit options. */
  build<TBuildOptions extends DefinePageBuildOptions>(
    options: TBuildOptions,
  ): DefinePageBuildResultFor<TBuildOptions, TTypes>;
}

/** Root page builder returned by `definePage()`. */
export interface DefinePageRootBuilder<TState = EmptyRecord>
  extends DefinePageBuilder<DefinePageRootTypeState<TState>, false> {}
