import type { ValidatedPluginDescriptor } from './jsr-plugin-validator-port.ts';

/** Trust tier assigned to a statically validated plugin package. */
export type PluginTrustTier = 'first-party' | 'third-party';

/** Trust decision used before running a plugin-owned scaffolder. */
export interface PluginTrustDecision {
  /** Resolved package scope without the leading `@`. */
  readonly scope: string;
  /** Resolved scoped package name. */
  readonly packageSpecifier: string;
  /** Whether installer policy treats the package as first-party. */
  readonly tier: PluginTrustTier;
  /** Whether the package may use the trusted broad Deno permission set. */
  readonly trusted: boolean;
  /** Whether the user must confirm before plugin-owned code runs. */
  readonly confirmationRequired: boolean;
}

/** Classify a validated plugin descriptor into the installer trust tier. */
export function classifyPluginTrust(
  descriptor: Pick<ValidatedPluginDescriptor, 'package'>,
): PluginTrustDecision {
  const scope = descriptor.package.scope.toLowerCase();
  const isFirstParty = scope === 'netscript';
  return {
    scope: descriptor.package.scope,
    packageSpecifier: descriptor.package.packageSpecifier,
    tier: isFirstParty ? 'first-party' : 'third-party',
    trusted: isFirstParty,
    confirmationRequired: !isFirstParty,
  };
}
