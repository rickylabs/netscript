import type { PromptPort } from '../../../../kernel/ports/prompt-port.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { ValidatedPluginDescriptor } from './jsr-plugin-validator-port.ts';
import {
  classifyPluginTrust,
  type PluginTrustDecision,
  type PluginTrustTier,
} from './plugin-trust-tier.ts';

/** Reason a plugin-install confirmation gate completed without prompting. */
export type PluginInstallConfirmationSkipReason =
  | 'first-party'
  | 'skip-confirmation'
  | 'ci';

/** Confirmation decision returned before plugin-owned scaffold execution. */
export type PluginInstallConfirmationDecision =
  | {
    readonly confirmed: true;
    readonly prompted: true;
    readonly trustTier: PluginTrustTier;
    readonly packageSpecifier: string;
  }
  | {
    readonly confirmed: true;
    readonly prompted: false;
    readonly skippedBecause: PluginInstallConfirmationSkipReason;
    readonly trustTier: PluginTrustTier;
    readonly packageSpecifier: string;
  };

/** Options accepted by the plugin-install confirmation gate. */
export interface ConfirmPluginInstallOptions {
  /** Validated JSR descriptor returned by the static validator. */
  readonly descriptor: ValidatedPluginDescriptor;
  /** Prompt port used for interactive confirmation. */
  readonly prompt: PromptPort;
  /** Precomputed trust decision, when the caller already classified the descriptor. */
  readonly trust?: PluginTrustDecision;
  /** User-supplied bypass for third-party confirmation. */
  readonly skipConfirmation?: boolean;
  /** Non-interactive mode; bypasses the third-party prompt. */
  readonly ci?: boolean;
}

/** Confirm third-party plugin installation before any plugin-owned code runs. */
export async function confirmPluginInstall(
  options: ConfirmPluginInstallOptions,
): Promise<PluginInstallConfirmationDecision> {
  const trust = options.trust ?? classifyPluginTrust(options.descriptor);
  if (!trust.confirmationRequired) {
    return skipped(options.descriptor, trust, 'first-party');
  }
  if (options.skipConfirmation === true) {
    return skipped(options.descriptor, trust, 'skip-confirmation');
  }
  if (options.ci === true) {
    return skipped(options.descriptor, trust, 'ci');
  }

  const confirmed = await options.prompt.confirm(
    formatConfirmationPrompt(options.descriptor),
    {
      defaultValue: false,
    },
  );
  if (!confirmed) {
    throw new ScaffoldValidationError(
      `Plugin installation for ${options.descriptor.package.packageSpecifier} was not confirmed.`,
      { package: options.descriptor.package.packageSpecifier },
    );
  }

  return {
    confirmed: true,
    prompted: true,
    trustTier: trust.tier,
    packageSpecifier: options.descriptor.package.packageSpecifier,
  };
}

function skipped(
  descriptor: ValidatedPluginDescriptor,
  trust: PluginTrustDecision,
  reason: PluginInstallConfirmationSkipReason,
): PluginInstallConfirmationDecision {
  return {
    confirmed: true,
    prompted: false,
    skippedBecause: reason,
    trustTier: trust.tier,
    packageSpecifier: descriptor.package.packageSpecifier,
  };
}

function formatConfirmationPrompt(
  descriptor: ValidatedPluginDescriptor,
): string {
  const repository = formatRepository(descriptor.details.githubRepository);
  const score = descriptor.details.score === undefined ? 'unknown' : `${descriptor.details.score}`;
  return [
    `Install third-party NetScript plugin ${descriptor.package.packageSpecifier}@${descriptor.version}?`,
    `Description: ${descriptor.details.description ?? descriptor.manifest.description}`,
    `Repository: ${repository}`,
    `JSR score: ${score}`,
  ].join('\n');
}

function formatRepository(value: unknown): string {
  if (value === undefined || value === null) {
    return 'unknown';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value !== 'object') {
    return 'unknown';
  }
  const record = value;
  if (
    'owner' in record && 'name' in record && typeof record.owner === 'string' &&
    typeof record.name === 'string'
  ) {
    return `${record.owner}/${record.name}`;
  }
  if ('url' in record && typeof record.url === 'string') {
    return record.url;
  }
  return 'unknown';
}
