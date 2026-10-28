import { installUiRegistry } from '../../../../kernel/application/ui/v2/install-registry.ts';
import type { UiRegistryDependencies } from '../../../../kernel/application/ui/v2/registry-client.ts';
import { reportUiRegistry } from '../add/add-ui-output.ts';
import { installUiRegistryItems } from '../registry.ts';
import { Command } from '@cliffy/command';

import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { DEFAULT_UI_INIT_ITEMS } from '../registry.ts';
import { requireUiAppRoot, type UiAppRootResolver } from '../../../presentation/support.ts';
import type { UiInitCommandInput } from './init-ui-input.ts';

/** Dependencies for the public `ui:init` command handler. */
export interface UiInitCommandDependencies {
  /** Application dependencies for installing Fresh UI registry files. */
  readonly installDependencies: UiRegistryDependencies;
  /** Resolve the Fresh application root from flags or environment. */
  readonly resolveUiAppRoot: UiAppRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Create the public `ui:init` command. */
export function createUiInitCommand(
  dependencies: UiInitCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('ui:init')
    .description('Install the NetScript Fresh UI foundation into an app workspace')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--app <name:string>', 'Fresh app workspace name')
    .option('--registry-root <path:string>', 'Fresh UI package root override')
    .option('--theme <name:string>', 'Theme registry item (defaults to the official theme)')
    .option('--force', 'Overwrite existing copied UI files', { default: false })
    .action(async (options: UiInitCommandInput): Promise<void> => {
      const projectRoot = await requireUiAppRoot(
        dependencies.resolveUiAppRoot,
        { projectRoot: options.projectRoot, app: options.app },
      );
      if (options.registryRoot) {
        const result = await installUiRegistryItems({
          projectRoot,
          registryRoot: options.registryRoot,
          names: DEFAULT_UI_INIT_ITEMS,
          overwrite: options.force ?? false,
          theme: options.theme,
        }, dependencies.installDependencies);
        print(`Installed ${result.installedItems.length} Fresh UI registry items.`);
        print(`Copied ${result.copiedFiles.length} files.`);
        return;
      }
      const result = await installUiRegistry({
        root: projectRoot,
        names: DEFAULT_UI_INIT_ITEMS,
        force: options.force,
        theme: options.theme,
      }, dependencies.installDependencies);
      reportUiRegistry(result, {}, print);
    });
}
