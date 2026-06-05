import {
  type BoundGetLinkPropsInput,
  type BoundLinkProps,
  createRouteNav,
  type CurrentRouteState,
  type FreshLinkAttributes,
  type FreshPartialLinkAttributes,
  getBoundLinkProps,
  getLinkProps,
  type InferRoutePath,
  type InferRouteSearch,
  Link,
  type LinkProps,
  type RouteSearchUpdate,
  type TypedRoutePathInput,
  type TypedRoutePathOf,
  type TypedRouteSearchOf,
  type TypedRouteTarget,
  useCurrentPath,
  useCurrentRoute,
  useCurrentSearch,
} from '../builders/define-page/navigation.tsx';
import type { ComponentType } from 'preact';
import { searchParamsToInput } from '../builders/define-page/search-params.ts';
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

export type EnumPathParam<
  TParamName extends string,
  TValues extends readonly [string, ...string[]],
> = {
  [TKey in TParamName]: TValues[number];
};

export interface EnumPathParamDefinition<
  TParamName extends string,
  TValues extends readonly [string, ...string[]],
> {
  readonly paramName: TParamName;
  readonly values: TValues;
  readonly schema: PathParamSchema<EnumPathParam<TParamName, TValues>>;
  parse(value: string | undefined): TValues[number] | null;
}

type RouteContractPathOf<TPathSchema> = InferSchemaOutput<TPathSchema> extends object
  ? InferSchemaOutput<TPathSchema>
  : EmptyRecord;
type RouteContractSearchOf<TSearchSchema> = InferSchemaOutput<TSearchSchema> extends object
  ? InferSchemaOutput<TSearchSchema>
  : EmptyRecord;

type StripLeadingSlash<TPattern extends string> = TPattern extends `/${infer TRest}` ? TRest : TPattern;

type InferRoutePatternSegment<TSegment extends string> = TSegment extends `[[...${infer TParam}]]`
  ? { [TKey in TParam]?: readonly string[] }
  : TSegment extends `[...${infer TParam}]` ? { [TKey in TParam]: readonly string[] }
  : TSegment extends `[${infer TParam}]` ? { [TKey in TParam]: string }
  : {};

type InferRoutePatternPathSegments<TPattern extends string> = TPattern extends '' ? {}
  : TPattern extends `${infer TSegment}/${infer TRest}`
    ? Simplify<InferRoutePatternSegment<TSegment> & InferRoutePatternPathSegments<TRest>>
  : InferRoutePatternSegment<TPattern>;

export type InferRoutePatternPath<TRoutePattern extends string> = InferRoutePatternPathSegments<
  StripLeadingSlash<TRoutePattern>
>;

export type RouteHrefInput<TTarget extends TypedRouteTarget<object, object>> =
  & TypedRoutePathInput<TypedRoutePathOf<TTarget>>
  & {
    search?: RouteSearchUpdate<TypedRouteSearchOf<TTarget>>;
    preserveSearchParams?: boolean;
  };

type RouteHrefArgs<TTarget extends TypedRouteTarget<object, object>> = HasPathParams<TypedRoutePathOf<TTarget>> extends true
  ? [input: RouteHrefInput<TTarget>]
  : [input?: RouteHrefInput<TTarget>];

export type PairedRouteHrefInput<
  TPrimary extends TypedRouteTarget<object, object>,
  TPartial extends TypedRouteTarget<object, object>,
> =
  & TypedRoutePathInput<TypedRoutePathOf<TPrimary>>
  & {
    search?: RouteSearchUpdate<TypedRouteSearchOf<TPrimary>>;
    preserveSearchParams?: boolean;
    partialPath?: TypedRoutePathOf<TPartial>;
    partialSearch?: RouteSearchUpdate<TypedRouteSearchOf<TPartial>>;
    partialPreserveSearchParams?: boolean;
  };

type PairedRouteHrefArgs<
  TPrimary extends TypedRouteTarget<object, object>,
  TPartial extends TypedRouteTarget<object, object>,
> = HasPathParams<TypedRoutePathOf<TPrimary>> extends true
  ? [input: PairedRouteHrefInput<TPrimary, TPartial>]
  : [input?: PairedRouteHrefInput<TPrimary, TPartial>];

export type PairedRouteGetLinkPropsInput<
  TPrimary extends TypedRouteTarget<object, object>,
  TPartial extends TypedRouteTarget<object, object>,
> =
  & Omit<FreshPartialLinkAttributes, 'children' | 'href' | 'f-partial'>
  & PairedRouteHrefInput<TPrimary, TPartial>;

export type RouteContractTypeCarrier = {
  readonly $types?: {
    path: object;
    search: object;
  };
};

export type InferRouteContractPath<TValue extends RouteContractTypeCarrier> = NonNullable<TValue['$types']>['path'];
export type InferRouteContractSearch<TValue extends RouteContractTypeCarrier> = NonNullable<TValue['$types']>['search'];

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

export interface DefineRouteContractOptions<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
> {
  pathSchema?: TPathSchema;
  searchSchema?: TSearchSchema;
}

export type RouteReferenceKind = 'page' | 'partial';

export interface RouteReferenceOptions {
  readonly id?: string;
  readonly kind?: RouteReferenceKind;
}

export interface PairedRouteTarget<
  TPrimary extends TypedRouteTarget<object, object>,
  TPartial extends TypedRouteTarget<object, object>,
> {
  readonly route: TPrimary;
  readonly partialRoute: TPartial;
  href(...args: PairedRouteHrefArgs<TPrimary, TPartial>): ValidatedRouteHref;
  partialHref(...args: PairedRouteHrefArgs<TPrimary, TPartial>): ValidatedRouteHref;
  getLinkProps(
    input: PairedRouteGetLinkPropsInput<TPrimary, TPartial>,
  ): FreshPartialLinkAttributes & { href: ValidatedRouteHref; 'f-partial': ValidatedRouteHref };
}

export interface RouteReference<
  TPath extends object = EmptyRecord,
  TSearch extends object = SearchParamInput,
> extends TypedRouteTarget<TPath, TSearch> {
  readonly routePattern: string;
  readonly pathSchema?: PathParamSchema<TPath>;
  readonly searchSchema?: SearchParamSchema<TSearch>;
  readonly nav: DefinePageRouteNav<TPath, TSearch>;
  readonly $pattern: string;
  readonly $href?: ValidatedRouteHref;
  readonly $id?: string;
  readonly $kind?: RouteReferenceKind;
  href(...args: RouteHrefArgs<RouteReference<TPath, TSearch>>): ValidatedRouteHref;
  getLinkProps(
    input: BoundGetLinkPropsInput<RouteReference<TPath, TSearch>>,
  ): FreshLinkAttributes & { href: ValidatedRouteHref };
  parsePath(input: PathParamInput): TPath;
  safeParsePath(input: PathParamInput): SchemaParseResult<TPath>;
  parseSearch(input: URLSearchParams | SearchParamInput): TSearch;
  safeParseSearch(input: URLSearchParams | SearchParamInput): SchemaParseResult<TSearch>;
  readonly Link: ComponentType<BoundLinkProps<RouteReference<TPath, TSearch>>>;
  withPartial<TPartial extends TypedRouteTarget<object, object>>(
    partialRoute: TPartial,
  ): PairedRouteTarget<RouteReference<TPath, TSearch>, TPartial>;
}

export interface BoundRouteContract<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
> extends RouteReference<RouteContractPathOf<TPathSchema>, RouteContractSearchOf<TSearchSchema>> {
  readonly pathSchema: TPathSchema extends undefined ? undefined
    : TPathSchema & PathParamSchema<RouteContractPathOf<TPathSchema>>;
  readonly searchSchema: TSearchSchema extends undefined ? undefined
    : TSearchSchema & SearchParamSchema<RouteContractSearchOf<TSearchSchema>>;
  readonly $types?: {
    path: RouteContractPathOf<TPathSchema>;
    search: RouteContractSearchOf<TSearchSchema>;
  };
}

export {
  type CurrentRouteState,
  getLinkProps,
  type InferRoutePath,
  type InferRouteSearch,
  Link,
  useCurrentPath,
  useCurrentRoute,
  useCurrentSearch,
};

export interface DefineRouteContract<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
> {
  readonly pathSchema: TPathSchema;
  readonly searchSchema: TSearchSchema;
  readonly $types?: {
    path: RouteContractPathOf<TPathSchema>;
    search: RouteContractSearchOf<TSearchSchema>;
  };
  createNav(
    routePattern: string,
  ): DefinePageRouteNav<RouteContractPathOf<TPathSchema>, RouteContractSearchOf<TSearchSchema>>;
  bind(routePattern: string): BoundRouteContract<TPathSchema, TSearchSchema>;
  parsePath(input: PathParamInput): RouteContractPathOf<TPathSchema>;
  safeParsePath(input: PathParamInput): SchemaParseResult<RouteContractPathOf<TPathSchema>>;
  parseSearch(input: URLSearchParams | SearchParamInput): RouteContractSearchOf<TSearchSchema>;
  safeParseSearch(
    input: URLSearchParams | SearchParamInput,
  ): SchemaParseResult<RouteContractSearchOf<TSearchSchema>>;
}

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
    return Link<Reference>({
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
    Link: RouteLink,
    withPartial<TPartial extends TypedRouteTarget<object, object>>(partialRoute: TPartial) {
      return pairRouteTargets(reference, partialRoute);
    },
  };

  return reference;
}

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

export function defineRouteContract(): DefineRouteContract<undefined, undefined>;
export function defineRouteContract<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
>(
  options: DefineRouteContractOptions<TPathSchema, TSearchSchema>,
): DefineRouteContract<TPathSchema, TSearchSchema>;
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
