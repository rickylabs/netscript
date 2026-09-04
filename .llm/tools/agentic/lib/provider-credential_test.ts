import { assertEquals } from '@std/assert';
import { OPENCODE_TOOL } from '../config/versions.ts';
import {
  environmentWithOpenCodeCredential,
  openCodeCredentialProviderForModel,
  parseCredentialAssignment,
} from './provider-credential.ts';

Deno.test('model prefixes select the exact paid provider', () => {
  assertEquals(openCodeCredentialProviderForModel('opencode-go/model'), 'opencode_go');
  assertEquals(openCodeCredentialProviderForModel('ollama-cloud/model'), 'ollama');
  assertEquals(openCodeCredentialProviderForModel('openrouter/vendor/model'), 'openrouter');
  assertEquals(openCodeCredentialProviderForModel('n5air/local-model'), null);
});

Deno.test('credential parser reads only the requested assignment', () => {
  const source = "OPENROUTER_API_KEY='router'\nexport OPENCODE_API_KEY=go\n";
  assertEquals(parseCredentialAssignment(source, 'OPENCODE_API_KEY'), 'go');
  assertEquals(parseCredentialAssignment(source, 'OLLAMA_API_KEY'), undefined);
});

Deno.test('selected credential clears rival API keys', async () => {
  const env = await environmentWithOpenCodeCredential(
    'opencode-go/model',
    {
      HOME: '/home/test',
      OPENCODE_API_KEY: 'go',
      OLLAMA_API_KEY: 'ollama',
      OPENROUTER_API_KEY: 'router',
    },
    () => Promise.reject(new Error('must not read')),
    undefined,
  );
  assertEquals(env.OPENCODE_API_KEY, 'go');
  assertEquals(env.OLLAMA_API_KEY, undefined);
  assertEquals(env.OPENROUTER_API_KEY, undefined);
});

Deno.test('credential falls back to its mode-600 local env file', async () => {
  let requestedPath = '';
  const env = await environmentWithOpenCodeCredential(
    'ollama-cloud/model',
    { HOME: '/home/test' },
    (path) => {
      requestedPath = path;
      return Promise.resolve('OLLAMA_API_KEY=opaque');
    },
    () => Promise.resolve({ mode: 0o100600 }),
  );
  assertEquals(requestedPath, `/home/test/${OPENCODE_TOOL.ollamaEnvRelativePath}`);
  assertEquals(env.OLLAMA_API_KEY, 'opaque');
});

Deno.test('credential loader rejects permissive file modes without exposing values', async () => {
  let message = '';
  try {
    await environmentWithOpenCodeCredential(
      'openrouter/vendor/model',
      { HOME: '/home/test' },
      () => Promise.resolve('OPENROUTER_API_KEY=never-surface'),
      () => Promise.resolve({ mode: 0o100644 }),
    );
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assertEquals(message, 'OPENROUTER_API_KEY credential file permissions must be 0600');
  assertEquals(message.includes('never-surface'), false);
});

Deno.test('unknown local providers do not trigger credential reads or clearing', async () => {
  let reads = 0;
  const env = await environmentWithOpenCodeCredential(
    'n5air/local-model',
    { HOME: '/home/test', OPENROUTER_API_KEY: 'untouched' },
    () => {
      reads++;
      return Promise.resolve('');
    },
    undefined,
  );
  assertEquals(reads, 0);
  assertEquals(env.OPENROUTER_API_KEY, 'untouched');
});
