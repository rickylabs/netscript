import { assertEquals, assertRejects } from '@std/assert';
import { OPENCODE_TOOL } from '../config/versions.ts';
import { parseOpenRouterApiKey, resolveOpenRouterApiKey } from './openrouter-credential.ts';

Deno.test('shared OpenRouter credential parser accepts quoted exports', () => {
  assertEquals(parseOpenRouterApiKey("export OPENROUTER_API_KEY='opaque'"), 'opaque');
});

Deno.test('shared credential resolver prefers the process environment', async () => {
  let reads = 0;
  assertEquals(
    await resolveOpenRouterApiKey({ OPENROUTER_API_KEY: 'environment' }, () => {
      reads++;
      return Promise.resolve('OPENROUTER_API_KEY=file');
    }),
    'environment',
  );
  assertEquals(reads, 0);
});

Deno.test('shared credential resolver follows the configured fallback convention', async () => {
  let path = '';
  assertEquals(
    await resolveOpenRouterApiKey({ HOME: '/home/operator' }, (requested) => {
      path = requested;
      return Promise.resolve('OPENROUTER_API_KEY=file');
    }),
    'file',
  );
  assertEquals(path, `/home/operator/${OPENCODE_TOOL.openRouterEnvRelativePath}`);
});

Deno.test('shared credential resolver fails without exposing unrelated content', async () => {
  await assertRejects(
    () => resolveOpenRouterApiKey({ HOME: '/home/operator' }, () => Promise.resolve('OTHER=value')),
    Error,
    'OPENROUTER_API_KEY is missing',
  );
});
