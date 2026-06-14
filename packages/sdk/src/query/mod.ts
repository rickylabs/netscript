/**
 * `@netscript/sdk/query` cache-aware query factories.
 *
 * This subpath creates server-friendly query helpers from service contracts and
 * typed service clients. Query factories execute through the registered cache
 * provider, share the SDK query key format, and expose prefetch, invalidate,
 * cached-data, and TanStack option helpers for each contract action.
 *
 * Use this subpath when code wants L2 query factories directly. Use the root
 * `defineServices()` preset when a contract map should create clients,
 * factories, and frontend query utils together.
 *
 * @module
 */

export { createCompositeQuery } from './composite-query.ts';
export { createQueryFactories, createQueryFactory } from './query-factory.ts';
export { type CacheProvider, hasCacheProvider, setCacheProvider } from '../cache/cache-provider.ts';
export type {
  ActionMethod,
  CompositeQuery,
  FactoryConfig,
  ProcedureInput,
  ProcedureOutput,
  QueryFactory,
} from '../ports/query-factory.ts';
