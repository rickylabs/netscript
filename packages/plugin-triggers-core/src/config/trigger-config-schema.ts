import { z } from 'zod';
import type { TriggerKind } from '../domain/mod.ts';

export type TriggerConfigKind = Extract<
  TriggerKind,
  'webhook' | 'file-watch' | 'scheduled' | 'queue' | 'stream' | 'manual'
>;

interface TriggerDefinitionConfigData {
  readonly id: string;
  readonly name: string;
  readonly kind: TriggerConfigKind;
  readonly enabled: boolean;
  readonly entrypoint?: string;
  readonly tags: string[];
}

interface TriggerScalingConfigData {
  readonly concurrency: number;
}

interface TriggerRetentionConfigData {
  readonly kvDays: number;
  readonly dbDays: number;
}

interface TriggerGroupConfigData {
  readonly topic: string;
  readonly scaling: TriggerScalingConfigData;
  readonly retention: TriggerRetentionConfigData;
  readonly triggers: TriggerDefinitionConfigData[];
}

interface WebhookConfigData {
  readonly enabled: boolean;
  readonly basePath: string;
  readonly rateLimitPerMinute: number;
}

interface TriggersConfigData {
  readonly triggersDir: string;
  readonly groups: TriggerGroupConfigData[];
  readonly webhooks?: WebhookConfigData;
  readonly enabled: boolean;
}

/** Trigger definition config schema for `netscript.config.ts`. */
export const TriggerDefinitionConfigSchema: z.ZodType<TriggerDefinitionConfigData> = z.object({
  id: z.string().min(1).describe('Trigger identifier'),
  name: z.string().min(1).describe('Trigger name'),
  kind: z.enum(['webhook', 'file-watch', 'scheduled', 'queue', 'stream', 'manual']).default(
    'webhook',
  ),
  enabled: z.boolean().default(true),
  entrypoint: z.string().min(1).optional().describe('Trigger entrypoint file'),
  tags: z.array(z.string().min(1)).default([]),
});

/** Trigger group scaling configuration schema. */
export const TriggerScalingConfigSchema: z.ZodType<TriggerScalingConfigData> = z.object({
  concurrency: z.number().int().positive().default(10),
});

/** Trigger event retention configuration schema. */
export const TriggerRetentionConfigSchema: z.ZodType<TriggerRetentionConfigData> = z.object({
  kvDays: z.number().int().positive().default(7),
  dbDays: z.number().int().positive().default(90),
});

/** Topic-isolated trigger group schema. */
export const TriggerGroupSchema: z.ZodType<TriggerGroupConfigData> = z.object({
  topic: z.string().min(1).describe('Topic identifier for trigger grouping'),
  scaling: TriggerScalingConfigSchema.default({ concurrency: 10 }),
  retention: TriggerRetentionConfigSchema.default({ kvDays: 7, dbDays: 90 }),
  triggers: z.array(TriggerDefinitionConfigSchema).default([]),
});

/** Webhook ingestion configuration schema. */
export const WebhookConfigSchema: z.ZodType<WebhookConfigData> = z.object({
  enabled: z.boolean().default(false),
  basePath: z.string().default('/api/v1/webhooks'),
  rateLimitPerMinute: z.number().int().positive().default(60),
});

const TriggersConfigObjectSchema: z.ZodType<TriggersConfigData> = z.object({
  triggersDir: z.string().default('./triggers'),
  groups: z.array(TriggerGroupSchema).default([]),
  webhooks: WebhookConfigSchema.optional(),
  enabled: z.boolean().default(true),
});

/** Trigger plugin configuration schema. */
export const TriggersConfigSchema: z.ZodType<TriggersConfigData | undefined> =
  TriggersConfigObjectSchema.optional();

export type TriggerDefinitionConfig = z.infer<typeof TriggerDefinitionConfigSchema>;
export type TriggerScalingConfig = z.infer<typeof TriggerScalingConfigSchema>;
export type TriggerRetentionConfig = z.infer<typeof TriggerRetentionConfigSchema>;
export type TriggerGroupConfig = z.infer<typeof TriggerGroupSchema>;
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;
export type TriggersConfig = z.infer<typeof TriggersConfigSchema>;
export type TriggersConfigInput = Partial<Omit<NonNullable<TriggersConfig>, 'groups'>> & {
  readonly groups?: Array<
    & Partial<Omit<TriggerGroupConfig, 'topic' | 'triggers'>>
    & Pick<TriggerGroupConfig, 'topic'>
    & { readonly triggers?: Partial<TriggerDefinitionConfig>[] }
  >;
};
