/**
 * Structural boundary for the moving Deno Desktop auto-update globals.
 *
 * This is the only production module in the SDK auto-update surface that may
 * inspect `globalThis` or the Deno global. Keeping that access here lets the
 * public contract survive upstream namespace changes.
 *
 * @module
 */

import { AUTO_UPDATE_ARCHITECTURES, AUTO_UPDATE_OPERATING_SYSTEMS } from '../domain/constants.ts';
import type {
  AutoUpdateArchitecture,
  AutoUpdateDisabledReason,
  AutoUpdateOperatingSystem,
  AutoUpdateReleaseTarget,
} from '../domain/types.ts';

interface DenoBuildShape {
  readonly os: AutoUpdateOperatingSystem;
  readonly arch: AutoUpdateArchitecture;
}

/** Options accepted by both native updater namespace generations. */
export interface NativeAutoUpdateOptions {
  readonly url: string;
  readonly interval?: number;
  readonly publicKey: string;
  readonly onUpdateReady?: (version: string) => void;
  readonly onRollback?: (reason: string) => void;
}

/** Callable native updater isolated from its namespace receiver. */
export type NativeAutoUpdate = (options: NativeAutoUpdateOptions) => void;

/** Resolved native desktop update runtime. */
export interface DenoAutoUpdateRuntime {
  readonly version: string;
  readonly target: AutoUpdateReleaseTarget;
  readonly autoUpdate: NativeAutoUpdate;
}

/** Structural native updater resolution result. */
export type DenoAutoUpdateRuntimeResolution =
  | { readonly enabled: true; readonly runtime: DenoAutoUpdateRuntime }
  | { readonly enabled: false; readonly reason: AutoUpdateDisabledReason };

function isOperatingSystem(value: unknown): value is AutoUpdateOperatingSystem {
  return typeof value === 'string' && AUTO_UPDATE_OPERATING_SYSTEMS.some((item) => item === value);
}

function isArchitecture(value: unknown): value is AutoUpdateArchitecture {
  return typeof value === 'string' && AUTO_UPDATE_ARCHITECTURES.some((item) => item === value);
}

function isDenoBuildShape(value: unknown): value is DenoBuildShape {
  return typeof value === 'object' && value !== null &&
    isOperatingSystem(Reflect.get(value, 'os')) &&
    isArchitecture(Reflect.get(value, 'arch'));
}

function readDenoGlobal(): unknown {
  return Reflect.get(globalThis, 'Deno');
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function resolveReleaseTargetFrom(deno: object): AutoUpdateReleaseTarget {
  const build: unknown = Reflect.get(deno, 'build');
  if (!isDenoBuildShape(build)) {
    throw new Error('Deno.build does not identify a supported desktop release target.');
  }
  return { os: build.os, arch: build.arch };
}

function bindNativeAutoUpdate(value: unknown, receiver: object): NativeAutoUpdate | undefined {
  if (typeof value !== 'function') {
    return undefined;
  }
  return (options: NativeAutoUpdateOptions): void => {
    Reflect.apply(value, receiver, [options]);
  };
}

function resolveCandidate(
  receiver: object,
  versionKey: string,
  updaterKey: string,
  target: AutoUpdateReleaseTarget,
): DenoAutoUpdateRuntimeResolution {
  const version: unknown = Reflect.get(receiver, versionKey);
  if (typeof version !== 'string' || version.length === 0) {
    return { enabled: false, reason: 'missing-version' };
  }

  const autoUpdate = bindNativeAutoUpdate(Reflect.get(receiver, updaterKey), receiver);
  if (!autoUpdate) {
    return { enabled: false, reason: 'missing-updater' };
  }

  return { enabled: true, runtime: { version, target, autoUpdate } };
}

/** Resolve old and proposed native updater shapes from an unknown Deno value. */
export function resolveDenoAutoUpdateRuntimeFrom(
  deno: unknown,
): DenoAutoUpdateRuntimeResolution {
  if (!isObject(deno)) {
    return { enabled: false, reason: 'not-desktop' };
  }

  const desktop: unknown = Reflect.get(deno, 'desktop');
  const hasNamespacedCandidate = isObject(desktop) &&
    (Reflect.has(desktop, 'appVersion') || Reflect.has(desktop, 'autoUpdate'));
  const hasLegacyCandidate = Reflect.has(deno, 'desktopVersion') || Reflect.has(deno, 'autoUpdate');

  if (!hasNamespacedCandidate && !hasLegacyCandidate) {
    return { enabled: false, reason: 'not-desktop' };
  }

  const target = resolveReleaseTargetFrom(deno);
  let namespacedFailure: DenoAutoUpdateRuntimeResolution | undefined;
  if (hasNamespacedCandidate && isObject(desktop)) {
    const namespaced = resolveCandidate(desktop, 'appVersion', 'autoUpdate', target);
    if (namespaced.enabled) {
      return namespaced;
    }
    namespacedFailure = namespaced;
  }
  if (hasLegacyCandidate) {
    const legacy = resolveCandidate(deno, 'desktopVersion', 'autoUpdate', target);
    if (legacy.enabled || !namespacedFailure) {
      return legacy;
    }
  }
  return namespacedFailure ?? { enabled: false, reason: 'not-desktop' };
}

/** Resolve the native updater from the current Deno global. */
export function resolveDenoAutoUpdateRuntime(): DenoAutoUpdateRuntimeResolution {
  return resolveDenoAutoUpdateRuntimeFrom(readDenoGlobal());
}

/** Resolve the supported native release target from the Deno global. */
export function resolveDenoReleaseTarget(): AutoUpdateReleaseTarget {
  const deno: unknown = readDenoGlobal();
  if (!isObject(deno)) {
    throw new Error('Deno.build is unavailable; native auto-update requires the Deno runtime.');
  }
  return resolveReleaseTargetFrom(deno);
}
