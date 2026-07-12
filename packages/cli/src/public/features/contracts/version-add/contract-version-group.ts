import { Command } from '@cliffy/command';
import { contractVersionAddCommand } from './add-contract-version-command.ts';

/** Root `netscript contract version` command group. */
export const contractVersionCommand: Command<any, any, any, any, any, any, any, any> = new Command()
  .name('version')
  .description('Evolve versioned workspace contracts')
  .action(function () {
    this.showHelp();
  })
  .command('add', contractVersionAddCommand);
