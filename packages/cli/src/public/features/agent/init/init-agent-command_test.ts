import { assertEquals, assertRejects } from '@std/assert';
import type { InitAgentInput } from './init-agent-input.ts';
import { createInitAgentCommand } from './init-agent-command.ts';

Deno.test('agent init command forwards editor and --with-docs explicitly', async () => {
  let received: InitAgentInput | undefined;
  const command = createInitAgentCommand({
    projectRoot: () => '/fixture',
    init: (input) => {
      received = input;
      return Promise.resolve({ hosts: ['vscode'], changedFiles: [], messages: [] });
    },
  });
  await command.parse(['--host', 'vscode', '--editor', 'zed', '--with-docs']);
  assertEquals(received, {
    projectRoot: '/fixture',
    host: 'vscode',
    editor: 'zed',
    withDocs: true,
  });
});

Deno.test('agent init command rejects unsupported editors with manual guidance', async () => {
  const command = createInitAgentCommand({
    projectRoot: () => '/fixture',
    init: () => Promise.resolve({ hosts: [], changedFiles: [], messages: [] }),
  });
  await assertRejects(
    () => command.parse(['--editor', 'jetbrains']),
    Error,
    'Supported editors: none, zed, vscode. Use --editor none and configure MCP manually',
  );
});
