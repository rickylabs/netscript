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
