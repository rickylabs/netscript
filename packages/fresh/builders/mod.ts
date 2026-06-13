/**
 * Fluent builder entry point for `@netscript/fresh`.
 *
 * Route contracts live on `@netscript/fresh/route`.
 *
 * @module
 */

import { definePage as definePageImpl } from './define-page/builder/mod.tsx';
import {
  definePartial as definePartialImpl,
  defineStatsPartial as defineStatsPartialImpl,
} from './define-partial.tsx';
export type { InferDefinePageLayerLoaderProps } from './define-page/types.ts';
export type {
  CollectionDescriptor,
  CollectionItem,
  CollectionKeyInputProps,
  CollectionKeyMap,
  ControlProps,
  DescriptionProps,
  ErrorFormReplyInit,
  ErrorProps,
  FieldConstraints,
  FieldDescriptor,
  FieldDescriptorMap,
  FormCsrfInputProps,
  FormElementProps,
  FormErrorMessages,
  FormFieldErrors,
  FormFieldPath,
  FormIntent,
  FormIntentResult,
  FormReplyHelpers,
  FormReplyInit,
  FormSubmissionErrorResult,
  FormSubmissionInitialResult,
  FormSubmissionInvalidResult,
  FormSubmissionRedirectResult,
  FormSubmissionResult,
  FormSubmissionSuccessResult,
  FormValues,
  IntentButtonProps,
  InvalidFormReplyInit,
  LabelProps,
  RedirectFormReplyInit,
  RuntimeFormState,
  SuccessFormReplyInit,
} from '../form/types.ts';
import type {
  FormIntent,
  FormIntentResult,
  FormReplyHelpers,
  FormValues,
  RuntimeFormState,
} from '../form/types.ts';

/** Empty object shape used by page builders without typed state. */
export type EmptyRecord = Record<string, never>;

/** Generic object map used by resources and layer registries. */
export type UnknownRecord = Record<string, unknown>;

/** Layer props keyed by layer id. */
export type PageLayerMap = Record<string, object>;

/** Renderable content accepted by builder-owned components, layouts, and slots. */
export type PageRenderable =
  | null
  | undefined
  | boolean
  | number
  | bigint
  | string
  | {
    readonly type?: unknown;
    readonly props?: unknown;
    readonly key?: unknown;
  }
  | readonly PageRenderable[];

/** Minimal component contract accepted by page and partial builders. */
export interface ComponentLike<TProps extends object> {
  /** Render the component with the provided props. */
  (props: TProps): PageRenderable;
}

/** Minimal route config surface emitted by framework partial routes. */
export interface PartialRouteConfig {
  /** Skip the app wrapper for the route. */
  readonly skipAppWrapper?: boolean;
  /** Skip inherited layouts for the route. */
  readonly skipInheritedLayouts?: boolean;
  /** Additional route config keys forwarded to Fresh. */
  readonly [key: string]: unknown;
}

/** Minimal cache-entry shape accepted by page layer loaders. */
export interface PageCacheEntry<T> {
  /** Cached payload. */
  readonly data: T;
  /** Unix epoch timestamp in milliseconds. */
  readonly cachedAt: number;
}

/** Raw path input keyed by dynamic segment name. */
export type PagePathParamInput = Record<string, string | undefined>;

/** Raw search-param value accepted by route helpers. */
export type PageSearchParamValue = string | string[] | undefined;

/** Raw search input keyed by query param name. */
export type PageSearchParamInput = Record<string, PageSearchParamValue>;

/** Success result returned by page-owned schemas. */
export interface PageSchemaParseSuccess<TOutput> {
  /** Always `true` for successful parses. */
  readonly success: true;
  /** Parsed output payload. */
  readonly data: TOutput;
}

/** Failure result returned by page-owned schemas. */
export interface PageSchemaParseFailure {
  /** Always `false` for failed parses. */
  readonly success: false;
  /** Optional parse error from the underlying validator. */
  readonly error?: unknown;
}

/** Result returned by page-owned path and search schemas. */
export type PageSchemaParseResult<TOutput> =
  | PageSchemaParseSuccess<TOutput>
  | PageSchemaParseFailure;

/** Minimal path schema contract accepted by `definePage()`. */
export interface PagePathSchema<TOutput extends object = object> {
  /** Parse raw path params into typed route state. */
  safeParse(input: PagePathParamInput): PageSchemaParseResult<TOutput>;
}

/** Minimal search schema contract accepted by `definePage()`. */
export interface PageSearchSchema<TOutput extends object = object> {
  /** Parse raw search params into typed route state. */
  safeParse(input: PageSearchParamInput): PageSchemaParseResult<TOutput>;
}

/** Link props returned by builder-owned route helpers. */
export interface PageLinkProps {
  /** Generated href. */
  readonly href?: string;
  /** Enables Fresh client navigation. */
  readonly 'f-client-nav'?: boolean;
  /** Optional Fresh partial href. */
  readonly 'f-partial'?: string;
  /** Optional DOM id forwarded to the anchor. */
  readonly id?: string;
  /** Optional CSS class forwarded to the anchor. */
  readonly class?: string;
  /** Optional inline style forwarded to the anchor. */
  readonly style?: string;
  /** Optional title forwarded to the anchor. */
  readonly title?: string;
  /** Optional ARIA current state. */
  readonly 'aria-current'?: string;
  /** Additional forwarded anchor props. */
  readonly [key: string]: unknown;
}

/** Input accepted by builder-owned route href helpers. */
export type PageRouteHrefInput<TPath extends object, TSearch extends object> =
  & ([keyof TPath] extends [never] ? { readonly path?: TPath }
    : TPath extends EmptyRecord ? { readonly path?: TPath }
    : { readonly path: TPath })
  & {
    /** Partial search update applied before generating the href. */
    readonly search?: Partial<TSearch> | ((prev: TSearch) => Partial<TSearch>);
    /** Preserve the current route search state before applying `search`. */
    readonly preserveSearchParams?: boolean;
  };

/** Input accepted by builder-owned bound route link-prop helpers. */
export type PageRouteGetLinkPropsInput<TPath extends object, TSearch extends object> =
  & Omit<PageLinkProps, 'children' | 'href'>
  & PageRouteHrefInput<TPath, TSearch>
  & {
    /** Use history replace semantics. */
    readonly replace?: boolean;
  };

/** Props accepted by builder-owned route link components. */
export type PageRouteLinkComponentProps<TPath extends object, TSearch extends object> =
  & Omit<PageLinkProps, 'href'>
  & PageRouteHrefInput<TPath, TSearch>
  & {
    /** Link contents rendered inside the anchor. */
    readonly children: PageRenderable;
    /** Use history replace semantics. */
    readonly replace?: boolean;
  };

/** Typed route navigation surface exposed by routed pages. */
export interface PageRouteNavigation<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> {
  /** Build a validated href for the route. */
  makeHref(...args: [] | [PageRouteHrefInput<TPath, TSearch>]): string;
}

/** Input accepted by paired page/partial route helpers. */
export type PagePairedRouteHrefInput<
  TPrimaryPath extends object,
  TPrimarySearch extends object,
  TPartialPath extends object,
  TPartialSearch extends object,
> =
  & PageRouteHrefInput<TPrimaryPath, TPrimarySearch>
  & {
    /** Optional path params used only for the partial route. */
    readonly partialPath?: TPartialPath;
    /** Optional search update used only for the partial route. */
    readonly partialSearch?:
      | Partial<TPartialSearch>
      | ((prev: TPartialSearch) => Partial<TPartialSearch>);
    /** Preserve the partial route search params before applying `partialSearch`. */
    readonly partialPreserveSearchParams?: boolean;
  };

/** Link props produced by paired page/partial route helpers. */
export interface PagePartialLinkProps extends PageLinkProps {
  /** Partial href used by Fresh partial navigation. */
  readonly 'f-partial': string;
}

/** Combined page/partial route helper returned by `route.withPartial(...)`. */
export interface PagePairedRouteTarget<
  TPrimaryPath extends object = EmptyRecord,
  TPrimarySearch extends object = EmptyRecord,
  TPartialPath extends object = EmptyRecord,
  TPartialSearch extends object = EmptyRecord,
> {
  /** Primary page route. */
  readonly route: PageRouteReference<TPrimaryPath, TPrimarySearch>;
  /** Partial route refreshed by the page. */
  readonly partialRoute: PageRouteTarget<TPartialPath, TPartialSearch>;
  /** Build the page href for the paired target. */
  href(
    input?: PagePairedRouteHrefInput<TPrimaryPath, TPrimarySearch, TPartialPath, TPartialSearch>,
  ): string;
  /** Build the partial href for the paired target. */
  partialHref(
    input?: PagePairedRouteHrefInput<TPrimaryPath, TPrimarySearch, TPartialPath, TPartialSearch>,
  ): string;
  /** Build anchor props with both `href` and `f-partial`. */
  getLinkProps(
    input: PageRouteGetLinkPropsInput<TPrimaryPath, TPrimarySearch> & {
      readonly partialPath?: TPartialPath;
      readonly partialSearch?:
        | Partial<TPartialSearch>
        | ((prev: TPartialSearch) => Partial<TPartialSearch>);
      readonly partialPreserveSearchParams?: boolean;
    },
  ): PagePartialLinkProps & { readonly href: string };
}

/** Minimal route target accepted by `withRoute()`. */
export interface PageRouteTarget<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> {
  /** Compile-time-only path and search state metadata. */
  readonly $types?: {
    readonly path: TPath;
    readonly search: TSearch;
  };
  /** Fresh route pattern used to build hrefs. */
  readonly routePattern: string;
  /** Optional typed path schema. */
  readonly pathSchema?: PagePathSchema<TPath>;
  /** Optional typed search schema. */
  readonly searchSchema?: PageSearchSchema<TSearch>;
}

/** Minimal route reference accepted by `withRoute()`. */
export interface PageRouteReference<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> extends PageRouteTarget<TPath, TSearch> {
  /** Typed route navigation helper. */
  readonly nav: PageRouteNavigation<TPath, TSearch>;
  /** Static href when the route has no dynamic path params. */
  readonly $href?: string;
  /** Build a validated href for the route. */
  href(...args: [] | [PageRouteHrefInput<TPath, TSearch>]): string;
  /** Build link props for the route. */
  getLinkProps(
    input: PageRouteGetLinkPropsInput<TPath, TSearch>,
  ): PageLinkProps & { readonly href: string };
  /** Parse raw path params into typed route state. */
  parsePath(input: PagePathParamInput): TPath;
  /** Safely parse raw path params into typed route state. */
  safeParsePath(input: PagePathParamInput): PageSchemaParseResult<TPath>;
  /** Parse raw search params into typed route state. */
  parseSearch(input: URLSearchParams | PageSearchParamInput): TSearch;
  /** Safely parse raw search params into typed route state. */
  safeParseSearch(input: URLSearchParams | PageSearchParamInput): PageSchemaParseResult<TSearch>;
  /** Route-bound link component. */
  readonly Link: (props: PageRouteLinkComponentProps<TPath, TSearch>) => PageRenderable;
  /** Pair the page route with a framework partial route. */
  withPartial<TPartialPath extends object, TPartialSearch extends object>(
    partialRoute: PageRouteTarget<TPartialPath, TPartialSearch>,
  ): PagePairedRouteTarget<TPath, TSearch, TPartialPath, TPartialSearch>;
}

/** Minimal error payload accepted by builder-owned partial error components. */
export interface PageErrorPrimitives {
  /** Normalized error payload. */
  readonly error: {
    readonly message: string;
    readonly status: number;
    readonly code?: string;
    readonly type: 'client' | 'server' | 'unknown';
    readonly retry: boolean;
    readonly timestamp: number;
  };
  /** Human-readable title for the error surface. */
  readonly errorTitle: string;
  /** User-facing message shown in the view. */
  readonly errorMessage: string;
  /** Optional machine-readable code. */
  readonly errorCode: string | undefined;
  /** Error classification. */
  readonly errorType: 'client' | 'server' | 'unknown';
  /** HTTP status associated with the error. */
  readonly errorStatus: number;
  /** Unix epoch timestamp in milliseconds. */
  readonly errorTimestamp: number;
  /** Decorative icon chosen for the error severity. */
  readonly errorIcon: string;
  /** Whether retry affordances should be shown. */
  readonly isRetryable: boolean;
  /** Background utility class for the default renderer. */
  readonly bgColor: string;
  /** Border utility class for the default renderer. */
  readonly borderColor: string;
  /** Text utility class for the default renderer. */
  readonly textColor: string;
}

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
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

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

/** HTTP methods accepted by `withHandler()`. */
export type PageMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';

/** Handler function accepted by `withHandler()`. */
export type PageMethodHandler<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  THasRoute extends boolean = false,
> = (
  ctx: PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
) => Response | { data: unknown } | Promise<Response | { data: unknown }>;

/**
 * Extended context exposed to `withForm()` callbacks.
 *
 * Extends the base page context with a `form` namespace that provides access
 * to reply helpers, the parsed intent, raw `FormData`, submission ID, CSRF
 * token, and parsed values.
 *
 * `TOutput` is `unknown` in pre-mutation callbacks (`mutate`, `onIntent`) and
 * fully typed in post-mutation callbacks (`redirectTo`, `onSuccess`,
 * `invalidate`).
 */
export interface PageFormHandlerContext<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  TValues extends FormValues = FormValues,
  TOutput = unknown,
  THasRoute extends boolean = false,
> extends PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute> {
  /** Form-specific values and reply helpers available to form callbacks. */
  readonly form: {
    /** Factory helpers for constructing typed form replies. */
    readonly reply: FormReplyHelpers<TValues, TOutput>;
    /** Parsed form intent, when present. */
    readonly intent: FormIntent | null;
    /** Raw submitted form data. */
    readonly formData: FormData;
    /** Stable submission id. */
    readonly submissionId: string;
    /** CSRF token submitted with the form, when present. */
    readonly csrfToken?: string;
    /** Parsed form values before schema validation completes. */
    readonly values: Partial<TValues>;
  };
}

/**
 * Configuration for the `withForm()` builder method (legacy `PageBuilder`
 * interface).
 *
 * Uses a two-tier context design:
 * - **Pre-mutation** callbacks (`mutate`, `onIntent`) receive their context
 *   with `TOutput = unknown`, keeping the inference site open so TypeScript
 *   can infer `TOutput` from `mutate`'s return type.
 * - **Post-mutation** callbacks (`redirectTo`, `onSuccess`, `invalidate`)
 *   receive `NoInfer<TOutput>`, consuming the inferred type without
 *   widening it.
 *
 * `TOutput` is inferred from the return type of `mutate`. Supplying an
 * explicit generic overrides and enforces the type.
 */
export interface PageFormConfig<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends PageLayerMap = EmptyRecord,
  TSchema = unknown,
  TOutput = unknown,
  THasRoute extends boolean = false,
> {
  /** Schema used for validation and constraint extraction. Inference site for `TSchema`. */
  readonly schema: TSchema;
  /** Resolves initial form values on GET. Merged with schema defaults. */
  readonly initial?: (
    ctx: PageContext<TState, TResources, TPath, TSearch, TLayerData, THasRoute>,
  ) =>
    | Partial<SchemaInput<TSchema, FormValues> & FormValues>
    | Promise<Partial<SchemaInput<TSchema, FormValues> & FormValues>>;
  /** Executes the mutation with validated input. Return type is the sole inference site for `TOutput`. */
  readonly mutate: (
    input: SchemaOutput<TSchema, FormValues>,
    ctx: PageFormHandlerContext<
      TState,
      TResources,
      TPath,
      TSearch,
      TLayerData,
      SchemaInput<TSchema, FormValues> & FormValues,
      unknown,
      THasRoute
    >,
  ) => TOutput | Promise<TOutput>;
  /** Handles non-submit intents (e.g. validate, reset). Short-circuits before validation. */
  readonly onIntent?: (
    intent: FormIntent,
    values: SchemaInput<TSchema, FormValues> & FormValues,
    ctx: PageFormHandlerContext<
      TState,
      TResources,
      TPath,
      TSearch,
      TLayerData,
      SchemaInput<TSchema, FormValues> & FormValues,
      unknown,
      THasRoute
    >,
  ) =>
    | FormIntentResult<SchemaInput<TSchema, FormValues> & FormValues>
    | Promise<
      FormIntentResult<SchemaInput<TSchema, FormValues> & FormValues>
    >;
  /** Redirect target after successful mutation. Takes precedence over `onSuccess`. */
  readonly redirectTo?: (
    output: NoInfer<TOutput>,
    ctx: PageFormHandlerContext<
      TState,
      TResources,
      TPath,
      TSearch,
      TLayerData,
      SchemaInput<TSchema, FormValues> & FormValues,
      NoInfer<TOutput>,
      THasRoute
    >,
  ) => string | Response | Promise<string | Response>;
  /** Success metadata when staying on the same page (message and/or next values). */
  readonly onSuccess?: (
    output: NoInfer<TOutput>,
    ctx: PageFormHandlerContext<
      TState,
      TResources,
      TPath,
      TSearch,
      TLayerData,
      SchemaInput<TSchema, FormValues> & FormValues,
      NoInfer<TOutput>,
      THasRoute
    >,
  ) =>
    | {
      readonly message?: string;
      readonly nextValues?: Partial<SchemaInput<TSchema, FormValues> & FormValues>;
    }
    | Promise<
      {
        readonly message?: string;
        readonly nextValues?: Partial<SchemaInput<TSchema, FormValues> & FormValues>;
      }
    >;
  /** Cache invalidation after mutation, before the response is sent. */
  readonly invalidate?: (
    output: NoInfer<TOutput>,
    ctx: PageFormHandlerContext<
      TState,
      TResources,
      TPath,
      TSearch,
      TLayerData,
      SchemaInput<TSchema, FormValues> & FormValues,
      NoInfer<TOutput>,
      THasRoute
    >,
  ) => void | Promise<void>;
  /** CSRF protection toggle. Defaults to `true`. */
  readonly csrf?: boolean;
  /** HTTP method for the form submission. Defaults to `POST`. */
  readonly method?: 'POST' | 'PUT' | 'PATCH';
  /** Telemetry span prefix. Defaults to `form.{id}`. */
  readonly spanName?: string;
}

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

/** Materialized partial route contract returned by `definePartial()`. */
export interface DefinedPartialRoute<TContext, THandler = undefined> {
  /** Fresh route config for the partial. */
  readonly config: PartialRouteConfig;
  /** Optional Fresh handler attached to the partial route. */
  readonly handler?: THandler;
  /** Page renderer for the partial route. */
  readonly page: (ctx: TContext) => Promise<unknown>;
  /** Default export-compatible page renderer. */
  readonly default: (ctx: TContext) => Promise<unknown>;
}

/** Options for creating a framework-owned partial route. */
export interface DefinePartialOptions<TProps extends object, TContext, THandler = undefined> {
  /** Stable Fresh partial name rendered into the response. */
  readonly name: string;
  /** Async loader producing the component props. */
  readonly loader: (ctx: TContext) => Promise<TProps>;
  /** Display component rendered inside the partial. */
  readonly component: ComponentLike<TProps>;
  /** Optional error component rendered inside the default error shell. */
  readonly errorComponent?: ComponentLike<PageErrorPrimitives>;
  /** Optional override for the default partial error title. */
  readonly errorTitle?: string;
  /** Optional Fresh handler attached to the partial route. */
  readonly handler?: THandler;
  /** Optional Fresh route config merged with the framework defaults. */
  readonly config?: PartialRouteConfig;
}

/** Options for creating a stats-only partial route. */
export interface DefineStatsPartialOptions<TProps extends object, TContext, THandler = undefined>
  extends Omit<DefinePartialOptions<TProps, TContext, THandler>, 'loader'> {
  /** Async query that resolves the stats payload. */
  readonly query: () => Promise<TProps>;
}

/**
 * Start a new typed page builder chain.
 *
 * @returns A fluent builder for assembling a Fresh page module.
 *
 * @example
 * ```ts
 * import { definePage } from "@netscript/fresh/builders";
 *
 * const page = definePage()
 *   .withLayout(() => "ready")
 *   .build();
 * ```
 */
export function definePage<TState = EmptyRecord>(): PageRootBuilder<TState> {
  return definePageImpl<TState>() as unknown as PageRootBuilder<TState>;
}

/**
 * Define a framework-owned partial route backed by an async loader.
 *
 * @param options - Partial route configuration.
 * @returns A Fresh route module contract for the partial.
 */
export function definePartial<TProps extends object, TContext, THandler = undefined>(
  options: DefinePartialOptions<TProps, TContext, THandler>,
): DefinedPartialRoute<TContext, THandler> {
  return definePartialImpl(options as unknown as never) as unknown as DefinedPartialRoute<
    TContext,
    THandler
  >;
}

/**
 * Define a stats-only partial route backed by a context-free query function.
 *
 * @param options - Partial route configuration.
 * @returns A Fresh route module contract for the partial.
 */
export function defineStatsPartial<TProps extends object, TContext, THandler = undefined>(
  options: DefineStatsPartialOptions<TProps, TContext, THandler>,
): DefinedPartialRoute<TContext, THandler> {
  return defineStatsPartialImpl(options as unknown as never) as unknown as DefinedPartialRoute<
    TContext,
    THandler
  >;
}
