/** Public `netscript deploy desktop` command group. */

import { Command } from '@cliffy/command';
import type { CliffyCommand } from '../../../../../kernel/presentation/command-types.ts';
import {
  AUTO_UPDATE_ARCHITECTURES,
  AUTO_UPDATE_OPERATING_SYSTEMS,
  type AutoUpdateArchitecture,
  type AutoUpdateOperatingSystem,
} from '@netscript/sdk/auto-update';
import type { ProcessPort } from '../../../../../kernel/ports/process-port.ts';
import type { FileSystemPort } from '../../../../../kernel/ports/file-system-port.ts';
import { DesktopPackageError } from './package/desktop-package-contract.ts';
import { createDesktopPackageCommand } from './package/package-desktop-command.ts';
import { packageDesktop } from './package/package-desktop.ts';

/** Dependencies required by the desktop deployment command group. */
export interface DesktopDeployCommandDependencies {
  /** Process adapter used by native package tasks. */
  readonly process: ProcessPort;
  /** Filesystem adapter used to prepare artifact directories. */
  readonly fileSystem: Pick<FileSystemPort, 'createDir'>;
  /** Resolve a project root from an optional CLI value. */
  readonly resolveProjectRoot: (projectRoot?: string) => Promise<string | undefined>;
}

function currentReleaseTarget(): {
  readonly os: AutoUpdateOperatingSystem;
  readonly arch: AutoUpdateArchitecture;
} {
  const os = AUTO_UPDATE_OPERATING_SYSTEMS.find((candidate) => candidate === Deno.build.os);
  const arch = AUTO_UPDATE_ARCHITECTURES.find((candidate) => candidate === Deno.build.arch);
  if (os === undefined || arch === undefined) {
    throw new DesktopPackageError(
      'unsupported-target',
      `Deno Desktop packaging does not support ${Deno.build.os}-${Deno.build.arch}.`,
    );
  }
  return { os, arch };
}

/** Create the public desktop deployment command group. */
export function createDesktopDeployCommand(
  dependencies: DesktopDeployCommandDependencies,
): CliffyCommand {
  return new Command()
    .name('desktop')
    .description('Package and publish native Deno Desktop applications')
    .action(function () {
      this.showHelp();
    })
    .command(
      'package',
      createDesktopPackageCommand({
        resolveProjectRoot: dependencies.resolveProjectRoot,
        packageDesktop: (input) => {
          const currentTarget = currentReleaseTarget();
          return packageDesktop(input, {
            process: dependencies.process,
            fileSystem: dependencies.fileSystem,
            hostOperatingSystem: currentTarget.os,
            currentTarget,
          });
        },
      }),
    );
}
