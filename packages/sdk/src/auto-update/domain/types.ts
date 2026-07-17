/**
 * Public release configuration and target types for native auto-update.
 *
 * @module
 */

import type { AUTO_UPDATE_ARCHITECTURES, AUTO_UPDATE_OPERATING_SYSTEMS } from './constants.ts';

/** Operating systems supported by the Deno Desktop native updater. */
export type AutoUpdateOperatingSystem = (typeof AUTO_UPDATE_OPERATING_SYSTEMS)[number];

/** Architecture vocabulary emitted by `Deno.build.arch`. */
export type AutoUpdateArchitecture = (typeof AUTO_UPDATE_ARCHITECTURES)[number];

/** Native release target resolved from the Deno runtime. */
export interface AutoUpdateReleaseTarget {
  /** Native operating system. */
  readonly os: AutoUpdateOperatingSystem;
  /** Native CPU architecture. */
  readonly arch: AutoUpdateArchitecture;
}

/** Trusted release configuration compiled into an application. */
export interface AutoUpdateReleaseConfig {
  /** HTTPS base URL containing channel and target release paths. */
  readonly baseUrl: string;
  /** Release channel namespace. Defaults to `stable`. */
  readonly channel?: string;
  /** Ed25519 public key forwarded to the native updater. */
  readonly publicKey: string;
  /** HTTPS installer page used when a staged update requires manual application. */
  readonly manualUpdateUrl: string;
}

/** Validated release descriptor passed to the native updater seam. */
export interface ReleaseClient {
  /** Validated release channel. */
  readonly channel: string;
  /** Native target used in the release URL. */
  readonly target: AutoUpdateReleaseTarget;
  /** Per-channel, per-target native update URL. */
  readonly updateUrl: string;
  /** Ed25519 public key forwarded unchanged to the native updater. */
  readonly publicKey: string;
  /** Validated manual installer URL for staged updates that cannot auto-apply. */
  readonly manualUpdateUrl: string;
}
