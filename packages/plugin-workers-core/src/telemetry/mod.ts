/**
 * @module @netscript/plugin-workers-core/telemetry
 *
 * Worker telemetry registration and instrumentation contracts.
 */

export {
  WorkerSpanNames,
  WorkerTelemetryAttributes,
  WorkerTelemetryEvents,
  WorkerTelemetryStatuses,
} from './attributes.ts';
export type {
  WorkerSpanName,
  WorkerTelemetryAttribute,
  WorkerTelemetryEvent,
  WorkerTelemetryStatus,
} from './attributes.ts';
export {
  applyWorkerInstrumentations,
  JobExecuteInstrumentation,
  JobMainInstrumentation,
  QueueDequeueInstrumentation,
  QueueEnqueueInstrumentation,
  TaskExecuteInstrumentation,
  WorkerInstrumentation,
} from './instrumentation.ts';
export { TaskInstrumentation } from '../abstracts/task-instrumentation.ts';
export { WorkerInstrumentation as AbstractWorkerInstrumentation } from '../abstracts/worker-instrumentation.ts';
export type {
  WorkerInstrumentationContext as AbstractWorkerInstrumentationContext,
  WorkerInstrumentationSpan as AbstractWorkerInstrumentationSpan,
} from '../abstracts/worker-instrumentation.ts';
export type {
  InstrumentationContext,
  TelemetryAttributes,
  TelemetryAttributeValue,
  WorkerTelemetrySpan,
} from './instrumentation.ts';
