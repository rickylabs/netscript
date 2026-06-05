import { z } from 'zod';
import { JOB_SOURCES } from '../domain/constants.ts';
import { TaskPermissionsInputSchema } from '../domain/task.ts';

type AnyZodObject = z.ZodObject<Record<string, z.ZodTypeAny>>;

/** Retention settings for worker job executions. */
export const RetentionConfigSchema: z.ZodOptional<AnyZodObject> = z.object({
  archiveToDb: z.boolean().optional(),
  kvRetentionDays: z.number().optional(),
  dbRetentionDays: z.number().optional(),
  maxExecutions: z.number().optional(),
}).optional();

/** Worker job configuration schema. */
export const JobConfigSchema: AnyZodObject = z.object({
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
  retention: RetentionConfigSchema,
  enabled: z.boolean().default(true),
});

/** Retention settings for worker job executions. */
export type RetentionConfig = z.infer<typeof RetentionConfigSchema>;

/** Worker job configuration. */
export type JobConfig = z.infer<typeof JobConfigSchema>;
