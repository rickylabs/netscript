/** Background child health contract and process transport. @module */
export { CHILD_CRASH_LOOP_THRESHOLD } from '../domain/child-health.ts';
export type {
  ChildFatalError,
  ChildHealthSnapshot,
  ChildHealthState,
} from '../domain/child-health.ts';
export { ChildHealthMonitor } from '../runtime/child-health-monitor.ts';
export { childHealthResponse } from '../presentation/child-health-response.ts';
export { runChildHealthProcess } from '../presentation/run-child-health-process.ts';
