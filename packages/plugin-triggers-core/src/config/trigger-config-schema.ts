import { z } from 'zod';

/** Minimal schema contract exposed without leaking Zod internals. */
export type TriggerConfigSchema<TOutput> = Readonly<{
  parse(data: unknown): TOutput;
  safeParse(data: unknown):
    | { readonly success: true; readonly data: TOutput }
    | { readonly success: false; readonly error: unknown };
}>;

/** Trigger kinds accepted in `netscript.config.ts`. */
export const TRIGGER_CONFIG_KINDS: readonly [
  'webhook',
  'file-watch',
  'scheduled',
  'queue',
  'stream',
  'manual',
] = ['webhook', 'file-watch', 'scheduled', 'queue', 'stream', 'manual'];

/** Trigger kinds accepted in `netscript.config.ts`. */
export type TriggerConfigKind = (typeof TRIGGER_CONFIG_KINDS)[number];

/** Config entry for a discovered trigger definition. */
export type TriggerDefinitionConfig = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly kind: TriggerConfigKind;
  readonly enabled: boolean;
  readonly entrypoint?: string;
  readonly tags: string[];
}>;

/** Per-group trigger runtime scaling settings. */
export type TriggerScalingConfig = Readonly<{
  readonly concurrency: number;
}>;

/** Retention windows for trigger event storage. */
export type TriggerRetentionConfig = Readonly<{
  readonly kvDays: number;
  readonly dbDays: number;
}>;

/** Topic-isolated trigger group configuration. */
export type TriggerGroupConfig = Readonly<{
  readonly topic: string;
  readonly scaling: TriggerScalingConfig;
  readonly retention: TriggerRetentionConfig;
  readonly triggers: TriggerDefinitionConfig[];
}>;

/** Webhook ingress configuration. */
export type WebhookConfig = Readonly<{
  readonly enabled: boolean;
  readonly basePath: string;
  readonly rateLimitPerMinute: number;
}>;

/** Root trigger plugin configuration when enabled. */
export type TriggersConfig =
  | Readonly<{
    readonly triggersDir: string;
    readonly groups: TriggerGroupConfig[];
    readonly webhooks?: WebhookConfig;
    readonly enabled: boolean;
  }>
  | undefined;

const triggerDefinitionConfigSchema: z.ZodType<TriggerDefinitionConfig> = z.object({
  id: z.string().min(1).describe('Trigger identifier'),
  name: z.string().min(1).describe('Trigger name'),
  kind: z.enum(TRIGGER_CONFIG_KINDS).default('webhook'),
  enabled: z.boolean().default(true),
  entrypoint: z.string().min(1).optional().describe('Trigger entrypoint file'),
  tags: z.array(z.string().min(1)).default([]),
});

/** Trigger definition config schema for `netscript.config.ts`. */
export const TriggerDefinitionConfigSchema: TriggerConfigSchema<TriggerDefinitionConfig> =
  triggerDefinitionConfigSchema;

const triggerScalingConfigSchema: z.ZodType<TriggerScalingConfig> = z.object({
  concurrency: z.number().int().positive().default(10),
});

/** Trigger group scaling configuration schema. */
export const TriggerScalingConfigSchema: TriggerConfigSchema<TriggerScalingConfig> =
  triggerScalingConfigSchema;

const triggerRetentionConfigSchema: z.ZodType<TriggerRetentionConfig> = z.object({
  kvDays: z.number().int().positive().default(7),
  dbDays: z.number().int().positive().default(90),
});

/** Trigger event retention configuration schema. */
export const TriggerRetentionConfigSchema: TriggerConfigSchema<TriggerRetentionConfig> =
  triggerRetentionConfigSchema;

const triggerGroupSchema: z.ZodType<TriggerGroupConfig> = z.object({
  topic: z.string().min(1).describe('Topic identifier for trigger grouping'),
  scaling: triggerScalingConfigSchema.default({ concurrency: 10 }),
  retention: triggerRetentionConfigSchema.default({ kvDays: 7, dbDays: 90 }),
  triggers: z.array(triggerDefinitionConfigSchema).default([]),
});

/** Topic-isolated trigger group schema. */
export const TriggerGroupSchema: TriggerConfigSchema<TriggerGroupConfig> = triggerGroupSchema;

const webhookConfigSchema: z.ZodType<WebhookConfig> = z.object({
  enabled: z.boolean().default(false),
  basePath: z.string().default('/api/v1/webhooks'),
  rateLimitPerMinute: z.number().int().positive().default(60),
});

/** Webhook ingestion configuration schema. */
export const WebhookConfigSchema: TriggerConfigSchema<WebhookConfig> = webhookConfigSchema;

const triggersConfigObjectSchema: z.ZodType<NonNullable<TriggersConfig>> = z.object({
  triggersDir: z.string().default('./triggers'),
  groups: z.array(triggerGroupSchema).default([]),
  webhooks: webhookConfigSchema.optional(),
  enabled: z.boolean().default(true),
});

/** Trigger plugin configuration schema. */
export const TriggersConfigSchema: TriggerConfigSchema<TriggersConfig> = triggersConfigObjectSchema
  .optional();

/** Partial trigger plugin configuration accepted from user config files. */
export type TriggersConfigInput = Partial<Omit<NonNullable<TriggersConfig>, 'groups'>> & {
  readonly groups?: Array<
    & Partial<Omit<TriggerGroupConfig, 'topic' | 'triggers'>>
    & Pick<TriggerGroupConfig, 'topic'>
    & { readonly triggers?: Partial<TriggerDefinitionConfig>[] }
  >;
};
