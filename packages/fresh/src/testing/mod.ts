/**
 * Testing helpers for `@netscript/fresh` consumers.
 *
 * @module
 */

/** Mock route context returned by `createMockRouteContext()`. */
export interface MockRouteContext<
  TState = Record<string, never>,
  TResources extends Record<string, unknown> = Record<string, never>,
  TPath extends object = Record<string, never>,
  TSearch extends object = Record<string, never>,
> {
  /** Request URL for the fixture. */
  readonly url: URL;
  /** Raw request object for the fixture. */
  readonly req: Request;
  /** Fresh route params for the fixture. */
  readonly params: Record<string, string | undefined>;
  /** Fresh state object for the fixture. */
  readonly state: TState;
  /** Request abort signal. */
  readonly signal: AbortSignal;
  /** Parsed route path params. */
  readonly path: TPath;
  /** Parsed route search values. */
  readonly search: TSearch;
  /** Layer data available to layout tests. */
  readonly layerData: Record<string, unknown>;
  /** Route pattern represented by the fixture. */
  readonly routePattern: string;
  /** Minimal route navigation fixture. */
  readonly nav: { makeHref(): string };
  /** Optional route reference for tests that need routed context. */
  readonly route?: unknown;
  /** Named resources available to route loaders. */
  readonly resources: TResources;
  /** Return a named resource from the fixture. */
  resource<TKey extends keyof TResources & string>(key: TKey): TResources[TKey];
}

/** Mock defer policy profile names accepted by defer test fixtures. */
export type MockDeferPolicyProfile =
  | 'balanced'
  | 'aggressive-first-paint'
  | 'background-refresh'
  | 'low-bandwidth';

/** Mock defer policy override accepted by defer test fixtures. */
export interface MockDeferPolicyInput {
  /** Named policy profile to start from. */
  readonly profile?: MockDeferPolicyProfile;
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

/** Options used to construct a route context fixture. */
export interface MockRouteContextOptions<
  TState = Record<string, never>,
  TResources extends Record<string, unknown> = Record<string, never>,
  TPath extends object = Record<string, never>,
  TSearch extends object = Record<string, never>,
> {
  /** Request URL for the fixture. */
  readonly url?: string | URL;
  /** Raw request object for the fixture. */
  readonly req?: Request;
  /** Fresh route params for the fixture. */
  readonly params?: Record<string, string | undefined>;
  /** Fresh state object for the fixture. */
  readonly state?: TState;
  /** Parsed route path params. */
  readonly path?: TPath;
  /** Parsed route search values. */
  readonly search?: TSearch;
  /** Route pattern represented by the fixture. */
  readonly routePattern?: string;
  /** Named resources available to route loaders. */
  readonly resources?: TResources;
  /** Abort signal exposed to loaders and handlers. */
  readonly signal?: AbortSignal;
}

/** Create a minimal page context fixture for route, loader, and layout tests. */
export function createMockRouteContext<
  TState = Record<string, never>,
  TResources extends Record<string, unknown> = Record<string, never>,
  TPath extends object = Record<string, never>,
  TSearch extends object = Record<string, never>,
>(
  options: MockRouteContextOptions<TState, TResources, TPath, TSearch> = {},
): MockRouteContext<TState, TResources, TPath, TSearch> {
  const url = options.url instanceof URL
    ? options.url
    : new URL(options.url ?? 'https://example.test/');
  const resources = (options.resources ?? {}) as TResources;

  return {
    url,
    req: options.req ?? new Request(url),
    params: options.params ?? {},
    state: (options.state ?? {}) as TState,
    signal: options.signal ?? new AbortController().signal,
    path: (options.path ?? {}) as TPath,
    search: (options.search ?? {}) as TSearch,
    layerData: {},
    routePattern: options.routePattern ?? '/',
    nav: {
      makeHref: () => '/',
    },
    route: undefined,
    resources,
    resource(key) {
      return resources[key];
    },
  };
}

/** Create a defer policy fixture accepted by defer-region helpers. */
export function createMockDeferPolicy(
  policy: MockDeferPolicyInput | MockDeferPolicyProfile = 'balanced',
): MockDeferPolicyInput | MockDeferPolicyProfile {
  return typeof policy === 'string' ? policy : { ...policy };
}
