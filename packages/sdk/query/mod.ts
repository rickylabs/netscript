/**
 * Query-factory APIs for the NetScript SDK.
 *
 * @module
 */

export { createCompositeQuery } from '../core/composite-query.ts';
export { createQueryFactories, createQueryFactory } from '../core/query-factory.ts';
export {
  type CacheProvider,
  hasCacheProvider,
  setCacheProvider,
} from '../core/cache-provider.ts';
export type {
  ActionMethod,
  CompositeQuery,
  FactoryConfig,
  ProcedureInput,
  ProcedureOutput,
  QueryFactory,
} from '../interfaces/query-factory.ts';
