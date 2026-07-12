import { Command } from '@cliffy/command';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { removeUiRegistryItem, type UiInstallDependencies } from '../registry.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';

/** Create `ui:remove`. */
export function createUiRemoveCommand(deps: { readonly installDependencies: UiInstallDependencies; readonly resolveProjectRoot: ProjectRootResolver; readonly print?: (message: string) => void }) {
  const print = deps.print ?? outputText;
  return new Command().name('ui:remove').description('Remove a copied Fresh UI registry item').arguments('<name:string>')
    .option('--project-root <path:string>', 'Project root directory').action(async (options: { projectRoot?: string }, name: string) => {
      const root = await requireProjectRoot(deps.resolveProjectRoot, options.projectRoot);
      const removed = await removeUiRegistryItem(root, name, deps.installDependencies.fs);
      print(`Removed ${removed.length} files and pruned deno.json imports.`);
    });
}
