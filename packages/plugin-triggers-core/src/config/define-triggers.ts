import type { TriggersConfigInput } from './trigger-config-schema.ts';

/** Preserve literal trigger config types for `netscript.config.ts`. */
export function defineTriggers(config: TriggersConfigInput): TriggersConfigInput {
  return config;
}
