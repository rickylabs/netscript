import { Command } from '@cliffy/command';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { type UiInstallDependencies, updateUiRegistryItems } from '../registry.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';

/** Create drift-safe `ui:update`. */
export function createUiUpdateCommand(deps: { readonly installDependencies: UiInstallDependencies; readonly resolveProjectRoot: ProjectRootResolver; readonly print?: (message: string) => void }) {
  const print = deps.print ?? outputText;
  return new Command().name('ui:update').description('Update unmodified Fresh UI registry files').arguments('[name:string]')
    .option('--project-root <path:string>', 'Project root directory').action(async (options: { projectRoot?: string }, name?: string) => {
      const root = await requireProjectRoot(deps.resolveProjectRoot, options.projectRoot);
      const result = await updateUiRegistryItems(root, name ? [name] : [], deps.installDependencies.fs);
      for (const path of result.drifted) print(`drift\t${path}`);
      print(`Updated ${result.updated.length} files; ${result.drifted.length} require manual merge.`);
    });
}
