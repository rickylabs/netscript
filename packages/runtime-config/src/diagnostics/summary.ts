import type { RuntimeConfig } from '../domain/types.ts';
import { resolveRuntimeConfigDir } from '../application/loader.ts';

/**
 * Trigger path override included in a runtime config summary.
 */
export interface RuntimeConfigTriggerPathOverride {
  /** Trigger identifier. */
  id: string;
  /** Runtime watch paths configured for the trigger. */
  paths: string[];
}

/**
 * Structured summary of active runtime overrides.
 */
export interface RuntimeConfigSummary {
  /** Prefix used when formatting presentation messages. */
  prefix: string;
  /** Directory runtime config was loaded from. */
  sourceDir: string;
  /** Job identifiers disabled by runtime config. */
  disabledJobs: string[];
  /** Saga identifiers disabled by runtime config. */
  disabledSagas: string[];
  /** Trigger identifiers disabled by runtime config. */
  disabledTriggers: string[];
  /** Feature identifiers disabled by runtime config. */
  disabledFeatures: string[];
  /** Trigger path overrides from runtime config. */
  triggerPathOverrides: RuntimeConfigTriggerPathOverride[];
  /** Human-readable message lines suitable for caller-owned presentation. */
  messages: string[];
}

/**
 * Summarize active runtime overrides without emitting presentation output.
 */
export function summarizeRuntimeConfig(
  config: RuntimeConfig,
  prefix = '[runtime-config]',
): RuntimeConfigSummary {
  const sourceDir = resolveRuntimeConfigDir();
  const disabledJobs = config.jobs.filter((job) => job.enabled === false).map((job) => job.id);
  const disabledSagas = config.sagas.filter((saga) => saga.enabled === false).map((saga) =>
    saga.id
  );
  const disabledTriggers = config.triggers
    .filter((trigger) => trigger.enabled === false)
    .map((trigger) => trigger.id);
  const disabledFeatures = config.features
    .filter((feature) => !feature.enabled)
    .map((feature) => feature.id);
  const triggerPathOverrides = config.triggers
    .filter((trigger) => trigger.paths && trigger.paths.length > 0)
    .map((trigger) => ({
      id: trigger.id,
      paths: trigger.paths ?? [],
    }));

  return {
    prefix,
    sourceDir,
    disabledJobs,
    disabledSagas,
    disabledTriggers,
    disabledFeatures,
    triggerPathOverrides,
    messages: formatSummaryMessages({
      prefix,
      sourceDir,
      disabledJobs,
      disabledSagas,
      disabledTriggers,
      disabledFeatures,
      triggerPathOverrides,
      messages: [],
    }),
  };
}

function formatSummaryMessages(summary: RuntimeConfigSummary): string[] {
  const messages = [`${summary.prefix} Loaded from: ${summary.sourceDir}`];

  if (summary.disabledJobs.length > 0) {
    messages.push(`${summary.prefix} Disabled jobs: ${summary.disabledJobs.join(', ')}`);
  }
  if (summary.disabledSagas.length > 0) {
    messages.push(`${summary.prefix} Disabled sagas: ${summary.disabledSagas.join(', ')}`);
  }
  if (summary.disabledTriggers.length > 0) {
    messages.push(
      `${summary.prefix} Disabled triggers: ${summary.disabledTriggers.join(', ')}`,
    );
  }
  if (summary.disabledFeatures.length > 0) {
    messages.push(
      `${summary.prefix} Disabled features: ${summary.disabledFeatures.join(', ')}`,
    );
  }

  for (const override of summary.triggerPathOverrides) {
    messages.push(
      `${summary.prefix} Trigger '${override.id}' paths overridden: ${override.paths.join('; ')}`,
    );
  }

  return messages;
}
