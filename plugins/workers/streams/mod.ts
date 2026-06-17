/**
 * Browser-safe stream exports for the workers plugin.
 *
 * Consumed by Fresh islands — must not re-export server-only code.
 *
 * @module
 */

export {
  createWorkersStreamDB,
  type WorkerExecution,
  type WorkerJob,
  type WorkersStreamDB,
} from './factory.ts';
export { WorkerExecutionSchema, WorkerJobSchema, workersStreamSchema } from './schema.ts';
export type {
  StreamSchemaDefinition,
  WorkersStreamDefinition,
  WorkersStreamSchema,
  WorkerStreamCollectionDefinition,
  WorkerStreamEntitySchema,
  WorkerStreamStandardSchema,
} from '@netscript/plugin-workers-core/streams';
