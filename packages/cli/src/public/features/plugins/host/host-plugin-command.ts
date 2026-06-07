import { Command } from '@cliffy/command';

import { CliCommand } from '../../../../kernel/application/abstracts/cli-command.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { ProjectRootResolver } from '../../../presentation/support.ts';
import { requireProjectRoot } from '../../../presentation/support.ts';
import type { PluginHostLoaderPort } from './plugin-loader.ts';

/** Dependencies for the host-side plugin sync command. */
export interface HostPluginCommandDependencies {
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Create a host loader for the resolved project root. */
  readonly createLoader: (projectRoot: string) => PluginHostLoaderPort;
  /** Output sink for command summaries. */
  readonly print?: (message: string) => void;
}

/** Command adapter that triggers the host-side plugin loader. */
export class HostPluginCommand extends CliCommand<Command> {
  /** Stable command identifier. */
  readonly id = 'plugin.host';

  constructor(private readonly dependencies: HostPluginCommandDependencies) {
    super();
  }

  /** Build the command definition consumed by the CLI runner. */
  define(): Command<any, any, any, any, any, any, any, any> {
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name('sync')
      .description('Synchronize plugin contributions and generated registries')
      .option('--project-root <path:string>', 'Project root directory')
      .action(async (options: { projectRoot?: string }): Promise<void> => {
        const projectRoot = await requireProjectRoot(
          this.dependencies.resolveProjectRoot,
          options.projectRoot,
        );
        const state = await this.dependencies.createLoader(projectRoot).resolve();
        print(`Synchronized ${state.plugins.length} plugin(s).`);
      }) as unknown as Command;
  }
}

/** Create the host-side plugin command adapter. */
export function createHostPluginCommand(
  dependencies: HostPluginCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  return new HostPluginCommand(dependencies).define();
}
