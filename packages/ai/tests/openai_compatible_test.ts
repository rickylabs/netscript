/**
 * Registration + port-conformance tests for the OpenAI-compatible provider subpath.
 *
 * @module
 */
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import '../openai-compatible.ts'; // side effect: self-registers 'openai-compatible'
import {
  OPENAI_COMPATIBLE_PROVIDER_ID,
  OpenAiCompatibleModelProvider,
} from '../openai-compatible.ts';
import { getModelProvider, listModelProviders } from '../mod.ts';
import { AiError, AiNotConfiguredError } from '../src/contracts/mod.ts';

const CONFIG = {
  baseURL: 'https://api.deepseek.example/v1',
  apiKey: 'test-key',
  models: ['deepseek-chat', 'deepseek-reasoner'] as const,
};

Deno.test('openai-compatible: importing the subpath self-registers the provider', () => {
  assert(listModelProviders().includes(OPENAI_COMPATIBLE_PROVIDER_ID));
  const provider = getModelProvider(OPENAI_COMPATIBLE_PROVIDER_ID, { ...CONFIG });
  assertEquals(provider.id, 'openai-compatible');
});

Deno.test('openai-compatible: listModels/supports/getModel reflect the configured models', async () => {
  const provider = new OpenAiCompatibleModelProvider({ ...CONFIG });
  const models = await provider.listModels();
  assertEquals(models.map((m) => m.id), ['deepseek-chat', 'deepseek-reasoner']);
  assertEquals(models[0]?.provider, 'openai-compatible');
  assert(provider.supports('deepseek-chat'));
  const handle = await provider.getModel('deepseek-reasoner');
  assertEquals(handle.providerId, 'openai-compatible');
  assertEquals(handle.descriptor.id, 'deepseek-reasoner');
});

Deno.test('openai-compatible: getModel rejects an unknown model when models are configured', async () => {
  const provider = new OpenAiCompatibleModelProvider({ ...CONFIG });
  assert(!provider.supports('not-a-model'));
  await assertRejects(() => provider.getModel('not-a-model'), AiError);
});

Deno.test('openai-compatible: unconfigured models list is optimistic (endpoint owns its catalog)', async () => {
  const provider = new OpenAiCompatibleModelProvider({
    baseURL: CONFIG.baseURL,
    apiKey: CONFIG.apiKey,
  });
  assertEquals(await provider.listModels(), []);
  assert(provider.supports('anything'));
  const handle = await provider.getModel('anything');
  assertEquals(handle.descriptor.id, 'anything');
});

Deno.test('openai-compatible: createChatClient wraps the TanStack client (F-13 stop path)', () => {
  const provider = new OpenAiCompatibleModelProvider({ ...CONFIG });
  const client = provider.createChatClient('deepseek-chat');
  // Cancellation is driven by an AbortController passed to chat()/chatStream().
  assertEquals(client.kind, 'text');
});

Deno.test('openai-compatible: createChatClient throws AiNotConfiguredError without baseURL/apiKey', () => {
  const provider = new OpenAiCompatibleModelProvider({ models: ['m1'] });
  assertThrows(() => provider.createChatClient('m1'), AiNotConfiguredError);
});
