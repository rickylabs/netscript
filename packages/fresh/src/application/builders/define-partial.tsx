/**
 * Partial route helpers for `@netscript/fresh`.
 *
 * @module
 */

import type { RouteConfig } from 'fresh';
import { Partial } from 'fresh/runtime';
import { ErrorDisplay } from '../../diagnostics/error/ErrorDisplay.tsx';
import { errorHandler, hasError } from '../../diagnostics/error/handler.ts';
import type { ComponentLike } from './define-page/page-compat/shared-types.ts';
import type { EmptyRecord } from './define-page/page-compat/shared-types.ts';
import type { PageRequestContext } from './define-page/page-compat/context-types.ts';
import type { PageMethod } from './define-page/page-compat/form-types.ts';
import type { PageErrorPrimitives } from './define-page/page-compat/route-types.ts';
import type { RouteReference } from '../route/_internal/contract-runtime.ts';
import { resolvePathParams, resolveSearchParams } from './define-page/runtime/context.ts';

/** Default Fresh route config used by framework partial routes. */
export const PARTIAL_ROUTE_CONFIG: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

/** Materialized partial route contract returned by `definePartial()`. */
export interface DefinedPartialRoute<TContext, THandler = undefined> {
  /** Fresh route configuration for the partial. */
  config: RouteConfig;
  /** Optional Fresh handler attached to the partial route. */
  handler?: THandler;
  /** Render the partial for a Fresh request context. */
  page: (ctx: TContext) => Promise<unknown>;
  /** Default-export-compatible partial renderer. */
  readonly default: (ctx: TContext) => Promise<unknown>;
}

/** Options for creating a framework-owned partial route. */
export interface DefinePartialOptions<
  TProps extends object,
  TContext,
  THandler = undefined,
> {
  /** Stable partial name rendered into the response. */
  name: string;
  /** Load the component props for a request. */
  loader: (ctx: TContext) => Promise<TProps>;
  /** Component rendered inside the partial boundary. */
  component: ComponentLike<TProps>;
  /** Optional component rendered inside the default error shell. */
  errorComponent?: ComponentLike<PageErrorPrimitives>;
  /** Optional override for the default partial error title. */
  errorTitle?: string;
  /** Optional Fresh handler attached to the partial route. */
  handler?: THandler;
  /** Optional Fresh route configuration merged with framework defaults. */
  config?: RouteConfig;
}

/** Request context exposed to a route-bound partial loader or handler. */
export type PartialRouteContext<
  TState,
  TPath extends object,
  TSearch extends object,
> = PageRequestContext<TState> & {
  /** Parsed route path state. */
  readonly path: TPath;
  /** Parsed route search state. */
  readonly search: TSearch;
  /** Generated route reference bound to the partial. */
  readonly route: RouteReference<TPath, TSearch>;
};

/** Method handler accepted by a route-bound partial. */
export type PartialRouteHandler<TContext> = (
  ctx: TContext,
) => Response | { data: unknown } | Promise<Response | { data: unknown }>;

/** Method-handler map accepted by a route-bound partial. */
export type PartialRouteHandlers<TContext> = Partial<
  Record<PageMethod, PartialRouteHandler<TContext>>
>;

/** Options for binding a partial to a generated route reference. */
export interface DefineRoutedPartialOptions<
  TProps extends object,
  TState,
  TPath extends object,
  TSearch extends object,
> extends
  Omit<
    DefinePartialOptions<
      TProps,
      PartialRouteContext<TState, TPath, TSearch>,
      PartialRouteHandlers<PartialRouteContext<TState, TPath, TSearch>>
    >,
    'handler'
  > {
  /** Generated reference that parses the partial's path and search state. */
  readonly route: RouteReference<TPath, TSearch>;
  /** Optional method handlers receiving the same parsed context as the loader. */
  readonly handler?: PartialRouteHandlers<PartialRouteContext<TState, TPath, TSearch>>;
}

const PARTIAL_ROUTE_METHODS: readonly PageMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
];

function bindPartialRouteContext<
  TState,
  TPath extends object,
  TSearch extends object,
>(
  ctx: PageRequestContext<TState>,
  route: RouteReference<TPath, TSearch>,
): PartialRouteContext<TState, TPath, TSearch> {
  return {
    ...ctx,
    path: resolvePathParams(route.pathSchema, ctx.params, route),
    search: resolveSearchParams(route.searchSchema, ctx.url.searchParams, route),
    route,
  };
}

function bindPartialRouteHandlers<
  TState,
  TPath extends object,
  TSearch extends object,
>(
  handlers: PartialRouteHandlers<PartialRouteContext<TState, TPath, TSearch>> | undefined,
  route: RouteReference<TPath, TSearch>,
): PartialRouteHandlers<PageRequestContext<TState>> | undefined {
  if (!handlers) {
    return undefined;
  }

  const bound: PartialRouteHandlers<PageRequestContext<TState>> = {};
  for (const method of PARTIAL_ROUTE_METHODS) {
    const handler = handlers[method];
    if (handler) {
      bound[method] = (ctx) => handler(bindPartialRouteContext(ctx, route));
    }
  }
  return bound;
}

function materializePartial<
  TProps extends object,
  TRequestContext,
  TLoaderContext,
  THandler,
>(
  options: {
    readonly name: string;
    readonly component: ComponentLike<TProps>;
    readonly errorComponent?: ComponentLike<PageErrorPrimitives>;
    readonly errorTitle?: string;
    readonly config?: RouteConfig;
  },
  prepareContext: (ctx: TRequestContext) => TLoaderContext,
  loader: (ctx: TLoaderContext) => Promise<TProps>,
  handler: THandler | undefined,
): DefinedPartialRoute<TRequestContext, THandler> {
  const config = {
    ...options.config,
    ...PARTIAL_ROUTE_CONFIG,
  } satisfies RouteConfig;

  const page = async (ctx: TRequestContext): Promise<unknown> => {
    const loaderContext = prepareContext(ctx);
    const load = errorHandler(() => loader(loaderContext));
    const result = await load();

    if (hasError(result)) {
      const title = options.errorTitle ?? `Failed to load ${options.name}`;
      const ErrorComponent = options.errorComponent;

      return (
        <Partial name={options.name}>
          <ErrorDisplay error={result.error} title={title}>
            {ErrorComponent ? (props) => <ErrorComponent {...props} /> : undefined}
          </ErrorDisplay>
        </Partial>
      );
    }

    const Component = options.component;
    const data = result as TProps;

    return (
      <Partial name={options.name}>
        <Component {...data} />
      </Partial>
    );
  };

  return {
    config,
    handler,
    page,
    default: page,
  };
}

/** Define a partial route backed by an async loader and a display component. */
export function definePartial<
  TProps extends object,
  TPath extends object,
  TSearch extends object,
  TState = EmptyRecord,
>(
  options: DefineRoutedPartialOptions<TProps, TState, TPath, TSearch>,
): DefinedPartialRoute<
  PageRequestContext<TState>,
  PartialRouteHandlers<PageRequestContext<TState>>
>;
export function definePartial<
  TProps extends object,
  TContext,
  THandler = undefined,
>(
  options: DefinePartialOptions<TProps, TContext, THandler>,
): DefinedPartialRoute<TContext, THandler>;
export function definePartial<
  TProps extends object,
  TContext,
  THandler,
  TState,
  TPath extends object,
  TSearch extends object,
>(
  options:
    | DefinePartialOptions<TProps, TContext, THandler>
    | DefineRoutedPartialOptions<TProps, TState, TPath, TSearch>,
):
  | DefinedPartialRoute<TContext, THandler>
  | DefinedPartialRoute<
    PageRequestContext<TState>,
    PartialRouteHandlers<PageRequestContext<TState>>
  > {
  if ('route' in options) {
    const { route } = options;
    return materializePartial(
      options,
      (ctx: PageRequestContext<TState>) => bindPartialRouteContext(ctx, route),
      options.loader,
      bindPartialRouteHandlers(options.handler, route),
    );
  }

  return materializePartial(options, (ctx: TContext) => ctx, options.loader, options.handler);
}

/** Options for creating a stats-only partial backed by a query function. */
export interface DefineStatsPartialOptions<
  TProps extends object,
  TContext,
  THandler = undefined,
> extends Omit<DefinePartialOptions<TProps, TContext, THandler>, 'loader'> {
  /** Resolve the context-free stats payload. */
  query: () => Promise<TProps>;
}

/** Define a partial route whose data source does not need the Fresh request context. */
export function defineStatsPartial<
  TProps extends object,
  TContext,
  THandler = undefined,
>(
  options: DefineStatsPartialOptions<TProps, TContext, THandler>,
): DefinedPartialRoute<TContext, THandler> {
  return definePartial({
    ...options,
    loader: () => options.query(),
  });
}
