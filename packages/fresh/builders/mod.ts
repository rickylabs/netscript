/**
 * Fluent builder entry point for `@netscript/fresh`.
 *
 * Route contracts live on `@netscript/fresh/route`.
 *
 * @module
 */

import { definePage as definePageImpl } from './define-page/mod.ts';
import {
  definePartial as definePartialImpl,
  defineStatsPartial as defineStatsPartialImpl,
} from './define-partial.tsx';
import type {
  DefinedPartialRoute,
  DefinePartialOptions,
  DefineStatsPartialOptions,
  EmptyRecord,
  PageRootBuilder,
} from './define-page/page-compat.ts';

export type { InferDefinePageLayerLoaderProps } from './define-page/mod.ts';
export type * from './define-page/page-compat.ts';

/** Start a new typed page builder chain. */
export function definePage<TState = EmptyRecord>(): PageRootBuilder<TState> {
  return definePageImpl<TState>() as unknown as PageRootBuilder<TState>;
}

/** Define a framework-owned partial route backed by an async loader. */
export function definePartial<TProps extends object, TContext, THandler = undefined>(
  options: DefinePartialOptions<TProps, TContext, THandler>,
): DefinedPartialRoute<TContext, THandler> {
  return definePartialImpl(options as never) as unknown as DefinedPartialRoute<TContext, THandler>;
}

/** Define a stats-only partial route backed by a context-free query function. */
export function defineStatsPartial<TProps extends object, TContext, THandler = undefined>(
  options: DefineStatsPartialOptions<TProps, TContext, THandler>,
): DefinedPartialRoute<TContext, THandler> {
  return defineStatsPartialImpl(options as never) as unknown as DefinedPartialRoute<
    TContext,
    THandler
  >;
}
