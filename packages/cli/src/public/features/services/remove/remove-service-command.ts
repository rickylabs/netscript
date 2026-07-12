import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { ScaffolderPort, TemplatePort } from '../../../../kernel/ports/template-port.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import {
  type ProjectRootResolver,
  requireProjectRoot,
} from '../../../presentation/support.ts';
import type { RemoveServiceInput } from './remove-service-input.ts';
import { removeService } from './remove-service.ts';

/** Dependencies for the public `service remove` command. */
export interface RemoveServiceCommandDependencies {
  readonly fs: FileSystemPort;
  readonly scaffolder: ScaffolderPort;
  readonly templateAdapter: TemplatePort;
  readonly resolveProjectRoot: ProjectRootResolver;
}

/** Create the public `service remove` command. */
export function createServiceRemoveCommand(
  dependencies: RemoveServiceCommandDependencies,
): CliffyCommand {
  return new Command()
    .name('remove')
    .description('Remove a service workspace and reverse its registrations')
    .arguments('<name:string>')
    .option('--keep-contract', 'Retain paired contract files', { default: false })
    .option('--project-root <path:string>', 'Project root directory')
    .action(async (flags: RemoveServiceInput, name: string) => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        flags.projectRoot,
      );
      const result = await removeService({
        name,
        projectRoot,
        keepContract: flags.keepContract ?? false,
      }, dependencies);
      outputText(
        `Removed service "${name}", ${result.removedContracts.length} contract file(s), and ` +
          `regenerated ${result.helperFiles.length} Aspire helper file(s).`,
      );
    });
}
