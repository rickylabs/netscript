/**
 * @module templates/aspire/generate-global-json
 *
 * Tier 1 generator for `dotnet/global.json`.
 *
 * Produces a minimal `global.json` specifying the .NET SDK version,
 * roll-forward policy, and pre-release allowance.
 */

import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';

/** Options for generating `global.json`. */
export interface GlobalJsonOptions {
  /** .NET SDK version. Defaults to {@link SCAFFOLD_VERSIONS.DOTNET_SDK}. */
  readonly sdkVersion?: string;
}

/**
 * Generate the contents of `dotnet/global.json`.
 *
 * @param options - Optional overrides for SDK version.
 * @returns Serialized JSON string with trailing newline.
 */
export function generateGlobalJson(options?: GlobalJsonOptions): string {
  const config = {
    sdk: {
      version: options?.sdkVersion ?? SCAFFOLD_VERSIONS.DOTNET_SDK,
      rollForward: 'latestMinor',
      allowPrerelease: true,
    },
  };
  return JSON.stringify(config, null, 2) + '\n';
}
