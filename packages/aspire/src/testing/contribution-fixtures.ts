import type { AspireResource, ContributionContext } from '../domain/mod.ts';
import type { AspireBuilder } from '../ports/mod.ts';
import { AspireNSPluginContribution } from '../runtime/mod.ts';
import { createPortAllocator } from '../application/mod.ts';

/** Create a deterministic contribution context for Aspire tests. */
export function createContributionContextFixture(
  overrides: Partial<ContributionContext> = {},
): ContributionContext {
  return {
    projectRoot: '/workspace/app',
    port: createPortAllocator(),
    env: (source) => {
      if (typeof source === 'string') {
        return source;
      }
      if (source.kind === 'literal') {
        return source.value;
      }
      if (source.kind === 'secret') {
        return `secret:${source.name}`;
      }
      return `resource:${source.resource}:${source.key}`;
    },
    resource: () => undefined,
    manifest: { name: 'test-app' },
    ...overrides,
  };
}

/** Example contribution used by public tests and README snippets. */
export class ExampleAspireContribution extends AspireNSPluginContribution {
  /** Plugin name reported by the example contribution. */
  readonly pluginName = '@example/plugin';

  /** Contribute one Deno service to the supplied builder. */
  contribute(
    builder: AspireBuilder,
    ctx: ContributionContext,
  ): readonly AspireResource[] {
    return [
      builder.addDenoService('example-service', {
        workdir: ctx.projectRoot,
        entrypoint: 'services/example/main.ts',
        port: ctx.port('example-service', 8123),
        permissions: ['--allow-net'],
      }),
    ];
  }
}
