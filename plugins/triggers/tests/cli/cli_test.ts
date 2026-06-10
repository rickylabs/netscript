import { assertEquals } from 'jsr:@std/assert@^1';
import {
  type PluginCliArgs,
  type PluginCliResult,
  StaticTriggersCliBackend,
  TRIGGERS_CLI_COMMANDS,
  TriggersCli,
  triggersCli,
  type TriggersCliBackend,
  type TriggersCliCommandDefinition,
} from '../../src/cli/composition/main.ts';

class RecordingTriggersBackend implements TriggersCliBackend {
  readonly handled: TriggersCliCommandDefinition[] = [];

  handle(
    definition: TriggersCliCommandDefinition,
    args: PluginCliArgs,
  ): PluginCliResult {
    this.handled.push(definition);
    return {
      code: 0,
      message: `handled ${definition.name}`,
      data: {
        command: definition.name,
        category: definition.category,
        usage: definition.usage,
        values: args.values ?? [],
        flags: args.flags ?? {},
      },
    };
  }
}

Deno.test('TriggersCli exposes the triggers command registry', async () => {
  const backend = new RecordingTriggersBackend();
  const cli = new TriggersCli(backend);
  const commands = cli.commands();

  assertEquals(cli.name, 'triggers');
  assertEquals(cli.description, 'Trigger ingress and scheduling plugin CLI.');
  assertEquals(commands.map((command) => command.name), [...TRIGGERS_CLI_COMMANDS]);

  const addWebhook = await cli.run({
    command: 'add-webhook',
    values: ['order-created'],
    flags: { path: '/webhooks/order-created', 'secret-env': 'ORDER_WEBHOOK_SECRET' },
  });
  assertEquals(addWebhook.code, 0);
  assertEquals(addWebhook.data, {
    command: 'add-webhook',
    category: 'scaffolding',
    usage: 'ns-triggers add webhook <id> --path=<path> [--secret-env=<name> --job=<id>]',
    values: ['order-created'],
    flags: { path: '/webhooks/order-created', 'secret-env': 'ORDER_WEBHOOK_SECRET' },
  });
  assertEquals(backend.handled.map((definition) => definition.name), ['add-webhook']);

  const missing = await cli.run({ command: 'missing-command' });
  assertEquals(missing.code, 1);
});

Deno.test('triggersCli composition root provides the default CLI instance', () => {
  assertEquals(triggersCli.name, 'triggers');
  assertEquals(triggersCli.commands().map((command) => command.name), [...TRIGGERS_CLI_COMMANDS]);
});

Deno.test('StaticTriggersCliBackend returns command metadata without runtime dependencies', () => {
  const backend = new StaticTriggersCliBackend();
  const preview = backend.handle({
    name: 'preview',
    category: 'schedule',
    description: 'Preview scheduled trigger fire times.',
    usage: 'ns-triggers preview <trigger-id> [--count=<n>]',
    flags: [{ name: 'count', description: 'Number of fire times to preview.' }],
  }, {
    command: 'preview',
    values: ['nightly-export'],
    flags: { count: '3' },
  });

  assertEquals(preview.code, 0);
  assertEquals(preview.data, {
    command: 'preview',
    category: 'schedule',
    usage: 'ns-triggers preview <trigger-id> [--count=<n>]',
    flags: { count: '3' },
    values: ['nightly-export'],
  });
});
