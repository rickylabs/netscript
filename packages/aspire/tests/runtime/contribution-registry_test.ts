import { assertEquals, assertThrows } from 'jsr:@std/assert';
import { AspireNSPluginContribution, ContributionRegistry } from '../../src/runtime/mod.ts';
import { DuplicateContributionError } from '../../src/domain/mod.ts';
import type { AspireResource, ContributionContext } from '../../src/domain/mod.ts';
import type { AspireBuilder } from '../../src/ports/mod.ts';

class NamedContribution extends AspireNSPluginContribution {
  constructor(readonly pluginName: string) {
    super();
  }

  contribute(
    _builder: AspireBuilder,
    _ctx: ContributionContext,
  ): readonly AspireResource[] {
    return [];
  }
}

Deno.test('ContributionRegistry: resolves registered contributions by plugin name', () => {
  const registry = new ContributionRegistry();
  const contribution = new NamedContribution('@acme/plugin-one');

  registry.register(contribution);

  assertEquals(registry.resolve('@acme/plugin-one'), contribution);
  assertEquals(registry.list(), [contribution]);
});

Deno.test('ContributionRegistry: rejects duplicate plugin names', () => {
  const registry = new ContributionRegistry();
  registry.register(new NamedContribution('@acme/plugin-one'));

  assertThrows(
    () => registry.register(new NamedContribution('@acme/plugin-one')),
    DuplicateContributionError,
  );
});
