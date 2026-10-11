/**
 * Closed background child lifecycle vocabulary.
 *
 * @example
 * ```ts
 * import type { ChildHealthState } from '@netscript/plugin/health';
 * const state: ChildHealthState = 'starting';
 * ```
 */
export type ChildHealthState =
  | 'starting'
  | 'ready'
  | 'degraded'
  | 'crash-looping'
  | 'stopped'
  | 'failed';

/**
 * Public incident metadata; the original message and stack are deliberately withheld.
 *
 * @example
 * ```ts
 * import type { ChildFatalError } from '@netscript/plugin/health';
 * const incident: ChildFatalError = {
 *   message: 'Background child failed (details redacted).', timestamp: 0,
 * };
 * ```
 */
export type ChildFatalError = Readonly<{
  /** Fixed redacted message, never the raw exception. */
  message: string;
  /** Capture time in milliseconds since the Unix epoch. */
  timestamp: number;
}>;

/**
 * Bounded JSON health payload for one background child.
 *
 * @example
 * ```ts
 * import type { ChildHealthSnapshot } from '@netscript/plugin/health';
 * const health: ChildHealthSnapshot = {
 *   state: 'starting', registryReady: false, dependencyReady: false,
 *   restartCount: 0, lastFatalError: null,
 * };
 * ```
 */
export type ChildHealthSnapshot = Readonly<{
  /** Named lifecycle state; only ready is healthy. */
  state: ChildHealthState;
  /** Generated definitions have been loaded and validated. */
  registryReady: boolean;
  /** Startup dependency checks succeeded and no listener failure is active. */
  dependencyReady: boolean;
  /** Cumulative restart attempts for this child instance. */
  restartCount: number;
  /** Most recent fatal incident, with secrets withheld. */
  lastFatalError: ChildFatalError | null;
}>;

/**
 * Three restarts within sixty seconds latch crash-looping until a clean running window.
 *
 * @example
 * ```ts
 * import { CHILD_CRASH_LOOP_THRESHOLD } from '@netscript/plugin/health';
 * console.log(CHILD_CRASH_LOOP_THRESHOLD.restarts); // 3
 * ```
 */
export const CHILD_CRASH_LOOP_THRESHOLD: Readonly<{ restarts: number; windowMs: number }> = Object
  .freeze({ restarts: 3, windowMs: 60_000 });
