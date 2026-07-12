import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';
import { findProjectRoot } from '../../../../kernel/adapters/config/deploy-config.ts';
import {
  DEFAULT_CONTRACT_VERSION,
  parseContractVersion,
} from '../../../../kernel/adapters/contracts/types.ts';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { InspectContractInput } from './inspect-contract-input.ts';
import { inspectContract } from './inspect-contract.ts';

/** `netscript contract inspect` command. */
export const contractInspectCommand: CliffyCommand = new Command()
  .name('inspect')
  .description('Inspect contract procedures and schema expressions')
  .arguments('<name:string>')
  .option('--version <version:string>', 'Contract version', {
    default: DEFAULT_CONTRACT_VERSION,
  })
  .option('--json', 'Emit machine-readable JSON', { default: false })
  .option('--path <path:string>', 'Workspace path to search from')
  .action(async (flags: InspectContractInput, name: string) => {
    const projectRoot = flags.path ? await findProjectRoot(flags.path) : await findProjectRoot();
    if (!projectRoot) throw new ScaffoldValidationError('NetScript workspace root not found.');
    const result = await inspectContract(
      name,
      parseContractVersion(flags.version ?? DEFAULT_CONTRACT_VERSION),
      projectRoot,
      new DenoFileSystem(),
    );
    if (flags.json) {
      outputText(JSON.stringify(result, null, 2));
      return;
    }
    outputText(`${result.name} (${result.version})`);
    for (const procedure of result.procedures) {
      outputText(
        `  ${procedure.name}  ${procedure.method} ${procedure.path ?? '(derived path)'}  ` +
          `input=${procedure.input ?? 'none'} output=${procedure.output ?? 'none'}`,
      );
    }
  });
