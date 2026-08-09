import { Command } from '@cliffy/command';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { listUiRegistryItems, type UiInstallDependencies } from '../registry.ts';
import { type UiAppRootResolver, requireUiAppRoot } from '../../../presentation/support.ts';

/** Create `ui:list`, including stable JSON output for dashboard consumers. */
export function createUiListCommand(deps: { readonly installDependencies: UiInstallDependencies; readonly resolveUiAppRoot: UiAppRootResolver; readonly print?: (message: string) => void }) {
  const print = deps.print ?? outputText;
  return new Command().name('ui:list').description('List Fresh UI registry items')
    .option('--project-root <path:string>', 'Project root directory').option('--app <name:string>', 'Fresh app workspace name').option('--json', 'Emit JSON').option('--collections', 'Include collections')
    .action(async (options: { projectRoot?: string; app?: string; json?: boolean; collections?: boolean }) => {
      const root = await requireUiAppRoot(deps.resolveUiAppRoot, { projectRoot: options.projectRoot, app: options.app });
      const result = await listUiRegistryItems(root, deps.installDependencies.fs);
      if (options.json) print(JSON.stringify(options.collections ? result : { items: result.items }, null, 2));
      else {
        for (const item of result.items) print(`${item.installed ? 'installed' : 'available'}\t${item.name}\t${item.kind ?? 'item'}`);
        if (options.collections) for (const collection of result.collections) print(`collection\t${collection.name}\t${collection.items.length}`);
      }
    });
}
