import { z } from 'zod';

const enumValues = <TValues extends readonly string[]>(
  values: TValues,
): { [TValue in TValues[number]]: TValue } =>
  Object.fromEntries(values.map((value) => [value, value])) as {
    [TValue in TValues[number]]: TValue;
  };

/** Default topic for jobs and tasks without explicit topic assignment. */
export const DEFAULT_TOPIC = 'default';

/** Supported task execution runtimes. */
export const TASK_TYPES = [
  'deno',
  'python',
  'dotnet',
  'cmd',
  'powershell',
  'shell',
  'executable',
] as const;

/** Supported task execution statuses. */
export const TASK_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'timeout',
  'skipped',
] as const;

/** Supported job execution statuses. */
export const EXECUTION_STATUSES = [
  'pending',
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
  'timeout',
] as const;

/** Sources that can own a job definition. */
export const JOB_SOURCES = [
  'local',
  'plugin',
  'database',
  'remote',
] as const;

/** Sources that can own a task definition. */
export const TASK_SOURCES = [
  'local',
  'plugin',
  'remote',
  'inline',
  'shared',
] as const;

/** Job execution modes. */
export const JOB_EXECUTION_TYPES = [
  'deno',
  'wrapper',
] as const;

/** Trigger sources that can enqueue jobs and tasks. */
export const TRIGGER_TYPES = [
  'cron',
  'manual',
  'api',
  'event',
  'retry',
  'queue',
  'plugin',
] as const;

/** Runtime modes used by worker runners. */
export const WORKER_RUNTIMES = [
  'in-process',
  'web-worker',
  'subprocess',
] as const;

/** Supported task execution runtime. */
export type TaskType =
  | 'cmd'
  | 'deno'
  | 'dotnet'
  | 'executable'
  | 'powershell'
  | 'python'
  | 'shell';

/** Supported task execution status. */
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Supported job execution status. */
export type ExecutionStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

/** Source that owns a job definition. */
export type JobSource = (typeof JOB_SOURCES)[number];

/** Source that owns a task definition. */
export type TaskSource = (typeof TASK_SOURCES)[number];

/** Job execution mode. */
export type JobExecutionType = (typeof JOB_EXECUTION_TYPES)[number];

/** Source that triggered a job or task execution. */
export type TriggerType = 'cron' | 'manual' | 'api' | 'event' | 'retry' | 'queue' | 'plugin';

/** Runtime mode used by worker runners. */
export type WorkerRuntime = (typeof WORKER_RUNTIMES)[number];

/** Runtime enum value map backing {@link TaskTypeSchema}. */
const TaskTypeSchemaValues: { [TValue in TaskType]: TValue } = enumValues(TASK_TYPES);
/** Runtime enum value map backing {@link TaskStatusSchema}. */
const TaskStatusSchemaValues: { [TValue in TaskStatus]: TValue } = enumValues(TASK_STATUSES);
/** Runtime enum value map backing {@link ExecutionStatusSchema}. */
const ExecutionStatusSchemaValues: { [TValue in ExecutionStatus]: TValue } = enumValues(
  EXECUTION_STATUSES,
);
/** Runtime enum value map backing {@link JobSourceSchema}. */
const JobSourceSchemaValues: { [TValue in JobSource]: TValue } = enumValues(JOB_SOURCES);
/** Runtime enum value map backing {@link TaskSourceSchema}. */
const TaskSourceSchemaValues: { [TValue in TaskSource]: TValue } = enumValues(TASK_SOURCES);
/** Runtime enum value map backing {@link JobExecutionTypeSchema}. */
const JobExecutionTypeSchemaValues: { [TValue in JobExecutionType]: TValue } = enumValues(
  JOB_EXECUTION_TYPES,
);
/** Runtime enum value map backing {@link TriggerTypeSchema}. */
const TriggerTypeSchemaValues: { [TValue in TriggerType]: TValue } = enumValues(TRIGGER_TYPES);
/** Runtime enum value map backing {@link WorkerRuntimeSchema}. */
const WorkerRuntimeSchemaValues: { [TValue in WorkerRuntime]: TValue } = enumValues(
  WORKER_RUNTIMES,
);

/** Enum value map backing {@link TaskTypeSchema}. */
export type TaskTypeSchemaValues = { [TValue in TaskType]: TValue };
/** Enum value map backing {@link TaskStatusSchema}. */
export type TaskStatusSchemaValues = { [TValue in TaskStatus]: TValue };
/** Enum value map backing {@link ExecutionStatusSchema}. */
export type ExecutionStatusSchemaValues = { [TValue in ExecutionStatus]: TValue };
/** Enum value map backing {@link JobSourceSchema}. */
export type JobSourceSchemaValues = { [TValue in JobSource]: TValue };
/** Enum value map backing {@link TaskSourceSchema}. */
export type TaskSourceSchemaValues = { [TValue in TaskSource]: TValue };
/** Enum value map backing {@link JobExecutionTypeSchema}. */
export type JobExecutionTypeSchemaValues = { [TValue in JobExecutionType]: TValue };
/** Enum value map backing {@link TriggerTypeSchema}. */
export type TriggerTypeSchemaValues = { [TValue in TriggerType]: TValue };
/** Enum value map backing {@link WorkerRuntimeSchema}. */
export type WorkerRuntimeSchemaValues = { [TValue in WorkerRuntime]: TValue };

/** Zod schema for task execution runtimes. */
export const TaskTypeSchema: z.ZodEnum<TaskTypeSchemaValues> = z.enum(
  TaskTypeSchemaValues,
);

/** Zod schema for task statuses. */
export const TaskStatusSchema: z.ZodEnum<TaskStatusSchemaValues> = z.enum(
  TaskStatusSchemaValues,
);

/** Zod schema for job execution statuses. */
export const ExecutionStatusSchema: z.ZodEnum<ExecutionStatusSchemaValues> = z.enum(
  ExecutionStatusSchemaValues,
);

/** Zod schema for job sources. */
export const JobSourceSchema: z.ZodEnum<JobSourceSchemaValues> = z.enum(
  JobSourceSchemaValues,
);

/** Zod schema for task sources. */
export const TaskSourceSchema: z.ZodEnum<TaskSourceSchemaValues> = z.enum(
  TaskSourceSchemaValues,
);

/** Zod schema for job execution modes. */
export const JobExecutionTypeSchema: z.ZodEnum<JobExecutionTypeSchemaValues> = z.enum(
  JobExecutionTypeSchemaValues,
);

/** Zod schema for trigger sources. */
export const TriggerTypeSchema: z.ZodEnum<TriggerTypeSchemaValues> = z.enum(
  TriggerTypeSchemaValues,
);

/** Zod schema for worker runtime modes. */
export const WorkerRuntimeSchema: z.ZodEnum<WorkerRuntimeSchemaValues> = z.enum(
  WorkerRuntimeSchemaValues,
);
