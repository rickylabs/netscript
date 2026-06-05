import { Command } from '@cliffy/command';
import { builtInSuites } from '../suites/registry.ts';

/** `suites` command. */
export function createSuitesCommand() {
  return new Command()
    .name('suites')
    .description('List available CLI E2E suites')
    .action(() => {
      for (const suite of builtInSuites) {
        Deno.stdout.writeSync(new TextEncoder().encode(`${suite.id}\t${suite.title}\n`));
      }
    });
}
