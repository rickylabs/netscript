/**
 * @module @netscript/plugin-triggers-core/config
 *
 * Config-time trigger schema exports for `netscript.config.ts`.
 */

export {
  TRIGGER_CONFIG_KINDS,
  TriggerDefinitionConfigSchema,
  TriggerGroupSchema,
  TriggerRetentionConfigSchema,
  TriggerScalingConfigSchema,
  TriggersConfigSchema,
  WebhookConfigSchema,
} from './trigger-config-schema.ts';
export { defineTriggers } from './define-triggers.ts';
export type {
  TriggerConfigSchema,
  TriggerConfigKind,
  TriggerDefinitionConfig,
  TriggerGroupConfig,
  TriggerRetentionConfig,
  TriggerScalingConfig,
  TriggersConfig,
  TriggersConfigInput,
  WebhookConfig,
} from './trigger-config-schema.ts';
