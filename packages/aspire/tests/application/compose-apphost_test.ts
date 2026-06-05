import { assertEquals, assertExists } from '@std/assert';
import type {
  AspireResource,
  CacheSpec,
  ContainerSpec,
  ContributionContext,
  DatabaseSpec,
  DenoBackgroundSpec,
  DenoServiceSpec,
} from '../../src/domain/mod.ts';
import type { AspireBuilder } from '../../src/ports/mod.ts';
import { composeAppHost, createPortAllocator } from '../../src/application/mod.ts';
import { AspireNSPluginContribution } from '../../src/runtime/mod.ts';

class MemoryBuilder implements AspireBuilder {
  readonly resources: AspireResource[] = [];
  readonly references: Array<{ from: string; to: string; waitFor: boolean }> = [];

  addDenoService(name: string, spec: DenoServiceSpec): AspireResource {
    return this.pushResource(name, 'deno-service', spec.port, spec);
  }

  addDenoBackground(name: string, spec: DenoBackgroundSpec): AspireResource {
    return this.pushResource(name, 'deno-background', undefined, spec);
  }

  addContainer(name: string, spec: ContainerSpec): AspireResource {
    return this.pushResource(name, 'container', spec.port, spec);
  }

  addPostgresDatabase(name: string, spec: DatabaseSpec): AspireResource {
    return this.pushResource(name, 'database', spec.port, spec);
  }

  addMysqlDatabase(name: string, spec: DatabaseSpec): AspireResource {
    return this.pushResource(name, 'database', spec.port, spec);
  }

  addMssqlDatabase(name: string, spec: DatabaseSpec): AspireResource {
    return this.pushResource(name, 'database', spec.port, spec);
  }

  addRedisCache(name: string, spec: CacheSpec): AspireResource {
    return this.pushResource(name, 'cache', spec.port, spec);
  }

  addGarnetCache(name: string, spec: CacheSpec): AspireResource {
    return this.pushResource(name, 'cache', spec.port, spec);
  }

  reference(from: string, to: string): void {
    this.references.push({ from, to, waitFor: false });
  }

  waitFor(from: string, to: string): void {
    this.references.push({ from, to, waitFor: true });
  }

  private pushResource(
    name: string,
    kind: AspireResource['kind'],
    port: number | undefined,
    spec: unknown,
  ): AspireResource {
    const resource: AspireResource = { name, kind, port, metadata: { spec } };
    this.resources.push(resource);
    return resource;
  }
}

class ExampleContribution extends AspireNSPluginContribution {
  readonly pluginName = '@example/plugin';

  contribute(
    builder: AspireBuilder,
    ctx: ContributionContext,
  ): readonly AspireResource[] {
    const service = builder.addDenoService('example-service', {
      workdir: ctx.projectRoot,
      entrypoint: 'services/example/main.ts',
      port: ctx.port('example-service', 8123),
      permissions: ['--allow-net'],
      env: {
        DATABASE_URL: ctx.env({ kind: 'secret', name: 'DATABASE_URL' }),
      },
    });
    builder.waitFor(service.name, 'postgres');
    return [service];
  }
}

function createContext(): ContributionContext {
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
  };
}

Deno.test('composeAppHost registers plugin contributions and returns resources', () => {
  const builder = new MemoryBuilder();
  const result = composeAppHost({
    builder,
    context: createContext(),
    plugins: [{
      name: '@example/plugin',
      contributions: { aspire: ExampleContribution },
    }],
  });

  assertEquals(result.resources.length, 1);
  assertEquals(builder.resources[0]?.name, 'example-service');
  assertEquals(builder.references, [
    { from: 'example-service', to: 'postgres', waitFor: true },
  ]);
  assertExists(result.registry.resolve('@example/plugin'));
});

Deno.test('composeAppHost skips plugins without Aspire contributions', () => {
  const builder = new MemoryBuilder();
  const result = composeAppHost({
    builder,
    context: createContext(),
    plugins: [{ name: '@example/empty' }],
  });

  assertEquals(result.resources, []);
  assertEquals(builder.resources, []);
});

Deno.test('createPortAllocator reuses assigned ports before allocating new ones', () => {
  const port = createPortAllocator({
    start: 9000,
    assigned: new Map([['fixed', 8123]]),
  });

  assertEquals(port('fixed'), 8123);
  assertEquals(port('next'), 9000);
  assertEquals(port('fallback', 9555), 9555);
  assertEquals(port('next'), 9000);
});
