/**
 * @module public/features/contract-root-command
 *
 * Contract lifecycle command group root for the public CLI.
 */

import { Command } from '@cliffy/command';
import { contractAddCommand } from './add/add-contract-command.ts';
import { contractListCommand } from './list/list-contracts-command.ts';
import { contractVersionCommand } from './version-add/contract-version-group.ts';
import { contractRemoveCommand } from './remove/remove-contract-command.ts';
import { contractAddRouteCommand } from './add-route/add-contract-route-command.ts';
import { contractInspectCommand } from './inspect/inspect-contract-command.ts';

/** Root `netscript contract` command group. */
export const contractCommand: Command<any, any, any, any, any, any, any, any> = new Command()
  .name('contract')
  .description('Manage NetScript workspace contracts')
  .action(function () {
    this.showHelp();
  })
  .command('add', contractAddCommand)
  .command('version', contractVersionCommand)
  .command('remove', contractRemoveCommand)
  .command('add-route', contractAddRouteCommand)
  .command('inspect', contractInspectCommand)
  .command('list', contractListCommand);
