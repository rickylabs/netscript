import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';

import { CliCommand } from '../../../../kernel/application/abstracts/cli-command.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import type { ProjectRootResolver } from '../../../presentation/support.ts';
import { requireProjectRoot } from '../../../presentation/support.ts';
import type { GenerateInstalledPluginRegistries } from '../../generate/plugins/generate-installed-plugin-registries.ts';

/** Dependencies for the host-side plugin sync command. */
export interface HostPluginCommandDependencies {
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Delegate to authoritative installed-plugin registry generation. */
  readonly generate: GenerateInstalledPluginRegistries;
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
  define(): CliffyCommand {
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name('sync')
      .description('Delegate registry synchronization to `netscript generate plugins`')
      .option('--project-root <path:string>', 'Project root directory')
      .action(async (options: { projectRoot?: string }): Promise<void> => {
        const projectRoot = await requireProjectRoot(
          this.dependencies.resolveProjectRoot,
          options.projectRoot,
        );
        const generated = await this.dependencies.generate({ dryRun: false, projectRoot });
        print(
          `Synchronized ${generated.length} registry file(s) via ` +
            '`netscript generate plugins`.',
        );
      });
  }
}

/** Create the host-side plugin command adapter. */
export function createHostPluginCommand(
  dependencies: HostPluginCommandDependencies,
): CliffyCommand {
  return new HostPluginCommand(dependencies).define();
}
