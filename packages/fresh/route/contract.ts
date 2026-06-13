import {
  type BoundGetLinkPropsInput,
  type BoundLinkProps,
  createRouteNav,
  type FreshLinkAttributes,
  type FreshPartialLinkAttributes,
  getBoundLinkProps,
  type InferRoutePath,
  type InferRouteSearch,
  Link as NavigationLink,
  type LinkProps,
  type RouteSearchUpdate,
  type TypedRoutePathInput,
  type TypedRoutePathOf,
  type TypedRouteSearchOf,
  type TypedRouteTarget,
} from '../builders/define-page/navigation.tsx';
import type { ComponentChildren, ComponentType } from 'preact';
import { searchParamsToInput } from '../builders/define-page/search-params.ts';

/** Re-exported Preact component type used for typed route links. */
export type { ComponentType };
/** Re-exported Preact child type used in typed link props. */
export type { ComponentChildren };
import type {
  DefinePageRouteNav,
  EmptyRecord,
  HasPathParams,
  InferSchemaOutput,
  PathParamInput,
  PathParamSchema,
  SchemaParseResult,
  SearchParamInput,
  SearchParamSchema,
  Simplify,
  ValidatedRouteHref,
} from '../builders/define-page/types.ts';

/** Route contract types shared with the page builder. */
export type {
  DefinePageRouteNav,
  EmptyRecord,
  HasPathParams,
  InferSchemaOutput,
  InferSafeParseOutput,
  MakeHrefArgs,
  MakeHrefInput,
  PathParamInput,
  PathParamSchema,
  SchemaLike,
  SchemaParseFailure,
  SchemaParseResult,
  SchemaParseSuccess,
  SearchParamInput,
  SearchParamSchema,
  SearchParamValue,
  Simplify,
  ValidatedRouteHref,
  validatedRouteHrefBrand,
} from '../builders/define-page/types.ts';

/** Navigation hooks and helpers re-exported from the page builder. */
export {
  getLinkProps,
  Link,
  useCurrentPath,
  useCurrentRoute,
  useCurrentSearch,
} from '../builders/define-page/navigation.tsx';

/** Navigation types re-exported from the page builder. */
export type {
  BoundGetLinkPropsInput,
  BoundLinkProps,
  CurrentRouteState,
  FreshLinkAttributes,
  FreshPartialLinkAttributes,
  GetLinkPropsInput,
  InferRoutePath,
  InferRouteSearch,
  LinkProps,
  RouteSearchUpdate,
  TypedRoutePathInput,
  TypedRoutePathOf,
  TypedRouteSearchOf,
  TypedRouteTarget,
} from '../builders/define-page/navigation.tsx';

/** Shape of a path parameter whose value is constrained to an enum of strings. */
export type EnumPathParam<
  TParamName extends string,
  TValues extends readonly [string, ...string[]],
> = {
  [TKey in TParamName]: TValues[number];
};

/** Definition of an enum path parameter, bundling its schema and a value parser. */
export interface EnumPathParamDefinition<
  TParamName extends string,
  TValues extends readonly [string, ...string[]],
> {
  /** Name of the path parameter. */
  readonly paramName: TParamName;
  /** Allowed values for the parameter. */
  readonly values: TValues;
  /** Schema that validates the parameter against the allowed values. */
  readonly schema: PathParamSchema<EnumPathParam<TParamName, TValues>>;
  /** Parse a raw parameter value, returning `null` when it is not allowed. */
  parse(value: string | undefined): TValues[number] | null;
}

/** Inferred path parameter object for a given path schema, defaulting to an empty record. */
export type RouteContractPathOf<TPathSchema> = InferSchemaOutput<TPathSchema> extends object
  ? InferSchemaOutput<TPathSchema>
  : EmptyRecord;

/** Inferred search parameter object for a given search schema, defaulting to an empty record. */
export type RouteContractSearchOf<TSearchSchema> = InferSchemaOutput<TSearchSchema> extends object
  ? InferSchemaOutput<TSearchSchema>
  : EmptyRecord;

/** Remove a leading slash from a literal route pattern. */
export type StripLeadingSlash<TPattern extends string> = TPattern extends `/${infer TRest}` ? TRest
  : TPattern;

/** Map one route pattern segment to its path parameter shape. */
export type InferRoutePatternSegment<TSegment extends string> = TSegment extends `[[...${infer TParam}]]`
  ? { [TKey in TParam]?: readonly string[] }
  : TSegment extends `[...${infer TParam}]` ? { [TKey in TParam]: readonly string[] }
  : TSegment extends `[${infer TParam}]` ? { [TKey in TParam]: string }
  : {};

/** Recursively map all segments of a route pattern to a path parameter object. */
export type InferRoutePatternPathSegments<TPattern extends string> = TPattern extends '' ? {}
  : TPattern extends `${infer TSegment}/${infer TRest}`
    ? Simplify<InferRoutePatternSegment<TSegment> & InferRoutePatternPathSegments<TRest>>
  : InferRoutePatternSegment<TPattern>;

/** Inferred path parameter object from a literal Fresh route pattern. */
export type InferRoutePatternPath<TRoutePattern extends string> = InferRoutePatternPathSegments<
  StripLeadingSlash<TRoutePattern>
>;

/** Input accepted when building an HREF for a typed route target. */
export type RouteHrefInput<TTarget extends TypedRouteTarget<object, object>> =
  & TypedRoutePathInput<TypedRoutePathOf<TTarget>>
  & {
    /** Optional search parameter update for the target route. */
    search?: RouteSearchUpdate<TypedRouteSearchOf<TTarget>>;
    /** Whether to preserve the current search parameters. */
    preserveSearchParams?: boolean;
  };

/** Argument tuple for {@link RouteReference.href}. */
export type RouteHrefArgs<TTarget extends TypedRouteTarget<object, object>> =
  HasPathParams<TypedRoutePathOf<TTarget>> extends true ? [input: RouteHrefInput<TTarget>]
    : [input?: RouteHrefInput<TTarget>];

/** Input accepted when building a paired HREF for a route and its partial companion. */
export type PairedRouteHrefInput<
  TPrimary extends TypedRouteTarget<object, object>,
  TPartial extends TypedRouteTarget<object, object>,
> =
  & TypedRoutePathInput<TypedRoutePathOf<TPrimary>>
  & {
    /** Optional search parameter update for the primary route. */
    search?: RouteSearchUpdate<TypedRouteSearchOf<TPrimary>>;
    /** Whether to preserve the current search parameters on the primary route. */
    preserveSearchParams?: boolean;
    /** Optional explicit path for the partial route. */
    partialPath?: TypedRoutePathOf<TPartial>;
    /** Optional search parameter update for the partial route. */
    partialSearch?: RouteSearchUpdate<TypedRouteSearchOf<TPartial>>;
    /** Whether to preserve the current search parameters on the partial route. */
    partialPreserveSearchParams?: boolean;
  };

/** Argument tuple for {@link PairedRouteTarget.href} and {@link PairedRouteTarget.partialHref}. */
export type PairedRouteHrefArgs<
  TPrimary extends TypedRouteTarget<object, object>,
  TPartial extends TypedRouteTarget<object, object>,
> = HasPathParams<TypedRoutePathOf<TPrimary>> extends true
  ? [input: PairedRouteHrefInput<TPrimary, TPartial>]
  : [input?: PairedRouteHrefInput<TPrimary, TPartial>];

/** Props accepted by {@link PairedRouteTarget.getLinkProps}. */
export type PairedRouteGetLinkPropsInput<
  TPrimary extends TypedRouteTarget<object, object>,
  TPartial extends TypedRouteTarget<object, object>,
> =
  & Omit<FreshPartialLinkAttributes, 'children' | 'href' | 'f-partial'>
  & PairedRouteHrefInput<TPrimary, TPartial>;

/** Carrier type used to infer path and search types from a route contract. */
export type RouteContractTypeCarrier = {
  readonly $types?: {
    /** Inferred path parameter object. */
    path: object;
    /** Inferred search parameter object. */
    search: object;
  };
};

/** Infer the path parameter type from a route contract carrier. */
export type InferRouteContractPath<TValue extends RouteContractTypeCarrier> = NonNullable<
  TValue['$types']
>['path'];

/** Infer the search parameter type from a route contract carrier. */
export type InferRouteContractSearch<TValue extends RouteContractTypeCarrier> = NonNullable<
  TValue['$types']
>['search'];

function safeParseRoutePath<TPathSchema extends PathParamSchema<object> | undefined>(
  schema: TPathSchema,
  input: PathParamInput,
): SchemaParseResult<RouteContractPathOf<TPathSchema>> {
  if (!schema) {
    return { success: true, data: {} as RouteContractPathOf<TPathSchema> };
  }

  return schema.safeParse(input) as SchemaParseResult<RouteContractPathOf<TPathSchema>>;
}

function parseRoutePath<TPathSchema extends PathParamSchema<object> | undefined>(
  schema: TPathSchema,
  input: PathParamInput,
): RouteContractPathOf<TPathSchema> {
  const result = safeParseRoutePath(schema, input);
  if (!result.success) {
    throw result.error ?? new Error('Invalid route path params');
  }

  return result.data;
}

function toSearchParamInput(input: URLSearchParams | SearchParamInput): SearchParamInput {
  return input instanceof URLSearchParams ? searchParamsToInput(input) : input;
}

function safeParseRouteSearch<TSearchSchema extends SearchParamSchema<object> | undefined>(
  schema: TSearchSchema,
  input: URLSearchParams | SearchParamInput,
): SchemaParseResult<RouteContractSearchOf<TSearchSchema>> {
  if (!schema) {
    return { success: true, data: {} as RouteContractSearchOf<TSearchSchema> };
  }

  return schema.safeParse(toSearchParamInput(input)) as SchemaParseResult<RouteContractSearchOf<TSearchSchema>>;
}

function parseRouteSearch<TSearchSchema extends SearchParamSchema<object> | undefined>(
  schema: TSearchSchema,
  input: URLSearchParams | SearchParamInput,
): RouteContractSearchOf<TSearchSchema> {
  const result = safeParseRouteSearch(schema, input);
  if (!result.success) {
    throw result.error ?? new Error('Invalid route search params');
  }

  return result.data;
}

/** Options accepted by {@link defineRouteContract}. */
export interface DefineRouteContractOptions<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
> {
  /** Optional schema used to parse and validate path parameters. */
  pathSchema?: TPathSchema;
  /** Optional schema used to parse and validate search parameters. */
  searchSchema?: TSearchSchema;
}

/** Kind of route reference a target represents. */
export type RouteReferenceKind = 'page' | 'partial';

/** Optional metadata attached to a route reference. */
export interface RouteReferenceOptions {
  /** Stable identifier for the route reference. */
  readonly id?: string;
  /** Whether the reference points to a full page or a Fresh partial. */
  readonly kind?: RouteReferenceKind;
}

/** A route target paired with a partial route for progressive enhancement. */
export interface PairedRouteTarget<
  TPrimary extends TypedRouteTarget<object, object>,
  TPartial extends TypedRouteTarget<object, object>,
> {
  /** Primary route target. */
  readonly route: TPrimary;
  /** Partial route target used for Fresh partial navigation. */
  readonly partialRoute: TPartial;
  /** Build an HREF to the primary route. */
  href(...args: PairedRouteHrefArgs<TPrimary, TPartial>): ValidatedRouteHref;
  /** Build an HREF to the partial route. */
  partialHref(...args: PairedRouteHrefArgs<TPrimary, TPartial>): ValidatedRouteHref;
  /** Build anchor props linking to the primary route with partial enhancement. */
  getLinkProps(
    input: PairedRouteGetLinkPropsInput<TPrimary, TPartial>,
  ): FreshPartialLinkAttributes & { href: ValidatedRouteHref; 'f-partial': ValidatedRouteHref };
}

/** Typed handle for a discovered route, including parsing and navigation helpers. */
export interface RouteReference<
  TPath extends object = EmptyRecord,
  TSearch extends object = SearchParamInput,
> extends TypedRouteTarget<TPath, TSearch> {
  /** Fresh route pattern (e.g. `/users/[id]`). */
  readonly routePattern: string;
  /** Schema used to parse path parameters. */
  readonly pathSchema?: PathParamSchema<TPath>;
  /** Schema used to parse search parameters. */
  readonly searchSchema?: SearchParamSchema<TSearch>;
  /** Navigation helpers scoped to this route. */
  readonly nav: DefinePageRouteNav<TPath, TSearch>;
  /** Canonical pattern accessor in generated manifests. */
  readonly $pattern: string;
  /** Static HREF when the route has no dynamic segments. */
  readonly $href?: ValidatedRouteHref;
  /** Optional route identifier. */
  readonly $id?: string;
  /** Route reference kind. */
  readonly $kind?: RouteReferenceKind;
  /** Build a validated HREF for this route. */
  href(...args: RouteHrefArgs<RouteReference<TPath, TSearch>>): ValidatedRouteHref;
  /** Build anchor props for this route. */
  getLinkProps(
    input: BoundGetLinkPropsInput<RouteReference<TPath, TSearch>>,
  ): FreshLinkAttributes & { href: ValidatedRouteHref };
  /** Parse raw path parameters into a typed object, throwing on invalid input. */
  parsePath(input: PathParamInput): TPath;
  /** Safely parse raw path parameters into a typed result. */
  safeParsePath(input: PathParamInput): SchemaParseResult<TPath>;
  /** Parse raw search parameters into a typed object, throwing on invalid input. */
  parseSearch(input: URLSearchParams | SearchParamInput): TSearch;
  /** Safely parse raw search parameters into a typed result. */
  safeParseSearch(input: URLSearchParams | SearchParamInput): SchemaParseResult<TSearch>;
  /** @ignore Preact component rendering a link bound to this route. */
  readonly Link: ComponentType<BoundLinkProps<RouteReference<TPath, TSearch>>>;
  /** Pair this route with a partial route target. */
  withPartial<TPartial extends TypedRouteTarget<object, object>>(
    partialRoute: TPartial,
  ): PairedRouteTarget<RouteReference<TPath, TSearch>, TPartial>;
}

/** A route contract bound to a concrete route pattern. */
export interface BoundRouteContract<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
> extends RouteReference<RouteContractPathOf<TPathSchema>, RouteContractSearchOf<TSearchSchema>> {
  /** Bound path schema, or undefined when no path parameters exist. */
  readonly pathSchema: TPathSchema extends undefined ? undefined
    : TPathSchema & PathParamSchema<RouteContractPathOf<TPathSchema>>;
  /** Bound search schema, or undefined when no search parameters exist. */
  readonly searchSchema: TSearchSchema extends undefined ? undefined
    : TSearchSchema & SearchParamSchema<RouteContractSearchOf<TSearchSchema>>;
  /** Type carrier exposing inferred path and search shapes. */
  readonly $types?: {
    path: RouteContractPathOf<TPathSchema>;
    search: RouteContractSearchOf<TSearchSchema>;
  };
}

/** Factory returned by {@link defineRouteContract}. */
export interface DefineRouteContract<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
> {
  /** Path schema passed to the contract factory. */
  readonly pathSchema: TPathSchema;
  /** Search schema passed to the contract factory. */
  readonly searchSchema: TSearchSchema;
  /** Type carrier exposing inferred path and search shapes. */
  readonly $types?: {
    path: RouteContractPathOf<TPathSchema>;
    search: RouteContractSearchOf<TSearchSchema>;
  };
  /** Create a navigation helper bound to the given pattern. */
  createNav(
    routePattern: string,
  ): DefinePageRouteNav<RouteContractPathOf<TPathSchema>, RouteContractSearchOf<TSearchSchema>>;
  /** Bind this contract to a concrete route pattern. */
  bind(routePattern: string): BoundRouteContract<TPathSchema, TSearchSchema>;
  /** Parse raw path parameters using the contract path schema. */
  parsePath(input: PathParamInput): RouteContractPathOf<TPathSchema>;
  /** Safely parse raw path parameters using the contract path schema. */
  safeParsePath(input: PathParamInput): SchemaParseResult<RouteContractPathOf<TPathSchema>>;
  /** Parse raw search parameters using the contract search schema. */
  parseSearch(input: URLSearchParams | SearchParamInput): RouteContractSearchOf<TSearchSchema>;
  /** Safely parse raw search parameters using the contract search schema. */
  safeParseSearch(
    input: URLSearchParams | SearchParamInput,
  ): SchemaParseResult<RouteContractSearchOf<TSearchSchema>>;
}

/**
 * Create a path parameter schema that only accepts a fixed set of string values.
 *
 * @param paramName - Name of the path parameter.
 * @param values - Allowed values for the parameter.
 * @returns A path parameter schema.
 */
export function enumPathParamSchema<
  const TParamName extends string,
  const TValues extends readonly [string, ...string[]],
>(
  paramName: TParamName,
  values: TValues,
): PathParamSchema<EnumPathParam<TParamName, TValues>> {
  return {
    safeParse(input: Record<string, string | undefined>) {
      const value = input[paramName];
      if (value !== undefined && values.includes(value)) {
        return {
          success: true as const,
          data: { [paramName]: value } as EnumPathParam<TParamName, TValues>,
        };
      }

      return {
        success: false as const,
        error: new Error(`Expected route param "${paramName}" to be one of: ${values.join(', ')}`),
      };
    },
  };
}

/**
 * Define a typed enum path parameter, including its schema and a value parser.
 *
 * @param paramName - Name of the path parameter.
 * @param values - Allowed values for the parameter.
 * @returns A full path parameter definition.
 */
export function defineEnumPathParam<
  const TParamName extends string,
  const TValues extends readonly [string, ...string[]],
>(
  paramName: TParamName,
  values: TValues,
): EnumPathParamDefinition<TParamName, TValues> {
  const schema = enumPathParamSchema(paramName, values);

  return {
    paramName,
    values,
    schema,
    parse(value: string | undefined) {
      const result = schema.safeParse({ [paramName]: value } as Record<string, string | undefined>);
      return result.success ? result.data[paramName] : null;
    },
  };
}

function hasDynamicRouteSegments(routePattern: string): boolean {
  return routePattern.includes('[');
}

function splitCatchAllValue(value: string): readonly string[] {
  return value.split('/').filter((segment) => segment.length > 0);
}

function inferRoutePathFromPattern<TRoutePath extends object>(
  routePattern: string,
  input: PathParamInput,
): TRoutePath {
  const path: Record<string, string | readonly string[] | undefined> = {};

  for (const segment of routePattern.split('/')) {
    const optionalCatchAll = segment.match(/^\[\[\.\.\.([^\]]+)\]\]$/)?.[1];
    if (optionalCatchAll) {
      const value = input[optionalCatchAll];
      if (value !== undefined && value !== null && value !== '') {
        path[optionalCatchAll] = splitCatchAllValue(value);
      }
      continue;
    }

    const catchAll = segment.match(/^\[\.\.\.([^\]]+)\]$/)?.[1];
    if (catchAll) {
      const value = input[catchAll];
      if (value === undefined || value === null || value === '') {
        throw new Error(`Missing catch-all path param "${catchAll}".`);
      }
      path[catchAll] = splitCatchAllValue(value);
      continue;
    }

    const dynamic = segment.match(/^\[([^\]]+)\]$/)?.[1];
    if (dynamic) {
      const value = input[dynamic];
      if (value === undefined || value === null || value === '') {
        throw new Error(`Missing path param "${dynamic}".`);
      }
      path[dynamic] = value;
    }
  }

  return path as TRoutePath;
}

function safeInferRoutePathFromPattern<TRoutePath extends object>(
  routePattern: string,
  input: PathParamInput,
): SchemaParseResult<TRoutePath> {
  try {
    return {
      success: true,
      data: inferRoutePathFromPattern<TRoutePath>(routePattern, input),
    };
  } catch (error: unknown) {
    return { success: false, error };
  }
}

function createRouteReferenceBase<TPath extends object, TSearch extends object>(
  options: {
    routePattern: string;
    pathSchema?: PathParamSchema<TPath>;
    searchSchema?: SearchParamSchema<TSearch>;
    parsePath: (input: PathParamInput) => TPath;
    safeParsePath: (input: PathParamInput) => SchemaParseResult<TPath>;
    parseSearch: (input: URLSearchParams | SearchParamInput) => TSearch;
    safeParseSearch: (input: URLSearchParams | SearchParamInput) => SchemaParseResult<TSearch>;
    metadata?: RouteReferenceOptions;
  },
): RouteReference<TPath, TSearch> {
  type Reference = RouteReference<TPath, TSearch>;

  let reference!: Reference;
  const nav = createRouteNav<TPath, TSearch>({
    routePattern: options.routePattern,
    pathSchema: options.pathSchema,
    searchSchema: options.searchSchema,
  });
  const getLinkPropsForReference: Reference['getLinkProps'] = (input) => {
    return getBoundLinkProps(reference, input);
  };
  const RouteLink: Reference['Link'] = (props) => {
    return NavigationLink<Reference>({
      to: reference,
      ...(props as BoundLinkProps<Reference>),
    } as LinkProps<Reference>);
  };

  reference = {
    routePattern: options.routePattern,
    pathSchema: options.pathSchema,
    searchSchema: options.searchSchema,
    nav,
    $pattern: options.routePattern,
    $href: hasDynamicRouteSegments(options.routePattern)
      ? undefined
      : options.routePattern as ValidatedRouteHref,
    $id: options.metadata?.id,
    $kind: options.metadata?.kind,
    href(...args) {
      const [input] = args as [BoundGetLinkPropsInput<Reference> | undefined];
      return getBoundLinkProps(reference, (input ?? {}) as BoundGetLinkPropsInput<Reference>).href;
    },
    getLinkProps: getLinkPropsForReference,
    parsePath: options.parsePath,
    safeParsePath: options.safeParsePath,
    parseSearch: options.parseSearch,
    safeParseSearch: options.safeParseSearch,
    Link: RouteLink as Reference['Link'],
    withPartial<TPartial extends TypedRouteTarget<object, object>>(partialRoute: TPartial) {
      return pairRouteTargets(reference, partialRoute);
    },
  };

  return reference;
}

/**
 * Pair a primary route target with a partial route target.
 *
 * @param route - Primary route target.
 * @param partialRoute - Partial route target used for progressive enhancement.
 * @returns A paired route target.
 */
export function pairRouteTargets<
  TPrimary extends TypedRouteTarget<object, object>,
  TPartial extends TypedRouteTarget<object, object>,
>(
  route: TPrimary,
  partialRoute: TPartial,
): PairedRouteTarget<TPrimary, TPartial> {
  const toPrimaryInput = (
    input?: PairedRouteGetLinkPropsInput<TPrimary, TPartial>,
  ): BoundGetLinkPropsInput<TPrimary> => {
    const normalizedInput = (input ?? {}) as PairedRouteGetLinkPropsInput<TPrimary, TPartial>;
    const {
      partialPath: _partialPath,
      partialSearch: _partialSearch,
      partialPreserveSearchParams: _partialPreserveSearchParams,
      ...routeInput
    } = normalizedInput;

    return routeInput as BoundGetLinkPropsInput<TPrimary>;
  };

  const toNormalizedInput = (
    input?: PairedRouteHrefInput<TPrimary, TPartial>,
  ): PairedRouteGetLinkPropsInput<TPrimary, TPartial> => {
    return (input ?? {}) as PairedRouteGetLinkPropsInput<TPrimary, TPartial>;
  };

  return {
    route,
    partialRoute,
    href(...args) {
      const [input] = args as [PairedRouteHrefInput<TPrimary, TPartial> | undefined];
      return getBoundLinkProps(route, toPrimaryInput(toNormalizedInput(input))).href;
    },
    partialHref(...args) {
      const [input] = args as [PairedRouteHrefInput<TPrimary, TPartial> | undefined];
      const normalizedInput = toNormalizedInput(input);
      const partialPath = (normalizedInput.partialPath ?? normalizedInput.path) as TypedRoutePathOf<TPartial>;
      const partialSearch = (normalizedInput.partialSearch ??
        normalizedInput.search) as RouteSearchUpdate<TypedRouteSearchOf<TPartial>> | undefined;

      return getBoundLinkProps(partialRoute, {
        path: partialPath,
        search: partialSearch,
        preserveSearchParams: normalizedInput.partialPreserveSearchParams,
      } as BoundGetLinkPropsInput<TPartial>).href;
    },
    getLinkProps(input) {
      const pageLinkProps = getBoundLinkProps(route, toPrimaryInput(input));
      const partialHref = this.partialHref(input);
      return {
        ...pageLinkProps,
        'f-partial': partialHref,
      };
    },
  };
}

/**
 * Create a typed route reference from a literal Fresh route pattern.
 *
 * @param routePattern - Fresh route pattern (e.g. `/users/[id]`).
 * @param metadata - Optional route reference metadata.
 * @returns A typed route reference.
 */
export function createRouteReference<const TRoutePattern extends string>(
  routePattern: TRoutePattern,
  metadata?: RouteReferenceOptions,
): RouteReference<InferRoutePatternPath<TRoutePattern>, SearchParamInput> {
  return createRouteReferenceBase<InferRoutePatternPath<TRoutePattern>, SearchParamInput>({
    routePattern,
    parsePath(input) {
      return inferRoutePathFromPattern<InferRoutePatternPath<TRoutePattern>>(routePattern, input);
    },
    safeParsePath(input) {
      return safeInferRoutePathFromPattern<InferRoutePatternPath<TRoutePattern>>(routePattern, input);
    },
    parseSearch(input) {
      return toSearchParamInput(input);
    },
    safeParseSearch(input) {
      return { success: true, data: toSearchParamInput(input) };
    },
    metadata,
  });
}

/**
 * Bind a route contract to a concrete route pattern.
 *
 * @param contract - Route contract created by {@link defineRouteContract}.
 * @param routePattern - Fresh route pattern to bind to.
 * @param metadata - Optional route reference metadata.
 * @returns A bound route contract.
 */
export function bindRoutePattern<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
>(
  contract: DefineRouteContract<TPathSchema, TSearchSchema>,
  routePattern: string,
  metadata?: RouteReferenceOptions,
): BoundRouteContract<TPathSchema, TSearchSchema> {
  return createRouteReferenceBase<RouteContractPathOf<TPathSchema>, RouteContractSearchOf<TSearchSchema>>(
    {
      routePattern,
      pathSchema: contract.pathSchema as PathParamSchema<RouteContractPathOf<TPathSchema>> | undefined,
      searchSchema: contract.searchSchema as SearchParamSchema<RouteContractSearchOf<TSearchSchema>> | undefined,
      parsePath(input) {
        return contract.parsePath(input);
      },
      safeParsePath(input) {
        return contract.safeParsePath(input);
      },
      parseSearch(input) {
        return contract.parseSearch(input);
      },
      safeParseSearch(input) {
        return contract.safeParseSearch(input);
      },
      metadata,
    },
  ) as BoundRouteContract<TPathSchema, TSearchSchema>;
}

/** Create a route contract with no path or search schemas. */
export function defineRouteContract(): DefineRouteContract<undefined, undefined>;
/** Create a route contract from explicit path and/or search schemas. */
export function defineRouteContract<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
>(
  options: DefineRouteContractOptions<TPathSchema, TSearchSchema>,
): DefineRouteContract<TPathSchema, TSearchSchema>;
/**
 * Create a route contract that can be bound to a route pattern and produce typed
 * route references.
 *
 * @param options - Optional path and search schemas.
 * @returns A route contract factory.
 */
export function defineRouteContract<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
>(
  options: DefineRouteContractOptions<TPathSchema, TSearchSchema> = {},
): DefineRouteContract<TPathSchema, TSearchSchema> {
  const pathSchema = options.pathSchema as TPathSchema;
  const searchSchema = options.searchSchema as TSearchSchema;

  return {
    pathSchema,
    searchSchema,
    createNav(routePattern: string) {
      return createRouteNav<RouteContractPathOf<TPathSchema>, RouteContractSearchOf<TSearchSchema>>(
        {
          routePattern,
          pathSchema: pathSchema as PathParamSchema<RouteContractPathOf<TPathSchema>> | undefined,
          searchSchema: searchSchema as
            | SearchParamSchema<RouteContractSearchOf<TSearchSchema>>
            | undefined,
        },
      );
    },
    bind(routePattern: string) {
      return bindRoutePattern(this, routePattern);
    },
    parsePath(input: PathParamInput) {
      return parseRoutePath(pathSchema, input);
    },
    safeParsePath(input: PathParamInput) {
      return safeParseRoutePath(pathSchema, input);
    },
    parseSearch(input: URLSearchParams | SearchParamInput) {
      return parseRouteSearch(searchSchema, input);
    },
    safeParseSearch(input: URLSearchParams | SearchParamInput) {
      return safeParseRouteSearch(searchSchema, input);
    },
  };
}
