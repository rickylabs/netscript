import { Command } from '@cliffy/command';
import { outputText } from '../../../../../kernel/presentation/output/default-output.ts';
import { requireUiAppRoot, type UiAppRootResolver } from '../../../../presentation/support.ts';
import {
  addUiRegistrySource,
  validateUiRegistrySource,
} from '../../../../../kernel/application/ui/v2/registry-queries.ts';
import type { UiRegistryDependencies } from '../../../../../kernel/application/ui/v2/registry-client.ts';

/** Create registry namespace configuration and source-schema validation commands. */
export function createUiRegistryCommand(deps: {
  readonly installDependencies: UiRegistryDependencies;
  readonly resolveUiAppRoot: UiAppRootResolver;
  readonly resolvePath: (path?: string) => string;
  readonly print?: (message: string) => void;
}) {
  const print = deps.print ?? outputText;
  const add = new Command().arguments('<namespace:string> <url:string>')
    .option('--project-root <path:string>', 'Fresh application directory').option(
      '--app <name:string>',
      'Fresh app name',
    )
    .option(
      '--header <value:string>',
      'Header template, e.g. Authorization=Bearer ${REGISTRY_TOKEN}',
      { collect: true },
    )
    .option('--index <url:string>', 'Optional catalog URL for a template registry')
    .action(async (options, namespace: string, url: string) => {
      const root = await requireUiAppRoot(deps.resolveUiAppRoot, {
        projectRoot: options.projectRoot,
        app: options.app,
      });
      const headers: Record<string, string> = {};
      for (const input of options.header ?? []) {
        const header = input.match(/^([^:=]+)[:=]\s*(.*)$/);
        if (!header) throw new Error('Use --header Name=template');
        headers[header[1].trim()] = header[2];
      }
      await addUiRegistrySource(root, namespace, {
        url,
        headers,
        ...(options.index ? { index: options.index } : {}),
      }, deps.installDependencies);
      print(`Configured registry ${namespace}.`);
    });
  const validate = new Command().arguments('[reference:string]')
    .option('--project-root <path:string>', 'Fresh application directory for configured namespaces')
    .option('--app <name:string>', 'Fresh app name').option('--json', 'Emit JSON')
    .action(async (options, reference = 'registry.json') => {
      const root = reference.startsWith('@')
        ? await requireUiAppRoot(deps.resolveUiAppRoot, {
          projectRoot: options.projectRoot,
          app: options.app,
        })
        : deps.resolvePath(options.projectRoot);
      const result = await validateUiRegistrySource(root, reference, deps.installDependencies);
      print(
        options.json ? JSON.stringify(result) : `Valid ${result.kind}: ${result.items} item(s).`,
      );
    });
  return new Command().name('ui:registry').description('Configure and validate registries')
    .command('add', add).command('validate', validate);
}
