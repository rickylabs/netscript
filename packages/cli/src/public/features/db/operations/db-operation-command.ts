/**
 * @module public/features/db/operations/db-operation-command
 */

import { resolve } from '@std/path';
import { Command } from '@cliffy/command';

import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { CliCommand } from '../../../../kernel/application/abstracts/cli-command.ts';
import { DbOperationRunner } from '../../../../kernel/adapters/database/operation-runner.ts';
import { DbWorkspaceResolver } from '../../../../kernel/adapters/database/workspace-resolver.ts';
import { RemoteError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { DbOperation } from '../../../../kernel/domain/db-engine.ts';

// deno-lint-ignore no-explicit-any
type AnyCliffyCommand = Command<any, any, any, any, any, any, any, any>;

/** Common options for database operation commands. */
export interface DbOperationCommandOptions {
  /** Database target: config key, database name, or `all`. */
  readonly db?: string;

  /** Project root directory. */
  readonly projectRoot?: string;
}

/** Host hooks required by DB operation presentation commands. */
export interface DbOperationCommandDependencies {
  /** Return the current working directory. */
  readonly cwd: () => string;
}

/** Shared public database operation command owner. */
export class DbOperationCommand extends CliCommand<AnyCliffyCommand> {
  readonly id: string;

  constructor(
    private readonly operation: DbOperation,
    private readonly descriptionText: string,
    private readonly dependencies: DbOperationCommandDependencies,
  ) {
    super();
    this.id = `public.db.${operation}`;
  }

  define(): AnyCliffyCommand {
    return new Command()
      .name(this.operation)
      .description(this.descriptionText)
      .option('--db <target:string>', 'Database target (config key, database name, or "all")')
      .option('--project-root <path:string>', 'Project root directory')
      .action(async (options: DbOperationCommandOptions): Promise<void> => {
        const code = await runDbOperation(this.operation, options, this.dependencies.cwd);
        exitWithCode(code);
      });
  }
}

/** Build an operation subcommand backed by the shared resolver and runner. */
export function createDbOperationCommand(
  operation: DbOperation,
  description: string,
  dependencies: DbOperationCommandDependencies,
) : Command<any, any, any, any, any, any, any, any> {
  return new DbOperationCommand(operation, description, dependencies).define();
}

/** Execute a database operation from CLI options. */
export async function runDbOperation(
  operation: DbOperation,
  options: DbOperationCommandOptions & { readonly migrationName?: string },
  cwd: () => string,
): Promise<number> {
  const projectRoot = resolve(options.projectRoot ?? cwd());
  const fs = new DenoFileSystem();
  const resolver = new DbWorkspaceResolver(fs);
  const databases = await resolver.discoverDatabases(projectRoot);
  const target = resolver.resolveTarget(databases, options.db);
  const runner = new DbOperationRunner();
  return await runner.execute({
    operation,
    target,
    migrationName: options.migrationName,
    projectRoot,
  });
}

/** Raise a typed exit error when the operation fails. */
export function exitWithCode(code: number): void {
  if (code !== 0) {
    throw new RemoteError(code, `Database operation failed with exit code ${code}`);
  }
}
