import { recordSchedulerCronRun, type Span } from './scheduler-tracing.ts';
import type { WorkerCronScheduler } from './scheduler-options.ts';

/** Wire cron scheduler events into scheduler telemetry. */
export function setupSchedulerEventListeners(
  cronScheduler: WorkerCronScheduler,
  getSchedulerSpan: () => Span | null,
): void {
  cronScheduler.on('jobRun', (event) => {
    const schedulerSpan = getSchedulerSpan();
    if (schedulerSpan) {
      recordSchedulerCronRun(
        schedulerSpan,
        event.jobId,
        event.result.duration,
        true,
      );
    }
  });

  cronScheduler.on('jobError', (event) => {
    console.error(
      `[Scheduler] Cron job '${event.jobId}' failed:`,
      event.result.error?.message,
    );

    const schedulerSpan = getSchedulerSpan();
    if (schedulerSpan) {
      recordSchedulerCronRun(
        schedulerSpan,
        event.jobId,
        event.result.duration,
        false,
        event.result.error?.message,
      );
    }
  });
}
