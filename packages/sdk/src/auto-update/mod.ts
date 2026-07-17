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
export {
  AUTO_UPDATE_ARCHITECTURES,
  AUTO_UPDATE_OPERATING_SYSTEMS,
  DEFAULT_RELEASE_CHANNEL,
} from './domain/constants.ts';
export type {
  AutoUpdateArchitecture,
  AutoUpdateOperatingSystem,
  AutoUpdateReleaseConfig,
  AutoUpdateReleaseTarget,
  ReleaseClient,
} from './domain/types.ts';
