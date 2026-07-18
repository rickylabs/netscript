import { assertEquals } from 'jsr:@std/assert@^1';
import {
  type PluginCliArgs,
  type PluginCliResult,
  SAGAS_CLI_COMMANDS,
  SagasCli,
  type SagasCliBackend,
  type SagasCliCommandDefinition,
  StaticSagasCliBackend,
} from '../../src/cli/mod.ts';

class RecordingSagasBackend implements SagasCliBackend {
  readonly handled: SagasCliCommandDefinition[] = [];

  handle(
    definition: SagasCliCommandDefinition,
    _args: PluginCliArgs,
  ): PluginCliResult {
    this.handled.push(definition);
    return { code: 0 };
  }
}

Deno.test('SagasCli exposes the sagas command registry', async () => {
  const cli = new SagasCli(new StaticSagasCliBackend());
  const commands = cli.commands();

  assertEquals(cli.name, 'sagas');
  assertEquals(cli.description, 'Saga orchestration plugin CLI.');
  assertEquals(commands.map((command) => command.name), [...SAGAS_CLI_COMMANDS]);

  const inspect = await runSagasCommand(cli, {
    command: 'inspect',
    values: ['project/sagas'],
    flags: { root: 'sagas,services' },
  });
  assertEquals(inspect.code, 0);
  assertEquals(inspect.data, {
    command: 'inspect',
    category: 'inspection',
    usage: 'deno x -A jsr:@netscript/plugin-sagas@<version>/cli inspect [id] [--root=sagas --json]',
    flags: { root: 'sagas,services' },
    values: ['project/sagas'],
  });

  const missing = await runSagasCommand(cli, { command: 'missing-command' });
  assertEquals(missing.code, 1);
});

Deno.test('SagasCli usage metadata uses the runnable versioned JSR entrypoint', async () => {
  const backend = new RecordingSagasBackend();
  const cli = new SagasCli(backend);

  for (const command of cli.commands()) {
    await command.run({ command: command.name });
  }

  assertEquals(backend.handled.length, SAGAS_CLI_COMMANDS.length);
  for (const definition of backend.handled) {
    assertEquals(
      definition.usage.startsWith(
        'deno x -A jsr:@netscript/plugin-sagas@<version>/cli ',
      ),
      true,
      `Unexpected sagas usage for ${definition.name}: ${definition.usage}`,
    );
  }
});

Deno.test('SagasCli exposes command metadata with categories and flags', () => {
  const cli = new SagasCli(new StaticSagasCliBackend());
  const definitions = cli.commands();

  assertEquals(definitions.map((definition) => definition.description), [
    'Create a saga definition and config entry.',
    'Generate the static saga registry for compiled runtimes.',
    'Publish a message to the durable saga bus.',
    'List registered sagas or durable saga instances.',
    'Inspect saga metadata from the runtime, with local source fallback.',
    'Update a generated saga definition and config.',
    'Remove a generated saga definition and config.',
    'Rewrite legacy sagas imports to plugin package specifiers.',
  ]);
});

async function runSagasCommand(
  cli: SagasCli,
  args: PluginCliArgs,
): Promise<PluginCliResult> {
  const command = cli.commands().find((item) => item.name === args.command);
  return command
    ? await command.run(args)
    : { code: 1, message: `Unknown sagas command: ${args.command}` };
}
