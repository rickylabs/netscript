import { Command } from '@cliffy/command';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { listUiRegistry } from '../../../../kernel/application/ui/v2/registry-queries.ts';
import type { UiRegistryDependencies } from '../../../../kernel/application/ui/v2/registry-client.ts';
import { requireUiAppRoot, type UiAppRootResolver } from '../../../presentation/support.ts';

/** Create `ui:list`, including stable JSON output for dashboard consumers. */
export function createUiListCommand(
  deps: {
    readonly installDependencies: UiRegistryDependencies;
    readonly resolveUiAppRoot: UiAppRootResolver;
    readonly print?: (message: string) => void;
  },
) {
  const print = deps.print ?? outputText;
  return new Command().name('ui:list').description('List Fresh UI registry items')
    .option('--project-root <path:string>', 'Project root directory').option(
      '--app <name:string>',
      'Fresh app workspace name',
    ).option('--registry <namespace:string>', 'Configured registry namespace').option(
      '--json',
      'Emit JSON',
    ).option('--collections', 'Include collections')
    .action(
      async (
        options: {
          projectRoot?: string;
          app?: string;
          json?: boolean;
          collections?: boolean;
          registry?: string;
        },
      ) => {
        const root = await requireUiAppRoot(deps.resolveUiAppRoot, {
          projectRoot: options.projectRoot,
          app: options.app,
        });
        const result = await listUiRegistry(root, deps.installDependencies, options.registry);
        if (options.json) {
          print(JSON.stringify(options.collections ? result : { items: result.items }, null, 2));
        } else {
          for (const item of result.items) {
            print(
              `${item.installed ? 'installed' : 'available'}\t${item.name}\t${item.kind ?? 'item'}`,
            );
          }
          if (options.collections) {
            for (const collection of result.collections) {
              print(`collection\t${collection.name}\t${collection.items.length}`);
            }
          }
        }
      },
    );
}
