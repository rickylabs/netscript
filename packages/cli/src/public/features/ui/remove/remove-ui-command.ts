import type { GeneratedSourceFormatterPort } from '../../../../kernel/ports/generated-source-formatter-port.ts';
import { Command } from '@cliffy/command';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { removeUiPage } from '../../../../kernel/application/ui/remove-ui-page.ts';
import { removeUiRegistryItem, type UiInstallDependencies } from '../registry.ts';
import { requireUiAppRoot, type UiAppRootResolver } from '../../../presentation/support.ts';

/** Create `ui:remove` for registry items and unchanged generated pages. */
export function createUiRemoveCommand(deps: {
  readonly installDependencies: UiInstallDependencies;
  readonly resolveUiAppRoot: UiAppRootResolver;
  readonly formatter?: Pick<GeneratedSourceFormatterPort, 'formatContents'>;
  readonly writeManifest?: (appRoot: string) => Promise<unknown>;
  readonly print?: (message: string) => void;
}) {
  const print = deps.print ?? outputText;
  return new Command().name('ui:remove')
    .description(
      'Remove a copied Fresh UI registry item or an unchanged generated page triad and router entry',
    )
    .arguments('<kind:string> [path:string]')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--app <name:string>', 'Fresh app workspace name')
    .option('--client <service:string>', 'Select the original service client for a data-bound page')
    .option('--dry-run', 'Validate and preview page removal without writing', { default: false })
    .example('Page removal', 'netscript ui:remove page catalog --dry-run')
    .action(
      async (
        options: { projectRoot?: string; app?: string; client?: string; dryRun: boolean },
        kind: string,
        path?: string,
      ) => {
        const root = await requireUiAppRoot(deps.resolveUiAppRoot, {
          projectRoot: options.projectRoot,
          app: options.app,
        });
        if (kind === 'page') {
          if (!path) throw new Error('ui:remove page requires <path>.');
          if (!deps.writeManifest || !deps.formatter) {
            throw new Error(
              'Page removal requires the route manifest writer and source formatter.',
            );
          }
          const result = await removeUiPage(
            { projectRoot: root, path, client: options.client, dryRun: options.dryRun },
            deps.installDependencies.fs,
            deps.writeManifest,
            deps.formatter,
          );
          if (result.status === 'absent') {
            print(
              `Nothing to remove for page '${path}'.${
                options.dryRun ? '' : ' Derived route modules refreshed.'
              }`,
            );
            return;
          }
          for (const file of result.files) {
            print(`${options.dryRun ? 'Planned removal' : 'Removed'}: ${file}`);
          }
          print(
            `${
              options.dryRun ? 'Planned' : 'Completed'
            } page removal: ${result.files.length} files; router ${
              result.routerChanged ? 'reconciled' : 'unchanged'
            }.`,
          );
          return;
        }
        if (path || options.dryRun || options.client) {
          throw new Error('Page path, --dry-run and --client are supported only for page removal.');
        }
        const removed = await removeUiRegistryItem(root, kind, deps.installDependencies.fs);
        print(`Removed ${removed.length} files and pruned deno.json imports.`);
      },
    );
}
