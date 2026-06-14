/** Partial-route compatibility types.
 *
 * @module
 */

import type { ComponentLike, PartialRouteConfig } from './shared-types.ts';
import type { PageErrorPrimitives } from './route-types.ts';

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
