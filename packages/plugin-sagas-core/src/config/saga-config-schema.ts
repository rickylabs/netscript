import { z } from 'zod';
import type { SagaId } from '../domain/mod.ts';
import type { SagaConfigEntry } from './define-saga-config.ts';

type SagaTransportProvider = 'auto' | 'redis' | 'rabbitmq' | 'inmemory';
type SagaStoreProvider = 'auto' | 'redis' | 'postgres' | 'inmemory';

interface SagaScalingConfigData {
  readonly concurrency: number;
  readonly mode: 'combined' | 'distributed';
}

interface SagaRetentionConfigData {
  readonly activeDays: number;
  readonly completedDays: number;
  readonly archiveToDb: boolean;
}

interface SagaGroupConfigData {
  readonly topic: string;
  readonly scaling?: SagaScalingConfigData;
  readonly retention?: SagaRetentionConfigData;
  readonly sagas: SagaConfigEntry[];
}

interface SagaConfigData {
  readonly sagasDir: string;
  readonly transportProvider: SagaTransportProvider;
  readonly storeProvider: SagaStoreProvider;
  readonly concurrency: number;
  readonly retry?: SagaConfigEntry['retry'];
  readonly timeout?: SagaConfigEntry['timeout'];
  readonly sagas: SagaConfigEntry[];
  readonly groups: SagaGroupConfigData[];
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
export const SagaRetryConfigSchema: z.ZodType<SagaConfigEntry['retry']> =
  SagaRetryConfigObjectSchema.optional();

const SagaTimeoutConfigObjectSchema: z.ZodType<NonNullable<SagaConfigEntry['timeout']>> = z
  .object({
    completionTimeout: z.number().min(1000).optional(),
    minTimeout: z.number().min(100).default(1000),
    maxTimeout: z.number().min(1000).default(7 * 24 * 60 * 60 * 1000),
  });

/** Completion timeout schema for global and per-saga config. */
export const SagaTimeoutConfigSchema: z.ZodType<SagaConfigEntry['timeout']> =
  SagaTimeoutConfigObjectSchema.optional();

const SagaEntryConfigSchema: z.ZodType<SagaConfigEntry> = z.object({
  id: z.string().min(1).transform((id) => id as SagaId),
  topic: z.string().min(1).optional(),
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  entrypoint: z.string().min(1),
  enabled: z.boolean().default(true),
  retry: SagaRetryConfigSchema,
  timeout: SagaTimeoutConfigSchema,
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
export const SagaGroupSchema: z.ZodType<SagaGroupConfigData> = z.object({
  topic: z.string().min(1).describe('Topic identifier for message routing'),
  scaling: SagaScalingConfigSchema,
  retention: SagaRetentionConfigSchema,
  sagas: z.array(SagaEntryConfigSchema).default([]),
});

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
  retry: SagaRetryConfigSchema,
  timeout: SagaTimeoutConfigSchema,
  sagas: z.array(SagaEntryConfigSchema).default([]),
  groups: z.array(SagaGroupSchema).default([]),
  enabled: z.boolean().default(true),
});

/** Saga plugin configuration schema. */
export const SagaConfigSchema: z.ZodType<SagaConfigData | undefined> = SagaConfigObjectSchema
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

/** Saga plugin configuration after defaults and group topic normalization. */
export type SagaConfig = z.infer<typeof SagaConfigSchema>;

/** Topic-isolated saga group after defaults. */
export type SagaGroupConfig = z.infer<typeof SagaGroupSchema>;

/** Retry policy after defaults. */
export type SagaRetryConfig = z.infer<typeof SagaRetryConfigSchema>;

/** Timeout policy after defaults. */
export type SagaTimeoutConfig = z.infer<typeof SagaTimeoutConfigSchema>;

/** Authoring form for saga config before schema defaults are applied. */
export interface SagaConfigInput extends Partial<Omit<NonNullable<SagaConfig>, 'groups'>> {
  /** Topic-isolated saga groups. */
  groups?: Array<
    & Partial<Omit<SagaGroupConfig, 'sagas' | 'topic'>>
    & Pick<SagaGroupConfig, 'topic'>
    & { sagas?: Partial<SagaConfigEntry>[] }
  >;
}
