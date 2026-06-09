import { z } from 'zod';
import type { SagaId } from '../domain/mod.ts';
import type { ConfigSchema } from './config-schema.ts';
import type { SagaConfigEntry } from './define-saga-config.ts';

/** Saga transport backend provider selector. */
export type SagaTransportProvider = 'auto' | 'redis' | 'rabbitmq' | 'inmemory';

/** Saga store backend provider selector. */
export type SagaStoreProvider = 'auto' | 'redis' | 'postgres' | 'inmemory';

/** Topic-level saga scaling configuration. */
export interface SagaScalingConfigData {
  /** Maximum concurrent saga handlers for the topic. */
  readonly concurrency: number;
  /** Runtime placement mode for this topic. */
  readonly mode: 'combined' | 'distributed';
}

/** Topic-level saga retention configuration. */
export interface SagaRetentionConfigData {
  /** Number of days active saga instances remain available. */
  readonly activeDays: number;
  /** Number of days completed saga instances remain available. */
  readonly completedDays: number;
  /** Whether completed saga instances are archived to the database. */
  readonly archiveToDb: boolean;
}

/** Topic-isolated saga group configuration. */
export interface SagaGroupConfigData {
  /** Topic identifier for message routing. */
  readonly topic: string;
  /** Scaling policy for this topic. */
  readonly scaling?: SagaScalingConfigData;
  /** Retention policy for this topic. */
  readonly retention?: SagaRetentionConfigData;
  /** Saga entries assigned to this topic. */
  readonly sagas: SagaConfigEntry[];
}

/** Saga plugin configuration after defaults and group topic normalization. */
export interface SagaConfigData {
  /** Directory containing saga modules. */
  readonly sagasDir: string;
  /** Transport backend provider selector. */
  readonly transportProvider: SagaTransportProvider;
  /** Store backend provider selector. */
  readonly storeProvider: SagaStoreProvider;
  /** Default concurrency budget. */
  readonly concurrency: number;
  /** Global retry policy. */
  readonly retry?: SagaConfigEntry['retry'];
  /** Global completion timeout policy. */
  readonly timeout?: SagaConfigEntry['timeout'];
  /** Legacy flat saga entries. */
  readonly sagas: SagaConfigEntry[];
  /** Topic-isolated saga groups. */
  readonly groups: SagaGroupConfigData[];
  /** Whether saga runtime contributions are enabled. */
  readonly enabled: boolean;
}

const SagaRetryConfigObjectSchema: z.ZodType<NonNullable<SagaConfigEntry['retry']>> = z.object({
  maxAttempts: z.number().min(0).default(5),
  initialDelay: z.number().min(100).default(1000),
  maxDelay: z.number().min(100).default(60000),
  backoffMultiplier: z.number().min(1).default(2),
  jitter: z.boolean().default(true),
});

/** Retry policy schema for global and per-saga config. */
const SagaRetryConfigZodSchema: z.ZodType<SagaConfigEntry['retry']> =
  SagaRetryConfigObjectSchema.optional();

/** Retry policy schema for global and per-saga config. */
export const SagaRetryConfigSchema: ConfigSchema<SagaConfigEntry['retry']> =
  SagaRetryConfigZodSchema;

const SagaTimeoutConfigObjectSchema: z.ZodType<NonNullable<SagaConfigEntry['timeout']>> = z
  .object({
    completionTimeout: z.number().min(1000).optional(),
    minTimeout: z.number().min(100).default(1000),
    maxTimeout: z.number().min(1000).default(7 * 24 * 60 * 60 * 1000),
  });

/** Completion timeout schema for global and per-saga config. */
const SagaTimeoutConfigZodSchema: z.ZodType<SagaConfigEntry['timeout']> =
  SagaTimeoutConfigObjectSchema.optional();

/** Completion timeout schema for global and per-saga config. */
export const SagaTimeoutConfigSchema: ConfigSchema<SagaConfigEntry['timeout']> =
  SagaTimeoutConfigZodSchema;

const SagaEntryConfigSchema: z.ZodType<SagaConfigEntry> = z.object({
  id: z.string().min(1).transform((id) => id as SagaId),
  topic: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  entrypoint: z.string().min(1),
  enabled: z.boolean().default(true),
  retry: SagaRetryConfigZodSchema,
  timeout: SagaTimeoutConfigZodSchema,
  tags: z.array(z.string().min(1)).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const SagaScalingConfigSchema: z.ZodType<SagaScalingConfigData | undefined> = z.object({
  concurrency: z.number().min(1).default(5),
  mode: z.enum(['combined', 'distributed']).default('combined'),
}).optional();

const SagaRetentionConfigSchema: z.ZodType<SagaRetentionConfigData | undefined> = z.object({
  activeDays: z.number().min(1).default(30),
  completedDays: z.number().min(1).default(7),
  archiveToDb: z.boolean().default(false),
}).optional();

/** Topic-isolated saga group schema. */
const SagaGroupZodSchema: z.ZodType<SagaGroupConfigData> = z.object({
  topic: z.string().min(1).describe('Topic identifier for message routing'),
  scaling: SagaScalingConfigSchema,
  retention: SagaRetentionConfigSchema,
  sagas: z.array(SagaEntryConfigSchema).default([]),
});

/** Topic-isolated saga group schema. */
export const SagaGroupSchema: ConfigSchema<SagaGroupConfigData> = SagaGroupZodSchema;

const SagaTransportProviderSchema: z.ZodType<SagaTransportProvider> = z.enum([
  'auto',
  'redis',
  'rabbitmq',
  'inmemory',
]).default('auto');

const SagaStoreProviderSchema: z.ZodType<SagaStoreProvider> = z.enum([
  'auto',
  'redis',
  'postgres',
  'inmemory',
]).default('auto');

const SagaConfigObjectSchema: z.ZodType<SagaConfigData> = z.object({
  sagasDir: z.string().default('./sagas'),
  transportProvider: SagaTransportProviderSchema,
  storeProvider: SagaStoreProviderSchema,
  concurrency: z.number().min(1).default(5),
  retry: SagaRetryConfigZodSchema,
  timeout: SagaTimeoutConfigZodSchema,
  sagas: z.array(SagaEntryConfigSchema).default([]),
  groups: z.array(SagaGroupZodSchema).default([]),
  enabled: z.boolean().default(true),
});

/** Saga plugin configuration schema. */
const SagaConfigZodSchema: z.ZodType<SagaConfigData | undefined> = SagaConfigObjectSchema
  .transform((config) => ({
    ...config,
    groups: config.groups.map((group) => ({
      ...group,
      sagas: group.sagas.map((saga) => ({
        ...saga,
        topic: group.topic,
      })),
    })),
  }))
  .optional();

/** Saga plugin configuration schema. */
export const SagaConfigSchema: ConfigSchema<SagaConfigData | undefined> = SagaConfigZodSchema;

/** Saga plugin configuration after defaults and group topic normalization. */
export type SagaConfig = SagaConfigData | undefined;

/** Topic-isolated saga group after defaults. */
export type SagaGroupConfig = SagaGroupConfigData;

/** Retry policy after defaults. */
export type SagaRetryConfig = SagaConfigEntry['retry'];

/** Timeout policy after defaults. */
export type SagaTimeoutConfig = SagaConfigEntry['timeout'];

/** Authoring form for saga config before schema defaults are applied. */
export interface SagaConfigInput extends Partial<Omit<NonNullable<SagaConfig>, 'groups'>> {
  /** Topic-isolated saga groups. */
  groups?: Array<
    & Partial<Omit<SagaGroupConfig, 'sagas' | 'topic'>>
    & Pick<SagaGroupConfig, 'topic'>
    & { sagas?: Partial<SagaConfigEntry>[] }
  >;
}
