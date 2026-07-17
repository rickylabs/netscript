/**
 * Typed release configuration for Deno Desktop native auto-update.
 *
 * Applications consume this stable NetScript subpath instead of reading the
 * moving Deno Desktop globals. Release URLs are resolved from trusted app
 * configuration and the current native `os-arch` target.
 *
 * @example Build the current native release descriptor
 * ```ts
 * import { createReleaseClient } from '@netscript/sdk/auto-update';
 *
 * const release = createReleaseClient({
 *   baseUrl: 'https://releases.example.com/my-app',
 *   channel: 'stable',
 *   publicKey: 'base64-ed25519-public-key',
 *   manualUpdateUrl: 'https://example.com/downloads/my-app',
 * });
 * console.log(release.updateUrl);
 * ```
 *
 * @module
 */

export { createReleaseClient } from './application/release-client.ts';
export { startAutoUpdate } from './application/start-auto-update.ts';
export {
  AUTO_UPDATE_APPLY_MODES,
  AUTO_UPDATE_ARCHITECTURES,
  AUTO_UPDATE_DISABLED_REASONS,
  AUTO_UPDATE_OPERATING_SYSTEMS,
  AUTO_UPDATE_START_STATUSES,
  DEFAULT_RELEASE_CHANNEL,
} from './domain/constants.ts';
export type {
  AutomaticAutoUpdateReadyEvent,
  AutoUpdateApplyMode,
  AutoUpdateArchitecture,
  AutoUpdateDisabledReason,
  AutoUpdateIntervalPolicy,
  AutoUpdateLaunchPolicy,
  AutoUpdateOperatingSystem,
  AutoUpdatePolicy,
  AutoUpdateReadyEvent,
  AutoUpdateReleaseConfig,
  AutoUpdateReleaseTarget,
  AutoUpdateRollbackEvent,
  AutoUpdateStartResult,
  AutoUpdateStartStatus,
  DisabledAutoUpdateResult,
  ManualAutoUpdateReadyEvent,
  ReleaseClient,
  ScheduledAutoUpdateResult,
  StartAutoUpdateOptions,
  StartedAutoUpdateResult,
} from './domain/types.ts';
