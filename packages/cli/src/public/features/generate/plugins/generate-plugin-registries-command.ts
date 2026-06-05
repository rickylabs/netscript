import { Command } from '@cliffy/command';
import { join } from '@std/path';
import type {
  EmitterPort,
  ExtractorPort,
  RegistryEmission,
  WalkerPort,
} from '@netscript/plugin/sdk';

import { CliCommand } from '../../../../kernel/application/abstracts/cli-command.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';
import { resolveWalkerEmissions } from '../../plugins/host/trigger-walker.ts';

// deno-lint-ignore no-explicit-any
type AnyCliffyCommand = Command<any, any, any, any, any, any, any, any>;

interface GeneratePluginRegistriesCommandInput {
  readonly dryRun?: boolean;
  readonly projectRoot?: string;
  readonly verbose?: boolean;
}

/** Dependencies for the public plugin registry generation command. */
export interface GeneratePluginRegistriesCommandDependencies {
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** SDK walker port. */
  readonly walker: WalkerPort;
  /** SDK extractor port. */
  readonly extractor: ExtractorPort;
  /** SDK emitter port. */
  readonly emitter: EmitterPort;
  /** Filesystem adapter used to write generated registry files. */
  readonly fs: FileSystemPort;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Public `generate plugins` command definition owner. */
export class GeneratePluginRegistriesCommand extends CliCommand<AnyCliffyCommand> {
  readonly id = 'public.generate.plugins';

  constructor(private readonly dependencies: GeneratePluginRegistriesCommandDependencies) {
    super();
  }

  define(): AnyCliffyCommand {
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name('plugins')
      .description('Generate plugin registries from project source')
      // Permission surface: --allow-read for project source/config, --allow-write for
      // .netscript/generated output when not using --dry-run.
      .option('--dry-run', 'Show what would be written without making changes', { default: false })
      .option('--project-root <path:string>', 'Project root directory')
      .option('--verbose', 'Show generated registry paths', { default: false })
      .action(async (options: GeneratePluginRegistriesCommandInput): Promise<void> => {
        const projectRoot = await requireProjectRoot(
          this.dependencies.resolveProjectRoot,
          options.projectRoot,
        );
        const emissions = await resolveWalkerEmissions({
          projectRoot,
          walker: this.dependencies.walker,
          extractor: this.dependencies.extractor,
          emitter: this.dependencies.emitter,
        });

        await writeEmissions({
          dryRun: options.dryRun ?? false,
          emissions,
          fs: this.dependencies.fs,
          projectRoot,
        });

        const verb = options.dryRun ? 'would write' : 'written';
        print(`Plugin registry generation complete: ${emissions.length} ${verb}.`);
        if (options.verbose) {
          for (const emission of emissions) print(emission.path);
        }
      });
  }
}

/** Create the public `generate plugins` command. */
export function createGeneratePluginRegistriesCommand(
  dependencies: GeneratePluginRegistriesCommandDependencies,
) {
  return new GeneratePluginRegistriesCommand(dependencies).define();
}

async function writeEmissions(options: {
  readonly dryRun: boolean;
  readonly emissions: readonly RegistryEmission[];
  readonly fs: FileSystemPort;
  readonly projectRoot: string;
}): Promise<void> {
  if (options.dryRun) return;
  for (const emission of options.emissions) {
    await options.fs.writeFile(join(options.projectRoot, emission.path), emission.text);
  }
}
