import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { parseContractVersion } from '../../../../kernel/adapters/contracts/types.ts';
import { ContractVersionRegistry } from '../../../../kernel/adapters/contracts/version-registry.ts';
import { findProjectRoot } from '../../../../kernel/adapters/config/deploy-config.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { AddContractVersionInput } from './add-contract-version-input.ts';
import { addContractVersion } from './add-contract-version.ts';

/** `netscript contract version add` command. */
export const contractVersionAddCommand: CliffyCommand =
  new Command()
    .name('add')
    .description('Promote a contract into a new version directory')
    .arguments('<name:string>')
    .option('--from <version:string>', 'Source contract version', { required: true })
    .option('--to <version:string>', 'Destination contract version', { required: true })
    .option('--path <path:string>', 'Workspace path to search from')
    .option('--force', 'Replace an existing destination contract', { default: false })
    .action(async (flags: AddContractVersionInput, name: string) => {
      const projectRoot = flags.path ? await findProjectRoot(flags.path) : await findProjectRoot();
      if (!projectRoot) throw new ScaffoldValidationError('NetScript workspace root not found.');
      const fs = new DenoFileSystem();
      const result = await addContractVersion({
        name,
        projectRoot,
        from: parseContractVersion(flags.from),
        to: parseContractVersion(flags.to),
        force: flags.force ?? false,
      }, { fs, registry: new ContractVersionRegistry(fs) });
      outputText(`Promoted contract "${name}" to ${flags.to} at ${result.contractPath}.`);
    });
