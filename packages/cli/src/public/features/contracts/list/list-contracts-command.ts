/**
 * @module public/features/contract-list-command
 *
 * Cliffy command for listing workspace contracts.
 */

import { Command } from '@cliffy/command';
import { findProjectRoot } from '../../../../kernel/adapters/config/deploy-config.ts';
import { parseContractVersion } from '../../../../kernel/adapters/contracts/types.ts';
import { ContractWorkspaceResolver } from '../../../../kernel/adapters/contracts/workspace-resolver.ts';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import type { CliffyCommand } from '../../../../kernel/presentation/command-types.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { ListContractsInput } from './list-contracts-input.ts';
import { formatContractList, listContracts } from './list-contracts.ts';

/** `netscript contract list` command. */
export const contractListCommand: CliffyCommand = new Command()
  .name('list')
  .description('List contracts and whether each has a matching service directory')
  .option('--version <version:string>', 'Contract version to inspect')
  .option('--path <path:string>', 'Workspace path to search from')
  .action(async (flags: ListContractsInput): Promise<void> => {
    const versions = await listContracts({
      path: flags.path,
      version: flags.version ? parseContractVersion(flags.version) : undefined,
    }, {
      findProjectRoot,
      resolver: new ContractWorkspaceResolver(new DenoFileSystem()),
    });
    for (const line of formatContractList(versions)) outputText(line);
  });
