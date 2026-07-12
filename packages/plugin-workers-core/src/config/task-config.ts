import { z } from 'zod';
import { TASK_SOURCES, TASK_TYPES } from '../domain/constants.ts';
import { TaskPermissionsInputSchema } from '../domain/task.ts';
import type { ConfigSchema } from './config-schema.ts';
import type { WorkerConfigPermissions } from './job-config.ts';

type AnyZodObject = z.ZodObject<Record<string, z.ZodTypeAny>>;

/** Runtime used to execute a task. */
export type WorkerTaskType =
  | 'deno'
  | 'python'
  | 'dotnet'
  | 'cmd'
  | 'powershell'
  | 'shell'
  | 'executable';

/** Origin of a worker task definition. */
export type WorkerTaskSource = 'local' | 'plugin' | 'remote' | 'inline' | 'shared';

/** Runtime task configuration. */
export interface TaskConfig {
  /** Stable task identifier. */
  readonly id: string;
  /** Queue topic used to route the task. */
  readonly topic?: string;
  /** Human-readable task name. */
  readonly name: string;
  /** Optional task description. */
  readonly description?: string;
  /** Runtime used to execute the task. */
  readonly type: WorkerTaskType;
  /** Module, script, or executable entrypoint. */
  readonly entrypoint: string;
  /** Origin of the task definition. */
  readonly source: WorkerTaskSource;
  /** Remote source URL for downloaded task code. */
  readonly sourceUrl?: string;
  /** Import map URL used by the task runtime. */
  readonly importMapUrl?: string;
  /** Command-line arguments passed to the task. */
  readonly args: readonly string[];
  /** Working directory for task execution. */
  readonly cwd?: string;
  /** Environment variables passed to the task. */
  readonly env?: Readonly<Record<string, string>>;
  /** Deno permissions granted to the task. */
  readonly permissions?: WorkerConfigPermissions;
  /** Plugin that contributed the task. */
  readonly pluginId?: string;
  /** Inline script body for dynamic tasks. */
  readonly inlineScript?: string;
  /** Optional cron expression for legacy scheduled tasks. */
  readonly schedule?: string;
  /** Timezone used by legacy schedules. */
  readonly timezone?: string;
  /** Execution timeout in milliseconds. */
  readonly timeout: number;
  /** Maximum retry attempts. */
  readonly maxRetries: number;
  /** Delay between retries in milliseconds. */
  readonly retryDelay: number;
  /** Maximum concurrent executions. */
  readonly maxConcurrency: number;
  /** Dispatch priority from 0 to 100. */
  readonly priority: number;
  /** Whether the task can be dispatched. */
  readonly enabled: boolean;
  /** Searchable task tags. */
  readonly tags: readonly string[];
  /** Caller-owned metadata attached to the task. */
  readonly metadata?: Readonly<Record<string, unknown>>;
  /** Whether task executions are persisted. */
  readonly persist: boolean;
}

export const TaskConfigZodSchema: AnyZodObject = z.object({
  id: z.string(),
  topic: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(TASK_TYPES).default('deno'),
  entrypoint: z.string(),
  source: z.enum(TASK_SOURCES).default('local'),
  sourceUrl: z.string().url().optional(),
  importMapUrl: z.string().optional(),
  args: z.array(z.string()).default([]),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  permissions: TaskPermissionsInputSchema.optional(),
  pluginId: z.string().optional(),
  inlineScript: z.string().optional(),
  schedule: z.string().optional(),
  timezone: z.string().optional(),
  timeout: z.number().default(300000),
  maxRetries: z.number().default(1),
  retryDelay: z.number().default(1000),
  maxConcurrency: z.number().default(1),
  priority: z.number().default(50),
  enabled: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
  persist: z.boolean().default(true),
});

/** Runtime task configuration. */
export const TaskConfigSchema: ConfigSchema<TaskConfig> =
  TaskConfigZodSchema as unknown as ConfigSchema<TaskConfig>; // quality-allow: Zod 4's invariant input parameter does not overlap the package's parse-only ConfigSchema facade despite identical parsed TaskConfig output.
