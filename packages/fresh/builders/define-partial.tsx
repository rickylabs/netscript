/**
 * Partial route helpers for `@netscript/fresh`.
 *
 * @module
 */

import type { RouteConfig } from 'fresh';
import { Partial } from 'fresh/runtime';
import type { ComponentType, JSX } from 'preact';
import { ErrorDisplay } from '../components/ErrorDisplay.tsx';
import { errorHandler, hasError } from '../error/handler.ts';
import type { ErrorPrimitives } from '../error/primitives.ts';

/** Default Fresh route config used by framework partial routes. */
export const PARTIAL_ROUTE_CONFIG: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

/** Materialized partial route contract returned by `definePartial()`. */
export interface DefinedPartialRoute<TContext, THandler = undefined> {
  config: RouteConfig;
  handler?: THandler;
  page: (ctx: TContext) => Promise<JSX.Element>;
  readonly default: (ctx: TContext) => Promise<JSX.Element>;
}

/** Options for creating a framework-owned partial route. */
export interface DefinePartialOptions<
  TProps extends object,
  TContext,
  THandler = undefined,
> {
  name: string;
  loader: (ctx: TContext) => Promise<TProps>;
  component: ComponentType<TProps>;
  errorComponent?: ComponentType<ErrorPrimitives>;
  errorTitle?: string;
  handler?: THandler;
  config?: RouteConfig;
}

/** Define a partial route backed by an async loader and a display component. */
export function definePartial<
  TProps extends object,
  TContext,
  THandler = undefined,
>(options: DefinePartialOptions<TProps, TContext, THandler>): DefinedPartialRoute<TContext, THandler> {
  const config = {
    ...options.config,
    ...PARTIAL_ROUTE_CONFIG,
  } satisfies RouteConfig;

  const page = async (ctx: TContext): Promise<JSX.Element> => {
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
