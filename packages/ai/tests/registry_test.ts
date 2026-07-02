import { assert, assertEquals, assertThrows } from '@std/assert';
import {
  getModel,
  getModelProvider,
  parseModelRef,
  registerModelProvider,
  resetModelRegistry,
} from '../src/ports/mod.ts';
import { InvalidModelRefError, ModelProviderNotFoundError } from '../src/contracts/mod.ts';
import { createFakeModelProvider } from '../src/testing/mod.ts';

Deno.test('model registry: registered provider resolves via getModelProvider', () => {
  resetModelRegistry();
  registerModelProvider('demo', () =>
    createFakeModelProvider('demo', [{ id: 'm1', provider: 'demo' }]));

  const provider = getModelProvider('demo');
  assertEquals(provider.id, 'demo');
  assert(provider.supports('m1'));
  resetModelRegistry();
});

Deno.test('model registry: getModel resolves a "<provider>:<model>" ref end-to-end', async () => {
  resetModelRegistry();
  registerModelProvider('demo', () =>
    createFakeModelProvider('demo', [{ id: 'm1', provider: 'demo' }]));

  const handle = await getModel('demo:m1');
  assertEquals(handle.providerId, 'demo');
  assertEquals(handle.descriptor.id, 'm1');
  resetModelRegistry();
});

Deno.test('model registry: getModelProvider throws ModelProviderNotFoundError when unregistered', () => {
  resetModelRegistry();
  assertThrows(() => getModelProvider('missing'), ModelProviderNotFoundError);
});

Deno.test('parseModelRef: rejects a malformed ref with InvalidModelRefError', () => {
  assertThrows(() => parseModelRef('no-separator'), InvalidModelRefError);
  assertEquals(parseModelRef('anthropic:claude'), { provider: 'anthropic', model: 'claude' });
  assertEquals(parseModelRef({ provider: 'p', model: 'm' }), { provider: 'p', model: 'm' });
});
