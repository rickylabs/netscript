import { assertEquals } from 'jsr:@std/assert@^1';

import {
  buildMinimalScaffoldPlan,
  createInMemoryProcess,
  createInMemoryPrompt,
} from './testing.ts';

Deno.test('createInMemoryProcess records calls and returns queued results', async () => {
  const process = createInMemoryProcess([{ code: 0, stdout: 'formatted', stderr: '' }]);

  const result = await process.exec('deno', ['fmt'], { cwd: '/workspace' });

  assertEquals(result.stdout, 'formatted');
  assertEquals(process.calls, [{
    command: 'deno',
    args: ['fmt'],
    cwd: '/workspace',
    env: undefined,
  }]);
});

Deno.test('createInMemoryPrompt replays scripted answers', async () => {
  const prompt = createInMemoryPrompt({
    inputs: ['demo'],
    confirmations: [true],
    selections: ['postgres'],
  });

  assertEquals(await prompt.input('name'), 'demo');
  assertEquals(await prompt.confirm('confirm'), true);
  assertEquals(await prompt.select('db', ['postgres', 'mysql'] as const), 'postgres');
});

Deno.test('buildMinimalScaffoldPlan applies overrides', () => {
  const plan = buildMinimalScaffoldPlan({
    dbEngines: ['mysql'],
    useWorkspacePackages: true,
  });

  assertEquals(plan.dbEngines, ['mysql']);
  assertEquals(plan.useWorkspacePackages, true);
});
