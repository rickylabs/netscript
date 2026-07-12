import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';
import { findProjectRoot } from '../../../../kernel/adapters/config/deploy-config.ts';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { parseContractVersion } from '../../../../kernel/adapters/contracts/types.ts';
import { ContractVersionRegistry } from '../../../../kernel/adapters/contracts/version-registry.ts';
import { ContractWorkspaceResolver } from '../../../../kernel/adapters/contracts/workspace-resolver.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { RemoveContractInput } from './remove-contract-input.ts';
import { removeContract } from './remove-contract.ts';

/** `netscript contract remove` command. */
export const contractRemoveCommand: CliffyCommand = new Command()
  .name('remove')
  .description('Remove a contract and regenerate version aggregates')
  .arguments('<name:string>')
  .option('--version <version:string>', 'Only remove the named contract version')
  .option('--path <path:string>', 'Workspace path to search from')
  .action(async (flags: RemoveContractInput, name: string) => {
    const projectRoot = flags.path ? await findProjectRoot(flags.path) : await findProjectRoot();
    if (!projectRoot) throw new ScaffoldValidationError('NetScript workspace root not found.');
    const fs = new DenoFileSystem();
    const removed = await removeContract({
      name,
      projectRoot,
      version: flags.version ? parseContractVersion(flags.version) : undefined,
    }, {
      fs,
      registry: new ContractVersionRegistry(fs),
      resolver: new ContractWorkspaceResolver(fs),
    });
    outputText(`Removed contract "${name}" from ${removed.length} version(s).`);
  });
