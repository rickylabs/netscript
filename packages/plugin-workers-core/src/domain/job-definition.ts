import { z } from 'zod';
import type { JobHandler } from './job-handler.ts';
import {
  DEFAULT_TOPIC,
  ExecutionStatusSchema,
  JobExecutionTypeSchema,
  JobSourceSchema,
  TriggerTypeSchema,
} from './constants.ts';
import { JobDefinitionPublicBaseSchema } from './public-schema.ts';
import { TaskPermissionsInputSchema } from './task.ts';

/** Branded worker job identifier. */
export type JobId<TId extends string = string> = TId & { readonly __brand: 'JobId' };

type JobEditableShape = {
  name: z.ZodType<string>;
  description: z.ZodOptional<z.ZodString>;
  entrypoint: z.ZodType<string>;
  schedule: z.ZodOptional<z.ZodString>;
  timezone: z.ZodType<string>;
  timeout: z.ZodType<number>;
  maxRetries: z.ZodType<number>;
  priority: z.ZodType<number>;
  enabled: z.ZodType<boolean>;
  tags: z.ZodType<string[]>;
  metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  retention: z.ZodOptional<z.ZodType<Record<string, unknown>>>;
};

const JobEditableShapeValue: JobEditableShape = {
  ...JobDefinitionPublicBaseSchema.omit({ id: true, topic: true }).shape,
  name: z.string().min(1).describe('Job name'),
  description: z.string().optional().describe('Job description'),
  entrypoint: z.string().describe('Script entrypoint path'),
  schedule: z.string().optional().describe('Cron schedule'),
  timezone: z.string().default('UTC').describe('Schedule timezone'),
  timeout: z.number().int().positive().default(300000).describe('Timeout in ms'),
  maxRetries: z.number().int().nonnegative().default(3).describe('Max retries'),
  priority: z.number().int().min(0).max(100).default(50).describe('Job priority'),
  enabled: z.boolean().default(true).describe('Job enabled'),
  tags: z.array(z.string()).default([]).describe('Job tags'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Additional metadata'),
  retention: z.object({
    archiveToDb: z.boolean().default(true).describe('Archive to database'),
    kvRetentionDays: z.number().int().positive().default(3).describe('KV retention days'),
    dbRetentionDays: z.number().int().nonnegative().default(30).describe('DB retention days'),
    maxExecutions: z.number().int().nonnegative().default(0).describe('Max executions in KV'),
  }).optional().describe('Execution retention settings'),
};
const JobEditableShape: JobEditableShape = JobEditableShapeValue;

/** User-editable job fields. */
export const JobEditableSchema: z.ZodObject<typeof JobEditableShape> = z.object(JobEditableShape);

type JobSystemShape = {
  id: z.ZodType<string>;
  topic: z.ZodType<string>;
  source: z.ZodType<typeof JobSourceSchema['_output']>;
  pluginId: z.ZodOptional<z.ZodString>;
  executionType: z.ZodType<typeof JobExecutionTypeSchema['_output']>;
  sourceUrl: z.ZodOptional<z.ZodString>;
  importMapUrl: z.ZodOptional<z.ZodString>;
  allowedImportHosts: z.ZodOptional<z.ZodArray<z.ZodString>>;
  wrapperType: z.ZodOptional<z.ZodString>;
  wrapperConfig: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  retryDelay: z.ZodType<number>;
  maxConcurrency: z.ZodType<number>;
  persist: z.ZodType<boolean>;
  permissions: z.ZodOptional<typeof TaskPermissionsInputSchema>;
  signature: z.ZodOptional<z.ZodType<Record<string, unknown>>>;
};

const JobSystemShapeValue: JobSystemShape = {
  ...JobDefinitionPublicBaseSchema.pick({ id: true, topic: true }).shape,
  id: z.string().min(1).describe('Job identifier'),
  topic: z.string().default(DEFAULT_TOPIC).describe('Topic identifier'),
  source: JobSourceSchema.default('local').describe('Job source'),
  pluginId: z.string().optional().describe('Source plugin ID'),
  executionType: JobExecutionTypeSchema.default('deno').describe('Execution type'),
  sourceUrl: z.string().url().optional().describe('Remote script URL'),
  importMapUrl: z.string().url().optional().describe('Import map URL'),
  allowedImportHosts: z.array(z.string()).optional().describe('Allowed import hosts'),
  wrapperType: z.string().optional().describe('Wrapper type'),
  wrapperConfig: z.record(z.string(), z.unknown()).optional().describe('Wrapper config'),
  retryDelay: z.number().int().nonnegative().default(1000).describe('Retry delay in ms'),
  maxConcurrency: z.number().int().nonnegative().default(1).describe('Max concurrent runs'),
  persist: z.boolean().default(true).describe('Persist to database'),
  permissions: TaskPermissionsInputSchema.optional().describe('Deno permissions'),
  signature: z.object({
    algorithm: z.enum(['sha256', 'sha384', 'sha512']),
    value: z.string(),
    keyId: z.string().optional(),
  }).optional().describe('Script signature'),
};
const JobSystemShape: JobSystemShape = JobSystemShapeValue;

/** System-managed job fields. */
export const JobSystemSchema: z.ZodObject<typeof JobSystemShape> = z.object(JobSystemShape);

type JobDefinitionShape = JobEditableShape & JobSystemShape;

const JobDefinitionShapeValue: JobDefinitionShape = {
  ...JobEditableSchema.shape,
  ...JobSystemSchema.shape,
};
const JobDefinitionShape: JobDefinitionShape = JobDefinitionShapeValue;

/** Full job definition schema. */
export const JobDefinitionSchema: z.ZodObject<typeof JobDefinitionShape> = z.object(
  JobDefinitionShape,
);

/** User-editable job fields. */
export type JobEditable = typeof JobEditableSchema['_output'];

/** System-managed job fields. */
export type JobSystem = typeof JobSystemSchema['_output'];

/** Stored job definition. */
export type StoredJobDefinition = JobEditable & JobSystem;

/** Public job definition produced by the job builder. */
export type JobDefinition<
  TId extends string = string,
  TPayload = unknown,
  TResult = unknown,
> = Readonly<
  Omit<typeof JobDefinitionSchema['_output'], 'id' | 'entrypoint'> & {
    id: JobId<TId>;
    entrypoint?: string;
    handler?: JobHandler<TPayload, TResult>;
  }
>;

type JobResponseShape =
  & Omit<JobEditableShape, 'entrypoint'>
  & { entrypoint: z.ZodOptional<z.ZodString> }
  & Pick<
    JobSystemShape,
    'executionType' | 'id' | 'pluginId' | 'source' | 'topic'
  >;

const JobResponseShapeValue: JobResponseShape = {
  ...JobEditableSchema.shape,
  entrypoint: z.string().optional().describe('Script entrypoint path'),
  ...JobSystemSchema.pick({
    id: true,
    topic: true,
    source: true,
    pluginId: true,
    executionType: true,
  }).shape,
};
const JobResponseShape: JobResponseShape = JobResponseShapeValue;

/** API-safe job response schema. */
export const JobResponseSchema: z.ZodObject<typeof JobResponseShape> = z.object(JobResponseShape);

/** API-safe job response. */
export type JobResponse = z.output<typeof JobResponseSchema>;

type ExecutionRecordShape = {
  id: z.ZodType<string>;
  concept: z.ZodType<'job' | 'task'>;
  jobId: z.ZodType<string>;
  topic: z.ZodType<string>;
  status: typeof ExecutionStatusSchema;
  triggeredBy: typeof TriggerTypeSchema;
  triggeredAt: z.ZodType<string>;
  startedAt: z.ZodType<string | null>;
  completedAt: z.ZodType<string | null>;
  exitCode: z.ZodType<number | null>;
  duration: z.ZodType<number | null>;
  error: z.ZodType<string | null>;
  result: z.ZodType<Record<string, unknown> | null>;
  workerId: z.ZodType<string | null>;
  attempt: z.ZodType<number>;
  maxAttempts: z.ZodType<number>;
  payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  correlationId: z.ZodOptional<z.ZodString>;
  traceparent: z.ZodOptional<z.ZodString>;
  tracestate: z.ZodOptional<z.ZodString>;
};

const ExecutionRecordShapeValue: ExecutionRecordShape = {
  id: z.string().uuid().describe('Execution ID'),
  concept: z.enum(['job', 'task']).default('job').describe('Execution concept'),
  jobId: z.string().min(1).describe('Job or task identifier'),
  topic: z.string().default(DEFAULT_TOPIC).describe('Topic identifier'),
  status: ExecutionStatusSchema.describe('Execution status'),
  triggeredBy: TriggerTypeSchema.describe('Trigger source'),
  triggeredAt: z.string().datetime().describe('Trigger timestamp'),
  startedAt: z.string().datetime().nullable().describe('Start timestamp'),
  completedAt: z.string().datetime().nullable().describe('Completion timestamp'),
  exitCode: z.number().int().nullable().describe('Exit code'),
  duration: z.number().nonnegative().nullable().describe('Duration in ms'),
  error: z.string().nullable().describe('Error message'),
  result: z.record(z.string(), z.unknown()).nullable().describe('Job result'),
  workerId: z.string().nullable().describe('Worker ID'),
  attempt: z.number().int().nonnegative().default(0).describe('Attempt number'),
  maxAttempts: z.number().int().positive().default(3).describe('Max attempts'),
  payload: z.record(z.string(), z.unknown()).optional().describe('Job payload'),
  correlationId: z.string().optional().describe('Correlation ID'),
  traceparent: z.string().optional().describe('W3C traceparent'),
  tracestate: z.string().optional().describe('W3C tracestate'),
};
const ExecutionRecordShape: ExecutionRecordShape = ExecutionRecordShapeValue;

/** Execution record schema stored for real-time job and task state. */
export const ExecutionRecordSchema: z.ZodObject<typeof ExecutionRecordShape> = z.object(
  ExecutionRecordShape,
);

/** Execution record stored for real-time job and task state. */
export type ExecutionRecord = Readonly<
  Record<string, unknown> & {
    readonly id: string;
    readonly concept: 'job' | 'task';
    readonly jobId: string;
    readonly topic: string;
    readonly status: z.output<typeof ExecutionStatusSchema>;
    readonly triggeredBy: z.output<typeof TriggerTypeSchema>;
    readonly triggeredAt: string;
    readonly startedAt: string | null;
    readonly completedAt: string | null;
    readonly exitCode: number | null;
    readonly duration: number | null;
    readonly error: string | null;
    readonly result: Record<string, unknown> | null;
    readonly workerId: string | null;
    readonly attempt: number;
    readonly maxAttempts: number;
    readonly payload?: Record<string, unknown>;
    readonly correlationId?: string;
    readonly traceparent?: string;
    readonly tracestate?: string;
  }
>;

/** Lightweight execution state used by runtime inspectors. */
export type ExecutionState = Readonly<{
  id: string;
  status: typeof ExecutionStatusSchema['_output'];
  updatedAt: string;
}>;
