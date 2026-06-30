import { assertEquals } from '@std/assert';

import { runPluginCliCommand } from './plugin-cli-runner.ts';
import { createTestContext, createTestPlugin, MemoryFileSystem } from '../test_fixtures.ts';

Deno.test('runPluginCliCommand routes mandatory info command', async () => {
  const result = await runPluginCliCommand({
    plugin: createTestPlugin(),
    args: { command: 'info' },
    context: createTestContext(new MemoryFileSystem()),
  });

  assertEquals(result.code, 0);
  assertEquals(result.data, {
    name: '@example/plugin-workers',
    kind: 'workers',
    displayName: 'Workers',
    version: '1.0.0',
    capabilities: ['jobs'],
    resources: ['job'],
  });
});

Deno.test('runPluginCliCommand routes resources through item scaffolders', async () => {
  const fileSystem = new MemoryFileSystem();
  const result = await runPluginCliCommand({
    plugin: createTestPlugin(),
    args: { command: 'add', values: ['job', 'send-email'] },
    context: createTestContext(fileSystem),
  });

  assertEquals(result.code, 0);
  assertEquals(
    fileSystem.files.get('/workspace/src/jobs/send-email.ts'),
    'export const id = "send-email";',
  );
});

Deno.test('runPluginCliCommand routes plugin-owned extra commands', async () => {
  const result = await runPluginCliCommand({
    plugin: createTestPlugin(),
    args: { command: 'logs' },
    context: createTestContext(new MemoryFileSystem()),
  });

  assertEquals(result, { code: 0, message: 'logs' });
});
