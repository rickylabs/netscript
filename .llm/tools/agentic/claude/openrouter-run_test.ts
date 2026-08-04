import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { openRouterClaudeEnvironment, parseOpenRouterRunArguments } from './openrouter-run.ts';

Deno.test('OpenRouter launcher parses the full flag surface', () => {
  assertEquals(
    parseOpenRouterRunArguments([
      '--model',
      'open/model',
      '--effort',
      'high',
      '--prompt',
      '/tmp/prompt.md',
      '--resume',
      'session-id',
      '--output',
      '/tmp/result.json',
    ]),
    {
      model: 'open/model',
      effort: 'high',
      prompt: '/tmp/prompt.md',
      resume: 'session-id',
      output: '/tmp/result.json',
    },
  );
});

Deno.test('OpenRouter launcher omits absent optional flags rather than passing undefined', () => {
  assertEquals(
    parseOpenRouterRunArguments(['--model', 'open/model', '--effort', 'xhigh', '--prompt', '/p']),
    { model: 'open/model', effort: 'xhigh', prompt: '/p' },
  );
});

Deno.test('OpenRouter launcher rejects a missing model, prompt, or unknown effort', () => {
  for (
    const args of [
      ['--effort', 'high', '--prompt', '/p'],
      ['--model', 'open/model', '--prompt', '/p'],
      ['--model', 'open/model', '--effort', 'high'],
      ['--model', 'open/model', '--effort', 'turbo', '--prompt', '/p'],
    ]
  ) {
    assertThrows(() => parseOpenRouterRunArguments(args), Error, 'Usage: claude-openrouter');
  }
});

Deno.test('an exported OpenRouter key maps to the child Anthropic auth token', async () => {
  assertEquals(
    await openRouterClaudeEnvironment(
      { HOME: '/home/test', OPENROUTER_API_KEY: 'already-exported' },
      () => Promise.reject(new Error('credential file must not be read')),
    ),
    { ANTHROPIC_AUTH_TOKEN: 'already-exported', ANTHROPIC_API_KEY: '' },
  );
});

Deno.test('the credential file supplies the child auth token when nothing is exported', async () => {
  const read: string[] = [];
  const env = await openRouterClaudeEnvironment({ HOME: '/home/test' }, (path) => {
    read.push(path);
    return Promise.resolve("# comment\nexport OPENROUTER_API_KEY='from-file'\n");
  });
  assertEquals(env, { ANTHROPIC_AUTH_TOKEN: 'from-file', ANTHROPIC_API_KEY: '' });
  assertEquals(read.length, 1);
  assertEquals(read[0].startsWith('/home/test/'), true);
});

Deno.test('a missing credential fails with an actionable, key-free error', async () => {
  await assertRejects(
    () => openRouterClaudeEnvironment({}, () => Promise.resolve('')),
    Error,
    'HOME is unavailable',
  );
  await assertRejects(
    () =>
      openRouterClaudeEnvironment(
        { HOME: '/home/test' },
        () => Promise.reject(new Error('No such file or directory')),
      ),
    Error,
    'could not be read',
  );
  await assertRejects(
    () => openRouterClaudeEnvironment({ HOME: '/home/test' }, () => Promise.resolve('# empty\n')),
    Error,
    'is missing from',
  );
});
