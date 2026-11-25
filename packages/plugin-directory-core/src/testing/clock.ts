/**
 * Deterministic clock primitives for directory adapters and conformance tests.
 *
 * Production wall-clock primitives (`DirectoryClock`, `createSystemDirectoryClock`) live in
 * `@netscript/plugin-directory-core/ports` and are re-exported here for testing convenience.
 *
 * @module
 */

import { createSystemDirectoryClock, type DirectoryClock } from '../ports/mod.ts';

export { createSystemDirectoryClock };
export type { DirectoryClock };

/** Default initial ISO-8601 UTC instant used by {@link createDeterministicClock}. */
export const DEFAULT_DETERMINISTIC_CLOCK_ISO: string = '2026-06-01T12:00:00.000Z';

/**
 * Controllable deterministic clock for testing expiry boundaries and `evaluatedAt` timestamps.
 *
 * @example
 * ```ts
 * import { createDeterministicClock } from '@netscript/plugin-directory-core/testing';
 *
 * const clock = createDeterministicClock('2026-06-01T12:00:00.000Z');
 * clock.advanceMs(60_000);
 * console.log(clock.nowIso()); // '2026-06-01T12:01:00.000Z'
 * ```
 */
export interface DeterministicDirectoryClock extends DirectoryClock {
  /** Advances the clock forward by a finite non-negative number of milliseconds. */
  advanceMs(deltaMs: number): void;
  /** Sets the clock to an exact epoch millisecond value, ISO-8601 string, or `Date`. */
  set(instant: number | string | Date): void;
}

function parseInstantMs(instant: number | string | Date): number {
  const ms = typeof instant === 'number'
    ? instant
    : instant instanceof Date
    ? instant.getTime()
    : Date.parse(instant);
  if (!Number.isFinite(ms)) {
    throw new RangeError('Deterministic directory clock requires a valid finite timestamp.');
  }
  return Math.trunc(ms);
}

/**
 * Creates a deterministic {@link DeterministicDirectoryClock} initialized at `initial`.
 *
 * @param initial - Optional initial timestamp (defaults to {@link DEFAULT_DETERMINISTIC_CLOCK_ISO}).
 * @returns Controllable deterministic clock.
 *
 * @example
 * ```ts
 * import { createDeterministicClock } from '@netscript/plugin-directory-core/testing';
 *
 * const clock = createDeterministicClock('2026-06-01T12:00:00.000Z');
 * console.log(clock.nowMs(), clock.nowIso());
 * ```
 */
export function createDeterministicClock(
  initial: number | string | Date = DEFAULT_DETERMINISTIC_CLOCK_ISO,
): DeterministicDirectoryClock {
  let currentMs = parseInstantMs(initial);

  return {
    nowMs(): number {
      return currentMs;
    },
    nowIso(): string {
      return new Date(currentMs).toISOString();
    },
    advanceMs(deltaMs: number): void {
      if (!Number.isFinite(deltaMs) || deltaMs < 0) {
        throw new RangeError('Clock advance deltaMs must be a finite number >= 0.');
      }
      currentMs += Math.trunc(deltaMs);
    },
    set(instant: number | string | Date): void {
      currentMs = parseInstantMs(instant);
    },
  };
}
