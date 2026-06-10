import type { JobDefinition } from '@netscript/plugin-workers-core/runtime';

/** Cron job handle used by the workers scheduler. */
export interface WorkerCronJob {
  /** Cron job identifier. */
  readonly id: string;
  /** Cron expression. */
  readonly schedule: string;
  /** Timezone used by the scheduler. */
  readonly timezone: string;
  /** Whether the job is currently enabled. */
  readonly enabled: boolean;
  /** Next scheduled run time. */
  readonly nextRun: Date | null;
  /** Last run time. */
  readonly lastRun: Date | null;
  /** Number of completed runs. */
  readonly runCount: number;
}

/** Cron scheduler surface consumed by the workers scheduler. */
export interface WorkerCronScheduler {
  /** Schedule a job callback. */
  schedule(
    id: string,
    schedule: string,
    handler: () => void | Promise<void>,
    options?: {
      readonly timezone?: string;
      readonly enabled?: boolean;
      readonly metadata?: Record<string, unknown>;
    },
  ): Promise<WorkerCronJob>;
  /** Remove a scheduled job. */
  unschedule(id: string): Promise<boolean>;
  /** Return a scheduled job by identifier. */
  get(id: string): WorkerCronJob | undefined;
  /** Return all scheduled jobs. */
  list(): readonly WorkerCronJob[];
  /** Enable a scheduled job. */
  enable(id: string): Promise<boolean>;
  /** Disable a scheduled job. */
  disable(id: string): Promise<boolean>;
  /** Stop the scheduler and release resources. */
  stop(): Promise<void>;
  /** Register a cron event listener. */
  on(
    event: 'jobRun' | 'jobError',
    listener: (event: {
      readonly jobId: string;
      readonly result: {
        readonly duration: number;
        readonly error?: Error;
      };
    }) => void,
  ): void;
}

/** Job registry surface consumed by the workers scheduler. */
export interface WorkerSchedulerJobRegistry {
  /** Return enabled jobs that have schedules. */
  listScheduled(): Promise<readonly JobDefinition[]>;
  /** Return a job definition by identifier. */
  get(jobId: string): Promise<JobDefinition | undefined>;
  /** Update a job definition. */
  update(jobId: string, updates: Partial<JobDefinition>): Promise<JobDefinition>;
  /** Enable a job definition. */
  enable(jobId: string): Promise<boolean>;
  /** Disable a job definition. */
  disable(jobId: string): Promise<boolean>;
}

/** Execution-state surface consumed by the workers scheduler. */
export interface WorkerSchedulerExecutionState {
  /** Reserved for future scheduler state interactions. */
  readonly id?: string;
}

/** Scheduler configuration options. */
export interface SchedulerOptions {
  /** Queue name to enqueue jobs to. */
  queueName?: string;
  /** Job registry instance. */
  registry: WorkerSchedulerJobRegistry;
  /** Execution state instance. */
  executionState: WorkerSchedulerExecutionState;
  /** Cron scheduler instance, auto-created if not provided. */
  cronScheduler?: WorkerCronScheduler;
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
