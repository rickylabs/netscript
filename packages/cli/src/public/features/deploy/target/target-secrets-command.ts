import { Command } from '@cliffy/command';

import type { PublicCommandDependencies } from '../../root/public-command-dependencies.ts';
import { runTargetOperation } from './run-target-operation.ts';

/** Create target secrets set/get/list subcommands. */
export function createTargetSecretsCommand(
  key: string,
  dependencies: PublicCommandDependencies,
): Command<any, any, any, any, any, any, any, any> {
  const group = new Command().name('secrets').description('Manage target deployment secrets')
    .action(function () {
      this.showHelp();
    });
  group.command('set', new Command().arguments('<key:string> <value:string>')
    .option('--project-root <dir:string>', 'Project root')
    .action((options: { projectRoot?: string }, secretKey: string, value: string) =>
      runTargetOperation(dependencies, key, 'secrets', {
        ...options,
        secrets: { operation: 'set', key: secretKey, value },
      })));
  group.command('get', new Command().arguments('<key:string>')
    .option('--project-root <dir:string>', 'Project root')
    .action((options: { projectRoot?: string }, secretKey: string) =>
      runTargetOperation(dependencies, key, 'secrets', {
        ...options,
        secrets: { operation: 'get', key: secretKey },
      })));
  group.command('list', new Command().option('--project-root <dir:string>', 'Project root')
    .action((options: { projectRoot?: string }) =>
      runTargetOperation(dependencies, key, 'secrets', {
        ...options,
        secrets: { operation: 'list' },
      })));
  return group;
}
