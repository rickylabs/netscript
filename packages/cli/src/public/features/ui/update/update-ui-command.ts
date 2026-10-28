import { Command } from '@cliffy/command';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { updateUiRegistry } from '../../../../kernel/application/ui/v2/registry-lifecycle.ts';
import type { UiRegistryDependencies } from '../../../../kernel/application/ui/v2/registry-client.ts';
import { requireUiAppRoot, type UiAppRootResolver } from '../../../presentation/support.ts';

/** Create drift-safe `ui:update`. */
export function createUiUpdateCommand(
  deps: {
    readonly installDependencies: UiRegistryDependencies;
    readonly resolveUiAppRoot: UiAppRootResolver;
    readonly print?: (message: string) => void;
  },
) {
  const print = deps.print ?? outputText;
  return new Command().name('ui:update').description('Update unmodified Fresh UI registry files')
    .arguments('[name:string]')
    .option('--project-root <path:string>', 'Project root directory').option(
      '--app <name:string>',
      'Fresh app workspace name',
    ).action(async (options: { projectRoot?: string; app?: string }, name?: string) => {
      const root = await requireUiAppRoot(deps.resolveUiAppRoot, {
        projectRoot: options.projectRoot,
        app: options.app,
      });
      const result = await updateUiRegistry(root, name ? [name] : [], deps.installDependencies);
      for (const path of result.drifted) print(`drift\t${path}`);
      print(
        `Updated ${result.updated.length} files; ${result.drifted.length} require manual merge.`,
      );
    });
}
