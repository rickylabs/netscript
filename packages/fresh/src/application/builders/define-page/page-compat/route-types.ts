/** Route compatibility types for page builders.
 *
 * @module
 */

import type { EmptyRecord, PageRenderable } from './shared-types.ts';

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
