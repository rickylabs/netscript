/**
 * Launch and interval orchestration for native auto-update.
 *
 * @module
 */

import {
  type DenoAutoUpdateRuntimeResolution,
  type NativeAutoUpdateOptions,
  resolveDenoAutoUpdateRuntime,
} from '../adapters/deno-auto-update-adapter.ts';
import {
  NETSCRIPT_ROLLBACK_TELEMETRY,
  type RollbackTelemetryPort,
} from '../adapters/netscript-rollback-telemetry.ts';
import { NATIVE_AUTO_APPLY_SUPPORT } from '../domain/constants.ts';
import type {
  AutoUpdateReadyEvent,
  AutoUpdateRollbackEvent,
  AutoUpdateStartResult,
  StartAutoUpdateOptions,
} from '../domain/types.ts';
import { createReleaseClientForTarget } from './release-client.ts';

/** Delayed-start port used by the interval-only policy. */
export interface AutoUpdateScheduler {
  /** Run a callback after a delay without exposing a cancellation contract. */
  schedule(callback: () => void, delayMs: number): void;
}

/** Internal dependencies used to fixture native runtime boundaries. */
export interface StartAutoUpdateDependencies {
  readonly resolveRuntime: () => DenoAutoUpdateRuntimeResolution;
  readonly scheduler: AutoUpdateScheduler;
  readonly telemetry: RollbackTelemetryPort;
}

const DEFAULT_AUTO_UPDATE_SCHEDULER: AutoUpdateScheduler = {
  schedule(callback: () => void, delayMs: number): void {
    setTimeout(callback, delayMs);
  },
};

const DEFAULT_START_AUTO_UPDATE_DEPENDENCIES: StartAutoUpdateDependencies = {
  resolveRuntime: resolveDenoAutoUpdateRuntime,
  scheduler: DEFAULT_AUTO_UPDATE_SCHEDULER,
  telemetry: NETSCRIPT_ROLLBACK_TELEMETRY,
};

function validateInterval(intervalMs: number | undefined): void {
  if (intervalMs !== undefined && (!Number.isFinite(intervalMs) || intervalMs <= 0)) {
    throw new TypeError('intervalMs must be a positive finite number.');
  }
}

function createReadyEvent(
  version: string,
  manualUpdateUrl: string,
  autoApply: boolean,
): AutoUpdateReadyEvent {
  return autoApply
    ? { applyMode: 'automatic', version }
    : { applyMode: 'manual', version, manualUpdateUrl };
}

/** Start native update checks with explicit internal boundary dependencies. */
export function startAutoUpdateWithDependencies(
  options: StartAutoUpdateOptions,
  dependencies: StartAutoUpdateDependencies,
): AutoUpdateStartResult {
  validateInterval(options.policy.intervalMs);
  const resolution = dependencies.resolveRuntime();
  if (!resolution.enabled) {
    return { status: 'disabled', reason: resolution.reason };
  }

  const { runtime } = resolution;
  const release = createReleaseClientForTarget(options.release, runtime.target);
  const nativeOptions: NativeAutoUpdateOptions = {
    url: release.updateUrl,
    interval: options.policy.intervalMs,
    publicKey: release.publicKey,
    onUpdateReady: options.onUpdateReady
      ? (version: string): void => {
        options.onUpdateReady?.(
          createReadyEvent(
            version,
            release.manualUpdateUrl,
            NATIVE_AUTO_APPLY_SUPPORT[runtime.target.os],
          ),
        );
      }
      : undefined,
    onRollback: (reason: string): void => {
      const event: AutoUpdateRollbackEvent = {
        reason,
        currentVersion: runtime.version,
      };
      dependencies.telemetry.reportRollback(event);
      options.onRollback?.(event);
    },
  };

  if (options.policy.checkOnLaunch) {
    runtime.autoUpdate(nativeOptions);
    return { status: 'started', updateUrl: release.updateUrl };
  }

  dependencies.scheduler.schedule(
    (): void => runtime.autoUpdate(nativeOptions),
    options.policy.intervalMs,
  );
  return {
    status: 'scheduled',
    updateUrl: release.updateUrl,
    firstCheckInMs: options.policy.intervalMs,
  };
}

/** Start or schedule native update checks through the stable NetScript seam. */
export function startAutoUpdate(options: StartAutoUpdateOptions): AutoUpdateStartResult {
  return startAutoUpdateWithDependencies(options, DEFAULT_START_AUTO_UPDATE_DEPENDENCIES);
}
