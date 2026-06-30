/** Fluent builder compatibility types.
 *
 * @module
 */

import type { FormValues, RuntimeFormState } from '../../../form/runtime/types.ts';
import type { ComponentLike, EmptyRecord, PageLayerMap, UnknownRecord } from './shared-types.ts';
import type {
  PageBuildOptions,
  PageDefinition,
  PageHeaderResolver,
  PageLayout,
  PageMetaResolver,
  RoutedPageDefinition,
} from './definition-types.ts';
import type {
  PageDeferPolicyInput,
  PageDeferPolicyProfile,
  PageLayerConfig,
  PageLayerLoader,
  PageResourceFactory,
  PageRoutePath,
  PageRouteSearch,
  PageTelemetryConfig,
  SchemaInput,
  SchemaOutput,
  Simplify,
} from './context-types.ts';
import type { PageFormConfig, PageMethod, PageMethodHandler } from './form-types.ts';
import type {
  PagePathSchema,
  PageRouteNavigation,
  PageRouteTarget,
  PageSearchSchema,
} from './route-types.ts';

/** Public fluent page builder surface. */
export interface PageBuilder<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  THasRoute extends boolean = false,
> {
  /** Add a single named resource to the page pipeline. */
  withResource<K extends string, TOut>(
    key: K,
    factory: PageResourceFactory<TState, TResources, TPath, TSearch, TLayerData, TOut, THasRoute>,
  ): PageBuilder<
    TState,
    Simplify<TResources & Record<K, Awaited<TOut>>>,
    TPath,
    TSearch,
    TLayerData,
    THasRoute
  >;
  /** Add multiple named resources to the page pipeline. */
  withResources<
    TFactories extends Record<
      string,
      PageResourceFactory<TState, TResources, TPath, TSearch, TLayerData, unknown, THasRoute>
    >,
  >(
    factories: TFactories,
  ): PageBuilder<
    TState,
    Simplify<TResources & { [K in keyof TFactories]: Awaited<ReturnType<TFactories[K]>> }>,
    TPath,
    TSearch,
    TLayerData,
    THasRoute
  >;
  /** Apply both path and search schemas in one step. */
  withParams<
    TPathSchema extends PagePathSchema<object> | undefined = undefined,
    TSearchSchema extends PageSearchSchema<object> | undefined = undefined,
  >(
    schemas: { readonly path?: TPathSchema; readonly search?: TSearchSchema },
  ): PageBuilder<
    TState,
    TResources,
    SchemaOutput<TPathSchema, TPath>,
    SchemaOutput<TSearchSchema, TSearch>,
    TLayerData,
    THasRoute
  >;
  /** Apply a typed path schema to the page. */
  withPathParams<TSchema extends PagePathSchema<object>>(
    schema: TSchema,
  ): PageBuilder<TState, TResources, SchemaOutput<TSchema, TPath>, TSearch, TLayerData, THasRoute>;
  /** Apply a typed search schema to the page. */
  withSearchParams<TSchema extends PageSearchSchema<object>>(
    schema: TSchema,
  ): PageBuilder<TState, TResources, TPath, SchemaOutput<TSchema, TSearch>, TLayerData, THasRoute>;
  /** Bind the page to a generated route reference. */
  withRoute<TRoute extends PageRouteTarget<object, object>>(
    route: TRoute,
  ): PageBuilder<
    TState,
    TResources,
    PageRoutePath<TRoute>,
    PageRouteSearch<TRoute>,
    TLayerData,
    true
  >;
  /**
   * Bind the page to a route using an inline route contract.
   *
   * The NetScript Vite plugin inserts the `$route` pattern from the page
   * module's path during codegen; authors write only the schema body.
   */
  withRouteContract<
    TPathSchema extends PagePathSchema<object> | undefined = undefined,
    TSearchSchema extends PageSearchSchema<object> | undefined = undefined,
  >(
    contract: {
      readonly $route?: string;
      readonly pathSchema?: TPathSchema;
      readonly searchSchema?: TSearchSchema;
    },
  ): PageBuilder<
    TState,
    TResources,
    SchemaOutput<TPathSchema, TPath>,
    SchemaOutput<TSearchSchema, TSearch>,
    TLayerData,
    true
  >;
  /** Configure defer policy defaults for the page. */
  withPolicy(
    policy: PageDeferPolicyInput | PageDeferPolicyProfile,
  ): PageBuilder<TState, TResources, TPath, TSearch, TLayerData, THasRoute>;
  /** Configure telemetry metadata for the page. */
  withTelemetry(
    telemetry: PageTelemetryConfig,
  ): PageBuilder<TState, TResources, TPath, TSearch, TLayerData, THasRoute>;
  /** Register a render layer for the page. */
  withLayer<K extends string, TProps extends object = EmptyRecord>(
    id: K,
    component: ComponentLike<TProps>,
    config?:
      | PageLayerConfig<TState, TResources, TPath, TSearch, TLayerData, TProps, THasRoute>
      | PageLayerLoader<TState, TResources, TPath, TSearch, TLayerData, TProps, THasRoute>,
  ): PageBuilder<
    TState,
    TResources,
    TPath,
    TSearch,
    Simplify<TLayerData & Record<K, TProps>>,
    THasRoute
  >;
  /**
   * Registers a route-bound form as a typed layer.
   *
   * Creates a layer, method handler, CSRF headers, and form metadata for
   * the given form identifier. All generics (`K`, `TSchema`, `TOutput`)
   * are auto-inferred; explicit generics override and enforce.
   *
   * @param id        Unique form layer identifier.
   * @param component Component receiving {@link RuntimeFormState} props.
   * @param config    Form configuration — see {@link PageFormConfig}.
   */
  withForm<K extends string, TSchema, TOutput = unknown>(
    id: K,
    component: ComponentLike<RuntimeFormState<SchemaInput<TSchema, FormValues> & FormValues>>,
    config: PageFormConfig<
      TState,
      TResources,
      TPath,
      TSearch,
      TLayerData,
      TSchema,
      TOutput,
      THasRoute
    >,
  ): PageBuilder<
    TState,
    TResources,
    TPath,
    TSearch,
    Simplify<
      TLayerData & Record<K, RuntimeFormState<SchemaInput<TSchema, FormValues> & FormValues>>
    >,
    THasRoute
  >;
  /** Register a page method handler. */
  withHandler(
    method: PageMethod,
    handler: PageMethodHandler<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
  ): PageBuilder<TState, TResources, TPath, TSearch, TLayerData, THasRoute>;
  /** Register the page layout. */
  withLayout(
    layout: PageLayout<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
  ): PageBuilder<TState, TResources, TPath, TSearch, TLayerData, THasRoute>;
  /** Register the page metadata resolver. */
  withMeta(
    resolver: PageMetaResolver<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
  ): PageBuilder<TState, TResources, TPath, TSearch, TLayerData, THasRoute>;
  /** Append one static header to the built page. */
  withHeader(
    name: string,
    value: string,
  ): PageBuilder<TState, TResources, TPath, TSearch, TLayerData, THasRoute>;
  /** Append a static header map to the built page. */
  withHeader(
    headers: HeadersInit,
  ): PageBuilder<TState, TResources, TPath, TSearch, TLayerData, THasRoute>;
  /** Append computed headers to the built page. */
  withHeader(
    resolver: PageHeaderResolver<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
  ): PageBuilder<TState, TResources, TPath, TSearch, TLayerData, THasRoute>;
  /** Set the default HTTP status code for Fresh `GET` rendering. */
  withStatus(
    status: number,
  ): PageBuilder<TState, TResources, TPath, TSearch, TLayerData, THasRoute>;
  /** Enable builder-owned HTML streaming for `delivery: 'stream'` layers. */
  withStreaming(): PageBuilder<TState, TResources, TPath, TSearch, TLayerData, THasRoute>;
  /** Create typed route navigation for the page. */
  createNav(routePattern?: string): PageRouteNavigation<TPath, TSearch>;
  /** Build the page definition without an explicit route pattern. */
  build(): THasRoute extends true
    ? RoutedPageDefinition<TState, TResources, TPath, TSearch, TLayerData>
    : PageDefinition<TState, TResources, TPath, TSearch, TLayerData>;
  /** Build the page definition for the supplied route pattern. */
  build(routePattern: string): RoutedPageDefinition<TState, TResources, TPath, TSearch, TLayerData>;
  /** Build the page definition for the supplied build options. */
  build<TBuildOptions extends PageBuildOptions>(
    options: TBuildOptions,
  ): TBuildOptions extends { routePattern: string }
    ? RoutedPageDefinition<TState, TResources, TPath, TSearch, TLayerData>
    : THasRoute extends true ? RoutedPageDefinition<TState, TResources, TPath, TSearch, TLayerData>
    : PageDefinition<TState, TResources, TPath, TSearch, TLayerData>;
}

/** Root page builder returned by `definePage()`. */
export interface PageRootBuilder<TState = EmptyRecord>
  extends PageBuilder<TState, EmptyRecord, EmptyRecord, EmptyRecord, EmptyRecord, false> {}
