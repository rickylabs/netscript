/**
 * @module templates/aspire/helpers/generate-register-infrastructure_test
 */

import { assert, assertStringIncludes } from 'jsr:@std/assert@^1';
import { describe, it } from 'jsr:@std/testing@^1/bdd';

import { generateRegisterInfrastructure } from '../register/generate-register-infrastructure.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../../../application/registries/template-registry.ts';

// `generateRegisterInfrastructure` reads templates synchronously, which requires a
// previously-awaited registry hydration. The tests exercise it directly (outside
// the CLI dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

describe('generateRegisterInfrastructure', () => {
  it('registers redis cache containers with endpoint wiring', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        redis: {
          Enabled: true,
          Engine: 'Redis',
          Mode: 'Container',
          DataPath: '.data/redis',
        },
      },
      primaryCache: 'redis',
    });

    assertStringIncludes(output, "builder.addContainer('redis', 'docker.io/library/redis:7')");
    assertStringIncludes(output, "cacheEndpoints.set('redis', redis_tcpEndpoint);");
    assertStringIncludes(output, "const primaryCache = caches.get('redis') ?? null;");
  });

  it('registers garnet cache containers with endpoint wiring', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        garnet: {
          Enabled: true,
          Engine: 'Garnet',
          Mode: 'Container',
          DataPath: '.data/garnet',
        },
      },
      primaryCache: 'garnet',
    });

    assertStringIncludes(output, "builder.addContainer('garnet', 'ghcr.io/microsoft/garnet:1.1.1')");
    assertStringIncludes(output, "cacheEndpoints.set('garnet', garnet_tcpEndpoint);");
    assertStringIncludes(output, "const primaryCacheEndpoint = cacheEndpoints.get('garnet') ?? null;");
  });

  it('emits deno-kv cache as file-backed infrastructure debt without container wiring', () => {
    const output = generateRegisterInfrastructure({
      databases: {},
      caches: {
        'deno-kv': {
          Enabled: true,
          Engine: 'DenoKv',
          Mode: 'External',
          DataPath: 'data/kv',
        },
      },
      primaryCache: 'deno-kv',
    });

    assertStringIncludes(output, 'deno-kv (DenoKv, file-backed — no Aspire cache resource needed)');
    assert(!output.includes(`builder.addContainer('deno-kv'`));
    assert(!output.includes(`cacheEndpoints.set('deno-kv'`));
  });

  it('skips sqlite Aspire resource registration entirely', () => {
    const output = generateRegisterInfrastructure({
      databases: {
        sqlite: {
          Enabled: true,
          Engine: 'Sqlite',
          Mode: 'External',
          DatabaseName: 'app.sqlite',
          Persistent: false,
        },
      },
      caches: {},
      primaryDatabase: 'sqlite',
    });

    assertStringIncludes(output, 'Sqlite, file-backed — no Aspire resource needed');
    assert(!output.includes("builder.addConnectionString('sqlite')"));
    assert(!output.includes("databases.set('sqlite', sqlite);"));
    assert(!output.includes('sqlite_server.addDatabase('));
    assert(!output.includes('const sqlite_server'));
  });
});
