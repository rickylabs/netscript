/**
 * Registration + port-conformance tests for the Anthropic provider subpath.
 *
 * @module
 */
import { assert, assertEquals, assertRejects } from '@std/assert';
import '../anthropic.ts'; // side effect: self-registers 'anthropic'
import { ANTHROPIC_PROVIDER_ID, AnthropicModelProvider } from '../anthropic.ts';
import { getModel, getModelProvider, listModelProviders } from '../mod.ts';
import { AiError } from '../src/contracts/mod.ts';

Deno.test('anthropic: importing the subpath self-registers the provider', () => {
  assert(listModelProviders().includes(ANTHROPIC_PROVIDER_ID));
  const provider = getModelProvider(ANTHROPIC_PROVIDER_ID);
  assertEquals(provider.id, 'anthropic');
});

Deno.test('anthropic: listModels surfaces the wrapped TanStack catalog', async () => {
  const provider = new AnthropicModelProvider();
  const models = await provider.listModels();
  assert(models.length > 0);
  // Every descriptor is owned by this provider and carries capabilities.
  for (const model of models) {
    assertEquals(model.provider, 'anthropic');
    assertEquals(model.capabilities?.streaming, true);
    assertEquals(model.capabilities?.vision, true);
  }
  assert(models.some((m) => m.id === 'claude-sonnet-4-5'));
});

Deno.test('anthropic: supports + getModel resolve a catalog model', async () => {
  const provider = new AnthropicModelProvider();
  assert(provider.supports('claude-sonnet-4-5'));
  const handle = await provider.getModel('claude-sonnet-4-5');
  assertEquals(handle.providerId, 'anthropic');
  assertEquals(handle.descriptor.id, 'claude-sonnet-4-5');
});

Deno.test('anthropic: getModel rejects an unknown model with AiError', async () => {
  const provider = new AnthropicModelProvider();
  assert(!provider.supports('gpt-4o'));
  await assertRejects(() => provider.getModel('gpt-4o'), AiError);
});

Deno.test('anthropic: end-to-end getModel("anthropic:<model>") resolves via the registry', async () => {
  const handle = await getModel('anthropic:claude-haiku-4-5');
  assertEquals(handle.providerId, 'anthropic');
  assertEquals(handle.descriptor.id, 'claude-haiku-4-5');
});

Deno.test('anthropic: createChatClient wraps the TanStack Anthropic text adapter (F-13 stop path)', () => {
  // Provide an explicit key so no ANTHROPIC_API_KEY env is required.
  const provider = new AnthropicModelProvider({ apiKey: 'sk-ant-test-key' });
  const client = provider.createChatClient('claude-sonnet-4-5');
  // The wrapped client is a TanStack text adapter; cancellation is driven by an
  // AbortController passed to chat()/chatStream() (documented on createChatClient).
  assertEquals(client.kind, 'text');
  assertEquals(client.name, 'anthropic');
});
