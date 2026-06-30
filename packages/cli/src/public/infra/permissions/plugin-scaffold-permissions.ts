import { join } from '@std/path';

import { SCAFFOLD_DIRS } from '../../../kernel/constants/scaffold/scaffold-dirs.ts';
import type { ValidatedPluginDescriptor } from '../../features/plugins/install/jsr-plugin-validator-port.ts';
import {
  classifyPluginTrust,
  type PluginTrustTier,
} from '../../features/plugins/install/plugin-trust-tier.ts';

/** Options for building Deno flags for plugin-owned scaffold execution. */
export interface PluginScaffoldPermissionFlagOptions {
  /** Validated descriptor for the plugin package that will be executed. */
  readonly descriptor: ValidatedPluginDescriptor;
  /** Absolute target project root. */
  readonly projectRoot: string;
  /** Local plugin workspace/config name. */
  readonly pluginName: string;
  /** Precomputed trust tier, when already available to the caller. */
  readonly trustTier?: PluginTrustTier;
  /** First-party-only opt-in for freshly published alpha packages. */
  readonly allowFreshFirstPartyDependency?: boolean;
}

/** Build the Deno permission flags used for plugin-owned scaffold execution. */
export function buildPluginScaffoldPermissionFlags(
  options: PluginScaffoldPermissionFlagOptions,
): readonly string[] {
  const tier = options.trustTier ?? classifyPluginTrust(options.descriptor).tier;
  if (tier === 'first-party') {
    return options.allowFreshFirstPartyDependency === true
      ? ['-A', '--minimum-dependency-age=0']
      : ['-A'];
  }

  return [
    `--allow-read=${options.projectRoot}`,
    `--allow-write=${thirdPartyWritableDirs(options).join(',')}`,
    '--deny-net',
    '--deny-run',
  ];
}

function thirdPartyWritableDirs(
  options: Pick<PluginScaffoldPermissionFlagOptions, 'projectRoot' | 'pluginName'>,
): readonly string[] {
  return [
    join(options.projectRoot, SCAFFOLD_DIRS.PLUGINS, options.pluginName),
    join(options.projectRoot, SCAFFOLD_DIRS.SERVICES),
    join(options.projectRoot, SCAFFOLD_DIRS.DATABASE),
    join(options.projectRoot, SCAFFOLD_DIRS.ASPIRE_TS),
    join(options.projectRoot, SCAFFOLD_DIRS.ASPIRE_GENERATED),
  ];
}
