import type { CliffyCommand } from '../../../../kernel/presentation/command-types.ts';
import { Command } from '@cliffy/command';
import type { EmitterPort, ExtractorPort, WalkerPort } from '@netscript/plugin/sdk';

import { CliCommand } from '../../../../kernel/application/abstracts/cli-command.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';
import type {
  GenerateInstalledPluginRegistries,
  GeneratedPluginRegistry,
} from './generate-installed-plugin-registries.ts';

interface GeneratePluginRegistriesCommandInput {
  readonly dryRun?: boolean;
  readonly projectRoot?: string;
  readonly verbose?: boolean;
}

/** Dependencies for the public plugin registry generation command. */
export interface GeneratePluginRegistriesCommandDependencies {
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Generate every registry declared by installed plugin runtime manifests. */
  readonly generate: GenerateInstalledPluginRegistries;
  /** Generic SDK walker retained for plugin item add/update commands. */
  readonly walker: WalkerPort;
  /** Generic SDK extractor retained for plugin item add/update commands. */
  readonly extractor: ExtractorPort;
  /** Generic SDK emitter retained for plugin item add/update commands. */
  readonly emitter: EmitterPort;
  /** Filesystem retained for plugin item add/update command emissions. */
  readonly fs: FileSystemPort;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Public `generate plugins` command definition owner. */
export class GeneratePluginRegistriesCommand extends CliCommand<CliffyCommand> {
  readonly id = 'public.generate.plugins';

  constructor(private readonly dependencies: GeneratePluginRegistriesCommandDependencies) {
    super();
  }

  define(): CliffyCommand {
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name('plugins')
      .description('Generate installed plugin runtime registries (authoritative)')
      .option('--dry-run', 'Show what would be written without making changes', { default: false })
      .option('--project-root <path:string>', 'Project root directory')
      .option('--verbose', 'Show generated registry paths', { default: false })
      .action(async (options: GeneratePluginRegistriesCommandInput): Promise<void> => {
        const projectRoot = await requireProjectRoot(
          this.dependencies.resolveProjectRoot,
          options.projectRoot,
        );
        const generated = await this.dependencies.generate({
          dryRun: options.dryRun ?? false,
          projectRoot,
        });

        const verb = options.dryRun ? 'would write' : 'written';
        print(`Plugin registry generation complete: ${generated.length} ${verb}.`);
        if (options.verbose) {
          for (const registry of generated) print(registry.path);
        }
      });
  }
}

/** Create the public `generate plugins` command. */
export function createGeneratePluginRegistriesCommand(
  dependencies: GeneratePluginRegistriesCommandDependencies,
): CliffyCommand {
  return new GeneratePluginRegistriesCommand(dependencies).define();
}

export type { GeneratedPluginRegistry };
