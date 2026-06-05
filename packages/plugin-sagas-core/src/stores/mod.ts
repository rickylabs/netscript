/**
 * @module @netscript/plugin-sagas-core/stores
 *
 * Store extension subpath.
 *
 * Group E keeps concrete persistent stores outside the root barrel. The store
 * port is re-exported here so external store implementations can target a
 * stable role-named subpath without importing test-only memory stores.
 */

export type {
  SagaCorrelationIndexEntry,
  SagaIdempotencyPort,
  SagaStorePort,
  SagaStoreWriteOptions,
} from '../ports/mod.ts';
