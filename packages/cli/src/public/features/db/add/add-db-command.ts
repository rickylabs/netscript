import { outputText } from '../../../../kernel/presentation/output/default-output.ts';
import { Command } from '@cliffy/command';
import { ScaffoldCommand } from '../../../../kernel/presentation/abstracts/scaffold-command.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../kernel/application/registries/template-registry.ts';
import { addDb, type AddDbDependencies } from './add-db.ts';
import type { AddDbCommandInput } from './add-db-input.ts';

// deno-lint-ignore no-explicit-any
type AnyCliffyCommand = Command<any, any, any, any, any, any, any, any>;

/** Dependencies for the public `db add` command handler. */
export interface DbAddCommandDependencies {
  /** Application dependencies for adding a database workspace. */
  readonly addDbDependencies: AddDbDependencies;
  /** Convert an optional project-root flag into the absolute root. */
  readonly resolvePath: (path?: string) => string;
  /** Print completion lines. */
  readonly print?: (message: string) => void;
}

/** Public `db add` command definition owner. */
export class AddDbCommand extends ScaffoldCommand<AnyCliffyCommand> {
  readonly id = 'public.db.add';
  protected readonly scaffoldSubject = 'database workspace';

  constructor(private readonly dependencies: DbAddCommandDependencies) {
    super();
  }

  define(): AnyCliffyCommand {
    const print = this.dependencies.print ?? outputText;
    return new Command()
      .name('add')
      .description('Add a database workspace to an existing project')
      .arguments('<engine:string>')
      .option('--name <key:string>', 'Config key for the database')
      .option('--project-root <path:string>', 'Project root directory')
      .option('--force', 'Overwrite existing database workspace files', { default: false })
      .action(async (options: AddDbCommandInput, engine: string): Promise<void> => {
        await DEFAULT_TEMPLATE_REGISTRY.hydrate();
        const result = await addDb({
          engine,
          configKey: options.name,
          projectRoot: this.dependencies.resolvePath(options.projectRoot),
          overwrite: options.force ?? false,
        }, this.dependencies.addDbDependencies);

        print(`Added ${engine} database "${result.scaffold.configKey}".`);
        print(`Created ${result.scaffold.scaffoldResult.filesCreated.length} database files.`);
        print(`Regenerated ${result.appHostHelpers.length} Aspire helper files.`);
      });
  }
}

/** Create the public `db add` command. */
export function createDbAddCommand(
  dependencies: DbAddCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  return new AddDbCommand(dependencies).define();
}
