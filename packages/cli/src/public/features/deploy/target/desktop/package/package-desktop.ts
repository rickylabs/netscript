/** Desktop package configuration selection and process orchestration. */

import {
  parseAppSettings,
  type AppEntry,
  type NetScriptConfig,
} from '@netscript/aspire/config';
import { join, resolve } from '@std/path';
import type { ProcessPort } from '../../../../../../kernel/ports/process-port.ts';
import type { FileSystemPort } from '../../../../../../kernel/ports/file-system-port.ts';
import {
  type DesktopPackageCompression,
  DesktopPackageError,
  type DesktopPackageInvocation,
  DEFAULT_DESKTOP_PACKAGE_OUTPUT_DIR,
  DEFAULT_DESKTOP_PACKAGE_TASK,
  type NativePackageFormat,
} from './desktop-package-contract.ts';
import { planDesktopPackages } from './plan-desktop-packages.ts';
import type {
  AutoUpdateArchitecture,
  AutoUpdateOperatingSystem,
} from '@netscript/sdk/auto-update';

/** CLI input for the native desktop package workflow. */
export interface PackageDesktopInput {
  /** Resolved NetScript project root. */
  readonly projectRoot: string;
  /** Optional app resource name used to disambiguate desktop entries. */
  readonly app?: string;
  /** Explicit Deno target triple. */
  readonly target?: string;
  /** Expand every SDK OS/architecture target. */
  readonly allTargets?: boolean;
  /** Optional native-format filter. */
  readonly formats?: readonly NativePackageFormat[];
  /** Runtime compression mode. */
  readonly compression: DesktopPackageCompression;
  /** Project-relative or absolute artifact output directory. */
  readonly outputDir?: string;
}

/** Dependencies for the native desktop package workflow. */
export interface PackageDesktopDependencies {
  /** Execute configured Deno tasks and optional tool preflights. */
  readonly process: ProcessPort;
  /** Create the explicit artifact output directory before invoking package tasks. */
  readonly fileSystem: Pick<FileSystemPort, 'createDir'>;
  /** Parse the canonical Aspire appsettings file. */
  readonly loadAppSettings?: (filePath: string) => Promise<NetScriptConfig>;
  /** Current host OS for host-only format checks. */
  readonly hostOperatingSystem: AutoUpdateOperatingSystem;
  /** Current Deno build target used when selectors are omitted. */
  readonly currentTarget: {
    readonly os: AutoUpdateOperatingSystem;
    readonly arch: AutoUpdateArchitecture;
  };
}

/** Result returned after every planned native package invocation succeeds. */
export interface PackageDesktopResult {
  /** Selected app resource name. */
  readonly appName: string;
  /** App version used in artifact names. */
  readonly version: string;
  /** Completed deterministic invocations. */
  readonly invocations: readonly DesktopPackageInvocation[];
}

interface SelectedDesktopApp {
  readonly name: string;
  readonly entry: AppEntry;
}

async function loadCanonicalAppSettings(filePath: string): Promise<NetScriptConfig> {
  return (await parseAppSettings(filePath)).config;
}

function selectDesktopApp(config: NetScriptConfig, requestedName?: string): SelectedDesktopApp {
  if (requestedName !== undefined) {
    const entry = config.Apps[requestedName];
    if (entry === undefined) {
      throw new DesktopPackageError('app-not-found', `App "${requestedName}" was not found.`);
    }
    if (entry.Type !== 'desktop') {
      throw new DesktopPackageError(
        'app-not-desktop',
        `App "${requestedName}" has Type "${entry.Type}", not "desktop".`,
      );
    }
    if (entry.Enabled !== true) {
      throw new DesktopPackageError(
        'app-disabled',
        `Desktop app "${requestedName}" must set Enabled to true before packaging.`,
      );
    }
    return { name: requestedName, entry };
  }

  const enabled = Object.entries(config.Apps).filter(([, entry]) =>
    entry.Type === 'desktop' && entry.Enabled === true
  );
  if (enabled.length === 0) {
    throw new DesktopPackageError(
      'app-not-found',
      'No enabled desktop app is configured. Set Type to "desktop" and Enabled to true.',
    );
  }
  if (enabled.length > 1) {
    throw new DesktopPackageError(
      'app-ambiguous',
      `Multiple enabled desktop apps are configured (${enabled.map(([name]) => name).join(', ')}); pass --app.`,
    );
  }
  const [name, entry] = enabled[0];
  return { name, entry };
}

/** Package one configured desktop app into its requested native artifact matrix. */
export async function packageDesktop(
  input: PackageDesktopInput,
  dependencies: PackageDesktopDependencies,
): Promise<PackageDesktopResult> {
  const projectRoot = resolve(input.projectRoot);
  const configPath = join(projectRoot, 'dotnet', 'AppHost', 'appsettings.json');
  const loadAppSettings = dependencies.loadAppSettings ?? loadCanonicalAppSettings;
  const config = await loadAppSettings(configPath);
  const selected = selectDesktopApp(config, input.app);
  const workdir = resolve(
    projectRoot,
    selected.entry.Workdir ?? join('apps', selected.name),
  );
  const outputDir = resolve(projectRoot, input.outputDir ?? DEFAULT_DESKTOP_PACKAGE_OUTPUT_DIR);
  const invocations = planDesktopPackages({
    appName: selected.name,
    version: config.Version,
    packageTaskName: selected.entry.PackageTaskName ?? DEFAULT_DESKTOP_PACKAGE_TASK,
    workdir,
    outputDir,
    target: input.target,
    allTargets: input.allTargets,
    formats: input.formats,
    compression: input.compression,
    hostOperatingSystem: dependencies.hostOperatingSystem,
    currentTarget: dependencies.currentTarget,
  });

  await dependencies.fileSystem.createDir(outputDir);

  if (input.compression === 'zstd') {
    let preflight;
    try {
      preflight = await dependencies.process.exec('zstd', ['--version']);
    } catch {
      throw new DesktopPackageError(
        'tool-unavailable',
        'The zstd executable is required when --compression zstd is selected.',
      );
    }
    if (preflight.code !== 0) {
      throw new DesktopPackageError(
        'tool-unavailable',
        'The zstd executable is required when --compression zstd is selected.',
      );
    }
  }

  for (const invocation of invocations) {
    let result;
    try {
      result = await dependencies.process.exec(
        invocation.command,
        invocation.args,
        { cwd: invocation.cwd },
      );
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      throw new DesktopPackageError(
        'package-failed',
        `Desktop package ${invocation.target.triple}/${invocation.format} failed: ${detail}`,
      );
    }
    if (result.code !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim() || `exit code ${result.code}`;
      throw new DesktopPackageError(
        'package-failed',
        `Desktop package ${invocation.target.triple}/${invocation.format} failed: ${detail}`,
      );
    }
  }

  return {
    appName: selected.name,
    version: config.Version,
    invocations,
  };
}
