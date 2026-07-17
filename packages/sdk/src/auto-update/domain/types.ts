/**
 * Public release configuration and target types for native auto-update.
 *
 * @module
 */

import type {
  AUTO_UPDATE_APPLY_MODES,
  AUTO_UPDATE_ARCHITECTURES,
  AUTO_UPDATE_DISABLED_REASONS,
  AUTO_UPDATE_OPERATING_SYSTEMS,
  AUTO_UPDATE_START_STATUSES,
} from './constants.ts';

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

/** Application mode for a staged native update. */
export type AutoUpdateApplyMode = (typeof AUTO_UPDATE_APPLY_MODES)[number];

/** Reason the native update seam is disabled. */
export type AutoUpdateDisabledReason = (typeof AUTO_UPDATE_DISABLED_REASONS)[number];

/** Status returned by `startAutoUpdate`. */
export type AutoUpdateStartStatus = (typeof AUTO_UPDATE_START_STATUSES)[number];

/** Check immediately on launch, optionally continuing at an interval. */
export interface AutoUpdateLaunchPolicy {
  /** Start the native updater during application launch. */
  readonly checkOnLaunch: true;
  /** Optional recurring check interval in milliseconds. */
  readonly intervalMs?: number;
}

/** Delay the first native update check and then continue at the same interval. */
export interface AutoUpdateIntervalPolicy {
  /** Do not start the native updater during application launch. */
  readonly checkOnLaunch: false;
  /** Delay and recurring check interval in milliseconds. */
  readonly intervalMs: number;
}

/** Native update check policy. */
export type AutoUpdatePolicy = AutoUpdateLaunchPolicy | AutoUpdateIntervalPolicy;

/** A staged update that the native launcher applies on relaunch. */
export interface AutomaticAutoUpdateReadyEvent {
  /** Automatic application discriminator. */
  readonly applyMode: 'automatic';
  /** Version staged by the native updater. */
  readonly version: string;
}

/** A staged update that requires a manual installer path. */
export interface ManualAutoUpdateReadyEvent {
  /** Manual application discriminator. */
  readonly applyMode: 'manual';
  /** Version staged by the native updater. */
  readonly version: string;
  /** Trusted app-config URL for the manual installer UX. */
  readonly manualUpdateUrl: string;
}

/** Typed update-ready event delivered to application UX. */
export type AutoUpdateReadyEvent =
  | AutomaticAutoUpdateReadyEvent
  | ManualAutoUpdateReadyEvent;

/** Native rollback event reported to telemetry and the application. */
export interface AutoUpdateRollbackEvent {
  /** Human-readable reason supplied by the native updater. */
  readonly reason: string;
  /** Application version running after rollback. */
  readonly currentVersion: string;
}

/** Options for starting the NetScript native update seam. */
export interface StartAutoUpdateOptions {
  /** Trusted release configuration compiled into the application. */
  readonly release: AutoUpdateReleaseConfig;
  /** Launch and recurring-check policy. */
  readonly policy: AutoUpdatePolicy;
  /** Called after the native updater stages a verified update. */
  readonly onUpdateReady?: (event: AutoUpdateReadyEvent) => void;
  /** Called after rollback telemetry has been recorded. */
  readonly onRollback?: (event: AutoUpdateRollbackEvent) => void;
}

/** Native updater started during application launch. */
export interface StartedAutoUpdateResult {
  /** Start outcome discriminator. */
  readonly status: 'started';
  /** Resolved native release URL. */
  readonly updateUrl: string;
}

/** Native updater scheduled to start after the configured interval. */
export interface ScheduledAutoUpdateResult {
  /** Start outcome discriminator. */
  readonly status: 'scheduled';
  /** Resolved native release URL. */
  readonly updateUrl: string;
  /** Delay before installing the native updater, in milliseconds. */
  readonly firstCheckInMs: number;
}

/** Native updater unavailable in the current runtime. */
export interface DisabledAutoUpdateResult {
  /** Start outcome discriminator. */
  readonly status: 'disabled';
  /** Structural reason the desktop updater is unavailable. */
  readonly reason: AutoUpdateDisabledReason;
}

/** Result of starting or scheduling native update checks. */
export type AutoUpdateStartResult =
  | StartedAutoUpdateResult
  | ScheduledAutoUpdateResult
  | DisabledAutoUpdateResult;
