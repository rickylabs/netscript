/**
 * Deliberately buggy module-load snapshot fixture used as the negative control
 * in `snapshot-lazy-import.probe.ts`.
 *
 * Capturing `AsyncLocalStorage.snapshot()` at top-level module evaluation
 * captures whatever request ALS stores happen to be active if this module is
 * first imported lazily inside an active request, leaking Request 1's stores
 * into every subsequent "detached" call.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

const moduleLoadSnapshot = AsyncLocalStorage.snapshot();

export function runWithModuleLoadSnapshot<T>(fn: () => T): T {
  return moduleLoadSnapshot(fn);
}
