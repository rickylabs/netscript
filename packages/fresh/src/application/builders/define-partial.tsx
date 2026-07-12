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
import type { PageErrorPrimitives } from './define-page/page-compat/route-types.ts';

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

/** Define a partial route backed by an async loader and a display component. */
export function definePartial<
  TProps extends object,
  TContext,
  THandler = undefined,
>(
  options: DefinePartialOptions<TProps, TContext, THandler>,
): DefinedPartialRoute<TContext, THandler> {
  const config = {
    ...options.config,
    ...PARTIAL_ROUTE_CONFIG,
  } satisfies RouteConfig;

  const page = async (ctx: TContext): Promise<unknown> => {
    const load = errorHandler(() => options.loader(ctx));
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
    handler: options.handler,
    page,
    default: page,
  };
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
