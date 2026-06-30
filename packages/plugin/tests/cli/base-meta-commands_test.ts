import { assertEquals } from '@std/assert';
import { createBaseMetaCommands } from '../../src/cli/mod.ts';

Deno.test('createBaseMetaCommands exposes status, health, and info', async () => {
  const commands = createBaseMetaCommands({
    name: '@example/plugin',
    displayName: 'Example Plugin',
    version: '1.0.0',
    capabilities: ['jobs'],
    health: () => ({ code: 0, message: 'ok' }),
  });

  assertEquals(commands.map((command) => command.name), ['status', 'health', 'info']);
  assertEquals(await commands[0].run({ command: 'status' }), {
    code: 0,
    message: 'Example Plugin is ready.',
    data: { health: { code: 0, message: 'ok' } },
  });
  assertEquals(commands[2].run({ command: 'info' }), {
    code: 0,
    message: 'Example Plugin',
    data: {
      name: '@example/plugin',
      displayName: 'Example Plugin',
      version: '1.0.0',
      capabilities: ['jobs'],
    },
  });
});
