/**
 * Shared `CallContext` timeout and abort-signal enforcement helpers for all directory adapters.
 *
 * Guarantees uniform validation and classification across in-memory, LDAP, Entra, and SCIM
 * adapters:
 * - `timeoutMs` must be finite and `<= DIRECTORY_MAX_TIMEOUT_MS` (`2_147_483_647` ms); invalid
 *   values throw `RangeError`.
 * - `timeoutMs <= 0` throws {@link DirectoryTimeout}.
 * - Timeout-reason aborts (`DirectoryTimeout` or `name === 'TimeoutError'`) throw
 *   {@link DirectoryTimeout}; all other caller aborts throw {@link DirectoryUnavailable}.
 *
 * @module
 */

import type { CallContext } from '../domain/mod.ts';
import { DIRECTORY_ERROR_CODES, DirectoryTimeout, DirectoryUnavailable } from './errors.ts';

/** Maximum safe 32-bit timer delay accepted for directory call timeouts (`2^31 - 1` ms). */
export const DIRECTORY_MAX_TIMEOUT_MS: number = 2_147_483_647;

type TimerHandle = ReturnType<typeof setTimeout>;

function isTimeoutAbortReason(reason: unknown): boolean {
  if (reason instanceof DirectoryTimeout) {
    return true;
  }
  if (typeof reason === 'object' && reason !== null) {
    const record = reason as { name?: unknown; code?: unknown };
    if (record.code === DIRECTORY_ERROR_CODES.timeout) {
      return true;
    }
    if (record.name === 'TimeoutError') {
      return true;
    }
  }
  return false;
}

/**
 * Classifies an `AbortSignal.reason` into {@link DirectoryTimeout} (for timeout reasons) or
 * {@link DirectoryUnavailable} (for non-timeout caller cancellation).
 *
 * @param directoryName - Adapter provider identifier (`DirectoryPort.name`).
 * @param operation - Directory port operation name.
 * @param reason - `AbortSignal.reason` value.
 * @param timeoutMs - Optional active timeout budget in milliseconds.
 * @returns Classified {@link DirectoryTimeout} or {@link DirectoryUnavailable}.
 *
 * @example
 * ```ts
 * import { classifyDirectoryAbortError } from '@netscript/plugin-directory-core/ports';
 *
 * const err = classifyDirectoryAbortError(
 *   'memory',
 *   'getUser',
 *   new DOMException('Timed out', 'TimeoutError'),
 *   500,
 * );
 * console.log(err.code); // 'DIRECTORY_TIMEOUT'
 * ```
 */
export function classifyDirectoryAbortError(
  directoryName: string,
  operation: string,
  reason: unknown,
  timeoutMs?: number,
): DirectoryTimeout | DirectoryUnavailable {
  if (isTimeoutAbortReason(reason)) {
    return new DirectoryTimeout(
      directoryName,
      operation,
      'Directory call was aborted due to timeout.',
      timeoutMs !== undefined ? { timeoutMs } : undefined,
    );
  }
  return new DirectoryUnavailable(
    directoryName,
    operation,
    'Directory call was aborted by the caller.',
  );
}

/**
 * Validates and resolves the effective timeout budget in milliseconds from `ctx.timeoutMs` or
 * `defaultTimeoutMs`.
 *
 * Rejects non-finite numbers and values exceeding {@link DIRECTORY_MAX_TIMEOUT_MS} with
 * `RangeError` (preventing 32-bit `setTimeout` overflow). Non-positive finite values are returned
 * so {@link assertDirectoryCallContext} can fail closed with {@link DirectoryTimeout}.
 *
 * @param ctx - Caller execution context.
 * @param defaultTimeoutMs - Optional adapter default timeout in milliseconds.
 * @returns Effective timeout in milliseconds, or `undefined` when neither is supplied.
 *
 * @example
 * ```ts
 * import { resolveDirectoryTimeoutMs } from '@netscript/plugin-directory-core/ports';
 *
 * console.log(resolveDirectoryTimeoutMs({ timeoutMs: 2_000 }, 5_000)); // 2000
 * ```
 */
export function resolveDirectoryTimeoutMs(
  ctx: CallContext,
  defaultTimeoutMs?: number,
): number | undefined {
  const effective = ctx.timeoutMs !== undefined ? ctx.timeoutMs : defaultTimeoutMs;
  if (effective === undefined) {
    return undefined;
  }
  if (!Number.isFinite(effective) || effective > DIRECTORY_MAX_TIMEOUT_MS) {
    throw new RangeError(
      `CallContext.timeoutMs must be a finite number <= ${DIRECTORY_MAX_TIMEOUT_MS}.`,
    );
  }
  return effective;
}

/**
 * Validates `ctx` before starting directory I/O, throwing `RangeError` for out-of-range timeouts,
 * {@link DirectoryTimeout} for exhausted (`<= 0`) timeouts or timeout-aborted signals, and
 * {@link DirectoryUnavailable} for non-timeout caller aborts.
 *
 * @param directoryName - Adapter provider identifier (`DirectoryPort.name`).
 * @param operation - Directory port operation name.
 * @param ctx - Caller execution context.
 * @param defaultTimeoutMs - Optional adapter default timeout in milliseconds.
 * @returns Validated positive timeout in milliseconds, or `undefined` when unbounded.
 *
 * @example
 * ```ts
 * import { assertDirectoryCallContext } from '@netscript/plugin-directory-core/ports';
 *
 * const budget = assertDirectoryCallContext('memory', 'health', { timeoutMs: 1_500 });
 * console.log(budget); // 1500
 * ```
 */
export function assertDirectoryCallContext(
  directoryName: string,
  operation: string,
  ctx: CallContext,
  defaultTimeoutMs?: number,
): number | undefined {
  const timeoutMs = resolveDirectoryTimeoutMs(ctx, defaultTimeoutMs);
  if (ctx.signal?.aborted) {
    throw classifyDirectoryAbortError(directoryName, operation, ctx.signal.reason, timeoutMs);
  }
  if (timeoutMs !== undefined && timeoutMs <= 0) {
    throw new DirectoryTimeout(
      directoryName,
      operation,
      `Directory call exceeded timeout budget (${timeoutMs}ms).`,
      { timeoutMs },
    );
  }
  return timeoutMs;
}

/**
 * Parameters accepted by {@link runWithDirectoryDeadline}.
 *
 * @example
 * ```ts
 * import {
 *   runWithDirectoryDeadline,
 *   type DirectoryDeadlineParams,
 * } from '@netscript/plugin-directory-core/ports';
 *
 * const params: DirectoryDeadlineParams<string> = {
 *   directoryName: 'memory',
 *   operation: 'getUser',
 *   timeoutMs: 1_000,
 *   task: () => Promise.resolve('ok'),
 * };
 * console.log(await runWithDirectoryDeadline(params));
 * ```
 */
export type DirectoryDeadlineParams<T> = Readonly<{
  /** Adapter provider identifier (`DirectoryPort.name`). */
  directoryName: string;
  /** Port operation name for error metadata. */
  operation: string;
  /** Optional positive timeout budget in milliseconds (`<= DIRECTORY_MAX_TIMEOUT_MS`). */
  timeoutMs?: number;
  /** Optional caller abort signal. */
  signal?: AbortSignal;
  /** Optional synchronous cancellation hook invoked once on timeout or abort (for example `client.unbind`). */
  onCancel?: () => void;
  /** Async task to race against the deadline and abort signal. */
  task: () => Promise<T>;
}>;

/**
 * Executes `task` while racing against an optional `timeoutMs` timer and `AbortSignal`, cleaning
 * up all timers and listeners on every completion path.
 *
 * @param params - Operation metadata, optional timeout/signal, cancellation hook, and async task.
 * @returns Resolved value of `task` when completed before timeout/abort.
 *
 * @example
 * ```ts
 * import { runWithDirectoryDeadline } from '@netscript/plugin-directory-core/ports';
 *
 * const value = await runWithDirectoryDeadline({
 *   directoryName: 'memory',
 *   operation: 'health',
 *   timeoutMs: 1_000,
 *   task: () => Promise.resolve(42),
 * });
 * console.log(value);
 * ```
 */
export async function runWithDirectoryDeadline<T>(
  params: DirectoryDeadlineParams<T>,
): Promise<T> {
  const { directoryName, operation, signal, onCancel, task } = params;
  const timeoutMs = resolveDirectoryTimeoutMs({ timeoutMs: params.timeoutMs });

  let cancelled = false;
  const triggerCancel = (): void => {
    if (cancelled) return;
    cancelled = true;
    onCancel?.();
  };

  if (signal?.aborted) {
    triggerCancel();
    throw classifyDirectoryAbortError(directoryName, operation, signal.reason, timeoutMs);
  }
  if (timeoutMs !== undefined && timeoutMs <= 0) {
    triggerCancel();
    throw new DirectoryTimeout(
      directoryName,
      operation,
      `Directory operation exceeded timeout budget (${timeoutMs}ms).`,
      { timeoutMs },
    );
  }
  if (timeoutMs === undefined && signal === undefined) {
    return await task();
  }

  let timer: TimerHandle | undefined;
  let onAbort: (() => void) | undefined;

  const deadlinePromise = new Promise<never>((_resolve, reject) => {
    if (timeoutMs !== undefined) {
      timer = setTimeout(() => {
        reject(
          new DirectoryTimeout(
            directoryName,
            operation,
            `Directory operation exceeded timeout budget of ${timeoutMs}ms.`,
            { timeoutMs },
          ),
        );
        triggerCancel();
      }, timeoutMs);
    }

    if (signal) {
      onAbort = () => {
        reject(classifyDirectoryAbortError(directoryName, operation, signal.reason, timeoutMs));
        triggerCancel();
      };
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });

  try {
    return await Promise.race([task(), deadlinePromise]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    if (signal && onAbort) {
      signal.removeEventListener('abort', onAbort);
    }
  }
}
