import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';
import {
  DEFAULT_CONTRACT_VERSION,
  parseContractVersion,
} from '../../../../kernel/adapters/contracts/types.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import {
  type ProjectRootResolver,
  requireProjectRoot,
} from '../../../presentation/support.ts';
import type { AddServiceHandlerInput } from './add-service-handler-input.ts';
import { addServiceHandler } from './add-service-handler.ts';

/** Dependencies for the `service add-handler` command. */
export interface AddServiceHandlerCommandDependencies {
  readonly fs: FileSystemPort;
  readonly resolveProjectRoot: ProjectRootResolver;
}

/** Create the public `service add-handler` command. */
export function createServiceAddHandlerCommand(
  dependencies: AddServiceHandlerCommandDependencies,
): CliffyCommand {
  return new Command()
    .name('add-handler')
    .description('Bind a contract procedure with a compiling service handler stub')
    .arguments('<service:string> <procedure:string>')
    .option('--version <version:string>', 'Contract and router version', {
      default: DEFAULT_CONTRACT_VERSION,
    })
    .option('--project-root <path:string>', 'Project root directory')
    .action(async (
      flags: AddServiceHandlerInput,
      service: string,
      procedure: string,
    ) => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        flags.projectRoot,
      );
      const routerPath = await addServiceHandler({
        service,
        procedure,
        version: parseContractVersion(flags.version ?? DEFAULT_CONTRACT_VERSION),
        projectRoot,
      }, dependencies.fs);
      outputText(`Added handler "${procedure}" to ${routerPath}.`);
    });
}
