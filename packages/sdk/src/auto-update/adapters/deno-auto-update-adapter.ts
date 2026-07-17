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
  AutoUpdateOperatingSystem,
  AutoUpdateReleaseTarget,
} from '../domain/types.ts';

interface DenoBuildShape {
  readonly os: AutoUpdateOperatingSystem;
  readonly arch: AutoUpdateArchitecture;
}

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

/** Resolve the supported native release target from the Deno global. */
export function resolveDenoReleaseTarget(): AutoUpdateReleaseTarget {
  const deno: unknown = readDenoGlobal();
  if (typeof deno !== 'object' || deno === null) {
    throw new Error('Deno.build is unavailable; native auto-update requires the Deno runtime.');
  }

  const build: unknown = Reflect.get(deno, 'build');
  if (!isDenoBuildShape(build)) {
    throw new Error('Deno.build does not identify a supported desktop release target.');
  }

  return { os: build.os, arch: build.arch };
}
