import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { CliCommand } from '../../../../kernel/application/abstracts/cli-command.ts';
import {
  generateConfigSchema,
  type GenerateConfigSchemaDependencies,
  type GenerateConfigSchemaRequest,
} from './generate-runtime-schemas.ts';
import { type ProjectRootResolver, requireProjectRoot } from '../../../presentation/support.ts';
import type { GenerateRuntimeSchemasCommandInput } from './generate-runtime-schemas-input.ts';

// deno-lint-ignore no-explicit-any
type AnyCliffyCommand = Command<any, any, any, any, any, any, any, any>;

/** Dependencies for the public runtime-schema generation command. */
export interface GenerateRuntimeSchemasCommandDependencies {
  /** Application dependencies for schema generation. */
  readonly generateConfigSchemaDependencies: GenerateConfigSchemaDependencies;
  /** Build the schema generation request once the root is known. */
  readonly createRequest: (
    projectRoot: string,
    options: { readonly dryRun: boolean; readonly force: boolean; readonly verbose: boolean },
  ) => Promise<Omit<GenerateConfigSchemaRequest, 'projectRoot' | 'dryRun' | 'force'>>;
  /** Resolve the project root from flags or environment. */
  readonly resolveProjectRoot: ProjectRootResolver;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Public `generate runtime-schemas` command definition owner. */
export class GenerateRuntimeSchemasCommand extends CliCommand<AnyCliffyCommand> {
  readonly id = 'public.generate.runtime-schemas';

  constructor(private readonly dependencies: GenerateRuntimeSchemasCommandDependencies) {
    super();
  }

  define(): AnyCliffyCommand {
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name('runtime-schemas')
      .description('Generate JSON Schema files for runtime config topics')
      .option('--verbose', 'Show detailed output', { default: false })
      .option('--dry-run', 'Show what would be written without making changes', { default: false })
      .option('--force', 'Overwrite existing schema files even if unchanged', { default: false })
      .option('--project-root <path:string>', 'Project root directory')
      .action(async (options: GenerateRuntimeSchemasCommandInput): Promise<void> => {
        const projectRoot = await requireProjectRoot(
          this.dependencies.resolveProjectRoot,
          options.projectRoot,
        );
        const request = await this.dependencies.createRequest(projectRoot, {
          dryRun: options.dryRun ?? false,
          force: options.force ?? false,
          verbose: options.verbose ?? false,
        });
        const result = await generateConfigSchema({
          projectRoot,
          dryRun: options.dryRun ?? false,
          force: options.force ?? false,
          ...request,
        }, this.dependencies.generateConfigSchemaDependencies);

        print(`Schema generation complete: ${result.written.length} written.`);
        if (result.skipped.length > 0) print(`${result.skipped.length} unchanged.`);
      });
  }
}

/** Create the public `generate runtime-schemas` command. */
export function createGenerateRuntimeSchemasCommand(
  dependencies: GenerateRuntimeSchemasCommandDependencies,
) : Command<any, any, any, any, any, any, any, any> {
  return new GenerateRuntimeSchemasCommand(dependencies).define();
}
