/** Fluent builder compatibility types.
 *
 * The compatibility names are aliases of the implementation's type-state
 * builder. Keeping one contract prevents the public facade and runtime builder
 * from drifting into structurally incompatible recursive interfaces.
 *
 * @module
 */

import type { DefinePageBuilder, DefinePageRootBuilder } from '../builder/state.ts';
import type {
  DefinePageLayerMap,
  DefinePageTypeState,
  EmptyRecord,
  UnknownRecord,
} from '../types.ts';

/** Public fluent page builder surface. */
export type PageBuilder<
  TState = EmptyRecord,
  TResources extends UnknownRecord = EmptyRecord,
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
  TLayerData extends DefinePageLayerMap = EmptyRecord,
  THasRoute extends boolean = false,
> = DefinePageBuilder<
  DefinePageTypeState<TState, TResources, TPath, TSearch, TLayerData>,
  THasRoute
>;

/** Root page builder returned by `definePage()`. */
export type PageRootBuilder<TState = EmptyRecord> = DefinePageRootBuilder<TState>;
