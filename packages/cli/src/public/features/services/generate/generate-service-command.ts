import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import {
  generateAspire,
  type GenerateAspireDependencies,
} from '../../generate/aspire/generate-aspire.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';

/** Dependencies for the public `service generate` command handler. */
export interface ServiceGenerateCommandDependencies {
  /** Application dependencies for helper generation. */
  readonly generateAspireDependencies: GenerateAspireDependencies;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Create the public `service generate` command. */
export function createServiceGenerateCommand(
  dependencies: ServiceGenerateCommandDependencies,
) {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('generate')
    .description('Regenerate Aspire helper files from service configuration')
    .option('--project-root <path:string>', 'Project root directory')
    .action(async (options): Promise<void> => {
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const result = await generateAspire(
        { projectRoot },
        dependencies.generateAspireDependencies,
      );
      print(`Regenerated ${result.helperFiles.length} Aspire helper files.`);
    });
}
