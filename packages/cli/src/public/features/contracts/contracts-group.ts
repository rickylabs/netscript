/**
 * @module public/features/contract-root-command
 *
 * Contract lifecycle command group root for the public CLI.
 */

import { Command } from '@cliffy/command';
import { contractAddCommand } from './add/add-contract-command.ts';
import { contractListCommand } from './list/list-contracts-command.ts';

/** Root `netscript contract` command group. */
export const contractCommand: Command<any, any, any, any, any, any, any, any> = new Command()
  .name('contract')
  .description('Manage NetScript workspace contracts')
  .action(function () {
    this.showHelp();
  })
  .command('add', contractAddCommand)
  .command('list', contractListCommand);
