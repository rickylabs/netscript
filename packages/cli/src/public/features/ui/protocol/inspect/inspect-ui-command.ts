import { Command } from '@cliffy/command';
import { outputText } from '../../../../../kernel/presentation/output/default-output.ts';
import { requireUiAppRoot, type UiAppRootResolver } from '../../../../presentation/support.ts';
import {
  infoUiRegistry,
  listUiRegistry,
  viewUiRegistry,
} from '../../../../../kernel/application/ui/v2/registry-queries.ts';
import type { UiRegistryDependencies } from '../../../../../kernel/application/ui/v2/registry-client.ts';

/** Create the read-only registry view, search, docs and app-info commands. */
export function createUiInspectCommand(kind: 'view' | 'search' | 'docs' | 'info', deps: {
  readonly installDependencies: UiRegistryDependencies;
  readonly resolveUiAppRoot: UiAppRootResolver;
  readonly print?: (message: string) => void;
}) {
  const command = new Command().name(`ui:${kind}`).description(`Inspect Fresh UI registry ${kind}`)
    .option('--project-root <path:string>', 'Fresh application directory')
    .option('--app <name:string>', 'Fresh application workspace name')
    .option('--registry <namespace:string>', 'Configured registry namespace, for search')
    .option('--json', 'Emit structured JSON');
  if (kind === 'view' || kind === 'docs') command.arguments('<reference:string>');
  if (kind === 'search') command.arguments('[query:string]');
  return command.action(async (options, reference?: string) => {
    const root = await requireUiAppRoot(deps.resolveUiAppRoot, {
      projectRoot: options.projectRoot,
      app: options.app,
    });
    let result: unknown;
    if (kind === 'info') result = await infoUiRegistry(root, deps.installDependencies);
    else if (kind === 'search') {
      const list = await listUiRegistry(root, deps.installDependencies, options.registry);
      const query = (reference ?? '').toLowerCase();
      result = {
        items: list.items.filter((item) =>
          [item.name, item.description, item.type, ...item.categories].some((value) =>
            value?.toLowerCase().includes(query)
          )
        ),
      };
    } else {
      const item = await viewUiRegistry(root, reference!, deps.installDependencies);
      result = kind === 'view' ? item : {
        name: item.name,
        docs: item.docs ?? '',
        files: item.files.filter((file) => /\.(md|mdx)$/.test(file.path)).map((file) => ({
          path: file.path,
          target: file.target,
        })),
      };
    }
    (deps.print ?? outputText)(JSON.stringify(result, null, 2));
  });
}
