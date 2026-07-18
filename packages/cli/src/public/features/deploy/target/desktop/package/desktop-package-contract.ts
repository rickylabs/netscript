/**
 * Native Deno Desktop package vocabulary and target catalog.
 *
 * @module
 */

import {
  AUTO_UPDATE_ARCHITECTURES,
  AUTO_UPDATE_OPERATING_SYSTEMS,
  type AutoUpdateArchitecture,
  type AutoUpdateOperatingSystem,
} from '@netscript/sdk/auto-update';

/** Native package formats produced by the desktop pipeline. */
export const NATIVE_PACKAGE_FORMATS = [
  'app',
  'dmg',
  'appimage',
  'deb',
  'rpm',
  'msi',
] as const;

/** Native package format identifier. */
export type NativePackageFormat = (typeof NATIVE_PACKAGE_FORMATS)[number];

/** Compression modes accepted by `deno desktop`. */
export const DESKTOP_PACKAGE_COMPRESSIONS = ['none', 'xz', 'lzma', 'zstd'] as const;

/** Desktop package compression mode. */
export type DesktopPackageCompression = (typeof DESKTOP_PACKAGE_COMPRESSIONS)[number];

/** Default task name exposed by the #452 package hook. */
export const DEFAULT_DESKTOP_PACKAGE_TASK = 'desktop:package' as const;

/** Default project-relative directory for native package output. */
export const DEFAULT_DESKTOP_PACKAGE_OUTPUT_DIR = '.deploy/desktop/packages' as const;

/** One supported Deno Desktop compilation target. */
export interface DesktopPackageTarget {
  /** Deno target triple forwarded to the package task. */
  readonly triple: string;
  /** SDK operating-system identity used by release routing. */
  readonly os: AutoUpdateOperatingSystem;
  /** SDK architecture identity used by release routing. */
  readonly arch: AutoUpdateArchitecture;
  /** Native formats supported for this operating system. */
  readonly formats: readonly NativePackageFormat[];
}

const DARWIN_FORMATS = ['app', 'dmg'] as const satisfies readonly NativePackageFormat[];
const LINUX_FORMATS = ['appimage', 'deb', 'rpm'] as const satisfies readonly NativePackageFormat[];
const WINDOWS_FORMATS = ['msi'] as const satisfies readonly NativePackageFormat[];

/**
 * Exhaustive explicit-target catalog derived from the SDK OS and architecture
 * constants. NetScript expands this catalog instead of forwarding upstream
 * `--all-targets`, which currently omits Windows ARM64.
 */
export const DENO_DESKTOP_TARGETS = [
  {
    os: AUTO_UPDATE_OPERATING_SYSTEMS[0],
    arch: AUTO_UPDATE_ARCHITECTURES[0],
    triple: 'x86_64-apple-darwin',
    formats: DARWIN_FORMATS,
  },
  {
    os: AUTO_UPDATE_OPERATING_SYSTEMS[0],
    arch: AUTO_UPDATE_ARCHITECTURES[1],
    triple: 'aarch64-apple-darwin',
    formats: DARWIN_FORMATS,
  },
  {
    os: AUTO_UPDATE_OPERATING_SYSTEMS[1],
    arch: AUTO_UPDATE_ARCHITECTURES[0],
    triple: 'x86_64-unknown-linux-gnu',
    formats: LINUX_FORMATS,
  },
  {
    os: AUTO_UPDATE_OPERATING_SYSTEMS[1],
    arch: AUTO_UPDATE_ARCHITECTURES[1],
    triple: 'aarch64-unknown-linux-gnu',
    formats: LINUX_FORMATS,
  },
  {
    os: AUTO_UPDATE_OPERATING_SYSTEMS[2],
    arch: AUTO_UPDATE_ARCHITECTURES[0],
    triple: 'x86_64-pc-windows-msvc',
    formats: WINDOWS_FORMATS,
  },
  {
    os: AUTO_UPDATE_OPERATING_SYSTEMS[2],
    arch: AUTO_UPDATE_ARCHITECTURES[1],
    triple: 'aarch64-pc-windows-msvc',
    formats: WINDOWS_FORMATS,
  },
] as const satisfies readonly DesktopPackageTarget[];

/** Supported Deno Desktop target triple. */
export type DenoDesktopTargetTriple = (typeof DENO_DESKTOP_TARGETS)[number]['triple'];

/** Request consumed by the pure native package planner. */
export interface DesktopPackagePlanRequest {
  /** App resource name. */
  readonly appName: string;
  /** App version embedded in artifact names. */
  readonly version: string;
  /** Deno task selected from the #452 package hook. */
  readonly packageTaskName: string;
  /** Absolute app working directory. */
  readonly workdir: string;
  /** Absolute artifact output directory. */
  readonly outputDir: string;
  /** Explicit Deno target triple. */
  readonly target?: string;
  /** Expand all SDK OS/architecture values. */
  readonly allTargets?: boolean;
  /** Optional native-format filter. */
  readonly formats?: readonly NativePackageFormat[];
  /** Runtime compression mode. */
  readonly compression: DesktopPackageCompression;
  /** Host OS used for host-only format preflight. */
  readonly hostOperatingSystem: AutoUpdateOperatingSystem;
  /** Current build target used when neither target selector is supplied. */
  readonly currentTarget: {
    readonly os: AutoUpdateOperatingSystem;
    readonly arch: AutoUpdateArchitecture;
  };
}

/** One deterministic invocation of the configured desktop package task. */
export interface DesktopPackageInvocation {
  /** Executable to invoke. */
  readonly command: 'deno';
  /** Task and native packaging arguments. */
  readonly args: readonly string[];
  /** App working directory. */
  readonly cwd: string;
  /** Native artifact output path. */
  readonly outputPath: string;
  /** Explicit Deno target definition. */
  readonly target: DesktopPackageTarget;
  /** Native format selected by the output extension. */
  readonly format: NativePackageFormat;
}

/** Failure codes emitted by the desktop packaging workflow. */
export const DESKTOP_PACKAGE_ERROR_CODES = [
  'invalid-input',
  'app-not-found',
  'app-not-desktop',
  'app-disabled',
  'app-ambiguous',
  'unsupported-target',
  'unsupported-format',
  'host-format-mismatch',
  'tool-unavailable',
  'package-failed',
] as const;

/** Desktop packaging failure code. */
export type DesktopPackageErrorCode = (typeof DESKTOP_PACKAGE_ERROR_CODES)[number];

/** Typed failure raised by desktop package planning or execution. */
export class DesktopPackageError extends Error {
  /** Create a desktop package failure with stable classification. */
  constructor(
    readonly code: DesktopPackageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'DesktopPackageError';
  }
}
