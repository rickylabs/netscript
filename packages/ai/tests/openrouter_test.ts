/**
 * Registration, port-conformance, and reasoning-shape tests for the OpenRouter
 * provider subpath.
 *
 * @module
 */
import { assert, assertEquals, assertRejects, assertThrows } from '@std/assert';
import '../openrouter.ts'; // side effect: self-registers 'openrouter'
import {
  DEFAULT_OPENROUTER_BASE_URL,
  OPENROUTER_PROVIDER_ID,
  OpenRouterModelProvider,
  openRouterReasoningModelOptions,
} from '../openrouter.ts';
import { getModelProvider, listModelProviders } from '../mod.ts';
import { AiError, AiNotConfiguredError } from '../src/contracts/mod.ts';

const CONFIG = {
  apiKey: 'test-key',
  models: ['anthropic/claude-sonnet-4.5', 'openai/gpt-4.1'] as const,
};

Deno.test('openrouter: importing the subpath self-registers the provider', () => {
  assert(listModelProviders().includes(OPENROUTER_PROVIDER_ID));
  const provider = getModelProvider(OPENROUTER_PROVIDER_ID, { ...CONFIG });
  assertEquals(provider.id, 'openrouter');
});

Deno.test('openrouter: listModels/supports/getModel reflect the configured models', async () => {
  const provider = new OpenRouterModelProvider({ ...CONFIG });
  const models = await provider.listModels();
  assertEquals(models.map((m) => m.id), ['anthropic/claude-sonnet-4.5', 'openai/gpt-4.1']);
  assertEquals(models[0]?.provider, 'openrouter');
  assert(provider.supports('openai/gpt-4.1'));
  const handle = await provider.getModel('anthropic/claude-sonnet-4.5');
  assertEquals(handle.providerId, 'openrouter');
  assertEquals(handle.descriptor.id, 'anthropic/claude-sonnet-4.5');
});

Deno.test('openrouter: getModel rejects an unknown model when models are configured', async () => {
  const provider = new OpenRouterModelProvider({ ...CONFIG });
  assert(!provider.supports('not-a-model'));
  await assertRejects(() => provider.getModel('not-a-model'), AiError);
});

Deno.test('openrouter: unconfigured models list is optimistic (OpenRouter owns its catalog)', async () => {
  const provider = new OpenRouterModelProvider({ apiKey: 'test-key' });
  assertEquals(await provider.listModels(), []);
  assert(provider.supports('anything'));
  const handle = await provider.getModel('anything');
  assertEquals(handle.descriptor.id, 'anything');
});

Deno.test('openrouter: reasoning normalization emits the top-level reasoning.effort shape', () => {
  // OpenRouter wire shape: { reasoning: { effort } } — NOT openai reasoning_effort.
  assertEquals(openRouterReasoningModelOptions('high'), { reasoning: { effort: 'high' } });
  assertEquals(openRouterReasoningModelOptions('medium'), { reasoning: { effort: 'medium' } });
  assertEquals(openRouterReasoningModelOptions('low'), { reasoning: { effort: 'low' } });
  assertEquals(openRouterReasoningModelOptions(undefined), undefined);
});

Deno.test('openrouter: createChatClient wraps the TanStack client (F-13 stop path)', () => {
  const provider = new OpenRouterModelProvider({ ...CONFIG, reasoningEffort: 'high' });
  const client = provider.createChatClient('anthropic/claude-sonnet-4.5');
  assertEquals(client.kind, 'text');
  assertEquals(client.name, 'openrouter');
});

Deno.test('openrouter: createChatClient throws AiNotConfiguredError without a key', () => {
  // No apiKey in config and OPENROUTER_API_KEY not set in this process.
  const previous = Deno.env.get('OPENROUTER_API_KEY');
  Deno.env.delete('OPENROUTER_API_KEY');
  try {
    const provider = new OpenRouterModelProvider({ models: ['m1'] });
    assertThrows(() => provider.createChatClient('m1'), AiNotConfiguredError);
  } finally {
    if (previous !== undefined) Deno.env.set('OPENROUTER_API_KEY', previous);
  }
});

Deno.test('openrouter: createChatClient resolves the key from OPENROUTER_API_KEY env', () => {
  const previous = Deno.env.get('OPENROUTER_API_KEY');
  Deno.env.set('OPENROUTER_API_KEY', 'env-key');
  try {
    const provider = new OpenRouterModelProvider({ models: ['m1'] });
    const client = provider.createChatClient('m1');
    assertEquals(client.kind, 'text');
  } finally {
    if (previous === undefined) Deno.env.delete('OPENROUTER_API_KEY');
    else Deno.env.set('OPENROUTER_API_KEY', previous);
  }
});

Deno.test('openrouter: default base URL is the OpenRouter endpoint', () => {
  assertEquals(DEFAULT_OPENROUTER_BASE_URL, 'https://openrouter.ai/api/v1');
});
