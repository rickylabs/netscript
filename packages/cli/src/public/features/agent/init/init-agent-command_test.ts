import { assertEquals, assertRejects } from '@std/assert';
import type { InitAgentInput, InitAgentResult } from './init-agent-input.ts';
import { createInitAgentCommand } from './init-agent-command.ts';

function result(overrides: Partial<InitAgentResult> = {}): InitAgentResult {
  return {
    hosts: ['claude'],
    resolution: {
      hosts: { value: ['claude'], source: 'default', signals: [] },
      editor: { value: 'none', source: 'default', signals: [] },
    },
    changedFiles: [],
    messages: [],
    ...overrides,
  };
}

Deno.test('agent init command forwards editor and --with-docs explicitly', async () => {
  let received: InitAgentInput | undefined;
  const command = createInitAgentCommand({
    projectRoot: () => '/fixture',
    init: (input) => {
      received = input;
      return Promise.resolve(result({ hosts: ['vscode'] }));
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

Deno.test('agent init command accepts --host opencode', async () => {
  let received: InitAgentInput | undefined;
  const command = createInitAgentCommand({
    projectRoot: () => '/fixture',
    init: (input) => {
      received = input;
      return Promise.resolve(result({ hosts: ['opencode'] }));
    },
  });
  await command.parse(['--host', 'opencode']);
  assertEquals(received?.host, 'opencode');
});

Deno.test('agent init command rejects unsupported hosts with the supported list', async () => {
  const command = createInitAgentCommand({
    projectRoot: () => '/fixture',
    init: () => Promise.resolve(result()),
  });
  await assertRejects(
    () => command.parse(['--host', 'cursor']),
    Error,
    'Supported hosts: claude, vscode, opencode, all.',
  );
});

Deno.test('agent init command prints the host resolution messages', async () => {
  const command = createInitAgentCommand({
    projectRoot: () => '/fixture',
    init: () =>
      Promise.resolve(result({
        changedFiles: ['/fixture/opencode.json'],
        hosts: ['opencode'],
        resolution: {
          hosts: {
            value: ['opencode'],
            source: 'environment',
            signals: [{ source: 'environment', name: 'OPENCODE' }],
          },
          editor: { value: 'none', source: 'default', signals: [] },
        },
        messages: ['Aspire agent wiring was skipped: aspire not found.'],
      })),
  });
  const printed: string[] = [];
  const log = console.log;
  console.log = (message: string) => printed.push(message);
  try {
    await command.parse([]);
  } finally {
    console.log = log;
  }
  assertEquals(printed, [
    'Installed NetScript agent integration for opencode.',
    'Agent hosts: opencode (from environment: OPENCODE).',
    'Editor: none (default: no flag, project marker, or environment signal).',
    'Aspire agent wiring was skipped: aspire not found.',
  ]);
});

Deno.test('agent init command rejects unsupported editors with manual guidance', async () => {
  const command = createInitAgentCommand({
    projectRoot: () => '/fixture',
    init: () => Promise.resolve(result({ hosts: [] })),
  });
  await assertRejects(
    () => command.parse(['--editor', 'jetbrains']),
    Error,
    'Supported editors: none, zed, vscode. Use --editor none and configure MCP manually',
  );
});
