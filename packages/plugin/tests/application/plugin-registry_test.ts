import { assertEquals, assertInstanceOf } from '@std/assert';
import { inspectPlugin } from '../../mod.ts';
import { PluginRegistry } from '../../src/application/mod.ts';
import { DuplicatePluginError } from '../../src/domain/mod.ts';
import { createPluginManifestFixture } from '../../src/testing/mod.ts';

Deno.test('PluginRegistry resolves plugins and rejects duplicates', () => {
  const registry = new PluginRegistry();
  registry.register(createPluginManifestFixture());

  assertEquals(registry.resolve('@example/plugin')?.version, '0.0.1-alpha.0');

  let caught: unknown;
  try {
    registry.register(createPluginManifestFixture());
  } catch (error) {
    caught = error;
  }
  assertInstanceOf(caught, DuplicatePluginError);
});

Deno.test('inspectPlugin reports plugin registry diagnostics', () => {
  const registry = new PluginRegistry();
  registry.register(createPluginManifestFixture());

  assertEquals(inspectPlugin(registry).details.plugins, 1);
});
