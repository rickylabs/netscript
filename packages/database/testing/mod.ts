/**
 * Testing utilities for `@netscript/database`.
 *
 * Use this subpath to run the shared database adapter contract against custom
 * adapters without importing package internals.
 *
 * @example
 * ```ts
 * import {
 *   createMockDatabaseAdapter,
 *   runDatabaseAdapterContract,
 * } from "@netscript/database/testing";
 *
 * runDatabaseAdapterContract({
 *   name: "mock",
 *   make: () => createMockDatabaseAdapter(),
 * });
 * ```
 *
 * @module
 */

export {
  createMockDatabaseAdapter,
  type DatabaseAdapterContractOptions,
  MockDatabaseAdapter,
  runDatabaseAdapterContract,
} from './mock-database.ts';
export type { DatabaseAdapter, DatabaseConnectionStatus, DatabaseProvider } from '../ports/mod.ts';
