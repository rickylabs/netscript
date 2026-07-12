import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
/**
 * @module public/features/contract-list-command
 *
 * Cliffy command for listing workspace contracts.
 */

import { Command } from '@cliffy/command';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { parseContractVersion } from '../../../../kernel/adapters/contracts/types.ts';
import { ContractWorkspaceResolver } from '../../../../kernel/adapters/contracts/workspace-resolver.ts';
import { findProjectRoot } from '../../../../kernel/adapters/config/deploy-config.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { ListContractsInput } from './list-contracts-input.ts';

async function resolveProjectRoot(pathFlag: string | undefined): Promise<string> {
  const projectRoot = pathFlag ? await findProjectRoot(pathFlag) : await findProjectRoot();
  if (projectRoot === null) {
    throw new ScaffoldValidationError(
      'NetScript workspace root not found. Run this command inside a workspace or pass --path.',
    );
  }
  return projectRoot;
}

/** `netscript contract list` command. */
export const contractListCommand: Command<any, any, any, any, any, any, any, any> = new Command()
  .name('list')
  .description('List contracts in the current NetScript workspace')
  .option('--version <version:string>', 'Contract version to inspect')
  .option('--path <path:string>', 'Workspace path to search from')
  .action(async (flags: ListContractsInput): Promise<void> => {
    const fs = new DenoFileSystem();
    const projectRoot = await resolveProjectRoot(flags.path);
    const resolver = new ContractWorkspaceResolver(fs);
    const versions = flags.version
      ? [parseContractVersion(flags.version)]
      : await resolver.discoverVersions(projectRoot);
    let count = 0;
    for (const version of versions) {
      const discovered = await resolver.discoverVersion(projectRoot, version);
      outputText(`Contracts (${version})`);
      for (const contract of discovered.contracts) {
        count++;
        const pairing = contract.hasService ? 'service paired' : 'contract only';
        outputText(`  ${contract.name}  ${pairing}`);
      }
    }
    if (count === 0) {
      outputText('No contracts found.');
    }
  });
