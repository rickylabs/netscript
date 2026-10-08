/**
 * Thin checked command relay sink over the existing explicit workers trigger boundary.
 * No queue or resource starts on import/construction; supplied clients own permissions.
 * A worker acceptance is checked before the relay may settle normalized identity/time.
 * @module
 */
export { createWorkerCommandOutboxSink } from './src/integration/commands/worker-command-sink.ts';
export type {
  WorkerCommandClientPort,
  WorkerCommandMetadata,
  WorkerCommandSinkOptions,
  WorkerCommandTarget,
  WorkerJobCommandRequest,
  WorkerTaskCommandRequest,
} from './src/integration/commands/worker-command-sink.ts';
export type { JobId, TaskId } from './src/public/root.ts';
export type {
  CommandJson,
  CommandOutboxAcceptance,
  CommandOutboxDelivery,
  CommandOutboxSink,
  CommandTraceContext,
} from '@netscript/service/commands/relay';
