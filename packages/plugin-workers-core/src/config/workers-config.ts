import { z } from 'zod';
import { type JobConfig, JobConfigZodSchema } from './job-config.ts';
import type { ConfigSchema } from './config-schema.ts';

/** Per-topic worker scaling configuration. */
export interface ScalingConfigData {
  /** Maximum concurrent workers for this topic. */
  readonly concurrency: number;
  /** Runtime deployment mode. */
  readonly mode: 'combined' | 'distributed';
}

/** Per-topic retention policy configuration. */
export interface TopicRetentionConfigData {
  /** Number of days execution history remains in KV. */
  readonly kvDays: number;
  /** Number of days execution history remains in the database. */
  readonly dbDays: number;
}

/** Worker group configuration for a topic. */
export interface WorkerGroupData {
  /** Queue topic owned by this group. */
  readonly topic: string;
  /** Scaling policy for this group. */
  readonly scaling?: ScalingConfigData;
  /** Retention policy for this group. */
  readonly retention?: TopicRetentionConfigData;
  /** Jobs assigned to this group. */
  readonly jobs: JobConfig[];
}

/** Queue backend provider selector. */
export type QueueProviderData = 'auto' | 'deno-kv' | 'redis' | 'postgres' | 'amqp';

/** Workers configuration section. */
export interface WorkersConfigData {
  /** Directory containing job modules. */
  readonly jobsDir: string;
  /** Directory containing task modules. */
  readonly tasksDir: string;
  /** Queue backend provider. */
  readonly queueProvider: QueueProviderData;
  /** Queue name used by the worker runtime. */
  readonly queueName: string;
  /** Default worker concurrency. */
  readonly concurrency: number;
  /** Legacy flat job definitions. */
  readonly jobs: JobConfig[];
  /** Topic-scoped worker groups. */
  readonly groups: WorkerGroupData[];
  /** Whether workers are enabled. */
  readonly enabled: boolean;
}

const ScalingConfigObjectSchema: z.ZodType<ScalingConfigData> = z.object({
  concurrency: z.number().min(1).default(2),
  mode: z.enum(['combined', 'distributed']).default('combined'),
});

const ScalingConfigZodSchema: z.ZodType<ScalingConfigData | undefined> = ScalingConfigObjectSchema
  .optional();

/** Per-topic scaling configuration schema. */
export const ScalingConfigSchema: ConfigSchema<ScalingConfigData | undefined> =
  ScalingConfigZodSchema;

const TopicRetentionConfigObjectSchema: z.ZodType<TopicRetentionConfigData> = z.object({
  kvDays: z.number().min(1).default(7),
  dbDays: z.number().min(1).default(90),
});

const TopicRetentionConfigZodSchema: z.ZodType<TopicRetentionConfigData | undefined> =
  TopicRetentionConfigObjectSchema.optional();

/** Per-topic retention policy schema. */
export const TopicRetentionConfigSchema: ConfigSchema<TopicRetentionConfigData | undefined> =
  TopicRetentionConfigZodSchema;

const WorkerGroupObjectSchema = z.object({
  topic: z.string().describe('Topic identifier for queue routing'),
  scaling: ScalingConfigZodSchema,
  retention: TopicRetentionConfigZodSchema,
  jobs: z.array(JobConfigZodSchema).default([]),
});

const WorkerGroupZodSchema = WorkerGroupObjectSchema as unknown as z.ZodType<WorkerGroupData>;

/** Worker group configuration schema. */
export const WorkerGroupSchema: ConfigSchema<WorkerGroupData> = WorkerGroupZodSchema;

const QueueProviderZodSchema: z.ZodType<QueueProviderData> = z.enum([
  'auto',
  'deno-kv',
  'redis',
  'postgres',
  'amqp',
]).default('auto');

/** Queue provider configuration schema. */
export const QueueProviderSchema: ConfigSchema<QueueProviderData> = QueueProviderZodSchema;

const WorkersConfigObjectSchema = z.object({
  jobsDir: z.string().default('./workers/jobs'),
  tasksDir: z.string().default('./workers/tasks'),
  queueProvider: QueueProviderZodSchema,
  queueName: z.string().default('jobs'),
  concurrency: z.number().default(2),
  jobs: z.array(JobConfigZodSchema).default([]),
  groups: z.array(WorkerGroupZodSchema).default([]),
  enabled: z.boolean().default(true),
});

const WorkersConfigZodSchema = WorkersConfigObjectSchema.transform((config) => ({
  ...config,
  groups: config.groups.map((group) => ({
    ...group,
    jobs: group.jobs.map((job) => ({
      ...job,
      topic: group.topic,
    })),
  })),
})).optional() as unknown as z.ZodType<WorkersConfigData | undefined>;

/** Workers plugin configuration schema. */
export const WorkersConfigSchema: ConfigSchema<WorkersConfigData | undefined> =
  WorkersConfigZodSchema as unknown as ConfigSchema<WorkersConfigData | undefined>;

/** Per-topic worker scaling configuration. */
export type ScalingConfig = ScalingConfigData | undefined;

/** Per-topic worker retention configuration. */
export type TopicRetentionConfig = TopicRetentionConfigData | undefined;

/** Worker group configuration for a topic. */
export type WorkerGroup = WorkerGroupData;

/** Queue backend provider selector. */
export type QueueProvider = QueueProviderData;

/** Workers configuration section. */
export type WorkersConfig = WorkersConfigData | undefined;

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
