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
