import type { CronScheduler } from '@netscript/cron';
import type { KvExecutionState } from '@netscript/plugin-workers-core/state';
import type { KvJobRegistry } from '@netscript/plugin-workers-core/registry';

/** Scheduler configuration options. */
export interface SchedulerOptions {
  /** Queue name to enqueue jobs to. */
  queueName?: string;
  /** Job registry instance. */
  registry: KvJobRegistry;
  /** Execution state instance. */
  executionState: KvExecutionState;
  /** Cron scheduler instance, auto-created if not provided. */
  cronScheduler?: CronScheduler;
  /** Whether to use memory scheduler for testing. */
  useMemoryScheduler?: boolean;
}

/** Scheduled job info. */
export interface ScheduledJobInfo {
  /** Job identifier. */
  jobId: string;
  /** Cron schedule. */
  schedule: string;
  /** Timezone. */
  timezone: string;
  /** Whether the job is enabled. */
  enabled: boolean;
  /** Next scheduled run. */
  nextRun: Date | null;
  /** Last run time. */
  lastRun: Date | null;
  /** Total run count. */
  runCount: number;
}
