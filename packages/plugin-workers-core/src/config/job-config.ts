import { z } from 'zod';
import { JOB_SOURCES } from '../domain/constants.ts';
import { TaskPermissionsInputSchema } from '../domain/task.ts';
import type { ConfigSchema } from './config-schema.ts';

/** Permission value accepted by worker config files. */
export type WorkerConfigPermissionValue = boolean | readonly string[];

/** Partial Deno permission set accepted by worker config files. */
export interface WorkerConfigPermissions {
  /** Network permission. */
  readonly net?: WorkerConfigPermissionValue;
  /** File read permission. */
  readonly read?: WorkerConfigPermissionValue;
  /** File write permission. */
  readonly write?: WorkerConfigPermissionValue;
  /** Environment variable permission. */
  readonly env?: WorkerConfigPermissionValue;
  /** Subprocess permission. */
  readonly run?: WorkerConfigPermissionValue;
  /** FFI permission. */
  readonly ffi?: boolean;
  /** Import specifiers allowed for dynamic imports. */
  readonly import?: readonly string[];
}

/** Origin of a worker job definition. */
export type WorkerJobSource = 'local' | 'plugin' | 'database' | 'remote';

/** Retention settings for worker job executions. */
export interface RetentionConfig {
  /** Whether execution history is archived to the database. */
  readonly archiveToDb?: boolean;
  /** Number of days execution history remains in KV. */
  readonly kvRetentionDays?: number;
  /** Number of days execution history remains in the database. */
  readonly dbRetentionDays?: number;
  /** Maximum number of executions retained for a job. */
  readonly maxExecutions?: number;
}

/** Worker job configuration. */
export interface JobConfig {
  /** Stable job identifier. */
  readonly id: string;
  /** Queue topic used to route the job. */
  readonly topic?: string;
  /** Human-readable job name. */
  readonly name: string;
  /** Optional job description. */
  readonly description?: string;
  /** Module entrypoint used to run the job. */
  readonly entrypoint: string;
  /** Origin of the job definition. */
  readonly source: WorkerJobSource;
  /** Optional cron expression for legacy scheduled jobs. */
  readonly schedule?: string;
  /** Timezone used by legacy schedules. */
  readonly timezone?: string;
  /** Execution timeout in milliseconds. */
  readonly timeout: number;
  /** Maximum retry attempts. */
  readonly maxRetries: number;
  /** Deno permissions granted to the job. */
  readonly permissions?: WorkerConfigPermissions;
  /** Searchable job tags. */
  readonly tags?: readonly string[];
  /** Caller-owned metadata attached to the job. */
  readonly metadata?: Readonly<Record<string, unknown>>;
  /** Execution retention policy. */
  readonly retention?: RetentionConfig;
  /** Whether the job can be dispatched. */
  readonly enabled: boolean;
}

const RetentionConfigZodSchema: z.ZodType<RetentionConfig | undefined> = z.object({
  archiveToDb: z.boolean().optional(),
  kvRetentionDays: z.number().optional(),
  dbRetentionDays: z.number().optional(),
  maxExecutions: z.number().optional(),
}).optional();

/** Retention settings for worker job executions. */
export const RetentionConfigSchema: ConfigSchema<RetentionConfig | undefined> =
  RetentionConfigZodSchema;

export const JobConfigZodSchema: z.ZodType<JobConfig> = z.object({
  id: z.string(),
  topic: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  entrypoint: z.string(),
  source: z.enum(JOB_SOURCES).default('local'),
  schedule: z.string().optional(),
  timezone: z.string().optional(),
  timeout: z.number().default(60000),
  maxRetries: z.number().default(3),
  permissions: TaskPermissionsInputSchema.optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  retention: RetentionConfigZodSchema,
  enabled: z.boolean().default(true),
});

/** Worker job configuration schema. */
export const JobConfigSchema: ConfigSchema<JobConfig> = JobConfigZodSchema;
