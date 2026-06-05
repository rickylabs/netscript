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
export type TaskType = (typeof TASK_TYPES)[number];

/** Supported task execution status. */
export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Supported job execution status. */
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

/** Source that owns a job definition. */
export type JobSource = (typeof JOB_SOURCES)[number];

/** Source that owns a task definition. */
export type TaskSource = (typeof TASK_SOURCES)[number];

/** Job execution mode. */
export type JobExecutionType = (typeof JOB_EXECUTION_TYPES)[number];

/** Source that triggered a job or task execution. */
export type TriggerType = (typeof TRIGGER_TYPES)[number];

/** Runtime mode used by worker runners. */
export type WorkerRuntime = (typeof WORKER_RUNTIMES)[number];

const TaskTypeSchemaValues: { [TValue in TaskType]: TValue } = enumValues(TASK_TYPES);
const TaskStatusSchemaValues: { [TValue in TaskStatus]: TValue } = enumValues(TASK_STATUSES);
const ExecutionStatusSchemaValues: { [TValue in ExecutionStatus]: TValue } = enumValues(
  EXECUTION_STATUSES,
);
const JobSourceSchemaValues: { [TValue in JobSource]: TValue } = enumValues(JOB_SOURCES);
const TaskSourceSchemaValues: { [TValue in TaskSource]: TValue } = enumValues(TASK_SOURCES);
const JobExecutionTypeSchemaValues: { [TValue in JobExecutionType]: TValue } = enumValues(
  JOB_EXECUTION_TYPES,
);
const TriggerTypeSchemaValues: { [TValue in TriggerType]: TValue } = enumValues(TRIGGER_TYPES);
const WorkerRuntimeSchemaValues: { [TValue in WorkerRuntime]: TValue } = enumValues(
  WORKER_RUNTIMES,
);

/** Zod schema for task execution runtimes. */
export const TaskTypeSchema: z.ZodEnum<typeof TaskTypeSchemaValues> = z.enum(
  TaskTypeSchemaValues,
);

/** Zod schema for task statuses. */
export const TaskStatusSchema: z.ZodEnum<typeof TaskStatusSchemaValues> = z.enum(
  TaskStatusSchemaValues,
);

/** Zod schema for job execution statuses. */
export const ExecutionStatusSchema: z.ZodEnum<typeof ExecutionStatusSchemaValues> = z.enum(
  ExecutionStatusSchemaValues,
);

/** Zod schema for job sources. */
export const JobSourceSchema: z.ZodEnum<typeof JobSourceSchemaValues> = z.enum(
  JobSourceSchemaValues,
);

/** Zod schema for task sources. */
export const TaskSourceSchema: z.ZodEnum<typeof TaskSourceSchemaValues> = z.enum(
  TaskSourceSchemaValues,
);

/** Zod schema for job execution modes. */
export const JobExecutionTypeSchema: z.ZodEnum<typeof JobExecutionTypeSchemaValues> = z.enum(
  JobExecutionTypeSchemaValues,
);

/** Zod schema for trigger sources. */
export const TriggerTypeSchema: z.ZodEnum<typeof TriggerTypeSchemaValues> = z.enum(
  TriggerTypeSchemaValues,
);

/** Zod schema for worker runtime modes. */
export const WorkerRuntimeSchema: z.ZodEnum<typeof WorkerRuntimeSchemaValues> = z.enum(
  WorkerRuntimeSchemaValues,
);
