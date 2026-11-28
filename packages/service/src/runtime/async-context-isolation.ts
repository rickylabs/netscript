/**
 * Composition-root clean async-context snapshot capture and streaming iterator detachment.
 *
 * Uses the shared `Symbol.for('@netscript/async-context/active-store-probes')`
 * registry (coordinated with RFC 0011) alongside `@netscript/telemetry/context`
 * root-context checks (`isActiveContextRoot` / `hasActiveSpan`) so services
 * never capture a request-poisoned `AsyncLocalStorage.snapshot()`.
 *
 * @module
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import {
  type Context as TelemetryContext,
  getRootContext,
  hasActiveSpan,
  isActiveContextRoot,
  withContext,
} from '@netscript/telemetry/context';

/** Shared global symbol holding registered framework `AsyncLocalStorage` active-store probes. */
export const ACTIVE_ASYNC_STORE_PROBES_SYMBOL: symbol = Symbol.for(
  '@netscript/async-context/active-store-probes',
);

/** Diagnostic probe entry registered by framework packages owning an `AsyncLocalStorage`. */
export interface ActiveAsyncStoreProbe {
  /** Human-readable identifier for error diagnostics (for example `@netscript/logger.context`). */
  readonly name: string;
  /** Returns `true` when this store currently has active ambient state on the current async context. */
  readonly isActive: () => boolean;
}

/**
 * Thrown when clean async-root snapshot capture is attempted inside an active
 * `AsyncLocalStorage` scope or non-root OpenTelemetry context.
 */
export class AsyncContextRootCaptureError extends Error {
  /** Stable machine-readable diagnostic code. */
  readonly code = 'ASYNC_CONTEXT_ROOT_CAPTURE_FAILED' as const;
  /** Registered store names or OpenTelemetry context sources that were active at capture time. */
  readonly activeSources: readonly string[];

  /**
   * Creates a fail-closed async-root capture error.
   *
   * @param activeSources - Active async-context sources detected during capture.
   */
  constructor(activeSources: readonly string[]) {
    super(
      `[ASYNC_CONTEXT_ROOT_CAPTURE_FAILED] Refusing to capture clean async root inside active context: ${
        activeSources.join(', ')
      }. Call service.start() at the composition root before serving requests.`,
    );
    this.name = 'AsyncContextRootCaptureError';
    this.activeSources = Object.freeze([...activeSources]);
  }
}

/** Clean composition-root execution boundary captured before serving requests. */
export interface CleanAsyncRootRunner {
  /**
   * Executes `fn` detached from any caller `AsyncLocalStorage` stores, applying
   * `otelContext` (defaulting to OpenTelemetry `ROOT_CONTEXT`).
   */
  runDetached<T>(fn: () => T, otelContext?: TelemetryContext): T;
}

/**
 * Verifies no registered framework `AsyncLocalStorage` probe or OpenTelemetry
 * span/context value is active, then captures a clean composition-root
 * `AsyncLocalStorage.snapshot()`.
 *
 * @throws {AsyncContextRootCaptureError} When called inside an active ALS or non-root OTel context.
 */
export function captureCleanAsyncRootOrThrow(): CleanAsyncRootRunner {
  const activeSources: string[] = [];

  const registry: unknown = Reflect.get(globalThis, ACTIVE_ASYNC_STORE_PROBES_SYMBOL);
  if (registry instanceof Set) {
    for (const candidate of registry) {
      if (!isActiveStoreProbe(candidate)) continue;
      let active = true;
      try {
        active = Boolean(candidate.isActive());
      } catch {
        // Fail closed if a registered probe throws while inspecting active state.
        active = true;
      }
      if (active) {
        activeSources.push(candidate.name);
      }
    }
  }

  const activeSpan = hasActiveSpan();
  if (activeSpan) {
    activeSources.push('@opentelemetry/api.activeSpan');
  } else if (!isActiveContextRoot()) {
    activeSources.push('@opentelemetry/api.activeContext');
  }

  if (activeSources.length > 0) {
    throw new AsyncContextRootCaptureError(activeSources);
  }

  const cleanSnapshot = AsyncLocalStorage.snapshot();

  return Object.freeze({
    runDetached<T>(fn: () => T, otelContext?: TelemetryContext): T {
      const targetContext = otelContext ?? getRootContext();
      return cleanSnapshot(() => withContext(targetContext, fn));
    },
  });
}

/** Reports whether `value` is an async iterator (including async generators / oRPC `eventIterator`). */
export function isAsyncIteratorLike(
  value: unknown,
): value is AsyncIterator<unknown, unknown, unknown> & Partial<AsyncDisposable> {
  return typeof value === 'object' &&
    value !== null &&
    typeof Reflect.get(value, 'next') === 'function' &&
    typeof Reflect.get(value, Symbol.asyncIterator) === 'function';
}

/**
 * Wraps an async iterator so every consumer `next()`, `return()`, `throw()`, and
 * `[Symbol.asyncDispose]()` (`await using`) pull executes inside `runDetached`,
 * preventing caller ALS leakage while forwarding yielded values unmodified so
 * `@orpc/server` `withEventMeta` / `getEventMeta` metadata remains intact.
 *
 * Optionally invokes `onSettled` once when the stream terminates (normal completion,
 * rejection, `return()`, `throw()`, or `[Symbol.asyncDispose]()`).
 */
export function wrapDetachedAsyncIterator<T, TReturn = unknown, TNext = unknown>(
  iterator: AsyncIterator<T, TReturn, TNext> & Partial<AsyncDisposable>,
  runDetached: <R>(fn: () => PromiseLike<R> | R) => PromiseLike<R> | R,
  onSettled?: () => void,
): AsyncIterableIterator<T, TReturn, TNext> & AsyncDisposable {
  let settled = false;
  const markSettled = (): void => {
    if (settled) return;
    settled = true;
    onSettled?.();
  };

  const wrapper: AsyncIterableIterator<T, TReturn, TNext> & AsyncDisposable = {
    async next(...args: [] | [TNext]): Promise<IteratorResult<T, TReturn>> {
      try {
        const result = await runDetached(() =>
          args.length === 0 ? iterator.next() : iterator.next(args[0])
        );
        if (result.done) {
          markSettled();
        }
        return result;
      } catch (error) {
        markSettled();
        throw error;
      }
    },

    async return(value?: TReturn | PromiseLike<TReturn>): Promise<IteratorResult<T, TReturn>> {
      try {
        if (typeof iterator.return === 'function') {
          return await runDetached(() => iterator.return!(value));
        }
        return { done: true, value: (await value) as TReturn };
      } finally {
        markSettled();
      }
    },

    async throw(error?: unknown): Promise<IteratorResult<T, TReturn>> {
      try {
        if (typeof iterator.throw === 'function') {
          const result = await runDetached(() => iterator.throw!(error));
          if (result.done) {
            markSettled();
          }
          return result;
        }
        markSettled();
        throw error;
      } catch (thrown) {
        markSettled();
        throw thrown;
      }
    },

    async [Symbol.asyncDispose](): Promise<void> {
      try {
        const dispose = iterator[Symbol.asyncDispose];
        if (typeof dispose === 'function') {
          await runDetached(() => dispose.call(iterator));
        } else if (typeof iterator.return === 'function') {
          await runDetached(() => iterator.return!());
        }
      } finally {
        markSettled();
      }
    },

    [Symbol.asyncIterator](): AsyncIterableIterator<T, TReturn, TNext> & AsyncDisposable {
      return wrapper;
    },
  };

  return wrapper;
}

function isActiveStoreProbe(value: unknown): value is ActiveAsyncStoreProbe {
  return typeof value === 'object' &&
    value !== null &&
    typeof Reflect.get(value, 'name') === 'string' &&
    typeof Reflect.get(value, 'isActive') === 'function';
}
