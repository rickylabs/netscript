import { Command } from '@cliffy/command';
import { createGateCommand } from './commands/gate-command.ts';
import { createGatesCommand } from './commands/gates-command.ts';
import { createRunCommand } from './commands/run-command.ts';
import { createSuitesCommand } from './commands/suites-command.ts';
import type { CliRunnerFactory } from './cli-command-contracts.ts';

/** Create the Cliffy program for the E2E suite. */
export function createCliProgram(createRunner: CliRunnerFactory) {
  return new Command()
    .name('netscript-cli-e2e')
    .version('0.1.0')
    .description('Run NetScript CLI E2E validation suites')
    .action(function () {
      this.showHelp();
    })
    .command('run', createRunCommand(createRunner))
    .command('gate', createGateCommand(createRunner))
    .command('suites', createSuitesCommand())
    .command('gates', createGatesCommand());
}
