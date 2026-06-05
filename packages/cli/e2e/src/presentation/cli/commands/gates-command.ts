import { Command } from '@cliffy/command';
import { resolveSuite } from '../suites/registry.ts';

/** `gates` command. */
export function createGatesCommand() {
  return new Command()
    .name('gates')
    .description('List gates for a suite')
    .arguments('<suite:string>')
    .action((_options: unknown, suiteId: string) => {
      const suite = resolveSuite(suiteId);
      for (const gate of suite.gates) {
        Deno.stdout.writeSync(
          new TextEncoder().encode(`${gate.id}\t${gate.phase}\t${gate.title}\n`),
        );
      }
    });
}
