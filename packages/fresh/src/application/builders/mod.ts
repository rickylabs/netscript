/**
 * Fluent builder entry point for `@netscript/fresh`.
 *
 * Route contracts live on `@netscript/fresh/route`.
 *
 * @module
 */

import { definePage as definePageImpl } from './define-page/mod.ts';
import {
  type DefinedPartialRoute,
  definePartial as definePartialImpl,
  type DefinePartialOptions,
  defineStatsPartial as defineStatsPartialImpl,
  type DefineStatsPartialOptions,
} from './define-partial.tsx';
import type { EmptyRecord, PageRootBuilder } from './define-page/page-compat.ts';

export type { InferDefinePageLayerLoaderProps } from './define-page/mod.ts';
export type * from './define-page/page-compat.ts';

/** Start a new typed page builder chain. */
export function definePage<TState = EmptyRecord>(): PageRootBuilder<TState> {
  return definePageImpl<TState>();
}

/** Define a framework-owned partial route backed by an async loader. */
export function definePartial<TProps extends object, TContext, THandler = undefined>(
  options: DefinePartialOptions<TProps, TContext, THandler>,
): DefinedPartialRoute<TContext, THandler> {
  return definePartialImpl(options);
}

/** Define a stats-only partial route backed by a context-free query function. */
export function defineStatsPartial<TProps extends object, TContext, THandler = undefined>(
  options: DefineStatsPartialOptions<TProps, TContext, THandler>,
): DefinedPartialRoute<TContext, THandler> {
  return defineStatsPartialImpl(options);
}
