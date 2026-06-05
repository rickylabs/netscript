/**
 * Compatibility exports for server-only workers streams.
 *
 * @module
 */

export { emitJobToStream, getWorkersStreamProducer, startWorkersStreamMirror } from './producer.ts';
export {
  WorkerExecutionSchema,
  WorkerJobSchema,
  workersStreamSchema,
} from '@netscript/plugin-workers-core/streams';
