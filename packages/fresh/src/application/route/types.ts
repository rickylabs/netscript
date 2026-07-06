/**
 * Public route contract types for `@netscript/fresh`.
 *
 * @module
 */

export type * from './pagination-types.ts';

/** Empty object shape used by route helpers without typed params. */
export type EmptyRecord = Record<string, never>;

/**
 * `EmptySegment` is intentionally the empty object type — it tells TypeScript
 * "no extra properties contributed by this segment" without dragging the
 * `[k: string]: never` index signature that `EmptyRecord` carries (which
 * would collapse intersections in `InferRoutePatternPathSegments` to
 * `never`).
 */
// deno-lint-ignore ban-types
export type EmptySegment = {};

/** Primitive search-param value accepted by route helpers. */
export type SearchParamValue = string | string[] | undefined;

/** Raw path input keyed by dynamic segment name. */
export type PathParamInput = Record<string, string | undefined>;

/** Raw search input keyed by query param name. */
export type SearchParamInput = Record<string, SearchParamValue>;

/** Successful schema parse result. */
export interface SchemaParseSuccess<TOutput> {
  /** Always `true` for successful parses. */
  readonly success: true;
  /** Parsed and normalized data. */
  readonly data: TOutput;
}

/** Failed schema parse result. */
export interface SchemaParseFailure {
  /** Always `false` for failed parses. */
  readonly success: false;
  /** Optional parse error from the underlying validator. */
  readonly error?: unknown;
}

/** Result returned by route path and search schemas. */
export type SchemaParseResult<TOutput> = SchemaParseSuccess<TOutput> | SchemaParseFailure;

/** Minimal schema contract accepted for route path params. */
export interface PathParamSchema<TOutput extends object = object> {
  /**
   * Parse raw path params into a typed object.
   *
   * @param input - Raw Fresh path params.
   * @returns A success or failure result.
   */
  safeParse(input: PathParamInput): SchemaParseResult<TOutput>;
}

/** Minimal schema contract accepted for route search params. */
export interface SearchParamSchema<TOutput extends object = object> {
  /**
   * Parse raw search params into a typed object.
   *
   * @param input - Raw search params.
   * @returns A success or failure result.
   */
  safeParse(input: SearchParamInput): SchemaParseResult<TOutput>;
}

/** Stable href string returned by validated route navigation helpers. */
export type ValidatedRouteHref = string;

/** Input used when partially updating typed search state. */
export type RouteSearchUpdate<TSearch extends object> =
  | Partial<TSearch>
  | ((prev: TSearch) => Partial<TSearch>);

/** Fresh-compatible anchor attributes returned by route helpers. */
export interface FreshLinkAttributes {
  /** Generated href for the route. */
  readonly href?: string;
  /** Enables Fresh client navigation for the link. */
  readonly 'f-client-nav'?: boolean;
  /** Optional class attribute forwarded to the anchor. */
  readonly class?: string;
  /** Optional inline style forwarded to the anchor. */
  readonly style?: string;
  /** Optional current-page marker. */
  readonly 'aria-current'?: string;
  /** Additional anchor attributes forwarded as-is. */
  readonly [key: string]: unknown;
}

/** Fresh-compatible partial link attributes returned by paired routes. */
export interface FreshPartialLinkAttributes extends FreshLinkAttributes {
  /** Partial href used by Fresh partial navigation. */
  'f-partial'?: string;
}

/**
 * Infer typed path params directly from a Fresh route pattern.
 *
 * @example
 * ```ts
 * type Params = InferRoutePatternPath<"/orders/[id]">;
 * // { id: string }
 * ```
 */
export type InferRoutePatternPath<TRoutePattern extends string> = InferRoutePatternPathSegments<
  StripLeadingSlash<TRoutePattern>
>;

/** Strip a leading slash from a Fresh route pattern. */
export type StripLeadingSlash<TPattern extends string> = TPattern extends `/${infer TRest}` ? TRest
  : TPattern;

/** Infer one typed path segment from a Fresh route pattern segment. */
export type InferRoutePatternSegment<TSegment extends string> = TSegment extends
  `[[...${infer TParam}]]` ? { [TKey in TParam]?: readonly string[] }
  : TSegment extends `[...${infer TParam}]` ? { [TKey in TParam]: readonly string[] }
  : TSegment extends `[${infer TParam}]` ? { [TKey in TParam]: string }
  : EmptySegment;

/** Infer typed path params from the stripped Fresh route pattern. */
export type InferRoutePatternPathSegments<TPattern extends string> = TPattern extends ''
  ? EmptyRecord
  : TPattern extends `${infer TSegment}/${infer TRest}`
    ? InferRoutePatternSegment<TSegment> & InferRoutePatternPathSegments<TRest> & EmptySegment
  : InferRoutePatternSegment<TPattern>;

/**
 * Public type carrier used by route contracts and route references.
 */
export interface RouteContractTypeCarrier<
  TPath extends object = object,
  TSearch extends object = object,
> {
  /** Compile-time-only path and search state metadata. */
  readonly $types?: {
    readonly path: TPath;
    readonly search: TSearch;
  };
}

/**
 * Infer the typed path state carried by a route contract or route reference.
 */
export type InferRouteContractPath<TValue extends RouteContractTypeCarrier> = NonNullable<
  TValue['$types']
>['path'];

/**
 * Infer the typed search state carried by a route contract or route reference.
 */
export type InferRouteContractSearch<TValue extends RouteContractTypeCarrier> = NonNullable<
  TValue['$types']
>['search'];

/** Input accepted by `route.nav.makeHref()`. */
export type RouteHrefInput<TPath extends object, TSearch extends object> =
  & RoutePathInput<TPath>
  & {
    /** Partial search update applied before generating the href. */
    readonly search?: RouteSearchUpdate<TSearch>;
    /** Preserve the current route search params before applying `search`. */
    readonly preserveSearchParams?: boolean;
  };

/** Path input accepted by route href builders. */
export type RoutePathInput<TPath extends object> = [keyof TPath] extends [never]
  ? { readonly path?: TPath }
  : TPath extends EmptyRecord ? { readonly path?: TPath }
  : { readonly path: TPath };

/** Variadic args accepted by route href builders. */
export type RouteHrefArgs<TPath extends object, TSearch extends object> = [keyof TPath] extends
  [never] ? [input?: RouteHrefInput<TPath, TSearch>]
  : TPath extends EmptyRecord ? [input?: RouteHrefInput<TPath, TSearch>]
  : [input: RouteHrefInput<TPath, TSearch>];

/** Input accepted by `route.getLinkProps()`. */
export type RouteLinkPropsInput<TPath extends object, TSearch extends object> =
  & Omit<FreshLinkAttributes, 'children' | 'href'>
  & RouteHrefInput<TPath, TSearch>
  & {
    /** Use history replace semantics for the generated link. */
    readonly replace?: boolean;
  };

/** Props accepted by the route-bound Fresh link component. */
export type RouteLinkComponentProps<TPath extends object, TSearch extends object> =
  & Omit<FreshLinkAttributes, 'href'>
  & RouteHrefInput<TPath, TSearch>
  & {
    /** Link contents rendered inside the anchor. */
    readonly children: unknown;
    /** Use history replace semantics for the generated link. */
    readonly replace?: boolean;
  };

/** Input accepted by paired page/partial route helpers. */
export type PairedRouteHrefInput<
  TPrimaryPath extends object,
  TPrimarySearch extends object,
  TPartialPath extends object,
  TPartialSearch extends object,
> =
  & RouteHrefInput<TPrimaryPath, TPrimarySearch>
  & {
    /** Optional path params used only for the partial route. */
    readonly partialPath?: TPartialPath;
    /** Optional search update used only for the partial route. */
    readonly partialSearch?: RouteSearchUpdate<TPartialSearch>;
    /** Preserve the partial route search params before applying `partialSearch`. */
    readonly partialPreserveSearchParams?: boolean;
  };

/** Input accepted by paired-route `getLinkProps()`. */
export type PairedRouteLinkPropsInput<
  TPrimaryPath extends object,
  TPrimarySearch extends object,
  TPartialPath extends object,
  TPartialSearch extends object,
> =
  & Omit<FreshPartialLinkAttributes, 'children' | 'href' | 'f-partial'>
  & PairedRouteHrefInput<TPrimaryPath, TPrimarySearch, TPartialPath, TPartialSearch>;

/** Variadic args accepted by paired route href builders. */
export type PairedRouteHrefArgs<
  TPrimaryPath extends object,
  TPrimarySearch extends object,
  TPartialPath extends object,
  TPartialSearch extends object,
> = [keyof TPrimaryPath] extends [never]
  ? [input?: PairedRouteHrefInput<TPrimaryPath, TPrimarySearch, TPartialPath, TPartialSearch>]
  : TPrimaryPath extends EmptyRecord
    ? [input?: PairedRouteHrefInput<TPrimaryPath, TPrimarySearch, TPartialPath, TPartialSearch>]
  : [input: PairedRouteHrefInput<TPrimaryPath, TPrimarySearch, TPartialPath, TPartialSearch>];

/** Minimal typed route navigation API exposed to consumers. */
export interface RouteNavigation<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> {
  /**
   * Build a validated href for the route.
   *
   * @param args - Optional path and search input.
   * @returns A route href ready for links or redirects.
   */
  makeHref(...args: RouteHrefArgs<TPath, TSearch>): ValidatedRouteHref;
}

/** Route metadata classification used by generated route manifests. */
export type RouteReferenceKind = 'page' | 'partial';

/** Optional metadata attached to generated route references. */
export interface RouteReferenceOptions {
  /** Stable generated identifier for the route. */
  readonly id?: string;
  /** Route kind emitted by the manifest generator. */
  readonly kind?: RouteReferenceKind;
}

/**
 * Stable route reference returned by route contracts and generated manifests.
 */
export interface RouteReference<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> extends RouteContractTypeCarrier<TPath, TSearch> {
  /** Fresh route pattern used to generate the href. */
  readonly routePattern: string;
  /** Optional typed path schema for the route. */
  readonly pathSchema?: PathParamSchema<TPath>;
  /** Optional typed search schema for the route. */
  readonly searchSchema?: SearchParamSchema<TSearch>;
  /** Typed href builder for the route. */
  readonly nav: RouteNavigation<TPath, TSearch>;
  /** Raw pattern emitted into the generated route manifest. */
  readonly $pattern: string;
  /** Static href when the route has no dynamic path params. */
  readonly $href?: ValidatedRouteHref;
  /** Optional manifest id. */
  readonly $id?: string;
  /** Optional manifest route kind. */
  readonly $kind?: RouteReferenceKind;

  /**
   * Build a validated href for the route.
   *
   * @param args - Optional path and search input.
   * @returns A route href ready for links or redirects.
   */
  href(...args: RouteHrefArgs<TPath, TSearch>): ValidatedRouteHref;

  /**
   * Materialize Fresh link props for the route.
   *
   * @param input - Bound link config without the target route.
   * @returns Anchor props with a generated `href`.
   */
  getLinkProps(
    input: RouteLinkPropsInput<TPath, TSearch>,
  ): FreshLinkAttributes & { readonly href: ValidatedRouteHref };

  /**
   * Parse raw path params into typed route path state.
   *
   * @param input - Raw Fresh path params.
   * @returns The parsed path object.
   */
  parsePath(input: PathParamInput): TPath;

  /**
   * Safely parse raw path params into typed route path state.
   *
   * @param input - Raw Fresh path params.
   * @returns Success or failure parse result.
   */
  safeParsePath(input: PathParamInput): SchemaParseResult<TPath>;

  /**
   * Parse raw query params into typed route search state.
   *
   * @param input - Raw query params as `URLSearchParams` or a plain object.
   * @returns The parsed search object.
   */
  parseSearch(input: URLSearchParams | SearchParamInput): TSearch;

  /**
   * Safely parse raw query params into typed route search state.
   *
   * @param input - Raw query params as `URLSearchParams` or a plain object.
   * @returns Success or failure parse result.
   */
  safeParseSearch(input: URLSearchParams | SearchParamInput): SchemaParseResult<TSearch>;

  /**
   * Fresh link component already bound to the route reference.
   */
  readonly Link: (props: RouteLinkComponentProps<TPath, TSearch>) => unknown;

  /**
   * Pair the page route with a framework partial route.
   *
   * @param partialRoute - Partial route reference.
   * @returns A helper that can produce page and partial hrefs together.
   */
  withPartial<TPartialPath extends object, TPartialSearch extends object>(
    partialRoute: RouteReference<TPartialPath, TPartialSearch>,
  ): PairedRouteTarget<TPath, TSearch, TPartialPath, TPartialSearch>;
}

/** Bound route reference created from a route contract and concrete route pattern. */
export type BoundRouteContract<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> =
  & RouteReference<TPath, TSearch>
  & RouteContractTypeCarrier<TPath, TSearch>;

/** Combined page/partial route helper returned by `route.withPartial(...)`. */
export interface PairedRouteTarget<
  TPrimaryPath extends object = EmptyRecord,
  TPrimarySearch extends object = EmptyRecord,
  TPartialPath extends object = EmptyRecord,
  TPartialSearch extends object = EmptyRecord,
> {
  /** Primary page route. */
  readonly route: RouteReference<TPrimaryPath, TPrimarySearch>;
  /** Partial route refreshed by the page. */
  readonly partialRoute: RouteReference<TPartialPath, TPartialSearch>;

  /**
   * Build the page href for the paired target.
   *
   * @param args - Page and optional partial input.
   * @returns The primary page href.
   */
  href(
    ...args: PairedRouteHrefArgs<TPrimaryPath, TPrimarySearch, TPartialPath, TPartialSearch>
  ): ValidatedRouteHref;

  /**
   * Build the partial href for the paired target.
   *
   * @param args - Page and optional partial input.
   * @returns The partial href.
   */
  partialHref(
    ...args: PairedRouteHrefArgs<TPrimaryPath, TPrimarySearch, TPartialPath, TPartialSearch>
  ): ValidatedRouteHref;

  /**
   * Materialize Fresh partial link props for the paired target.
   *
   * @param input - Page and partial navigation input.
   * @returns Anchor props with both `href` and `f-partial`.
   */
  getLinkProps(
    input: PairedRouteLinkPropsInput<TPrimaryPath, TPrimarySearch, TPartialPath, TPartialSearch>,
  ): FreshPartialLinkAttributes & {
    readonly href: ValidatedRouteHref;
    readonly 'f-partial': ValidatedRouteHref;
  };
}

/** Contract options for defining typed route path and search schemas. */
export interface DefineRouteContractOptions<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
> {
  /** Optional path schema used to parse Fresh path params. */
  readonly pathSchema?: TPathSchema;
  /** Optional search schema used to parse query params. */
  readonly searchSchema?: TSearchSchema;
}

/** Public route contract produced by `defineRouteContract()`. */
export interface DefineRouteContract<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
> extends RouteContractTypeCarrier<TPath, TSearch> {
  /** Optional path schema used when binding the contract to a route pattern. */
  readonly pathSchema?: PathParamSchema<TPath>;
  /** Optional search schema used when binding the contract to a route pattern. */
  readonly searchSchema?: SearchParamSchema<TSearch>;

  /**
   * Create typed route navigation for a concrete Fresh route pattern.
   *
   * @param routePattern - Fresh route pattern such as `"/orders/[id]"`.
   * @returns A typed navigation helper.
   */
  createNav(routePattern: string): RouteNavigation<TPath, TSearch>;

  /**
   * Bind the contract to a concrete Fresh route pattern.
   *
   * @param routePattern - Fresh route pattern such as `"/orders/[id]"`.
   * @returns A bound route reference with parsing and href helpers.
   */
  bind(routePattern: string): BoundRouteContract<TPath, TSearch>;

  /**
   * Parse raw path params with the contract schema.
   *
   * @param input - Raw Fresh path params.
   * @returns Parsed path state.
   */
  parsePath(input: PathParamInput): TPath;

  /**
   * Safely parse raw path params with the contract schema.
   *
   * @param input - Raw Fresh path params.
   * @returns Success or failure parse result.
   */
  safeParsePath(input: PathParamInput): SchemaParseResult<TPath>;

  /**
   * Parse raw search params with the contract schema.
   *
   * @param input - Raw search params.
   * @returns Parsed search state.
   */
  parseSearch(input: URLSearchParams | SearchParamInput): TSearch;

  /**
   * Safely parse raw search params with the contract schema.
   *
   * @param input - Raw search params.
   * @returns Success or failure parse result.
   */
  safeParseSearch(input: URLSearchParams | SearchParamInput): SchemaParseResult<TSearch>;
}

/** Enum-backed path param definition returned by `defineEnumPathParam()`. */
export interface EnumPathParamDefinition<
  TParamName extends string,
  TValues extends readonly [string, ...string[]],
> {
  /** Dynamic path param name. */
  readonly paramName: TParamName;
  /** Allowed string values for the param. */
  readonly values: TValues;
  /** Path schema matching the enum values. */
  readonly schema: PathParamSchema<Record<TParamName, TValues[number]>>;

  /**
   * Parse a single param value against the enum definition.
   *
   * @param value - Candidate path segment value.
   * @returns The typed enum value or `null` when invalid.
   */
  parse(value: string | undefined): TValues[number] | null;
}

/** Infer the output object carried by a route schema. */
export type SchemaOutput<TSchema> = TSchema extends undefined ? EmptyRecord
  : TSchema extends { readonly _output: infer TOutput extends object } ? TOutput
  : TSchema extends { safeParse(input: unknown): SchemaParseResult<infer TOutput extends object> }
    ? TOutput
  : EmptyRecord;
