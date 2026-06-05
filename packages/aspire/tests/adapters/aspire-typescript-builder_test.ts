import { assertEquals } from '@std/assert';
import { AspireTypeScriptBuilder, resolveEnvSource } from '../../src/adapters/mod.ts';

Deno.test('AspireTypeScriptBuilder records resources and references as operations', () => {
  const builder = new AspireTypeScriptBuilder();
  builder.addDenoService('api', {
    workdir: 'services/api',
    entrypoint: 'main.ts',
    port: 8080,
    permissions: ['--allow-net'],
  });
  builder.waitFor('api', 'postgres');

  assertEquals(builder.toOperations().length, 2);
});

Deno.test('resolveEnvSource resolves literals, secrets, resources, and raw strings', () => {
  assertEquals(resolveEnvSource('raw'), 'raw');
  assertEquals(resolveEnvSource({ kind: 'literal', value: 'value' }), 'value');
  assertEquals(
    resolveEnvSource(
      { kind: 'secret', name: 'DATABASE_URL' },
      { secrets: new Map([['DATABASE_URL', 'postgres://local']]) },
    ),
    'postgres://local',
  );
  assertEquals(
    resolveEnvSource(
      { kind: 'resource', resource: 'api', key: 'url' },
      {
        resources: new Map([[
          'api',
          { name: 'api', kind: 'deno-service', metadata: { url: 'http://localhost:8080' } },
        ]]),
      },
    ),
    'http://localhost:8080',
  );
});
