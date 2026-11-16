/** Bounded graceful work, abort cleanup, and queue settlement. @module */
import { WebPlatformJobRunnerClock } from '../adapters/web-platform-job-runner-clock.ts';
import {
  resolveWorkerDrainBudget,
  type WorkerDrainClock,
  type WorkerDrainOptions,
} from './worker-lifecycle.ts';

/** Fixed phases wired by a worker's composition root. */
export interface WorkerDrainActions {
  /** Stop intake and join all admitted deliveries, including tasks and trigger jobs. */
  pauseIntake(): Promise<void>;
  /** Cancel remaining executions; this does not terminate in-process JavaScript. */
  abort(): void;
  /** Join runner cleanup and the paused delivery barriers after abort. */
  abortCompleted(): Promise<void>;
  /** Stop listeners and close only the queues owned by this worker. */
  close(): Promise<void>;
}

/**
 * Stop intake, allow work to finish, then abort and settle within one monotonic deadline.
 * A work-window timeout requests cancellation; uncompleted cleanup/settlement rejects
 * with TimeoutError. Process owners remain responsible for physical termination.
 */
export async function drainWorker(
  options: WorkerDrainOptions,
  actions: WorkerDrainActions,
): Promise<void> {
  const budget = resolveWorkerDrainBudget(options);
  const clock = options.drainClock ?? new WebPlatformJobRunnerClock(() => performance.now());
  const started = clock.now();
  let failure: unknown;
  let timedOut = false;
  try {
    await until(actions.pauseIntake(), started + budget.workMs, clock);
  } catch (error) {
    failure = error;
  }
  try {
    actions.abort();
    timedOut = !await until(
      actions.abortCompleted(),
      started + budget.totalMs - budget.settlementMs,
      clock,
    );
  } catch (error) {
    failure ??= error;
  }
  try {
    timedOut = !await until(actions.close(), started + budget.totalMs, clock) || timedOut;
  } catch (error) {
    failure ??= error;
  }
  if (timedOut) throw new DOMException('Worker drain budget elapsed.', 'TimeoutError');
  if (failure !== undefined) throw failure;
}

async function until(
  work: Promise<void>,
  deadline: number,
  clock: WorkerDrainClock,
): Promise<boolean> {
  if (clock.now() > deadline) {
    void work.catch(() => {});
    return false;
  }
  const timeout = Promise.withResolvers<boolean>();
  const cancel = clock.schedule(Math.max(0, deadline - clock.now()), () => timeout.resolve(false));
  try {
    return await Promise.race([work.then(() => true), timeout.promise]);
  } finally {
    cancel();
  }
}
