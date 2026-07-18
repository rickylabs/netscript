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

/** Consumer-visible native update application modes. */
export const AUTO_UPDATE_APPLY_MODES: readonly ['automatic', 'manual'] = [
  'automatic',
  'manual',
];

/** Outcomes returned when the update seam is started. */
export const AUTO_UPDATE_START_STATUSES: readonly ['started', 'scheduled', 'disabled'] = [
  'started',
  'scheduled',
  'disabled',
];

/** Reasons the native update seam can be unavailable. */
export const AUTO_UPDATE_DISABLED_REASONS: readonly [
  'not-desktop',
  'missing-version',
  'missing-updater',
] = [
  'not-desktop',
  'missing-version',
  'missing-updater',
];

/** Native apply support by Deno Desktop operating system. */
export const NATIVE_AUTO_APPLY_SUPPORT: Readonly<
  Record<(typeof AUTO_UPDATE_OPERATING_SYSTEMS)[number], boolean>
> = {
  darwin: true,
  linux: true,
  windows: false,
};

/** Telemetry names emitted when the native updater reports a rollback. */
export const AUTO_UPDATE_TELEMETRY_NAMES: Readonly<{
  tracer: string;
  span: string;
  event: string;
  rollbackErrorType: string;
}> = {
  tracer: '@netscript/sdk',
  span: 'netscript.sdk.auto_update.rollback',
  event: 'auto_update.rollback',
  rollbackErrorType: 'auto_update_rollback',
};
