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

  const addJob = await runWorkersCommand(cli, {
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

  const missing = await runWorkersCommand(cli, { command: 'missing-command' });
  assertEquals(missing.code, 1);
});

Deno.test('workersCli composition root provides the default CLI instance', () => {
  assertEquals(workersCli.name, 'workers');
  assertEquals(workersCli.commands().map((command) => command.name), [...WORKERS_CLI_COMMANDS]);
});

Deno.test('WorkersCli usage metadata uses the runnable versioned JSR entrypoint', async () => {
  const backend = new RecordingWorkersBackend();
  const cli = new WorkersCli(backend);

  for (const command of cli.commands()) {
    await command.run({ command: command.name });
  }

  assertEquals(backend.handled.length, WORKERS_CLI_COMMANDS.length);
  for (const definition of backend.handled) {
    assertEquals(
      definition.usage.startsWith(
        'deno x -A jsr:@netscript/plugin-workers@<version>/cli ',
      ),
      true,
      `Unexpected workers usage for ${definition.name}: ${definition.usage}`,
    );
  }
});

async function runWorkersCommand(
  cli: WorkersCli,
  args: PluginCliArgs,
): Promise<PluginCliResult> {
  const command = cli.commands().find((item) => item.name === args.command);
  return command
    ? await command.run(args)
    : { code: 1, message: `Unknown workers command: ${args.command}` };
}
