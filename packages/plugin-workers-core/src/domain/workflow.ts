import { z } from 'zod';
import { WorkflowDefinitionPublicBaseSchema } from './public-schema.ts';

/** Branded worker workflow identifier. */
export type WorkflowId<TId extends string = string> = TId & { readonly __brand: 'WorkflowId' };

const WORKFLOW_EXECUTION_STATUSES = {
  cancelled: 'cancelled',
  completed: 'completed',
  failed: 'failed',
  pending: 'pending',
  running: 'running',
} as const;

/** Runtime status for a workflow execution. */
export const WorkflowExecutionStatusSchema: z.ZodEnum<typeof WORKFLOW_EXECUTION_STATUSES> = z.enum(
  WORKFLOW_EXECUTION_STATUSES,
);

/** Runtime status for a workflow execution. */
export type WorkflowExecutionStatus = typeof WorkflowExecutionStatusSchema['_output'];

const WORKFLOW_STEP_STATUSES = {
  completed: 'completed',
  failed: 'failed',
  skipped: 'skipped',
} as const;

/** Runtime status for an individual workflow step. */
export const WorkflowStepStatusSchema: z.ZodEnum<typeof WORKFLOW_STEP_STATUSES> = z.enum(
  WORKFLOW_STEP_STATUSES,
);

/** Runtime status for an individual workflow step. */
export type WorkflowStepStatus = typeof WorkflowStepStatusSchema['_output'];

const WORKFLOW_STEP_KINDS = {
  job: 'job',
  sleep: 'sleep',
  task: 'task',
} as const;

/** Workflow step kind. */
export const WorkflowStepKindSchema: z.ZodEnum<typeof WORKFLOW_STEP_KINDS> = z.enum(
  WORKFLOW_STEP_KINDS,
);

/** Workflow step kind. */
export type WorkflowStepKind = 'job' | 'sleep' | 'task';

type WorkflowStepShape = {
  id: z.ZodType<string>;
  kind: z.ZodType<WorkflowStepKind>;
  taskId: z.ZodType<string | undefined>;
  jobId: z.ZodType<string | undefined>;
  payload: z.ZodType<unknown>;
  durationMs: z.ZodType<number | undefined>;
};

const WorkflowStepShape: WorkflowStepShape = {
  id: z.string().min(1),
  kind: WorkflowStepKindSchema,
  taskId: z.string().optional(),
  jobId: z.string().optional(),
  payload: z.unknown().optional(),
  durationMs: z.number().int().positive().optional(),
};

/** Single workflow step schema. */
export const WorkflowStepSchema: z.ZodObject<typeof WorkflowStepShape> = z.object(
  WorkflowStepShape,
);

/** Single workflow step in a worker workflow definition. */
export type WorkflowStep = Readonly<
  {
    id: string;
    kind: WorkflowStepKind;
    taskId?: string;
    jobId?: string;
    payload?: unknown;
    durationMs?: number;
  }
>;

type WorkflowDefinitionShape = {
  id: z.ZodType<string>;
  steps: z.ZodType<WorkflowStep[]>;
  timeout: z.ZodType<number | undefined>;
  tags: z.ZodType<string[] | undefined>;
  metadata: z.ZodType<Record<string, unknown> | undefined>;
};

const WorkflowDefinitionShape: WorkflowDefinitionShape = {
  ...WorkflowDefinitionPublicBaseSchema.shape,
  id: z.string().min(1).describe('Workflow identifier'),
  steps: z.array(WorkflowStepSchema).describe('Workflow steps'),
  timeout: z.number().int().positive().optional().describe('Workflow timeout in ms'),
  tags: z.array(z.string()).optional().describe('Workflow tags'),
  metadata: z.record(z.string(), z.unknown()).optional().describe('Additional metadata'),
};

/** Full workflow definition schema. */
export const WorkflowDefinitionSchema: z.ZodObject<typeof WorkflowDefinitionShape> = z.object(
  WorkflowDefinitionShape,
);

/** Public workflow definition produced by the workflow builder. */
export type WorkflowDefinition<TId extends string = string> = Readonly<{
  id: WorkflowId<TId>;
  steps: readonly WorkflowStep[];
  timeout?: number;
  tags?: readonly string[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

type WorkflowStepResultShape = {
  stepId: z.ZodType<string>;
  status: z.ZodType<WorkflowStepStatus>;
  output: z.ZodType<unknown>;
  error: z.ZodType<string | undefined>;
  duration: z.ZodType<number>;
  completedAt: z.ZodType<string>;
};

const WorkflowStepResultShape: WorkflowStepResultShape = {
  stepId: z.string().min(1),
  status: WorkflowStepStatusSchema,
  output: z.unknown().optional(),
  error: z.string().optional(),
  duration: z.number().nonnegative(),
  completedAt: z.string().datetime(),
};

/** Result recorded for one workflow step. */
export const WorkflowStepResultSchema: z.ZodObject<typeof WorkflowStepResultShape> = z.object(
  WorkflowStepResultShape,
);

/** Result recorded for one workflow step. */
export type WorkflowStepResult = Readonly<
  & Pick<
    typeof WorkflowStepResultSchema['_output'],
    'completedAt' | 'duration' | 'status' | 'stepId'
  >
  & Partial<
    Omit<
      typeof WorkflowStepResultSchema['_output'],
      'completedAt' | 'duration' | 'status' | 'stepId'
    >
  >
>;

/** Step results indexed by step identifier. */
export type WorkflowResults = Readonly<Record<string, WorkflowStepResult>>;

const WORKFLOW_TRIGGER_TYPES = {
  cron: 'cron',
  event: 'event',
  manual: 'manual',
  queue: 'queue',
} as const;
const WorkflowTriggerTypeSchema: z.ZodEnum<typeof WORKFLOW_TRIGGER_TYPES> = z.enum(
  WORKFLOW_TRIGGER_TYPES,
);

type WorkflowStateShape = {
  workflowId: z.ZodType<string>;
  executionId: z.ZodType<string>;
  status: z.ZodType<WorkflowExecutionStatus>;
  currentStepIndex: z.ZodType<number>;
  results: z.ZodType<Record<string, WorkflowStepResult>>;
  startedAt: z.ZodType<string>;
  completedAt: z.ZodType<string | undefined>;
  duration: z.ZodType<number | undefined>;
  error: z.ZodType<string | undefined>;
  triggeredBy: z.ZodType<typeof WORKFLOW_TRIGGER_TYPES[keyof typeof WORKFLOW_TRIGGER_TYPES]>;
  payload: z.ZodType<unknown>;
};

const WorkflowStateShape: WorkflowStateShape = {
  workflowId: z.string().min(1),
  executionId: z.string().min(1),
  status: WorkflowExecutionStatusSchema,
  currentStepIndex: z.number().int().nonnegative(),
  results: z.record(z.string(), WorkflowStepResultSchema),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  duration: z.number().nonnegative().optional(),
  error: z.string().optional(),
  triggeredBy: WorkflowTriggerTypeSchema,
  payload: z.unknown().optional(),
};

/** Durable workflow execution state schema. */
export const WorkflowStateSchema: z.ZodObject<typeof WorkflowStateShape> = z.object(
  WorkflowStateShape,
);

/** Durable workflow execution state. */
export type WorkflowState<TPayload = unknown> = Readonly<
  Partial<Omit<typeof WorkflowStateSchema['_output'], 'payload' | 'results'>> & {
    workflowId: string;
    executionId: string;
    status: WorkflowExecutionStatus;
    currentStepIndex: number;
    startedAt: string;
    results: WorkflowResults;
    payload?: TPayload;
  }
>;

/** Options for starting or resuming workflow execution. */
export type WorkflowExecutionOptions<TPayload = unknown> = Readonly<{
  executionId?: string;
  payload?: TPayload;
  triggeredBy?: typeof WORKFLOW_TRIGGER_TYPES[keyof typeof WORKFLOW_TRIGGER_TYPES];
}>;

/** Event that can be routed to a workflow execution. */
export type WorkflowEvent<T = unknown> = Readonly<{
  executionId: string;
  eventName: string;
  data: T;
  sentAt: string;
}>;
