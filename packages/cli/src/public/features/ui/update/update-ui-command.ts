import { Command } from '@cliffy/command';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { type UiInstallDependencies, updateUiRegistryItems } from '../registry.ts';
import { type UiAppRootResolver, requireUiAppRoot } from '../../../presentation/support.ts';

/** Create drift-safe `ui:update`. */
export function createUiUpdateCommand(deps: { readonly installDependencies: UiInstallDependencies; readonly resolveUiAppRoot: UiAppRootResolver; readonly print?: (message: string) => void }) {
  const print = deps.print ?? outputText;
  return new Command().name('ui:update').description('Update unmodified Fresh UI registry files').arguments('[name:string]')
    .option('--project-root <path:string>', 'Project root directory').option('--app <name:string>', 'Fresh app workspace name').action(async (options: { projectRoot?: string; app?: string }, name?: string) => {
      const root = await requireUiAppRoot(deps.resolveUiAppRoot, { projectRoot: options.projectRoot, app: options.app });
      const result = await updateUiRegistryItems(root, name ? [name] : [], deps.installDependencies.fs);
      for (const path of result.drifted) print(`drift\t${path}`);
      print(`Updated ${result.updated.length} files; ${result.drifted.length} require manual merge.`);
    });
}
