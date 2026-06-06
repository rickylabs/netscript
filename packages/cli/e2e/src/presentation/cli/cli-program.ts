import { Command } from '@cliffy/command';
import { RemoteError } from '../../../../src/kernel/domain/errors/cli-exit-error.ts';
import { defaultRunOptions } from '../../create-default-runner.ts';
import { SCAFFOLD } from '../../domain/cli-surface.ts';
import { createGateCommand } from './commands/gate-command.ts';
import { createGatesCommand } from './commands/gates-command.ts';
import { createRunCommand } from './commands/run-command.ts';
import { createSuitesCommand } from './commands/suites-command.ts';
import type { CliRunnerFactory } from './cli-command-contracts.ts';
import { resolveSuite } from './suites/registry.ts';

/** Create the Cliffy program for the E2E suite. */
export function createCliProgram(createRunner: CliRunnerFactory) {
  return new Command()
    .name('netscript-cli-e2e')
    .version('0.1.0')
    .description('Run NetScript CLI E2E validation suites')
    .action(async () => {
      const options = { ...defaultRunOptions(), cleanup: true };
      const suite = resolveSuite(SCAFFOLD.RUNTIME, options);
      const report = await createRunner(options).run(suite, { suiteId: suite.id, options });
      if (!report.ok) throw new RemoteError(1, 'CLI E2E suite failed');
    })
    .command('run', createRunCommand(createRunner))
    .command('gate', createGateCommand(createRunner))
    .command('suites', createSuitesCommand())
    .command('gates', createGatesCommand());
}
