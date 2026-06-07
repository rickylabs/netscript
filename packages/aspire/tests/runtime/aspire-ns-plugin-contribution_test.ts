import { assertEquals } from '@std/assert';
import { AspireNSPluginContribution } from '../../src/runtime/mod.ts';
import type { AspireResource, ContributionContext } from '../../src/domain/mod.ts';
import type { AspireBuilder } from '../../src/ports/mod.ts';

class EmptyContribution extends AspireNSPluginContribution {
  readonly pluginName = '@acme/plugin-empty';

  contribute(
    _builder: AspireBuilder,
    _ctx: ContributionContext,
  ): readonly AspireResource[] {
    return [];
  }
}

Deno.test('AspireNSPluginContribution: default hooks return empty declarations', () => {
  const contribution = new EmptyContribution();
  const ctx = {
    projectRoot: '.',
    port: (_key: string, fallback = 0) => fallback,
    env: (value: Parameters<ContributionContext['env']>[0]) =>
      typeof value === 'string' ? value : value.kind,
    resource: () => undefined,
    manifest: {},
  } satisfies ContributionContext;

  assertEquals(contribution.declareEnv(ctx), {});
  assertEquals(contribution.declareHealthChecks(ctx), []);
});
