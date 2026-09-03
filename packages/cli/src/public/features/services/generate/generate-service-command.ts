import type { CliffyCommand } from '../../../../kernel/presentation/command-types.ts';
import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import {
  generateAspire,
  type GenerateAspireDependencies,
} from '../../generate/aspire/generate-aspire.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';
import {
  generateServiceClients,
  type GenerateServiceClientsDependencies,
} from './generate-service-clients.ts';

/** Dependencies for the public `service generate` command handler. */
export interface ServiceGenerateCommandDependencies {
  /** Application dependencies for helper generation. */
  readonly generateAspireDependencies: GenerateAspireDependencies;
  /** Application dependencies for client-module generation. */
  readonly generateServiceClientsDependencies: GenerateServiceClientsDependencies;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
  /** Client generator override for focused command tests. */
  readonly generateClients?: typeof generateServiceClients;
  /** Aspire generator override for focused command tests. */
  readonly generateHelpers?: typeof generateAspire;
}

/** Create the public `service generate` command. */
export function createServiceGenerateCommand(
  dependencies: ServiceGenerateCommandDependencies,
): CliffyCommand {
  const print = dependencies.print ?? outputText;
  return new Command()
    .name('generate')
    .description('Regenerate service clients and Aspire helpers from service configuration')
    .option('--project-root <path:string>', 'Project root directory')
    .option('--dry-run', 'Report generated-file changes without writing', { default: false })
    .option('--force', 'Rewrite generated files even when content is unchanged', { default: false })
    .action(async (options): Promise<void> => {
      await DEFAULT_TEMPLATE_REGISTRY.hydrate();
      const projectRoot = await requireProjectRoot(
        dependencies.resolveProjectRoot,
        options.projectRoot,
      );
      const dryRun = options.dryRun ?? false;
      const force = options.force ?? false;
      const generateClients = dependencies.generateClients ?? generateServiceClients;
      const clients = await generateClients(
        { projectRoot, dryRun, force },
        dependencies.generateServiceClientsDependencies,
      );
      const generateHelpers = dependencies.generateHelpers ?? generateAspire;
      const helpers = await generateHelpers(
        { projectRoot, dryRun, force },
        dependencies.generateAspireDependencies,
      );
      const clientVerb = dryRun ? 'Would write' : 'Wrote';
      const helperVerb = dryRun ? 'Would write' : 'Wrote';
      print(
        `${clientVerb} ${
          dryRun ? clients.planned.filter((file) => file.willWrite).length : clients.written.length
        } service client modules.`,
      );
      print(`Skipped ${clients.skipped.length} current service client modules.`);
      print(`${helperVerb} ${helpers.helperFiles.length} Aspire helper files.`);
    });
}
