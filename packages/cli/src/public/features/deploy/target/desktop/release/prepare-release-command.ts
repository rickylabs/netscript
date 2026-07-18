/** Public `netscript deploy desktop release prepare` command. */

import { Command } from '@cliffy/command';
import {
  AUTO_UPDATE_ARCHITECTURES,
  AUTO_UPDATE_OPERATING_SYSTEMS,
  DEFAULT_RELEASE_CHANNEL,
  type AutoUpdateArchitecture,
  type AutoUpdateOperatingSystem,
} from '@netscript/sdk/auto-update';
import { resolve } from '@std/path';
import type { CliffyCommand } from '../../../../../../kernel/presentation/command-types.ts';
import { outputText } from '../../../../../../kernel/presentation/output/default-output.ts';
import type { ProcessPort } from '../../../../../../kernel/ports/process-port.ts';
import { NativeReleaseError } from './native-release-contract.ts';
import {
  createBsdiffPatch,
  prepareNativeRelease,
  type PreviousRuntimeInput,
} from './prepare-native-release.ts';
import { DenoNativeReleaseStore, type NativeReleaseRoute } from './release-store.ts';
import { decodePkcs8Pem, importReleasePrivateKey, signReleaseString } from './sign-release.ts';

/** Dependencies for the native release prepare command. */
export interface PrepareReleaseCommandDependencies {
  /** Process adapter used for external bsdiff. */
  readonly process: ProcessPort;
  /** Resolve a project root from an optional CLI value. */
  readonly resolveProjectRoot: (projectRoot?: string) => Promise<string | undefined>;
  /** Print successful completion. */
  readonly print?: (message: string) => void;
}

function parseTarget(value: string): Pick<NativeReleaseRoute, 'os' | 'arch'> {
  for (const os of AUTO_UPDATE_OPERATING_SYSTEMS) {
    for (const arch of AUTO_UPDATE_ARCHITECTURES) {
      if (value === `${os}-${arch}`) return { os, arch };
    }
  }
  throw new NativeReleaseError('invalid-input', `Unsupported release target "${value}".`);
}

function parsePreviousRuntimes(values: readonly string[]): readonly PreviousRuntimeInput[] {
  return values.map((value) => {
    const separator = value.indexOf('=');
    if (separator <= 0 || separator === value.length - 1) {
      throw new NativeReleaseError('invalid-input', '--from must use <version>=<runtime-path>.');
    }
    return { version: value.slice(0, separator), runtimePath: value.slice(separator + 1) };
  });
}

/** Create the native release preparation command. */
export function createPrepareReleaseCommand(
  dependencies: PrepareReleaseCommandDependencies,
): CliffyCommand {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('prepare')
    .description('Prepare signed native latest.json and bsdiff patches')
    .option('--project-root <dir:string>', 'NetScript project root')
    .option('--channel <channel:string>', 'Release channel', { default: DEFAULT_RELEASE_CHANNEL })
    .option('--target <target:string>', 'SDK release target, for example linux-x86_64', {
      required: true,
    })
    .option('--version <version:string>', 'New native runtime version', { required: true })
    .option('--sequence <sequence:integer>', 'Strictly increasing release sequence', {
      required: true,
    })
    .option('--current-runtime <path:string>', 'New runtime library path', { required: true })
    .option('--from <versionRuntime:string>', 'Previous <version>=<runtime-path>; repeatable', {
      collect: true,
      required: true,
    })
    .option('--private-key-file <path:string>', 'Ed25519 PKCS#8 PEM private key', {
      required: true,
    })
    .option('--release-dir <dir:string>', 'Filesystem release root', {
      default: '.deploy/desktop/releases',
    })
    .action(async (options): Promise<void> => {
      const projectRoot = await dependencies.resolveProjectRoot(options.projectRoot);
      if (projectRoot === undefined) {
        throw new NativeReleaseError('invalid-input', 'Unable to locate a NetScript project root.');
      }
      const target = parseTarget(options.target);
      const privateKey = await importReleasePrivateKey(
        decodePkcs8Pem(await Deno.readTextFile(resolve(projectRoot, options.privateKeyFile))),
      );
      const store = new DenoNativeReleaseStore(resolve(projectRoot, options.releaseDir));
      const result = await prepareNativeRelease(
        {
          route: { channel: options.channel, ...target },
          version: options.version,
          sequence: options.sequence,
          currentRuntimePath: resolve(projectRoot, options.currentRuntime),
          previousRuntimes: parsePreviousRuntimes(options.from).map((previous) => ({
            ...previous,
            runtimePath: resolve(projectRoot, previous.runtimePath),
          })),
        },
        {
          createPatch: (oldPath, newPath) => createBsdiffPatch(dependencies.process, oldPath, newPath),
          sign: (signed) => signReleaseString(signed, privateKey),
          promote: (request) => store.promote(request),
        },
      );
      print(`Prepared native release sequence ${result.payload.sequence} at ${result.manifestPath}.`);
    });
}
