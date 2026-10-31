import { Command } from '@cliffy/command';
import { buildUiRegistry } from '../../../../kernel/application/ui/build/build-ui-registry.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { UiRegistryPathPort } from '../../../../kernel/ports/ui-registry-port.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';

/** Create ui:build for arbitrary local registries and static hosting directories. */
export function createUiBuildCommand(deps: {
  readonly fs: FileSystemPort;
  readonly paths: UiRegistryPathPort;
  readonly resolvePath: (path?: string) => string;
  readonly print?: (message: string) => void;
}) {
  return new Command().name('ui:build').description('Build static registry catalog and item JSON')
    .option('--registry <path:string>', 'Source registry.json', { default: 'registry.json' })
    .option('--source-root <path:string>', 'Root containing registry source files')
    .option('--output <path:string>', 'Static output directory', { default: 'public/r' })
    .action(async (options) => {
      const files = await buildUiRegistry({
        registry: deps.resolvePath(options.registry),
        sourceRoot: options.sourceRoot ? deps.resolvePath(options.sourceRoot) : undefined,
        output: deps.resolvePath(options.output),
      }, deps);
      (deps.print ?? outputText)(`Built ${files.length} registry JSON artifacts.`);
    });
}
