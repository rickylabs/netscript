import { assertEquals, assertThrows } from '@std/assert';
import { createAuthPresetRegistry } from './mod.ts';

Deno.test('createAuthPresetRegistry registers provider presets by kind and id', () => {
  const registry = createAuthPresetRegistry([{
    kind: 'provider',
    id: 'example',
    backend: 'custom',
    displayName: 'Example',
  }]);

  assertEquals(registry.get('provider:example')?.id, 'example');
});

Deno.test('createAuthPresetRegistry rejects duplicate preset keys', () => {
  assertThrows(() =>
    createAuthPresetRegistry([
      { kind: 'backend', id: 'custom', displayName: 'Custom', providerKinds: ['custom'] },
      { kind: 'backend', id: 'custom', displayName: 'Custom 2', providerKinds: ['custom'] },
    ])
  );
});
