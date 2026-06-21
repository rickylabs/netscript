/**
 * Package-private graceful shutdown coordination for service listeners.
 *
 * The public builder owns hook registration. The listener owns Deno's HTTP edge.
 * This coordinator owns the policy between them: idempotency, drain timeout
 * accounting, LIFO teardown hooks, and structured shutdown reports.
 *
 * @module
 */

import type {
  ShutdownHook,
  ShutdownHookOutcome,
  ShutdownReason,
  ShutdownReport,
} from '../types.ts';

/** Default graceful drain budget in milliseconds. */
export const DEFAULT_DRAIN_TIMEOUT_MS = 30_000;

interface ServiceShutdownCoordinatorOptions {
  readonly controller: AbortController;
  readonly shutdownServer: () => Promise<void>;
  readonly awaitServerFinished: () => Promise<void>;
  readonly hooks?: readonly ShutdownHook[];
  readonly drainTimeoutMs?: number;
}

interface ShutdownBudget {
  readonly startedAt: number;
  readonly timeoutMs: number;
}

type StepResult<T> =
  | { readonly status: 'completed'; readonly value: T }
  | { readonly status: 'failed'; readonly error: unknown }
  | { readonly status: 'timed-out' };

/**
 * Coordinates graceful service shutdown under a bounded drain budget.
 *
 * @internal
 */
export class ServiceShutdownCoordinator {
  readonly #controller: AbortController;
  readonly #shutdownServer: () => Promise<void>;
  readonly #awaitServerFinished: () => Promise<void>;
  readonly #hooks: readonly ShutdownHook[];
  readonly #drainTimeoutMs: number;
  #shutdownPromise: Promise<ShutdownReport> | undefined;

  constructor(options: ServiceShutdownCoordinatorOptions) {
    this.#controller = options.controller;
    this.#shutdownServer = options.shutdownServer;
    this.#awaitServerFinished = options.awaitServerFinished;
    this.#hooks = [...(options.hooks ?? [])];
    this.#drainTimeoutMs = normalizeDrainTimeout(options.drainTimeoutMs);
  }

  /**
   * Runs graceful shutdown once and returns the same report to later callers.
   */
  runShutdown(
    reason: ShutdownReason,
    signal?: Deno.Signal,
  ): Promise<ShutdownReport> {
    this.#shutdownPromise ??= this.#runShutdown(reason, signal);
    return this.#shutdownPromise;
  }

  async #runShutdown(
    reason: ShutdownReason,
    signal?: Deno.Signal,
  ): Promise<ShutdownReport> {
    const budget: ShutdownBudget = {
      startedAt: performance.now(),
      timeoutMs: this.#drainTimeoutMs,
    };
    const hooks: ShutdownHookOutcome[] = [];
    let timedOut = false;

    if (!this.#controller.signal.aborted) {
      this.#controller.abort(reason);
    }

    const shutdownResult = await runWithinRemainingBudget(
      () => this.#shutdownServer(),
      budget,
    );
    timedOut = timedOut || shutdownResult.status === 'timed-out';

    if (!timedOut) {
      for (let index = this.#hooks.length - 1; index >= 0; index -= 1) {
        const hook = this.#hooks[index];
        const hookResult = await runWithinRemainingBudget(
          async () => {
            await hook({ reason, signal });
          },
          budget,
        );

        if (hookResult.status === 'completed') {
          hooks.push({ ok: true });
          continue;
        }

        hooks.push({
          ok: false,
          error: hookResult.status === 'timed-out'
            ? 'shutdown hook timed out'
            : normalizeErrorMessage(hookResult.error),
        });

        if (hookResult.status === 'timed-out') {
          timedOut = true;
          break;
        }
      }
    }

    if (!timedOut) {
      const finishedResult = await runWithinRemainingBudget(
        () => this.#awaitServerFinished(),
        budget,
      );
      timedOut = timedOut || finishedResult.status === 'timed-out';
    }

    return {
      reason,
      timedOut,
      hooks,
    };
  }
}

function normalizeDrainTimeout(value: number | undefined): number {
  if (value === undefined) return DEFAULT_DRAIN_TIMEOUT_MS;
  if (!Number.isFinite(value) || value < 0) return DEFAULT_DRAIN_TIMEOUT_MS;
  return value;
}

async function runWithinRemainingBudget<T>(
  operation: () => Promise<T>,
  budget: ShutdownBudget,
): Promise<StepResult<T>> {
  const remainingMs = remainingBudgetMs(budget);
  if (remainingMs <= 0) return { status: 'timed-out' };

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation()
        .then((value): StepResult<T> => ({ status: 'completed', value }))
        .catch((error: unknown): StepResult<T> => ({ status: 'failed', error })),
      new Promise<StepResult<T>>((resolve) => {
        timeoutId = setTimeout(() => resolve({ status: 'timed-out' }), remainingMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

function remainingBudgetMs(budget: ShutdownBudget): number {
  return Math.max(0, budget.timeoutMs - (performance.now() - budget.startedAt));
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
