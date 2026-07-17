/**
 * Finite values used by the SDK auto-update contract.
 *
 * @module
 */

/** Default release channel used when app configuration omits one. */
export const DEFAULT_RELEASE_CHANNEL = 'stable' as const;

/** Deno Desktop operating systems supported by the native updater. */
export const AUTO_UPDATE_OPERATING_SYSTEMS: readonly ['darwin', 'linux', 'windows'] = [
  'darwin',
  'linux',
  'windows',
];

/** Architecture names used by `Deno.build.arch` and upstream release targets. */
export const AUTO_UPDATE_ARCHITECTURES: readonly ['x86_64', 'aarch64'] = [
  'x86_64',
  'aarch64',
];
