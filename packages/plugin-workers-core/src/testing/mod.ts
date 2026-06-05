/**
 * @module @netscript/plugin-workers-core/testing
 *
 * Worker testing fixtures and in-memory adapters.
 */

export {};
export {
  createExecutionRecordFixture,
  createJobFixture,
  createJobResultFixture,
  createTestWorkersRuntime,
} from './job-fixtures.ts';
export type {
  ExecutionRecordFixtureOptions,
  JobFixtureOptions,
  TestWorkersRuntime,
  TestWorkersRuntimeOptions,
} from './job-fixtures.ts';
export { MemoryJobRegistry, MemoryJobStorage } from './memory-job-storage.ts';
export { MemoryWorker } from './memory-worker.ts';
export type { MemoryWorkerDispatch, MemoryWorkerOptions } from './memory-worker.ts';
