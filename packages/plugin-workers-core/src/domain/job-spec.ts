import { z } from 'zod';
import type { JobDefinition } from './job-definition.ts';
import { JobDefinitionSchema } from './job-definition.ts';
import { DEFAULT_TOPIC, TriggerTypeSchema } from './constants.ts';

/** Public job specification consumed by registries and runtime adapters. */
export type JobSpec<
  TId extends string = string,
  TPayload = unknown,
  TResult = unknown,
> = JobDefinition<TId, TPayload, TResult>;

/** Message enqueued to trigger a job execution. */
type JobMessageShape = {
  jobId: z.ZodType<string>;
  topic: z.ZodType<string>;
  triggeredBy: typeof TriggerTypeSchema;
  triggeredAt: z.ZodType<string>;
  payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  correlationId: z.ZodOptional<z.ZodString>;
  traceparent: z.ZodOptional<z.ZodString>;
  tracestate: z.ZodOptional<z.ZodString>;
  priority: z.ZodType<number>;
  delay: z.ZodOptional<z.ZodNumber>;
};

const JobMessageShapeValue: JobMessageShape = {
  jobId: z.string().min(1).describe('Job identifier'),
  topic: z.string().default(DEFAULT_TOPIC).describe('Topic identifier'),
  triggeredBy: TriggerTypeSchema.describe('Trigger source'),
  triggeredAt: z.string().datetime().describe('Trigger timestamp'),
  payload: z.record(z.string(), z.unknown()).optional().describe('Job payload'),
  correlationId: z.string().optional().describe('Correlation ID'),
  traceparent: z.string().optional().describe('W3C traceparent'),
  tracestate: z.string().optional().describe('W3C tracestate'),
  priority: z.number().int().min(0).max(100).default(50).describe('Priority'),
  delay: z.number().int().nonnegative().optional().describe('Delay in ms'),
};
const JobMessageShape: JobMessageShape = JobMessageShapeValue;

/** Message enqueued to trigger a job execution. */
export const JobMessageSchema: z.ZodObject<typeof JobMessageShape> = z.object(JobMessageShape);

/** Message enqueued to trigger a job execution. */
export type JobMessage = z.infer<typeof JobMessageSchema>;

/** Message enqueued to trigger a task execution. */
type TaskMessageShape = {
  taskId: z.ZodType<string>;
  topic: z.ZodType<string>;
  triggeredBy: typeof TriggerTypeSchema;
  triggeredAt: z.ZodType<string>;
  payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  correlationId: z.ZodOptional<z.ZodString>;
  traceparent: z.ZodOptional<z.ZodString>;
  tracestate: z.ZodOptional<z.ZodString>;
  priority: z.ZodType<number>;
  delay: z.ZodOptional<z.ZodNumber>;
};

const TaskMessageShapeValue: TaskMessageShape = {
  taskId: z.string().min(1).describe('Task identifier'),
  topic: z.string().default(DEFAULT_TOPIC).describe('Topic identifier'),
  triggeredBy: TriggerTypeSchema.describe('Trigger source'),
  triggeredAt: z.string().datetime().describe('Trigger timestamp'),
  payload: z.record(z.string(), z.unknown()).optional().describe('Task payload'),
  correlationId: z.string().optional().describe('Correlation ID'),
  traceparent: z.string().optional().describe('W3C traceparent'),
  tracestate: z.string().optional().describe('W3C tracestate'),
  priority: z.number().int().min(0).max(100).default(50).describe('Priority'),
  delay: z.number().int().nonnegative().optional().describe('Delay in ms'),
};
const TaskMessageShape: TaskMessageShape = TaskMessageShapeValue;

/** Message enqueued to trigger a task execution. */
export const TaskMessageSchema: z.ZodObject<typeof TaskMessageShape> = z.object(TaskMessageShape);

/** Message enqueued to trigger a task execution. */
export type TaskMessage = z.infer<typeof TaskMessageSchema>;

/** Event published to request a job trigger. */
type JobTriggerEventShape = {
  jobId: z.ZodType<string>;
  payload: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  requestedBy: z.ZodType<string>;
  requestedAt: z.ZodType<string>;
  priority: z.ZodOptional<z.ZodNumber>;
  delay: z.ZodOptional<z.ZodNumber>;
  traceparent: z.ZodOptional<z.ZodString>;
  tracestate: z.ZodOptional<z.ZodString>;
};

const JobTriggerEventShapeValue: JobTriggerEventShape = {
  jobId: z.string().min(1).describe('Job identifier'),
  payload: z.record(z.string(), z.unknown()).optional().describe('Job payload'),
  requestedBy: z.string().describe('Requester identifier'),
  requestedAt: z.string().datetime().describe('Request timestamp'),
  priority: z.number().int().min(0).max(100).optional().describe('Priority'),
  delay: z.number().int().nonnegative().optional().describe('Delay in ms'),
  traceparent: z.string().optional().describe('W3C traceparent'),
  tracestate: z.string().optional().describe('W3C tracestate'),
};
const JobTriggerEventShape: JobTriggerEventShape = JobTriggerEventShapeValue;

/** Event published to request a job trigger. */
export const JobTriggerEventSchema: z.ZodObject<typeof JobTriggerEventShape> = z.object(
  JobTriggerEventShape,
);

/** Event published to request a job trigger. */
export type JobTriggerEvent = z.infer<typeof JobTriggerEventSchema>;

/** Event published when a job execution completes. */
type JobCompletionEventShape = {
  jobId: z.ZodType<string>;
  executionId: z.ZodType<string>;
  status: z.ZodType<'cancelled' | 'completed' | 'failed' | 'timeout'>;
  result: z.ZodType<Record<string, unknown> | null>;
  error: z.ZodType<string | null>;
  completedAt: z.ZodType<string>;
  duration: z.ZodType<number>;
  correlationId: z.ZodOptional<z.ZodString>;
};

const JobCompletionEventShapeValue: JobCompletionEventShape = {
  jobId: z.string().min(1).describe('Job identifier'),
  executionId: z.string().uuid().describe('Execution ID'),
  status: z.enum(['completed', 'failed', 'cancelled', 'timeout']).describe('Final status'),
  result: z.record(z.string(), z.unknown()).nullable().describe('Job result'),
  error: z.string().nullable().describe('Error message'),
  completedAt: z.string().datetime().describe('Completion timestamp'),
  duration: z.number().nonnegative().describe('Duration in ms'),
  correlationId: z.string().optional().describe('Correlation ID'),
};
const JobCompletionEventShape: JobCompletionEventShape = JobCompletionEventShapeValue;

/** Event published when a job execution completes. */
export const JobCompletionEventSchema: z.ZodObject<typeof JobCompletionEventShape> = z.object(
  JobCompletionEventShape,
);

/** Event published when a job execution completes. */
export type JobCompletionEvent = z.infer<typeof JobCompletionEventSchema>;

/** Input for registering a job. */
type RegisterJobInputShape = Omit<typeof JobDefinitionSchema.shape, 'id'> & {
  id: z.ZodOptional<z.ZodString>;
};

const RegisterJobInputShapeValue: RegisterJobInputShape = {
  ...JobDefinitionSchema.omit({ id: true }).shape,
  id: z.string().optional(),
};
const RegisterJobInputShape: RegisterJobInputShape = RegisterJobInputShapeValue;

/** Input for registering a job. */
export const RegisterJobInputSchema: z.ZodObject<typeof RegisterJobInputShape> = z.object(
  RegisterJobInputShape,
);

/** Input for registering a job. */
export type RegisterJobInput = z.input<typeof RegisterJobInputSchema>;

/** Plugin contribution containing jobs to register. */
type PluginJobContributionShape = {
  definitions: z.ZodArray<typeof RegisterJobInputSchema>;
  overwriteExisting: z.ZodType<boolean>;
  idPrefix: z.ZodOptional<z.ZodString>;
};

const PluginJobContributionShapeValue: PluginJobContributionShape = {
  definitions: z.array(RegisterJobInputSchema).describe('Job definitions'),
  overwriteExisting: z.boolean().default(false).describe('Overwrite existing jobs'),
  idPrefix: z.string().optional().describe('Job ID prefix'),
};
const PluginJobContributionShape: PluginJobContributionShape = PluginJobContributionShapeValue;

/** Plugin contribution containing jobs to register. */
export const PluginJobContributionSchema: z.ZodObject<typeof PluginJobContributionShape> = z
  .object(PluginJobContributionShape);

/** Plugin contribution containing jobs to register. */
export type PluginJobContribution = z.infer<typeof PluginJobContributionSchema>;

/** KV key factories used by the worker system. */
export const JobKvKeys = {
  execution: (topic: string, jobId: string, executionId: string) =>
    ['executions', 'job', topic, jobId, executionId] as const,
  byTopic: (topic: string) => ['executions', 'job', topic] as const,
  byJob: (topic: string, jobId: string) => ['executions', 'job', topic, jobId] as const,
  allExecutions: () => ['executions', 'job'] as const,
  taskExecution: (topic: string, taskId: string, executionId: string) =>
    ['executions', 'task', topic, taskId, executionId] as const,
  taskByTopic: (topic: string) => ['executions', 'task', topic] as const,
  taskByTask: (topic: string, taskId: string) => ['executions', 'task', topic, taskId] as const,
  allTaskExecutions: () => ['executions', 'task'] as const,
  allConceptExecutions: () => ['executions'] as const,
  job: (topic: string, jobId: string) => ['jobs', topic, jobId] as const,
  jobsByTopic: (topic: string) => ['jobs', topic] as const,
  allJobs: () => ['jobs'] as const,
  stats: (topic: string, jobId: string) => ['stats', topic, jobId] as const,
  jobDefinition: (jobId: string) => ['jobs', DEFAULT_TOPIC, jobId] as const,
  taskDefinition: (taskId: string) => ['tasks', taskId] as const,
  allTasks: () => ['tasks'] as const,
  byStatus: (status: string, concept: string, executionId: string) =>
    ['executions', 'by-status', status, concept, executionId] as const,
  byStatusPrefix: (status: string, concept: string) =>
    ['executions', 'by-status', status, concept] as const,
  byStatusAllPrefix: (status: string) => ['executions', 'by-status', status] as const,
  byCorrelation: (correlationId: string, executionId: string) =>
    ['executions', 'by-correlation', correlationId, executionId] as const,
  byCorrelationPrefix: (correlationId: string) =>
    ['executions', 'by-correlation', correlationId] as const,
  statusCount: (concept: string, status: string) =>
    ['executions', 'counts', concept, status] as const,
  statusCountPrefix: (concept: string) => ['executions', 'counts', concept] as const,
} as const;

/** SSE event names for real-time worker updates. */
export const SSEEventTypes = {
  executionCreated: 'execution.created',
  executionUpdated: 'execution.updated',
  executionDeleted: 'execution.deleted',
  jobRegistered: 'job.registered',
  jobUpdated: 'job.updated',
  jobUnregistered: 'job.unregistered',
  taskRegistered: 'task.registered',
  taskUpdated: 'task.updated',
  taskUnregistered: 'task.unregistered',
  workerStatus: 'worker.status',
  heartbeat: 'heartbeat',
  jobs: 'jobs',
  executions: 'executions',
  tasks: 'tasks',
} as const;

/** SSE event name for worker updates. */
export type SSEEventType = (typeof SSEEventTypes)[keyof typeof SSEEventTypes];

/** SSE event envelope for real-time worker updates. */
type SSEEventShape = {
  type: z.ZodType<string>;
  data: z.ZodType<unknown>;
  timestamp: z.ZodType<string>;
  id: z.ZodOptional<z.ZodString>;
};

const SSEEventShapeValue: SSEEventShape = {
  type: z.string().describe('Event type'),
  data: z.unknown().describe('Event payload'),
  timestamp: z.string().datetime().describe('Event timestamp'),
  id: z.string().optional().describe('Event ID for reconnection'),
};
const SSEEventShape: SSEEventShape = SSEEventShapeValue;

/** SSE event envelope for real-time worker updates. */
export const SSEEventSchema: z.ZodObject<typeof SSEEventShape> = z.object(SSEEventShape);

/** SSE event envelope for real-time worker updates. */
export type SSEEvent = z.infer<typeof SSEEventSchema>;
