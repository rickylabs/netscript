import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';

import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import { requireProjectRoot } from '../../../presentation/support.ts';
import { mutateServiceReference, setServiceConfig } from './mutate-service-config.ts';

/** Create `service ref add|remove` and `service set` graph mutation commands. */
export function createServiceConfigCommands(dependencies: PublicCommandDependencies): {
  readonly ref: CliffyCommand;
  readonly set: CliffyCommand;
} {
  const ref = new Command().name('ref').description('Manage service references')
    .action(function () {
      this.showHelp();
    });
  ref.command('add', referenceCommand(dependencies, 'add'));
  ref.command('remove', referenceCommand(dependencies, 'remove'));

  const set = new Command().name('set').arguments('<name:string>')
    .description('Update an existing service and regenerate Aspire helpers')
    .option('--port <port:number>', 'HTTP port')
    .option('--enabled <enabled:boolean>', 'Whether the service is enabled')
    .option('--project-root <path:string>', 'Project root directory')
    .action(async (options: { port?: number; enabled?: boolean; projectRoot?: string }, name: string) => {
      await DEFAULT_TEMPLATE_REGISTRY.hydrate();
      const root = await requireProjectRoot(dependencies.resolveProjectRoot, options.projectRoot);
      const files = await setServiceConfig(generateDependencies(dependencies), root, name, options);
      outputText(`Updated service '${name}' and regenerated ${files.length} Aspire helper files.`);
    });
  return { ref, set };
}

function referenceCommand(
  dependencies: PublicCommandDependencies,
  operation: 'add' | 'remove',
): CliffyCommand {
  return new Command().arguments('<caller:string> <callee:string>')
    .option('--project-root <path:string>', 'Project root directory')
    .action(async (options: { projectRoot?: string }, caller: string, callee: string) => {
      await DEFAULT_TEMPLATE_REGISTRY.hydrate();
      const root = await requireProjectRoot(dependencies.resolveProjectRoot, options.projectRoot);
      const files = await mutateServiceReference(
        generateDependencies(dependencies),
        root,
        caller,
        callee,
        operation,
      );
      outputText(`${operation === 'add' ? 'Added' : 'Removed'} ${caller} -> ${callee}; regenerated ${files.length} Aspire helper files.`);
    });
}

function generateDependencies(dependencies: PublicCommandDependencies) {
  return {
    fs: dependencies.fs,
    scaffolder: dependencies.scaffolder,
    templateAdapter: dependencies.templateAdapter,
  };
}
