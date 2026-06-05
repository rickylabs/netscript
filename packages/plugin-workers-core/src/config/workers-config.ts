import { z } from 'zod';
import { type JobConfig, JobConfigSchema } from './job-config.ts';

interface ScalingConfigData {
  readonly concurrency: number;
  readonly mode: 'combined' | 'distributed';
}

interface TopicRetentionConfigData {
  readonly kvDays: number;
  readonly dbDays: number;
}

interface WorkerGroupData {
  readonly topic: string;
  readonly scaling?: ScalingConfigData;
  readonly retention?: TopicRetentionConfigData;
  readonly jobs: JobConfig[];
}

type QueueProviderData = 'auto' | 'deno-kv' | 'redis' | 'postgres' | 'amqp';

interface WorkersConfigData {
  readonly jobsDir: string;
  readonly tasksDir: string;
  readonly queueProvider: QueueProviderData;
  readonly queueName: string;
  readonly concurrency: number;
  readonly jobs: JobConfig[];
  readonly groups: WorkerGroupData[];
  readonly enabled: boolean;
}

const ScalingConfigObjectSchema: z.ZodType<ScalingConfigData> = z.object({
  concurrency: z.number().min(1).default(2),
  mode: z.enum(['combined', 'distributed']).default('combined'),
});

/** Per-topic scaling configuration schema. */
export const ScalingConfigSchema: z.ZodType<ScalingConfigData | undefined> =
  ScalingConfigObjectSchema.optional();

const TopicRetentionConfigObjectSchema: z.ZodType<TopicRetentionConfigData> = z.object({
  kvDays: z.number().min(1).default(7),
  dbDays: z.number().min(1).default(90),
});

/** Per-topic retention policy schema. */
export const TopicRetentionConfigSchema: z.ZodType<TopicRetentionConfigData | undefined> =
  TopicRetentionConfigObjectSchema.optional();

const WorkerGroupObjectSchema: z.ZodType<WorkerGroupData> = z.object({
  topic: z.string().describe('Topic identifier for queue routing'),
  scaling: ScalingConfigSchema,
  retention: TopicRetentionConfigSchema,
  jobs: z.array(JobConfigSchema).default([]),
});

/** Worker group configuration schema. */
export const WorkerGroupSchema: z.ZodType<WorkerGroupData> = WorkerGroupObjectSchema;

/** Queue provider configuration schema. */
export const QueueProviderSchema: z.ZodType<QueueProviderData> = z.enum([
  'auto',
  'deno-kv',
  'redis',
  'postgres',
  'amqp',
]).default('auto');

const WorkersConfigObjectSchema: z.ZodType<WorkersConfigData> = z.object({
  jobsDir: z.string().default('./workers/jobs'),
  tasksDir: z.string().default('./workers/tasks'),
  queueProvider: QueueProviderSchema,
  queueName: z.string().default('jobs'),
  concurrency: z.number().default(2),
  jobs: z.array(JobConfigSchema).default([]),
  groups: z.array(WorkerGroupSchema).default([]),
  enabled: z.boolean().default(true),
});

/** Workers plugin configuration schema. */
export const WorkersConfigSchema: z.ZodType<WorkersConfigData | undefined> =
  WorkersConfigObjectSchema.transform((config) => ({
    ...config,
    groups: config.groups.map((group) => ({
      ...group,
      jobs: group.jobs.map((job) => ({
        ...job,
        topic: group.topic,
      })),
    })),
  })).optional();

/** Per-topic worker scaling configuration. */
export type ScalingConfig = z.infer<typeof ScalingConfigSchema>;

/** Per-topic worker retention configuration. */
export type TopicRetentionConfig = z.infer<typeof TopicRetentionConfigSchema>;

/** Worker group configuration for a topic. */
export type WorkerGroup = z.infer<typeof WorkerGroupSchema>;

/** Queue backend provider selector. */
export type QueueProvider = z.infer<typeof QueueProviderSchema>;

/** Workers configuration section. */
export type WorkersConfig = z.infer<typeof WorkersConfigSchema>;

/** Authoring form for a worker job before schema defaults are applied. */
export type JobConfigInput = Partial<JobConfig> & Pick<JobConfig, 'id' | 'name' | 'entrypoint'>;

/** Authoring form for split worker config files before schema defaults are applied. */
export interface WorkersConfigInput
  extends Partial<Omit<NonNullable<WorkersConfig>, 'jobs' | 'groups'>> {
  /** Legacy flat job definitions. */
  jobs?: JobConfigInput[];
  /** Worker groups organized by topic. */
  groups?: Array<
    & Partial<Omit<NonNullable<WorkersConfig>['groups'][number], 'jobs'>>
    & Pick<NonNullable<WorkersConfig>['groups'][number], 'topic'>
    & { jobs?: JobConfigInput[] }
  >;
}

/**
 * Define a split worker config module.
 *
 * @param config - Worker config authoring object.
 * @returns The same config object for downstream validation.
 */
export function defineWorkers(config: WorkersConfigInput): WorkersConfigInput {
  return config;
}

/**
 * Define a per-topic job array.
 *
 * @param jobs - Job config authoring objects.
 * @returns The same job array for downstream validation.
 */
export function defineJobs(jobs: JobConfigInput[]): JobConfigInput[] {
  return jobs;
}
