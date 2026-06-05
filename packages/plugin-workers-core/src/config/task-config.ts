import { z } from 'zod';
import { TASK_SOURCES, TASK_TYPES } from '../domain/constants.ts';
import { TaskPermissionsInputSchema } from '../domain/task.ts';

type AnyZodObject = z.ZodObject<Record<string, z.ZodTypeAny>>;

/** Runtime task configuration schema. */
export const TaskConfigSchema: AnyZodObject = z.object({
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
export type TaskConfig = z.infer<typeof TaskConfigSchema>;
