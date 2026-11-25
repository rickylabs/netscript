/**
 * Wall-clock port shared by production directory adapters and test doubles.
 *
 * @module
 */

/**
 * Clock port used by directory adapters and test doubles for wall-clock reads (`evaluatedAt`,
 * `checkedAt`, and account expiration checks).
 *
 * @example
 * ```ts
 * import { createSystemDirectoryClock, type DirectoryClock } from '@netscript/plugin-directory-core/ports';
 *
 * const clock: DirectoryClock = createSystemDirectoryClock();
 * console.log(clock.nowIso());
 * ```
 */
export interface DirectoryClock {
  /** Returns the current wall-clock timestamp in epoch milliseconds. */
  nowMs(): number;
  /** Returns the current wall-clock timestamp formatted as an ISO-8601 UTC string. */
  nowIso(): string;
}

/**
 * Creates a wall-clock {@link DirectoryClock} backed by `Date.now()`.
 *
 * @returns Live system clock.
 *
 * @example
 * ```ts
 * import { createSystemDirectoryClock } from '@netscript/plugin-directory-core/ports';
 *
 * const clock = createSystemDirectoryClock();
 * console.log(clock.nowMs() > 0);
 * ```
 */
export function createSystemDirectoryClock(): DirectoryClock {
  return {
    nowMs(): number {
      return Date.now();
    },
    nowIso(): string {
      return new Date(Date.now()).toISOString();
    },
  };
}
