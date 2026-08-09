import { Command } from '@cliffy/command';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { removeUiRegistryItem, type UiInstallDependencies } from '../registry.ts';
import { type UiAppRootResolver, requireUiAppRoot } from '../../../presentation/support.ts';

/** Create `ui:remove`. */
export function createUiRemoveCommand(deps: { readonly installDependencies: UiInstallDependencies; readonly resolveUiAppRoot: UiAppRootResolver; readonly print?: (message: string) => void }) {
  const print = deps.print ?? outputText;
  return new Command().name('ui:remove').description('Remove a copied Fresh UI registry item').arguments('<name:string>')
    .option('--project-root <path:string>', 'Project root directory').option('--app <name:string>', 'Fresh app workspace name').action(async (options: { projectRoot?: string; app?: string }, name: string) => {
      const root = await requireUiAppRoot(deps.resolveUiAppRoot, { projectRoot: options.projectRoot, app: options.app });
      const removed = await removeUiRegistryItem(root, name, deps.installDependencies.fs);
      print(`Removed ${removed.length} files and pruned deno.json imports.`);
    });
}
