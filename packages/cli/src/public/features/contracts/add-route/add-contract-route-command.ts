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
import type { AddContractRouteInput } from './add-contract-route-input.ts';
import { addContractRoute } from './add-contract-route.ts';

/** `netscript contract add-route` command. */
export const contractAddRouteCommand: CliffyCommand = new Command()
  .name('add-route')
  .description('Append a typed oRPC procedure to a contract')
  .arguments('<contract:string> <procedure:string>')
  .option('--method <method:string>', 'HTTP method', { required: true })
  .option('--path <route:string>', 'REST route path', { required: true })
  .option('--input <schema:string>', 'Input schema expression')
  .option('--output <schema:string>', 'Output schema expression')
  .option('--version <version:string>', 'Contract version', {
    default: DEFAULT_CONTRACT_VERSION,
  })
  .option('--project-root <path:string>', 'Workspace path to search from')
  .action(async (
    flags: AddContractRouteInput,
    contract: string,
    procedure: string,
  ) => {
    const projectRoot = flags.projectRoot
      ? await findProjectRoot(flags.projectRoot)
      : await findProjectRoot();
    if (!projectRoot) throw new ScaffoldValidationError('NetScript workspace root not found.');
    const contractPath = await addContractRoute({
      contract,
      procedure,
      method: flags.method,
      path: flags.path,
      input: flags.input,
      output: flags.output,
      version: parseContractVersion(flags.version ?? DEFAULT_CONTRACT_VERSION),
      projectRoot,
    }, new DenoFileSystem());
    outputText(`Added ${flags.method.toUpperCase()} ${flags.path} as ${procedure} in ${contractPath}.`);
  });
