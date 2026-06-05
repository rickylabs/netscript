import { z } from 'zod';

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

/**
 * Main NetScript configuration schema.
 */
export const NetScriptConfigSchema: z.ZodType<any> = z.object({
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
  sagas: z.unknown().optional(),
  /** Plugin-owned triggers configuration. Trigger-specific validation lives in plugin-triggers-core. */
  triggers: z.unknown().optional(),
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
