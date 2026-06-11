/**
 * Query-factory APIs for the NetScript SDK.
 *
 * @module
 */

export { createCompositeQuery } from '../src/query/composite-query.ts';
export { createQueryFactories, createQueryFactory } from '../src/query/query-factory.ts';
export {
  type CacheProvider,
  hasCacheProvider,
  setCacheProvider,
} from '../src/cache/cache-provider.ts';
export type {
  ActionMethod,
  CompositeQuery,
  FactoryConfig,
  ProcedureInput,
  ProcedureOutput,
  QueryFactory,
} from '../src/ports/query-factory.ts';
