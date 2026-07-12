import type { CliffyCommand } from "../../../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';
import { contractVersionAddCommand } from './add-contract-version-command.ts';

/** Root `netscript contract version` command group. */
export const contractVersionCommand: CliffyCommand = new Command()
  .name('version')
  .description('Evolve versioned workspace contracts')
  .action(function () {
    this.showHelp();
  })
  .command('add', contractVersionAddCommand);
