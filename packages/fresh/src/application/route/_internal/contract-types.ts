/** Internal builder-shaped route contract types. */

import type { ComponentType } from 'preact';
import type {
  BoundGetLinkPropsInput,
  BoundLinkProps,
  FreshLinkAttributes,
  FreshPartialLinkAttributes,
  RouteSearchUpdate,
  TypedRoutePathInput,
  TypedRoutePathOf,
  TypedRouteSearchOf,
  TypedRouteTarget,
} from '../../builders/define-page/navigation/mod.ts';
import type {
  DefinePageRouteNav,
  EmptyRecord,
  HasPathParams,
  PathParamInput,
  PathParamSchema,
  SchemaParseResult,
  SearchParamInput,
  SearchParamSchema,
  Simplify,
  ValidatedRouteHref,
} from '../../builders/define-page/types.ts';
import type { SchemaObjectOutput } from '../schema-output.ts';

export type {
  CurrentRouteState,
  FreshLinkAttributes,
  FreshPartialLinkAttributes,
  InferRoutePath,
  InferRouteSearch,
  LinkProps,
  RouteSearchUpdate,
  TypedRoutePathInput,
  TypedRoutePathOf,
  TypedRouteSearchOf,
  TypedRouteTarget,
} from '../../builders/define-page/navigation/mod.ts';

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

export type RouteContractPathOf<TPathSchema> = SchemaObjectOutput<TPathSchema>;
export type RouteContractSearchOf<TSearchSchema> = SchemaObjectOutput<TSearchSchema>;

type StripLeadingSlash<TPattern extends string> = TPattern extends `/${infer TRest}` ? TRest
  : TPattern;

// `EmptySegment` is intentionally the empty object type — it tells TypeScript
// "no extra properties contributed by this segment" without dragging the
// `[k: string]: never` index signature that `EmptyRecord` carries (which
// would collapse intersections in `InferRoutePatternPathSegments` to
// `never`).
// deno-lint-ignore ban-types
type EmptySegment = {};

type InferRoutePatternSegment<TSegment extends string> = TSegment extends `[[...${infer TParam}]]`
  ? { [TKey in TParam]?: readonly string[] }
  : TSegment extends `[...${infer TParam}]` ? { [TKey in TParam]: readonly string[] }
  : TSegment extends `[${infer TParam}]` ? { [TKey in TParam]: string }
  : EmptySegment;

type InferRoutePatternPathSegments<TPattern extends string> = TPattern extends '' ? EmptyRecord
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

export type RouteHrefArgs<TTarget extends TypedRouteTarget<object, object>> =
  HasPathParams<TypedRoutePathOf<TTarget>> extends true ? [input: RouteHrefInput<TTarget>]
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

export type PairedRouteHrefArgs<
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

export type InferRouteContractPath<TValue extends RouteContractTypeCarrier> = NonNullable<
  TValue['$types']
>['path'];
export type InferRouteContractSearch<TValue extends RouteContractTypeCarrier> = NonNullable<
  TValue['$types']
>['search'];

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
