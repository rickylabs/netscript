import { assertEquals } from 'jsr:@std/assert@^1';
import {
  WORKERS_CLI_COMMANDS,
  WorkersCli,
  workersCli,
  type WorkersCliBackend,
  type WorkersCliCommandDefinition,
} from '../../src/cli/composition/main.ts';
import type { PluginCliArgs, PluginCliResult } from '../../src/cli/composition/main.ts';

class RecordingWorkersBackend implements WorkersCliBackend {
  readonly handled: WorkersCliCommandDefinition[] = [];

  handle(
    definition: WorkersCliCommandDefinition,
    args: PluginCliArgs,
  ): PluginCliResult {
    this.handled.push(definition);
    return {
      code: 0,
      message: `handled ${definition.name}`,
      data: {
        command: definition.name,
        category: definition.category,
        values: args.values ?? [],
        flags: args.flags ?? {},
      },
    };
  }
}

Deno.test('WorkersCli exposes the workers command registry', async () => {
  const backend = new RecordingWorkersBackend();
  const cli = new WorkersCli(backend);
  const commands = cli.commands();

  assertEquals(cli.name, 'workers');
  assertEquals(cli.description, 'Background Workers plugin CLI.');
  assertEquals(commands.map((command) => command.name), [...WORKERS_CLI_COMMANDS]);

  const addJob = await cli.run({
    command: 'add-job',
    values: ['nightly-report'],
    flags: { topic: 'workers.jobs' },
  });
  assertEquals(addJob.code, 0);
  assertEquals(addJob.data, {
    command: 'add-job',
    category: 'jobs',
    values: ['nightly-report'],
    flags: { topic: 'workers.jobs' },
  });
  assertEquals(backend.handled.map((definition) => definition.name), ['add-job']);

  const missing = await cli.run({ command: 'missing-command' });
  assertEquals(missing.code, 1);
});

Deno.test('workersCli composition root provides the default CLI instance', () => {
  assertEquals(workersCli.name, 'workers');
  assertEquals(workersCli.commands().map((command) => command.name), [...WORKERS_CLI_COMMANDS]);
});
