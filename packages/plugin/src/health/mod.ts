/** Background child health contract and process transport. @module */
export { CHILD_CRASH_LOOP_THRESHOLD } from '../domain/child-health.ts';
export type {
  ChildFatalError,
  ChildHealthMonitorOptions,
  ChildHealthSnapshot,
  ChildHealthState,
  ChildRestartHistory,
} from '../domain/child-health.ts';
export { ChildHealthMonitor } from '../runtime/child-health-monitor.ts';
export type { ChildRestartHistoryPort } from '../ports/child-restart-history-port.ts';
export { FileChildRestartHistory } from '../adapters/file-child-restart-history.ts';
export type { ChildHealthProcessOptions } from '../presentation/run-child-health-process.ts';
export { childHealthResponse } from '../presentation/child-health-response.ts';
export { runChildHealthProcess } from '../presentation/run-child-health-process.ts';
export {
  aggregatePluginHealth,
  summarizePluginHealth,
} from '../application/aggregate-plugin-health.ts';
export type {
  PluginHealthDeclaration,
  PluginHealthObservation,
  PluginHealthStatus,
  PluginHealthSummary,
  PluginResourceHealth,
} from '../domain/plugin-health.ts';
