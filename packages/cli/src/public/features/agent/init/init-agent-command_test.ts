import { assertEquals } from '@std/assert';
import type { InitAgentInput } from './init-agent-input.ts';
import { createInitAgentCommand } from './init-agent-command.ts';

Deno.test('agent init command forwards --with-docs explicitly', async () => {
  let received: InitAgentInput | undefined;
  const command = createInitAgentCommand({
    projectRoot: () => '/fixture',
    init: (input) => {
      received = input;
      return Promise.resolve({ hosts: ['vscode'], changedFiles: [], messages: [] });
    },
  });
  await command.parse(['--host', 'vscode', '--with-docs']);
  assertEquals(received, { projectRoot: '/fixture', host: 'vscode', withDocs: true });
});
