/**
 * @module @netscript/plugin-workers-core/shutdown
 *
 * Worker shutdown coordination contracts.
 */

export { ShutdownManager } from './shutdown-manager.ts';
export type {
  ShutdownManagerOptions,
  ShutdownReport,
  ShutdownResource,
  ShutdownState,
} from './shutdown-manager.ts';

export { drainWorker, type WorkerDrainActions } from './worker-drain.ts';
export {
  DEFAULT_ABORT_GRACE_PERIOD_MS,
  DEFAULT_WORKER_DRAIN_TIMEOUT_MS,
  resolveWorkerDrainBudget,
  type WorkerDrainBudget,
  type WorkerDrainClock,
  type WorkerDrainOptions,
  type WorkerLifecycleState,
} from './worker-lifecycle.ts';
