import { z } from 'zod';
import type { NetScriptConfig } from '../config-root-types.ts';
import { AppConfigSchema } from './app-schema.ts';

import { AspireConfigSchema } from './aspire-schema.ts';

import { DatabaseConfigSchema } from './database-schema.ts';

import { DeployConfigSchema } from './deploy-schema.ts';

import { GatewayConfigSchema } from './gateway-schema.ts';

import { LoggingConfigSchema } from './logging-schema.ts';

import { PathsConfigSchema } from './paths-schema.ts';

import { RuntimeConfigSectionSchema } from './runtime-config-schema.ts';

import { SdkConfigSchema } from './sdk-schema.ts';

import { ServiceConfigSchema } from './service-schema.ts';

const SagaRetryConfigSchema = z.object({
  maxAttempts: z.number(),
  initialDelay: z.number(),
  maxDelay: z.number(),
  backoffMultiplier: z.number(),
  jitter: z.boolean(),
});

const SagaTimeoutConfigSchema = z.object({
  completionTimeout: z.number().optional(),
  minTimeout: z.number(),
  maxTimeout: z.number(),
});

const SagaDefinitionSchema = z.object({
  id: z.string(),
  topic: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  entrypoint: z.string(),
  enabled: z.boolean().default(true),
  retry: SagaRetryConfigSchema.optional(),
  timeout: SagaTimeoutConfigSchema.optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const SagaScalingConfigSchema = z.object({
  concurrency: z.number(),
  mode: z.enum(['combined', 'distributed']),
});

const SagaRetentionConfigSchema = z.object({
  activeDays: z.number(),
  completedDays: z.number(),
  archiveToDb: z.boolean(),
});

const SagaGroupSchema = z.object({
  topic: z.string(),
  scaling: SagaScalingConfigSchema.optional(),
  retention: SagaRetentionConfigSchema.optional(),
  sagas: z.array(SagaDefinitionSchema).default([]),
});

const SagasConfigSectionSchema = z
  .object({
    sagasDir: z.string().default('sagas'),
    transportProvider: z.enum(['auto', 'redis', 'rabbitmq', 'inmemory']).default('auto'),
    storeProvider: z.enum(['auto', 'redis', 'postgres', 'inmemory']).default('auto'),
    concurrency: z.number().default(1),
    retry: SagaRetryConfigSchema.optional(),
    timeout: SagaTimeoutConfigSchema.optional(),
    sagas: z.array(SagaDefinitionSchema).default([]),
    groups: z.array(SagaGroupSchema).default([]),
    enabled: z.boolean().default(true),
  })
  .optional();

const TriggerDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['file', 'webhook', 'cron', 'manual']).default('webhook'),
  enabled: z.boolean().default(true),
  entrypoint: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const TriggerScalingConfigSchema = z.object({
  concurrency: z.number(),
});

const TriggerRetentionConfigSchema = z.object({
  kvDays: z.number(),
  dbDays: z.number(),
});

const TriggerGroupSchema = z.object({
  topic: z.string(),
  scaling: TriggerScalingConfigSchema.default({ concurrency: 10 }),
  retention: TriggerRetentionConfigSchema.default({ kvDays: 7, dbDays: 90 }),
  triggers: z.array(TriggerDefinitionSchema).default([]),
});

const WebhookConfigSchema = z.object({
  enabled: z.boolean().default(false),
  basePath: z.string().default('/api/v1/webhooks'),
  rateLimitPerMinute: z.number().default(60),
});

const TriggersConfigSectionSchema = z
  .object({
    triggersDir: z.string().default('triggers'),
    groups: z.array(TriggerGroupSchema).default([]),
    webhooks: WebhookConfigSchema.optional(),
    enabled: z.boolean().default(true),
  })
  .optional();

/**
 * Main NetScript configuration schema.
 */
export const NetScriptConfigSchema: z.ZodType<NetScriptConfig> = z.object({
  /** Project name */
  name: z.string(),
  /** Project version */
  version: z.string().default('1.0.0'),
  /** Workspace-aware project paths used by CLI/generators */
  paths: PathsConfigSchema,
  /** Logging configuration */
  logging: LoggingConfigSchema,
  /** Aspire orchestration configuration */
  aspire: AspireConfigSchema,
  /** Database configurations (with optional active engine selector) */
  databases: z.object({
    active: z.enum(['mysql', 'postgres', 'mssql', 'postgresql', 'sqlite', 'sqlserver']).optional(),
    config: z.array(DatabaseConfigSchema),
  }),
  /** Service configurations */
  services: z.record(z.string(), ServiceConfigSchema).optional(),
  /** Frontend/app configurations */
  apps: z.record(z.string(), AppConfigSchema).optional(),
  /** Plugin-owned sagas configuration. Saga-specific validation lives in plugin-sagas-core. */
  sagas: SagasConfigSectionSchema,
  /** Plugin-owned triggers configuration. Trigger-specific validation lives in plugin-triggers-core. */
  triggers: TriggersConfigSectionSchema,
  /** Gateway configuration */
  gateway: GatewayConfigSchema,
  /** SDK generation configuration */
  sdk: SdkConfigSchema,
  /** Deployment configuration (CLI pipeline overrides) */
  deploy: DeployConfigSchema,
  /** Runtime schema/config generation paths */
  runtimeConfig: RuntimeConfigSectionSchema,
  /** Plugin manifest module specifiers loaded by host tooling */
  plugins: z.array(z.string()).default([]),
}).passthrough();
