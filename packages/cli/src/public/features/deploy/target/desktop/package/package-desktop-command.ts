/** Public `netscript deploy desktop package` command. */

import { Command } from '@cliffy/command';
import type { CliffyCommand } from '../../../../../../kernel/presentation/command-types.ts';
import { outputText } from '../../../../../../kernel/presentation/output/default-output.ts';
import {
  DESKTOP_PACKAGE_COMPRESSIONS,
  type DesktopPackageCompression,
  DesktopPackageError,
  DEFAULT_DESKTOP_PACKAGE_OUTPUT_DIR,
  NATIVE_PACKAGE_FORMATS,
  type NativePackageFormat,
} from './desktop-package-contract.ts';
import type { PackageDesktopInput, PackageDesktopResult } from './package-desktop.ts';

/** Dependencies for the public desktop package command. */
export interface DesktopPackageCommandDependencies {
  /** Resolve a project root from an optional CLI value. */
  readonly resolveProjectRoot: (projectRoot?: string) => Promise<string | undefined>;
  /** Run the native package application workflow. */
  readonly packageDesktop: (input: PackageDesktopInput) => Promise<PackageDesktopResult>;
  /** Print command completion output. */
  readonly print?: (message: string) => void;
}

function parseFormats(values: readonly string[] | undefined): readonly NativePackageFormat[] | undefined {
  if (values === undefined) return undefined;
  const formats: NativePackageFormat[] = [];
  for (const value of values) {
    const format = NATIVE_PACKAGE_FORMATS.find((candidate) => candidate === value);
    if (format === undefined) {
      throw new DesktopPackageError(
        'unsupported-format',
        `Unsupported native package format "${value}". Expected ${NATIVE_PACKAGE_FORMATS.join(', ')}.`,
      );
    }
    formats.push(format);
  }
  return formats;
}

function parseCompression(value: string): DesktopPackageCompression {
  const compression = DESKTOP_PACKAGE_COMPRESSIONS.find((candidate) => candidate === value);
  if (compression === undefined) {
    throw new DesktopPackageError(
      'invalid-input',
      `Unsupported compression "${value}". Expected ${DESKTOP_PACKAGE_COMPRESSIONS.join(', ')}.`,
    );
  }
  return compression;
}

/** Create the public native desktop package command. */
export function createDesktopPackageCommand(
  dependencies: DesktopPackageCommandDependencies,
): CliffyCommand {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('package')
    .description('Package an enabled desktop app into Deno Desktop native formats')
    .option('--project-root <dir:string>', 'NetScript project root')
    .option('--app <name:string>', 'Desktop app resource name')
    .option('--target <triple:string>', 'Explicit Deno Desktop target triple')
    .option('--all-targets', 'Package all SDK-supported OS and architecture targets')
    .option('--format <format:string>', 'Native format; repeat for multiple formats', {
      collect: true,
    })
    .option('--compression <algorithm:string>', 'Compression: none, xz, lzma, or zstd', {
      default: 'xz',
    })
    .option('-o, --output-dir <dir:string>', 'Native package output directory', {
      default: DEFAULT_DESKTOP_PACKAGE_OUTPUT_DIR,
    })
    .action(async (options): Promise<void> => {
      if (options.target !== undefined && options.allTargets === true) {
        throw new DesktopPackageError(
          'invalid-input',
          '--target and --all-targets are mutually exclusive.',
        );
      }
      const projectRoot = await dependencies.resolveProjectRoot(options.projectRoot);
      if (projectRoot === undefined) {
        throw new DesktopPackageError(
          'invalid-input',
          'Unable to locate a NetScript project root; pass --project-root.',
        );
      }
      const result = await dependencies.packageDesktop({
        projectRoot,
        app: options.app,
        target: options.target,
        allTargets: options.allTargets === true,
        formats: parseFormats(options.format),
        compression: parseCompression(options.compression),
        outputDir: options.outputDir,
      });
      print(
        `Packaged ${result.appName}@${result.version}: ${result.invocations.length} native artifact(s).`,
      );
    });
}
